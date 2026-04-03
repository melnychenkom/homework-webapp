# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

Requires Python 3.11+, MySQL, and uv. Create `.env` with database credentials (see below), then:

```bash
uv sync                                    # install Python deps
uv run manage.py migrate --fake-initial    # first run only (table already exists in MySQL)
uv run manage.py runserver                 # start dev server at http://localhost:8000
```

Run tests (uses SQLite — no MySQL connection needed):

```bash
uv run manage.py test core
```

**Note:** The remote MySQL server is version 5.7. Django 5.1+ requires MySQL 8. The app works for tests (SQLite) and local dev, but `migrate` against the remote server will fail until the server is upgraded.

## Architecture

**Django 6 + MySQL** educational site about BLAST (bioinformatics sequence search tool). UI is in Ukrainian. Uses PyMySQL as the MySQL driver (pure Python, no system libs needed).

**Django project layout:**
- `blast/` — project config: `settings.py`, `urls.py`, `wsgi.py`
- `core/` — single app: `models.py`, `views.py`, `urls.py`, `templates/core/`

**Views (`core/views.py`):**
- `index` — `GET /` — renders `core/index.html` (main page)
- `messages` — `GET /messages/` — renders `core/messages.html` (HTMX partial; returns message list HTML)
- `submit` — `POST /submit/` — validates and saves feedback, returns `JsonResponse`
- `delete_message` — `POST /delete/` — deletes feedback by ID, returns `JsonResponse`

**Database:** `Feedback` model in `core/models.py` maps to the existing `feedback` MySQL table (`db_table = 'feedback'`). Fields: `id`, `username`, `email`, `message`, `created_at`.

**Static files** (`css/`, `js/`, `assets/`): served by Django's staticfiles app via `STATICFILES_DIRS = [BASE_DIR]`. Referenced in templates with `{% load static %}{% static '...' %}`.

**HTMX** (v1.9.12, CDN) drives the messages list: auto-loads on page open, refreshes after form submission and deletion.

**CSRF:** `{% csrf_token %}` is inside the feedback form (auto-included in `FormData`). The delete JS reads the token from `document.querySelector('[name="csrfmiddlewaretoken"]').value`.

## Environment variables (`.env`)

```
DB_HOST=...
DB_NAME=...
DB_USER=...
DB_PASS=...
SECRET_KEY=...   # optional in dev; required in prod
```
