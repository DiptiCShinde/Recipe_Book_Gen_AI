from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json
import os
from dotenv import load_dotenv
from groq import Groq
import sqlite3
from pydantic import BaseModel, Field
from pwdlib import PasswordHash
from database import DATABASE_PATH, initialize_database
from datetime import datetime, timedelta, timezone
import jwt

bearer_scheme = HTTPBearer()
load_dotenv(Path(__file__).with_name(".env"))

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise RuntimeError("GROQ_API_KEY is missing from backend/.env")

groq_client = Groq(api_key=api_key)
jwt_secret_key = os.getenv("JWT_SECRET_KEY")
if not jwt_secret_key:
    raise RuntimeError("JWT_SECRET_KEY is missing from backend/.env")
password_hasher = PasswordHash.recommended()

initialize_database()
app = FastAPI(title="RecipeGen API", version="0.1.0")

# During local development, Vite serves the page on port 5173 and FastAPI on 8000.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    """A small endpoint to confirm the Python API is running."""
    return {"status": "ok", "message": "RecipeGen API is ready"}

class UserCreate(BaseModel):
    display_name: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=128)

class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=128)

class SavedRecipeCreate(BaseModel):
    input_ingredients: list[str]
    dietary_preference: str = "none"
    cuisine_style: str = "any"
    recipe: dict

@app.post("/api/auth/register", status_code=201)
def register_user(user: UserCreate):
    display_name = user.display_name.strip()
    email = user.email.strip().lower()

    if not display_name:
        raise HTTPException(
            status_code=422,
            detail="Please enter a display name.",
        )

    if "@" not in email or "." not in email.rsplit("@", 1)[-1]:
        raise HTTPException(
            status_code=422,
            detail="Please enter a valid email address.",
        )

    password_hash = password_hasher.hash(user.password)

    try:
        with sqlite3.connect(DATABASE_PATH) as connection:
            cursor = connection.execute(
                """
                INSERT INTO users (email, display_name, password_hash)
                VALUES (?, ?, ?)
                """,
                (email, display_name, password_hash),
            )
            user_id = cursor.lastrowid
    except sqlite3.IntegrityError as error:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        ) from error

    return {
        "id": user_id,
        "email": email,
        "display_name": display_name,
    }

@app.post("/api/auth/login")
def login_user(login: LoginRequest):
    email = login.email.strip().lower()

    with sqlite3.connect(DATABASE_PATH) as connection:
        connection.row_factory = sqlite3.Row
        user = connection.execute(
            """
            SELECT id, email, display_name, password_hash
            FROM users
            WHERE email = ?
            """,
            (email,),
        ).fetchone()

    if user is None or not password_hasher.verify(
        login.password,
        user["password_hash"],
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    expires_at = datetime.now(timezone.utc) + timedelta(minutes=60)
    access_token = jwt.encode(
        {"sub": str(user["id"]), "exp": expires_at},
        jwt_secret_key,
        algorithm="HS256",
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "display_name": user["display_name"],
    }

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    try:
        payload = jwt.decode(
            credentials.credentials,
            jwt_secret_key,
            algorithms=["HS256"],
        )
        user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError) as error:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired login token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from error

    with sqlite3.connect(DATABASE_PATH) as connection:
        connection.row_factory = sqlite3.Row
        user = connection.execute(
            """
            SELECT id, email, display_name
            FROM users
            WHERE id = ?
            """,
            (user_id,),
        ).fetchone()

    if user is None:
        raise HTTPException(status_code=401, detail="User account not found.")

    return {
        "id": user["id"],
        "email": user["email"],
        "display_name": user["display_name"],
    }


@app.get("/api/users/me")
def read_my_profile(current_user: dict = Depends(get_current_user)):
    return current_user

@app.post("/api/users/me/recipes", status_code=201)
def save_my_recipe(
    saved_recipe: SavedRecipeCreate,
    current_user: dict = Depends(get_current_user),
):
    recipe_name = saved_recipe.recipe.get("name")

    if not isinstance(recipe_name, str) or not recipe_name.strip():
        raise HTTPException(
            status_code=422,
            detail="The recipe needs a name before it can be saved.",
        )

    with sqlite3.connect(DATABASE_PATH) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        cursor = connection.execute(
            """
            INSERT INTO saved_recipes (
                user_id,
                name,
                input_ingredients,
                dietary_preference,
                cuisine_style,
                recipe_json
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                current_user["id"],
                recipe_name,
                json.dumps(saved_recipe.input_ingredients),
                saved_recipe.dietary_preference,
                saved_recipe.cuisine_style,
                json.dumps(saved_recipe.recipe),
            ),
        )
        saved_id = cursor.lastrowid

    return {"id": saved_id, "name": recipe_name}

@app.get("/api/users/me/recipes")
def get_my_recipes(current_user: dict = Depends(get_current_user)):
    with sqlite3.connect(DATABASE_PATH) as connection:
        connection.row_factory = sqlite3.Row
        rows = connection.execute(
            """
            SELECT
                id,
                name,
                input_ingredients,
                dietary_preference,
                cuisine_style,
                recipe_json,
                created_at
            FROM saved_recipes
            WHERE user_id = ?
            ORDER BY created_at DESC, id DESC
            """,
            (current_user["id"],),
        ).fetchall()

    return [
        {
            "id": row["id"],
            "name": row["name"],
            "input_ingredients": json.loads(row["input_ingredients"]),
            "dietary_preference": row["dietary_preference"],
            "cuisine_style": row["cuisine_style"],
            "recipe": json.loads(row["recipe_json"]),
            "created_at": row["created_at"],
        }
        for row in rows
    ]

class RecipeRequest(BaseModel):
    ingredients: list[str]
    dietary_preference: str = "none"
    cuisine_style: str = "any"

@app.post("/api/recipes")
def create_recipe(request: RecipeRequest):
    try:
        completion = groq_client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You create simple, practical recipes from ingredients "
                        "a user has available. Keep instructions clear and concise."
                        "Return each cooking step as plain text without a number or bullet at the beginning."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        "Create one recipe using these ingredients: "
                        f"{', '.join(request.ingredients)}. "
                        f"Dietary preference: {request.dietary_preference}. "
                        f"Cuisine style: {request.cuisine_style}. "
                        "If the style is any, choose a style that suits the ingredients. "
                        "Follow this preference: vegetarian means no meat or fish; "
                        "vegan means no animal products; non-vegetarian may include meat or fish. "
                        "If the preference is none, apply no dietary restriction. "
                        "Return a recipe name, the ingredients, estimated "
                        "preparation time in minutes, and cooking steps as plain text "
                        "without numbers at the start of each step." 
                         "You may add a few complementary ingredients to improve the recipe. "
                         "List every ingredient used in the ingredients array, and continue to respect the dietary preference. "  ),
                },
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "recipe",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "ingredients": {
                                "type": "array",
                                "items": {"type": "string"},
                            },
                            "prep_time_minutes": {"type": "integer"},
                            "instructions": {
                                "type": "array",
                                "items": {"type": "string"},
                            },
                        },
                        "required": [
                            "name",
                            "ingredients",
                            "prep_time_minutes",
                            "instructions",
                        ],
                        "additionalProperties": False,
                    },
                },
            },
        )

        recipe_json = completion.choices[0].message.content
        return json.loads(recipe_json)

    except Exception as error:
        if getattr(error, "status_code", None) == 429:
            raise HTTPException(
                status_code=429,
                detail="Groq's usage limit was reached. Please wait and try again later.",
            ) from error

        raise HTTPException(
            status_code=502,
            detail="The recipe service is unavailable right now. Please try again.",
        ) from error

