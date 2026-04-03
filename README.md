# BLAST — Пошук гомологів

Навчальний вебзастосунок про інструмент BLAST (Basic Local Alignment Search Tool) та пошук гомологічних біологічних послідовностей.

## Технології

- **Python / Django 6** — бекенд
- **MySQL** — база даних
- **HTMX** — динамічне оновлення списку повідомлень
- **Bootstrap 5** — стилі (тема Freelancer)
- **uv** — керування залежностями
- **Docker** — контейнеризація

## Запуск локально

Потрібно: Python 3.11+, uv, MySQL 8+.

```bash
git clone git@github.com:melnychenkom/homework-webapp.git
cd homework-webapp

# Створити .env з параметрами бази даних
cp .env.example .env

uv sync
uv run manage.py migrate
uv run manage.py runserver
```

Відкрити `http://localhost:8000`.

## Запуск у Docker

```bash
docker build -t blast-webapp .
docker run -p 8000:8000 --env-file .env blast-webapp
```

## Змінні середовища (`.env`)

```
DB_HOST=...
DB_NAME=...
DB_USER=...
DB_PASS=...
SECRET_KEY=...
```

## Тести

```bash
uv run manage.py test core
```

Тести використовують SQLite — підключення до MySQL не потрібне.
