from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import json
import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv(Path(__file__).with_name(".env"))

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise RuntimeError("GROQ_API_KEY is missing from backend/.env")

groq_client = Groq(api_key=api_key)
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

