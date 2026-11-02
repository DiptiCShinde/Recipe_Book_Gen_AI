from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="RecipeGen API", version="0.1.0")

# During local development, Vite serves the page on port 5173 and FastAPI on 8000.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    """A small endpoint to confirm the Python API is running."""
    return {"status": "ok", "message": "RecipeGen API is ready"}
