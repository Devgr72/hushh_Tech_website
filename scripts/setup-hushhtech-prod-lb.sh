#!/usr/bin/env bash

set -euo pipefail

PROJECT_ID=""
REGION="us-central1"
SERVICE_NAME="hushh-tech-website"
CANONICAL_DOMAIN="hushhtech.com"
REDIRECT_DOMAIN="www.hushhtech.com"
NEG_NAME="hushhtech-prod-neg"
BACKEND_SERVICE_NAME="hushhtech-prod-backend"
URL_MAP_NAME="hushhtech-prod-url-map"
CERTIFICATE_NAME="hushhtech-prod-cert"
HTTPS_PROXY_NAME="hushhtech-prod-https-proxy"
IPV4_ADDRESS_NAME="hushhtech-prod-ipv4"
IPV6_ADDRESS_NAME="hushhtech-prod-ipv6"
FORWARDING_RULE_IPV4="hushhtech-prod-https-ipv4"
FORWARDING_RULE_IPV6="hushhtech-prod-https-ipv6"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project) PROJECT_ID="$2"; shift 2 ;;
    --region) REGION="$2"; shift 2 ;;
    --service) SERVICE_NAME="$2"; shift 2 ;;
    --canonical-domain) CANONICAL_DOMAIN="$2"; shift 2 ;;
    --redirect-domain) REDIRECT_DOMAIN="$2"; shift 2 ;;
    --help|-h)
      echo "Usage: $0 --project PROJECT_ID [--region us-central1] [--service hushh-tech-website] [--canonical-domain hushhtech.com] [--redirect-domain www.hushhtech.com]"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [[ -z "$PROJECT_ID" ]]; then
  echo "Missing required --project PROJECT_ID"
  exit 1
fi

if ! gcloud components list --format='value(id)' 2>/dev/null | grep -qx 'beta'; then
  echo "The gcloud beta component is required for serverless NEG commands."
  echo "Install it with: gcloud components install beta"
  exit 1
fi

backend_uri="https://www.googleapis.com/compute/v1/projects/${PROJECT_ID}/global/backendServices/${BACKEND_SERVICE_NAME}"
tmp_url_map="$(mktemp)"
trap 'rm -f "$tmp_url_map"' EXIT

cat >"$tmp_url_map" <<EOF
name: ${URL_MAP_NAME}
defaultService: ${backend_uri}
hostRules:
- hosts:
  - ${CANONICAL_DOMAIN}
  pathMatcher: canonical-matcher
- hosts:
  - ${REDIRECT_DOMAIN}
  pathMatcher: redirect-matcher
pathMatchers:
- name: canonical-matcher
  defaultService: ${backend_uri}
- name: redirect-matcher
  routeRules:
  - priority: 1
    matchRules:
    - prefixMatch: /.well-known/
    service: ${backend_uri}
  defaultUrlRedirect:
    hostRedirect: ${CANONICAL_DOMAIN}
    httpsRedirect: true
    redirectResponseCode: MOVED_PERMANENTLY_DEFAULT
EOF

echo "===================================================="
echo "Setting up production HTTPS load balancer for HushhTech"
echo "  Project:             $PROJECT_ID"
echo "  Region:              $REGION"
echo "  Service:             $SERVICE_NAME"
echo "  Canonical domain:    $CANONICAL_DOMAIN"
echo "  Redirect domain:     $REDIRECT_DOMAIN"
echo "===================================================="

gcloud services enable compute.googleapis.com run.googleapis.com --project="$PROJECT_ID" >/dev/null

if ! gcloud compute addresses describe "$IPV4_ADDRESS_NAME" --project="$PROJECT_ID" --global >/dev/null 2>&1; then
  gcloud compute addresses create "$IPV4_ADDRESS_NAME" \
    --project="$PROJECT_ID" \
    --global \
    --ip-version=IPV4
fi

if ! gcloud compute addresses describe "$IPV6_ADDRESS_NAME" --project="$PROJECT_ID" --global >/dev/null 2>&1; then
  gcloud compute addresses create "$IPV6_ADDRESS_NAME" \
    --project="$PROJECT_ID" \
    --global \
    --ip-version=IPV6
fi

if ! gcloud beta compute network-endpoint-groups describe "$NEG_NAME" --project="$PROJECT_ID" --region="$REGION" >/dev/null 2>&1; then
  gcloud beta compute network-endpoint-groups create "$NEG_NAME" \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --network-endpoint-type=serverless \
    --cloud-run-service="$SERVICE_NAME"
