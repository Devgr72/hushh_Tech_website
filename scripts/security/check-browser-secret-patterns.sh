#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

TARGETS=(
  src
  api
  supabase
  Dockerfile.gcp
  cloudbuild.yaml
  cloudbuild-prod.yaml
  cloudbuild-uat.yaml
  .github/workflows
  custom.d.ts
  src/vite-env.d.ts
  .env.local.example
)

BANNED_ENV_PATTERNS='VITE_OPENAI_API_KEY|window\.__OPENAI_API_KEY__|VITE_GEMINI_API_KEY|VITE_ALLOW_INSECURE_BROWSER_LLM'
BANNED_URL_PATTERN='\?key='

echo "Checking for browser-visible vendor secret patterns..."
if rg -n "$BANNED_ENV_PATTERNS" "${TARGETS[@]}"; then
  echo
  echo "Browser-secret policy failed."
  exit 1
fi

echo "Checking for provider URLs with embedded keys..."
if rg -n "$BANNED_URL_PATTERN" src api supabase; then
  echo
  echo "Embedded-provider-key policy failed."
  exit 1
fi

echo "Browser-secret policy passed."
