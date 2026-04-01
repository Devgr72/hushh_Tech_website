#!/usr/bin/env bash

set -euo pipefail

CANONICAL_DOMAIN="hushhtech.com"
REDIRECT_DOMAIN="www.hushhtech.com"
UAT_DOMAIN="uat.hushhtech.com"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --canonical-domain) CANONICAL_DOMAIN="$2"; shift 2 ;;
    --redirect-domain) REDIRECT_DOMAIN="$2"; shift 2 ;;
    --uat-domain) UAT_DOMAIN="$2"; shift 2 ;;
    --help|-h)
      echo "Usage: $0 [--canonical-domain hushhtech.com] [--redirect-domain www.hushhtech.com] [--uat-domain uat.hushhtech.com]"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

assert_contains() {
  local haystack="$1"
  local needle="$2"
  local message="$3"
  if grep -qi "$needle" <<<"$haystack"; then
    echo "PASS: $message"
  else
    echo "FAIL: $message"
    return 1
  fi
}

canonical_headers="$(curl -sI "https://${CANONICAL_DOMAIN}")"
redirect_headers="$(curl -sI "https://${REDIRECT_DOMAIN}")"
well_known_headers="$(curl -sI "https://${REDIRECT_DOMAIN}/.well-known/apple-app-site-association")"
assetlinks_headers="$(curl -sI "https://${REDIRECT_DOMAIN}/.well-known/assetlinks.json")"
uat_headers="$(curl -sI "https://${UAT_DOMAIN}")"

assert_contains "$canonical_headers" "^server: google frontend" "${CANONICAL_DOMAIN} is served by Google"
assert_contains "$redirect_headers" "^location: https://${CANONICAL_DOMAIN}" "${REDIRECT_DOMAIN} redirects to the apex host"
assert_contains "$well_known_headers" "^http/.* 200" "${REDIRECT_DOMAIN}/.well-known/apple-app-site-association is served directly"
assert_contains "$assetlinks_headers" "^http/.* 200" "${REDIRECT_DOMAIN}/.well-known/assetlinks.json is served directly"
assert_contains "$uat_headers" "^server: google frontend" "${UAT_DOMAIN} is served by Google"

echo ""
echo "Canonical headers:"
echo "$canonical_headers"