fi

if ! gcloud compute backend-services describe "$BACKEND_SERVICE_NAME" --project="$PROJECT_ID" --global >/dev/null 2>&1; then
  gcloud compute backend-services create "$BACKEND_SERVICE_NAME" \
    --project="$PROJECT_ID" \
    --global \
    --protocol=HTTP \
    --load-balancing-scheme=EXTERNAL_MANAGED
fi

if ! gcloud compute backend-services describe "$BACKEND_SERVICE_NAME" \
  --project="$PROJECT_ID" \
  --global \
  --format='value(backends[].group)' | grep -q "$NEG_NAME"; then
  gcloud compute backend-services add-backend "$BACKEND_SERVICE_NAME" \
    --project="$PROJECT_ID" \
    --global \
    --network-endpoint-group="$NEG_NAME" \
    --network-endpoint-group-region="$REGION"
fi

if ! gcloud compute ssl-certificates describe "$CERTIFICATE_NAME" --project="$PROJECT_ID" --global >/dev/null 2>&1; then
  gcloud compute ssl-certificates create "$CERTIFICATE_NAME" \
    --project="$PROJECT_ID" \
    --global \
    --domains="${CANONICAL_DOMAIN},${REDIRECT_DOMAIN}"
fi

gcloud compute url-maps import "$URL_MAP_NAME" \
  --project="$PROJECT_ID" \
  --global \
  --source="$tmp_url_map" \
  --quiet

if ! gcloud compute target-https-proxies describe "$HTTPS_PROXY_NAME" --project="$PROJECT_ID" --global >/dev/null 2>&1; then
  gcloud compute target-https-proxies create "$HTTPS_PROXY_NAME" \
    --project="$PROJECT_ID" \
    --global \
    --url-map="$URL_MAP_NAME" \
    --ssl-certificates="$CERTIFICATE_NAME"
else
  gcloud compute target-https-proxies update "$HTTPS_PROXY_NAME" \
    --project="$PROJECT_ID" \
    --global \
    --url-map="$URL_MAP_NAME" \
    --ssl-certificates="$CERTIFICATE_NAME"
fi

if ! gcloud compute forwarding-rules describe "$FORWARDING_RULE_IPV4" --project="$PROJECT_ID" --global >/dev/null 2>&1; then
  gcloud compute forwarding-rules create "$FORWARDING_RULE_IPV4" \
    --project="$PROJECT_ID" \
    --global \
    --load-balancing-scheme=EXTERNAL_MANAGED \
    --network-tier=PREMIUM \
    --address="$IPV4_ADDRESS_NAME" \
    --target-https-proxy="$HTTPS_PROXY_NAME" \
    --ports=443
fi

if ! gcloud compute forwarding-rules describe "$FORWARDING_RULE_IPV6" --project="$PROJECT_ID" --global >/dev/null 2>&1; then
  gcloud compute forwarding-rules create "$FORWARDING_RULE_IPV6" \
    --project="$PROJECT_ID" \
    --global \
    --load-balancing-scheme=EXTERNAL_MANAGED \
    --network-tier=PREMIUM \
    --address="$IPV6_ADDRESS_NAME" \
    --target-https-proxy="$HTTPS_PROXY_NAME" \
    --ports=443
fi

IPV4_ADDRESS="$(gcloud compute addresses describe "$IPV4_ADDRESS_NAME" --project="$PROJECT_ID" --global --format='value(address)')"
IPV6_ADDRESS="$(gcloud compute addresses describe "$IPV6_ADDRESS_NAME" --project="$PROJECT_ID" --global --format='value(address)')"

echo ""
echo "Production HTTPS edge configured."
echo "Set DNS TTL to 300, then point both hosts at:"
echo "  A    ${CANONICAL_DOMAIN}      ${IPV4_ADDRESS}"
echo "  AAAA ${CANONICAL_DOMAIN}      ${IPV6_ADDRESS}"
echo "  A    ${REDIRECT_DOMAIN}       ${IPV4_ADDRESS}"
echo "  AAAA ${REDIRECT_DOMAIN}       ${IPV6_ADDRESS}"
echo ""
echo "Managed certificate status:"
echo "  gcloud compute ssl-certificates describe ${CERTIFICATE_NAME} --project ${PROJECT_ID} --global"
