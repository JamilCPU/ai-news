# SIGNAL (ai-news)

SIGNAL is a small web app that publishes a daily digest of AI news aimed at builders. Each day produces a static HTML digest page plus an entry in a JSON index; the front end lists the digests and lets readers "like" articles. Likes are aggregated by category and source so they can be fed back into the next digest run.

The digest-generation agent itself is not part of this repository. Only its output (the dated pages under `app/public/digests/`) and the site that serves them are included.

## Stack

- Node.js 20 and Express 4 (`app/server.js`) for self-hosting
- Vanilla HTML, CSS and JavaScript front end (no build step)
- Cloudflare Pages Functions plus a Workers KV namespace (`SIGNAL_LIKES`) for the like counter (`functions/api/`)
- Docker and Docker Compose

## Running

Self-hosted with Docker:

```bash
export LAB_DB_API=http://localhost:8741   # optional, see Configuration
docker compose up --build
# open http://localhost:3002
```

Without Docker:

```bash
cd app
npm install
npm start          # http://localhost:3000 (override with PORT)
```

On Cloudflare Pages, serve `app/public` as the static output, deploy the `functions/` directory, and bind a KV namespace named `SIGNAL_LIKES`. `app/public/_redirects` maps `/api/digests` to the static `digests/index.json`, and `_headers` sets cache rules.

### Configuration

- `PORT` - port for the Express server (default 3000)
- `LAB_DB_API` - base URL of an optional companion API; `docker-compose.yml` passes it into the container

## Project layout

- `app/` - Express server, Dockerfile and the static site (`public/`)
- `app/public/digests/` - generated daily digest pages and `index.json`
- `functions/api/like.js` - POST/GET like counter with per-IP, 30-day de-duplication
- `functions/api/likes/summary.js` - aggregated likes by category and source

## Status

Working and used for personal reading. The like endpoints need Cloudflare KV and do not run under the plain Express server.
