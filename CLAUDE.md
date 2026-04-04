# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## What this app is

A Django + React web interface for **Pocket Extractor** — a bioinformatics tool that uses LLMs and fpocket to identify and prioritise protein binding pockets from research articles.

Backend: Django 6 + MySQL, served by gunicorn + WhiteNoise.
Frontend: React 19 + Vite + Bootstrap 5 + lucide-react, built into `react/` and served as static files.

## Running with Docker Compose (primary)

```bash
docker compose up --build       # first run or after frontend changes
docker compose up               # subsequent runs (Python-only changes)
docker compose restart django   # after Python-only changes (no rebuild needed)
```

App is at **http://localhost:8080** (container port 8000 mapped to host 8080).

Two services:
- `langgraph` — pocket-extractor FastAPI service (port 8000 internally)
- `django` — this app (exposed on 8080)

**Volume mount strategy**: only `./extractor` and `./webapp` are bind-mounted, so `react/` and `staticfiles/` built during `docker build` are preserved and served correctly by WhiteNoise.

## Running locally (Python only)

```bash
uv sync
uv run manage.py migrate
uv run manage.py runserver
```

Requires a `.env` file with database credentials and `LANGGRAPH_URL` pointing to a running pocket-extractor instance.

## Frontend development

```bash
cd frontend
npm install
npm run build    # outputs to ../react/; picked up by collectstatic
```

For live dev with Vite HMR set `VITE_DEV=true` in `.env` and run `npm run dev`.

## Architecture

```
webapp/          Django project config (settings.py, urls.py, wsgi.py)
extractor/       Django app
  models.py        ExtractionJob model
  views.py         All API views
  urls.py          URL routes
  services.py      pocket-extractor HTTP client
  migrations/
frontend/        React + Vite source
  src/
    App.tsx        HomePage, PipelineForm, ExtractForm, RecentJobs
    JobDetail.tsx  Job status page, RunInfoCard, PocketCard
    App.css        Bootstrap overrides (~50 lines)
    main.tsx       Bootstrap + React root
react/           Vite build output (in Docker image, not in git)
staticfiles/     collectstatic output (WhiteNoise serves from here)
```

## API endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/` | Serves React SPA |
| POST | `/pipeline/` | Submit pipeline job (PDB + article) |
| POST | `/extract/` | Submit LLM-only extraction job (article) |
| GET | `/jobs/` | List last 10 jobs (JSON) |
| GET | `/jobs/<uuid>/` | Job detail page (React SPA) |
| GET | `/jobs/<uuid>/status/` | Poll job status (JSON) |
| GET | `/jobs/<uuid>/files/<path>/` | Serve job output file |

## ExtractionJob model (`extractor/models.py`)

| Field | Type | Notes |
|-------|------|-------|
| `job_id` | UUID PK | From pocket-extractor |
| `target` | CharField | Protein target name |
| `article_filename` | CharField | Uploaded article filename |
| `job_type` | CharField | `pipeline` or `extract` |
| `status` | CharField | `pending` / `running` / `done` / `failed` |
| `pockets_json` | JSONField | Raw result from pocket-extractor |
| `output_path` | CharField | Relative path in shared output volume |
| `error` | TextField | Error message if failed |
| `created_at` | DateTimeField | Auto set on create |

## Services (`extractor/services.py`)

- `submit_pipeline(pdb_file, article_file, target)` → `POST /pipeline/async`
- `submit_extract(article_file, target, **kwargs)` → `POST /extract/file/async`
- `poll_job(job_id, job_type)` → `GET /pipeline/jobs/<id>` or `/extract/jobs/<id>`
- `PocketExtractorError` — raised on non-timeout HTTP errors
- `PollTimeout` — raised on `ReadTimeout`; caught silently in `job_status` view

## Environment variables (`.env`)

```
DB_HOST=...
DB_NAME=...
DB_USER=...
DB_PASS=...
SECRET_KEY=...           # optional in dev
LANGGRAPH_URL=...        # default: http://localhost:8000
RESULTS_ROOT=...         # default: BASE_DIR/results; shared volume in Docker
VITE_DEV=true            # optional: use Vite dev server instead of built assets
```
