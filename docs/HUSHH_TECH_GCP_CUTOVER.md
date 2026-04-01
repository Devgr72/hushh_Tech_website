# HushhTech Google Cloud Cutover Runbook

This runbook makes `https://hushhtech.com` the canonical production host, keeps `uat.hushhtech.com` on its existing Google setup, and removes Vercel from the HushhTech website traffic path.

## 1. Current repo-backed deployment model

- Production deploys from `main` via `.github/workflows/deploy-prod.yml`
- UAT deploys from `develop` via `.github/workflows/deploy-uat.yml`
- Both workflows now use explicit Cloud Build service accounts during `gcloud run deploy --source .`
- The application runtime redirects `www.hushhtech.com/*` to `https://hushhtech.com/*`, while still serving `/.well-known/*` on `www`

## 2. Repair UAT deploy permissions

Look up the current UAT runtime service account:

```bash
gcloud run services describe hushh-tech-website \
  --project hushh-tech-uat \
  --region us-central1 \
  --format='value(spec.template.spec.serviceAccountName)'
```

Apply the required IAM setup:

```bash
./scripts/setup-cloud-run-source-deploy.sh \
  --project hushh-tech-uat \
  --deployer-service-account github-deployer@hushh-tech-uat.iam.gserviceaccount.com \
  --runtime-service-account RUNTIME_SA_EMAIL
```

Expected build service account:

```text
cloud-run-build@hushh-tech-uat.iam.gserviceaccount.com
```

After the IAM update, push to `develop` and confirm the `Deploy to UAT` workflow succeeds.

## 3. Prepare production Google edge

Look up the production runtime service account:

```bash
gcloud run services describe hushh-tech-website \
  --project hushh-tech-prod \
  --region us-central1 \
  --format='value(spec.template.spec.serviceAccountName)'
```

Grant the production source-deploy roles:

```bash
./scripts/setup-cloud-run-source-deploy.sh \
  --project hushh-tech-prod \
  --deployer-service-account github-deployer@hushh-tech-prod.iam.gserviceaccount.com \
  --runtime-service-account RUNTIME_SA_EMAIL
```

Create the production load balancer resources:

```bash
gcloud components install beta

./scripts/setup-hushhtech-prod-lb.sh --project hushh-tech-prod
```

That script creates or updates:

- global IPv4 and IPv6 addresses
- serverless NEG for Cloud Run service `hushh-tech-website`
- global backend service
- Google-managed certificate for `hushhtech.com` and `www.hushhtech.com`
- URL map with:
  - backend routing for `hushhtech.com/*`
  - backend routing for `www.hushhtech.com/.well-known/*`
  - permanent redirect for every other `www.hushhtech.com/*`
- HTTPS proxy and forwarding rules

## 4. DNS cutover

Before changing records:

- lower TTL for `hushhtech.com` and `www.hushhtech.com` to `300`
- wait for the lower TTL to propagate

Then:

- replace the current apex production records with the Google load balancer IPs printed by `setup-hushhtech-prod-lb.sh`
- remove the current `www.hushhtech.com -> *.vercel-dns-017.com` mapping
- point `www.hushhtech.com` at the same Google load balancer IPs

After cutover:

```bash
./scripts/verify-hushhtech-google-edge.sh
```

## 5. Auth and compatibility

- Keep `https://hushhtech.com/auth/callback` as the primary production callback URL
- Keep `https://www.hushhtech.com/auth/callback` in allowlists during the first rollout
- Update Supabase auth URLs with:

```bash
./scripts/update-supabase-auth-url.sh
```

- Keep iOS entitlements for both `hushhtech.com` and `www.hushhtech.com` in this pass

## 6. Final cleanup

After 24-48 hours of stable Google-served traffic:

- remove the HushhTech website domain/project attachment from Vercel
- keep this scope limited to the website; do not remove unrelated Hushh Wallet or other external Vercel services

## 7. Acceptance checks

- `curl -I https://hushhtech.com` shows Google edge headers
- `curl -I https://www.hushhtech.com` returns a redirect to `https://hushhtech.com`
- `curl -I https://www.hushhtech.com/.well-known/apple-app-site-association` returns `200`
- `curl -I https://www.hushhtech.com/.well-known/assetlinks.json` returns `200`
- `curl -I https://uat.hushhtech.com` shows Google edge headers
- a new push to `develop` updates UAT successfully
- a new push to `main` updates production successfully
