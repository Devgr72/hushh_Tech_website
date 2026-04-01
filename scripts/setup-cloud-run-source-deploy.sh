#!/usr/bin/env bash

set -euo pipefail

PROJECT_ID=""
DEPLOYER_SERVICE_ACCOUNT=""
RUNTIME_SERVICE_ACCOUNT=""
BUILD_SERVICE_ACCOUNT_NAME="cloud-run-build"
BUILD_SERVICE_ACCOUNT_EMAIL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project) PROJECT_ID="$2"; shift 2 ;;
    --deployer-service-account) DEPLOYER_SERVICE_ACCOUNT="$2"; shift 2 ;;
    --runtime-service-account) RUNTIME_SERVICE_ACCOUNT="$2"; shift 2 ;;
    --build-service-account-name) BUILD_SERVICE_ACCOUNT_NAME="$2"; shift 2 ;;
    --build-service-account-email) BUILD_SERVICE_ACCOUNT_EMAIL="$2"; shift 2 ;;
    --help|-h)
      echo "Usage: $0 --project PROJECT_ID --deployer-service-account EMAIL --runtime-service-account EMAIL [--build-service-account-name NAME] [--build-service-account-email EMAIL]"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [[ -z "$PROJECT_ID" || -z "$DEPLOYER_SERVICE_ACCOUNT" || -z "$RUNTIME_SERVICE_ACCOUNT" ]]; then
  echo "Missing required arguments."
  echo "Usage: $0 --project PROJECT_ID --deployer-service-account EMAIL --runtime-service-account EMAIL [--build-service-account-name NAME] [--build-service-account-email EMAIL]"
  exit 1
fi

if [[ -z "$BUILD_SERVICE_ACCOUNT_EMAIL" ]]; then
  BUILD_SERVICE_ACCOUNT_EMAIL="${BUILD_SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
fi

echo "===================================================="
echo "Configuring Cloud Run source deploy permissions"
echo "  Project:             $PROJECT_ID"
echo "  Deployer SA:         $DEPLOYER_SERVICE_ACCOUNT"
echo "  Runtime SA:          $RUNTIME_SERVICE_ACCOUNT"
echo "  Build SA:            $BUILD_SERVICE_ACCOUNT_EMAIL"
echo "===================================================="

gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  --project="$PROJECT_ID" >/dev/null

if ! gcloud iam service-accounts describe "$BUILD_SERVICE_ACCOUNT_EMAIL" --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "Creating build service account: $BUILD_SERVICE_ACCOUNT_NAME"
  gcloud iam service-accounts create "$BUILD_SERVICE_ACCOUNT_NAME" \
    --project="$PROJECT_ID" \
    --display-name="Cloud Run source build service account"
else
  echo "Build service account already exists."
fi

echo "Granting deployer roles on project..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${DEPLOYER_SERVICE_ACCOUNT}" \
  --role="roles/run.sourceDeveloper" \
  --quiet >/dev/null

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${DEPLOYER_SERVICE_ACCOUNT}" \
  --role="roles/serviceusage.serviceUsageConsumer" \
  --quiet >/dev/null

echo "Granting deployer access to runtime service account..."
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SERVICE_ACCOUNT" \
  --project="$PROJECT_ID" \
  --member="serviceAccount:${DEPLOYER_SERVICE_ACCOUNT}" \
  --role="roles/iam.serviceAccountUser" \
  --quiet >/dev/null

echo "Granting deployer access to the build service account for explicit --build-service-account usage..."
gcloud iam service-accounts add-iam-policy-binding "$BUILD_SERVICE_ACCOUNT_EMAIL" \
  --project="$PROJECT_ID" \
  --member="serviceAccount:${DEPLOYER_SERVICE_ACCOUNT}" \
  --role="roles/iam.serviceAccountUser" \
  --quiet >/dev/null

echo "Granting Cloud Run builder role to the build service account..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${BUILD_SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/run.builder" \
  --quiet >/dev/null

echo ""
echo "Done."
echo "Use this build service account in source deploys:"
echo "  projects/${PROJECT_ID}/serviceAccounts/${BUILD_SERVICE_ACCOUNT_EMAIL}"
