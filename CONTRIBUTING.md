# Contributing

Thanks for contributing to Hushh Tech Website.

## Before you start

- Read [README.md](/Users/ankitkumarsingh/hushhTech/README.md) for the repo layout.
- Do not commit secrets, keys, `.env` files, `.p8` files, or service-account JSON.
- Treat GCP Secret Manager as the production source of truth for sensitive values.

## Local setup

```bash
npm ci
npm run test
npm run security:browser-secrets
```

Use these additional checks when you are touching security-sensitive paths:

```bash
npm run security:gitleaks
npm run security:pre-commit
```

## Branching and pull requests

- Do not push directly to `main`.
- Create a topic branch from `main`.
- Keep pull requests focused and small enough to review.
- Explain what changed, why it changed, and how you validated it.

## What maintainers expect

- New runtime code should live in the existing repo structure instead of adding ad hoc root files.
- Browser code must not depend on vendor secrets such as OpenAI or Gemini keys.
- Server-side secret usage should stay behind API routes, Cloud Run env, or Supabase secrets when migration is still in progress.
- Database changes should go through `supabase/migrations/` with timestamped files.

## Validation

At minimum, run the narrowest relevant checks for your change. Examples:

- `npm run test`
- `npx vite build`
- `npm run security:browser-secrets`
- `npm run security:gitleaks`

## Security issues

Do not file public issues for vulnerabilities. Follow [SECURITY.md](/Users/ankitkumarsingh/hushhTech/SECURITY.md).
