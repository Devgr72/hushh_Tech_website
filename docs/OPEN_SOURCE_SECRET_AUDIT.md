# Open-Source Secret Audit

This repo is being hardened for a public release without changing production behavior.

## What Was Removed From The Public Baseline

- Browser-only OpenAI fallbacks such as `VITE_OPENAI_API_KEY`
- Browser-only Gemini fallbacks such as `VITE_GEMINI_API_KEY`
- Gemini session routes that returned provider URLs with embedded `?key=...`
- Frontend build injection of Gemini vendor keys through `cloudbuild*.yaml`

## What Must Stay Server-Side

- `OPENAI_API_KEY`
- `GEMINI_API_KEY` and fallback Gemini keys
- `SUPABASE_SERVICE_ROLE_KEY`
- Apple private key material
- Stripe secrets
- Any other vendor or service credential that grants privileged access

Production secrets should live in GCP Secret Manager, with Supabase secrets kept only where an Edge Function still requires them during migration.

## Historical Exposures Requiring Rotation

The following historical files were previously committed and must be treated as compromised until rotated:

- `.env`
- `src/scripts/AuthKey_LK53NZBH4L.p8`

## Safe Public Config

These values are intentionally public client config when used correctly:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_REDIRECT_URL`
- `VITE_MARKET_SUPABASE_URL`
- `VITE_MARKET_SUPABASE_KEY`
- Firebase public web config values

## Repo Guardrails

- `npm run security:browser-secrets`
- `npm run security:gitleaks`
- `npm run security:audit`
- `npm run security:pre-commit`
- `.pre-commit-config.yaml`
- `.github/workflows/secret-hygiene.yml`

## Before Publishing

1. Rotate every credential exposed in git history or prior browser/runtime flows.
2. Verify production runs on rotated secrets stored in GCP Secret Manager.
3. Run `npm run security:audit`.
4. Rewrite git history with `npm run security:rewrite-history`.
5. Force-push the rewritten repo and have collaborators re-clone.
