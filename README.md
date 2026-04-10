# Hushh Tech Website

This repository combines the public website, product surfaces, serverless APIs, Supabase assets, and mobile shells used across Hushh experiences.

## Open source

Repository URL: https://github.com/hushh-labs/hushh_Tech_website

- License: [MIT](/Users/ankitkumarsingh/hushhTech/LICENSE)
- Contributing guide: [CONTRIBUTING.md](/Users/ankitkumarsingh/hushhTech/CONTRIBUTING.md)
- Security policy: [SECURITY.md](/Users/ankitkumarsingh/hushhTech/SECURITY.md)
- Code of conduct: [CODE_OF_CONDUCT.md](/Users/ankitkumarsingh/hushhTech/CODE_OF_CONDUCT.md)
- Support: [SUPPORT.md](/Users/ankitkumarsingh/hushhTech/SUPPORT.md)

## Project layout

- `src/`: Active frontend code.
- `src/pages/`: Live route entry points. Prefer the folder-based `ui.tsx` + `logic.ts` pattern for new pages.
- `src/hushh-*`, `src/kai*`: Product-specific app modules.
- `public/`: Static assets served directly by Vite.
- `api/`: Vercel-style serverless endpoints.
- `supabase/`: Edge functions, timestamped migrations, local config, and manual SQL scripts.
- `cloud-run/`: Standalone service deployments.
- `scripts/`: Deployment, maintenance, and operational scripts.
- `docs/`: Product, architecture, runbook, and archive documentation.
- `tests/`: Vitest coverage for critical flows.
- `playstore-assets/`: Store listing assets and release notes.

## Structure conventions

- Keep runtime app code in `src/`.
- Keep timestamped, environment-safe database changes in `supabase/migrations/`.
- Keep one-off or historical SQL in `supabase/manual-sql/`.
- Keep unused page snapshots out of `src/` and archive them under `docs/archive/`.
- Avoid adding ad hoc files to the project root unless they are true repo entrypoints such as toolchain config files.

## Cleanup notes

- Legacy page snapshots that are no longer imported now live in `docs/archive/src-pages/`.
- Operational SQL that used to sit in the repo root now lives in `supabase/manual-sql/`.
- Product docs that are not part of the shipped app should live in `docs/`, not `src/`.
- Capacitor native project files and mobile build scripts have been removed from this repo.
