# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

A Django + React web interface for **DNA Phylogenetics** — accepts FASTA files, aligns DNA sequences, builds phylogenetic trees, and visualises the result interactively.

Backend: Django 6 + MySQL, served by gunicorn + WhiteNoise. All computation runs on the Django server (no external worker service).
Frontend: React 19 + Vite + Bootstrap 5, built into `react/` and served as static files.

## Running with Docker Compose (primary)

```bash
docker compose up --build       # first run or after frontend changes
docker compose up               # subsequent runs (Python-only changes)
docker compose restart django   # after Python-only changes (no rebuild needed)
```

App is at **http://localhost:8080** (container port 8000 mapped to host 8080).

## Running locally (Python only)

```bash
uv sync
uv run manage.py migrate
uv run manage.py runserver
```

Requires a `.env` file with database credentials.

## Frontend development

```bash
cd frontend
npm install
npm run build    # outputs to ../react/; picked up by collectstatic
```

For live dev with Vite HMR set `VITE_DEV=true` in `.env` and run `npm run dev`.

## Running tests

```bash
uv run manage.py test aligner
```

Uses SQLite in test mode (set in `settings.py`) — no MySQL connection needed.

## Architecture

```
webapp/          Django project config (settings.py, urls.py, wsgi.py)
aligner/       Django app
  models.py        AnalysisJob model
  views.py         API views (upload, status, file serving)
  urls.py          URL routes
  tests.py         Model + file-serving tests
  migrations/
frontend/        React + Vite source
  src/
    App.tsx        HomePage, UploadForm, RecentJobs
    JobDetail.tsx  Job status page with polling, RunInfoCard
    App.css        Bootstrap overrides
    main.tsx       Bootstrap + React root
react/           Vite build output (in Docker image, not in git)
staticfiles/     collectstatic output (WhiteNoise serves from here)
```

**Volume mount strategy**: only `./aligner` and `./webapp` are bind-mounted, so `react/` and `staticfiles/` built during `docker build` are preserved and served correctly by WhiteNoise.

## API endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/` | Serves React SPA |
| POST | `/upload/` | Accept FASTA file, create AnalysisJob |
| GET | `/jobs/` | List last 10 jobs (JSON) |
| GET | `/jobs/<uuid>/` | Job detail page (React SPA) |
| GET | `/jobs/<uuid>/status/` | Poll job status (JSON) |
| GET | `/jobs/<uuid>/files/<path>/` | Serve job output file |

## AnalysisJob model (`aligner/models.py`)

| Field | Type | Notes |
|-------|------|-------|
| `job_id` | UUID PK | Auto-generated |
| `name` | CharField | User-supplied analysis name |
| `fasta_filename` | CharField | Uploaded FASTA filename |
| `status` | CharField | `pending` / `running` / `done` / `failed` |
| `results_json` | JSONField | Analysis results (alignment, tree data) |
| `output_path` | CharField | Relative path in shared output volume |
| `error` | TextField | Error message if failed |
| `created_at` | DateTimeField | Auto set on create |

## Environment variables (`.env`)

```
DB_HOST=...
DB_NAME=...
DB_USER=...
DB_PASS=...
SECRET_KEY=...           # optional in dev
RESULTS_ROOT=...         # default: BASE_DIR/results
VITE_DEV=true            # optional: use Vite dev server instead of built assets
```

## Settings notes

`webapp/settings.py` contains pymysql version patches that allow connecting to older MySQL 5.7 instances — do not remove them.
