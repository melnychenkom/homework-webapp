# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

Requires PHP, MySQL/MariaDB, and Composer. Copy `.env.example` to `.env` (or create `.env`) with database credentials, then:

```bash
composer install          # Install PHP dependencies (phpdotenv)
php -S localhost:8000     # Start local dev server
```

Bootstrap is installed via npm (`npm install`) but the compiled CSS from the Freelancer template is already included in `css/styles.css` — no build step is needed.

## Architecture

**LAMP stack** educational site about BLAST (bioinformatics sequence search tool). UI is in Ukrainian.

**PHP endpoints:**
- `index.php` — main page, server-rendered with Bootstrap Freelancer theme
- `db.php` — shared PDO database connection, loaded via `require_once` in other PHP files
- `submit.php` — POST handler for feedback form; validates input, inserts into `feedback` table
- `messages.php` — GET handler; returns rendered HTML of all feedback messages (loaded dynamically by HTMX)
- `delete.php` — POST handler for deleting a message by ID

**Frontend:**
- `css/styles.css` — Bootstrap 5 Freelancer theme (do not edit; it's a third-party template)
- `css/custom.css` — project-specific overrides
- `js/scripts.js` — navbar scroll effect, example content switcher, async form submission, HTMX-based message reload and deletion

**Database schema** (MySQL):
```sql
CREATE TABLE feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255),
  email VARCHAR(255),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**HTMX** (v1.9.12, loaded from CDN) drives dynamic content: the messages list auto-refreshes after form submission and after deletion without full page reloads.
