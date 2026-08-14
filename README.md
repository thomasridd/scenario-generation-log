# Test Scenario Tracker

A small standalone service that data-seeding scripts (Postman/Newman) call at
the end of a run to log the test scenario they just seeded in a staging
environment. Testers can then browse and search those scenarios through a
simple web UI, built with the
[MoJ Design System](https://design-patterns.service.justice.gov.uk/) /
GOV.UK Frontend.

## Tech stack

- TypeScript + Express
- PostgreSQL (via `pg`, no ORM)
- Server-rendered views with [Nunjucks](https://mozilla.github.io/nunjucks/)
- Styling from `@ministryofjustice/frontend` (built on `govuk-frontend`)
- Validation with [Zod](https://zod.dev/)

## Project layout

```
migrations/       Plain SQL migration files
scripts/          Migration runner + static asset copy script
scss/app.scss     Entry point that pulls in MoJ/GOV.UK Frontend styles
src/
  index.ts        Express app setup
  db.ts           Postgres connection + query helpers
  validation.ts   Zod schemas
  routes/
    api.ts        POST /api/scenario
    web.ts        Web UI routes
  views/          Nunjucks templates
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start Postgres

Either use the provided `docker-compose.yml`:

```bash
docker compose up -d
```

...or point `DATABASE_URL` at any local Postgres instance you already have
running.

### 3. Configure environment

```bash
cp .env.example .env
```

`.env`:

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/scenario_generation_log
PORT=3000
```

If you're using `docker-compose.yml` as-is, the database `scenario_generation_log`
is created automatically. If you're using your own Postgres instance, create
the database first:

```sql
CREATE DATABASE scenario_generation_log;
```

### 4. Run migrations

```bash
npm run migrate
```

This applies any `.sql` files in `migrations/` that haven't already been
applied (tracked in a `schema_migrations` table), in filename order.

### 5. Run the app

Development (rebuilds CSS on change, restarts server on change):

```bash
npm run dev
```

Production-style build + run:

```bash
npm run build
npm start
```

The app listens on `http://localhost:3000` by default (or whatever `PORT` is
set to).

## API

### `POST /api/scenario`

Public endpoint, called by a seeding script at the end of a run.

Required fields: `env`, `epic`, `scenario`, `identifier`.
Optional fields: `link` (must be an `http(s)` URL), `data` (array of
`{ field, value }` pairs), `note`.

`id` and `created_timestamp` are always set server-side.

Example `curl`, suitable for a Postman/Newman post-request script:

```bash
curl -X POST http://localhost:3000/api/scenario \
  -H "Content-Type: application/json" \
  -d '{
    "env": "Staging",
    "epic": "People report",
    "scenario": "Delete a person",
    "identifier": "Terry Baker",
    "link": "http://www.example.com/person/abcd",
    "data": [
      { "field": "Given name", "value": "Terry" },
      { "field": "Family name", "value": "Baker" }
    ],
    "note": "Some free text"
  }'
```

Success returns `201` with the created record. Invalid input returns `400`
with a validation error body.

## Web UI

- `GET /` — paginated, filterable list of scenarios (filter by environment,
  epic, or free-text search on scenario/identifier; filters are preserved in
  the query string, so pages are shareable).
- `GET /scenario/:id` — scenario detail, including the seeded `data` and an
  editable note.
- `POST /scenario/:id/note` — updates just the `note` field, then redirects
  back to the detail page.

## Notes

- No authentication — this is an internal tool for a trusted environment.
- Only the `note` field is editable after creation; nothing can be deleted
  through the UI.
- `data` is stored as a JSON string (matching what's `JSON.stringify`'d by
  the caller) and parsed back out for display.
