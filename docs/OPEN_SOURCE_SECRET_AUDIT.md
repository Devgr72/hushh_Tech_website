# Open-Source Secret Audit

This repo is being hardened for public contribution without changing production behavior during the cutover.

## What This Cutover Adds

- contributor-facing repo docs and community health files
- gitleaks-based scanning for the current tree and git history
- a rewrite-history script for the maintainer-only cleanup step
- branch protection and private vulnerability reporting on GitHub

## What Still Requires Maintainer Follow-Up

- credential rotation for historically exposed secrets
- git history rewrite to remove committed `.env` and `.p8` artifacts
- follow-up runtime/browser-secret cleanup work that has been intentionally split from the production-safe cutover

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

## Repo Guardrails In This PR

- `npm run security:gitleaks`
- `npm run security:audit`
- `npm run security:pre-commit`
- `.pre-commit-config.yaml`
- `.github/workflows/secret-hygiene.yml`

## Before The History Rewrite

1. Rotate every credential exposed in git history or prior browser/runtime flows.
2. Verify production runs on rotated secrets stored in GCP Secret Manager.
3. Run `npm run security:audit`.
4. Rewrite git history with `npm run security:rewrite-history`.
5. Force-push the rewritten repo and have collaborators re-clone.

## Endpoint-Level Hardening

Server-side secret storage is necessary but not sufficient. Serverless endpoints that call vendor APIs using server-held credentials must also enforce:

- Origin allowlist (rejects third-party browser callers)
- Method guard (405 on anything but the expected verb)
- Per-IP rate limit (caps abuse and vendor credit burn)
- Error redaction (no env var names, bearer tokens, or provider keys echoed back)

These are implemented in `api/shared/security.js` and applied to:

- `api/generate-investor-profile.js` (OpenAI GPT-4o)
- `api/enrich-preferences.js` (OpenAI chat completions)
- `api/send-email-notification.js` (Gmail SMTP)

`api/gemini-ephemeral-token.js` is rearchitected separately on the broker track.
`api/google-wallet-pass.js` uses its own `GOOGLE_WALLET_ALLOWED_ORIGINS` allowlist and is unchanged.

The per-instance rate limiter is best-effort. For durable cross-instance rate limiting, see the existing `hushh_ai_rate_limits` Supabase table referenced in `api/delete-account-service.js`.
