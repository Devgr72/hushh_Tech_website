#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "History rewrite requires a clean working tree. Commit or stash your changes first."
  exit 1
fi

if ! git filter-repo --version >/dev/null 2>&1; then
  echo "git-filter-repo is not installed."
  echo "Install it first, then re-run: npm run security:rewrite-history"
  exit 1
fi

echo "Rewriting history to remove known secret-bearing files..."
git filter-repo \
  --force \
  --invert-paths \
  --path .env \
  --path src/scripts/AuthKey_LK53NZBH4L.p8

cat <<'EOF'

History rewrite completed for the known secret-bearing files.

Next steps:
1. Confirm all exposed credentials were rotated before publishing.
2. Run: npm run security:audit
3. Force-push the rewritten branches and tags.
4. Have all collaborators re-clone or hard reset to the rewritten history.
EOF
