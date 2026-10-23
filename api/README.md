# Text2me GAR/FIAS API

The read-only API is a deployment component, not a hosted service. It is ready only after a validated SQLite index is mounted at `/data/gar-address-index.sqlite`.

Endpoints:
- `GET /health` — checks the database and required tables/views.
- `GET /api/addresses?q=<text>&limit=20` — address prefix search.
- `GET /api/addresses?q=12А&include_houses=true` — includes house records and postal codes where available.

The API must run on a persistent host behind a TLS reverse proxy. Mount the database read-only. Set `TEXT2ME_ALLOWED_ORIGINS=https://rytikov0285.github.io` for CORS. Do not configure the public website until the real database is imported and the API endpoint is deployed and tested.

Current limitation: the repository has no production database or hosting credentials. The API is not deployed.
