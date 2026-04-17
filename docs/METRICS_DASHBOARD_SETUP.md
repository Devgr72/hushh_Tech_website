# Metrics Dashboard Setup

## Local Development

The KPI dashboard needs two local processes:

0. Create `.env.local` from `.env.local.example` and fill in the real values for:
   - `VITE_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
1. Frontend on port `5173`
   `npm run dev`
2. Local API host on port `3000`
   `npm run dev:api`

The Vite dev server proxies `/api/*` requests to `http://127.0.0.1:3000`, so `/metrics` will stay blank or degraded until the API host is running.
The local API host now reads `.env.local` automatically and falls back to any env vars already exported in the shell.

### Required environment variables

- `SUPABASE_URL` or `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Quick checks

```bash
curl 'http://127.0.0.1:3000/api/metrics'
curl 'http://127.0.0.1:3000/api/metrics/summary?window_days=7'
curl 'http://127.0.0.1:5173/api/metrics/summary?window_days=7'
npm run test:e2e:metrics
```

All commands should return JSON.

## Real E2E Smoke

1. Ensure Playwright Chromium is installed:
   `npx playwright install chromium`
2. Run:
   `npm run test:e2e:metrics`

The smoke test fails if:
- the summary API returns a config error
- `/metrics` shows the red error panel
- the dashboard stays blank or stuck in the initial loading state

## Production Runtime

- Public page: `/metrics`
- Legacy alias: `/metric` redirects to `/metrics`
- API route: `/api/metrics/summary`

Cloud Run must expose the metrics API route through `server.js`, and the runtime must have:

- `SUPABASE_URL` or `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
