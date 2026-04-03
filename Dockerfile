FROM python:3.13-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY . .

ENV DJANGO_SETTINGS_MODULE=blast.settings
ENV PATH="/app/.venv/bin:$PATH"

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "blast.wsgi", "--bind", "0.0.0.0:8000", "--workers", "2"]
