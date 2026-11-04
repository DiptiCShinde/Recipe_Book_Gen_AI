# RecipeGen AI

RecipeGen AI is an early-stage recipe inspiration project. The current version provides a responsive landing page introducing the idea of turning ingredients you already have into a meal, plus a small backend health check.

## Current progress

- Built a responsive React landing page with RecipeGen branding, an introductory hero section, and a three-step “How it works” section.
- Added a FastAPI backend with `GET /api/health` to confirm that the API is running.
- Configured local development so the Vite frontend (`http://localhost:5173`) can make cross-origin requests to the FastAPI backend (`http://localhost:8000`).

## Not implemented yet

The current version is a project foundation and introduction. It does not yet generate recipes, call an AI model, collect ingredients in a form, create user accounts, or save recipes.

## Project structure

```text
recipegen-ai/
├── backend/
│   ├── main.py             # FastAPI application and health endpoint
│   └── requirements.txt    # Python dependencies
└── frontend/
    ├── index.html          # Browser entry page
    ├── package.json        # Frontend dependencies and scripts
    ├── vite.config.js      # Vite and React configuration
    └── src/
        ├── App.jsx         # Landing page content
        ├── main.jsx        # React entry point
        └── styles.css      # Page styling and responsive layout
```

## Requirements

- Node.js and npm
- Python 3.9 or newer

## Run locally

Start the backend in one terminal:

```bash
cd backend
python -m venv .venv
```

Activate the environment, then install dependencies and start the API:

```powershell
# Windows PowerShell
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

On macOS or Linux, activate it with `source .venv/bin/activate` instead.

Start the frontend in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually [http://localhost:5173](http://localhost:5173). The API documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs), and the health check is at [http://localhost:8000/api/health](http://localhost:8000/api/health).

## Available frontend commands

Run these from `frontend/`:

- `npm run dev` — start the development server.
- `npm run build` — create a production build.
- `npm run preview` — preview the production build locally.

## API

### `GET /api/health`

Returns a simple readiness response:

```json
{
  "status": "ok",
  "message": "RecipeGen API is ready"
}
```

## Next steps

A natural next milestone is to add an ingredient input form and connect it to a backend recipe-generation endpoint. Any future AI provider key should be kept on the backend and supplied through an environment variable; it should never be placed in frontend code.
