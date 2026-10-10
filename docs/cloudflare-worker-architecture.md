# Zero-Backend Cloudflare Worker Architecture

This document details the architectural plan for the off-site, zero-backend execution environment for Clone Bay background tasks (e.g., Discord webhook notifications, periodic threshold monitoring). 

## 1. The Core Philosophy: "Trust, but Verify" OpSec
By forcing users to deploy their own background worker, we maintain a strict Zero-Knowledge OpSec policy. The user effectively becomes their own backend hosting provider for this specific feature.
- **Zero Liability:** The developer holds no tokens and hosts no servers.
- **Total Ownership:** EVE SSO tokens never touch our servers, satisfying the high paranoia of EVE multiboxers.

## 2. Cost to the User: 100% Free
Users will never be asked for a credit card and will never hit a billing wall. Cloudflare’s Free Tier for Workers is built for massive enterprise applications and is incredibly generous:
- **Cloudflare's Free Limit:** 100,000 requests per day.
- **Clone Bay Worker Usage:** If the cron job runs every 15 minutes, that is 4 times an hour, or **96 requests per day**.
- **The Math:** The Clone Bay background script will use **0.096%** of their daily free limit. It is completely, absolutely free forever.

## 3. The Deployment Mechanism & User UX (Path B: Invisible Auto-Updater)
We will use Cloudflare's "Deploy to Workers" integration to allow 1-click provisioning. We are opting for the **"Invisible Auto-Updater"** UX path. It requires ~5 minutes of initial setup, but ensures the user's worker silently inherits every future update automatically without them ever touching code again.

**The Exact Step-by-Step User Journey:**

### Step 1: The Deploy & Variables (2 minutes)
1. **The Button:** The user clicks the deployment badge in Clone Bay:
   `[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/TerribleTurtle/clonebay-worker-template)`
2. **Cloudflare Handoff:** They log into Cloudflare and click **Authorize GitHub**. Cloudflare automatically forks the template repository into their personal GitHub account and deploys the worker.
3. **The Variables:** They navigate to their new Cloudflare Dashboard -> `Settings` -> `Variables` and paste their `ESI_REFRESH_TOKEN` and `DISCORD_WEBHOOK_URL`. *(The worker is now fully functional).*

### Step 2: The Hook Generation (1 minute)
1. While still in the Cloudflare dashboard, they navigate to `Settings` -> `Builds`.
2. They click **Generate Deploy Hook** and copy the unique URL it gives them.

### Step 3: The GitHub Secret (2 minutes)
1. They open their newly forked GitHub repository.
2. They navigate to `Settings` -> `Secrets and variables` -> `Actions`.
3. They click **New repository secret**.
4. They name it `CLOUDFLARE_DEPLOY_HOOK` and paste the URL.
*(Setup Complete. The worker will now auto-update forever).*

## 4. Automated Version Control (Under the Hood)
Since users now own a fork of our code, we use a GitHub Action packaged inside the template repository (`.github/workflows/auto-sync.yml`) that runs on a weekly schedule.

**CRITICAL CAVEAT (The `GITHUB_TOKEN` Trap):**
If a GitHub Action uses the default `GITHUB_TOKEN` to push the merged code to the user's fork, Cloudflare's deployment webhook *will not fire* (to prevent recursive webhook loops). 
To bypass this, the Action uses the `CLOUDFLARE_DEPLOY_HOOK` secret the user set up in Step 3 to explicitly trigger the build.

### The Auto-Sync Workflow Implementation:
```yaml
name: Auto-Sync Worker Updates
on:
  schedule:
    - cron: '0 0 * * 0' # Every Sunday at midnight
  workflow_dispatch: # Allow manual trigger

jobs:
  sync_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
        with:
          fetch-depth: 0
          
      - name: Sync upstream changes
        run: |
          git config --global user.name 'github-actions[bot]'
          git config --global user.email 'github-actions[bot]@users.noreply.github.com'
          git remote add upstream https://github.com/TerribleTurtle/clonebay-worker-template.git
          git fetch upstream
          git merge upstream/main --no-edit --allow-unrelated-histories
          git push origin main
          
      - name: Trigger Cloudflare Deploy Hook
        if: success()
        run: |
          # The URL is stored securely in GitHub Secrets, NOT in the public code.
          # This prevents malicious actors from spamming the user's build pipeline.
          curl -X POST "${{ secrets.CLOUDFLARE_DEPLOY_HOOK }}"
```

## 5. Token Resilience & Expiration Rules
**The Question:** How often will the worker fail due to token expiration?
**The Answer:** Practically never.

- EVE Online SSO Refresh Tokens are **permanent**. They do not expire from inactivity.
- They will only fail if:
  1. The user explicitly logs into EVE Online and revokes the application from the Third-Party Applications portal.
  2. We update the application to require new ESI scopes (forcing a re-auth).
  3. CCP executes a global token wipe.

**Error Handling (Fail Loudly):**
Because the worker is stateless and cannot automatically update its own Cloudflare environment variables, it must fail loudly on token death. If the worker encounters an invalid Refresh Token (HTTP 400 `invalid_token` from `/v2/oauth/token`), it will immediately send a Discord Webhook message:
> *"🚨 Clone Bay Worker Authentication Failed! Your ESI Refresh Token has expired or was revoked. Please open Clone Bay, generate a new token, and update your Cloudflare Variables."*
