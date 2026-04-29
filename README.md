# DNA Phylogenetics

Django + React web app for DNA sequence alignment and phylogenetic tree visualisation. Upload a FASTA file, get an interactive tree.

**Stack:** Django 6 · MySQL · React 19 · Vite · Bootstrap 5 · Docker

## Quick start

```bash
cp .env.example .env   # fill in DB_HOST, DB_NAME, DB_USER, DB_PASS, SECRET_KEY
docker compose up --build
```

App runs at **<http://localhost:8080>**.

## Development

After Python-only changes:

```bash
docker compose restart django
```

After frontend changes:

```bash
cd frontend && npm run build
docker compose up --build
```

Run tests (no DB required):

```bash
uv run manage.py test aligner
```

## Environment variables

| Variable       | Description                             |
| -------------- | --------------------------------------- |
| `DB_HOST`      | MySQL host                              |
| `DB_NAME`      | Database name                           |
| `DB_USER`      | Database user                           |
| `DB_PASS`      | Database password                       |
| `SECRET_KEY`   | Django secret key                       |
| `RESULTS_ROOT` | Output directory (default: `./results`) |
| `VITE_DEV`     | Set `true` to use Vite HMR dev server   |

## API

| Method | URL                          | Description          |
| ------ | ---------------------------- | -------------------- |
| POST   | `/upload/`                   | Submit FASTA file    |
| GET    | `/jobs/`                     | List recent jobs     |
| GET    | `/jobs/<uuid>/status/`       | Poll job status      |
| GET    | `/jobs/<uuid>/files/<path>/` | Download output file |
