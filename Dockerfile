FROM node:22-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM python:3.13-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

ENV UV_PROJECT_ENVIRONMENT=/venv
ENV VIRTUAL_ENV=/venv
ENV PATH="/venv/bin:$PATH"

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY . .
COPY --from=frontend /app/react ./react

ENV DJANGO_SETTINGS_MODULE=webapp.settings

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "webapp.wsgi", "--bind", "0.0.0.0:8000", "--workers", "2"]
