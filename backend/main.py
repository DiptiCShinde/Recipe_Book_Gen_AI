from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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


@app.post("/api/recipes")
def create_recipe(request: RecipeRequest):
    return {
        "name": "Quick Kitchen Bowl",
        "ingredients": request.ingredients,
        "prep_time_minutes": 20,
        "instructions": [
            "Prepare the ingredients.",
            "Cook them together until ready.",
            "Serve and enjoy.",
        ],
    }
