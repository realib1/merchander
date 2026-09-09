# Merchander Production Deployment Guide

This guide details the steps to deploy Merchander to production across Vercel (Next.js Web Application), Supabase (PostgreSQL Database & Storage), and a container host (Python Intelligence Brain).

---

## 1. Architecture & Deployment Topology

| Component | Stack | Recommended Host | Role |
| :--- | :--- | :--- | :--- |
| **Web Application** | Next.js 15, React 19, Tailwind CSS | **Vercel** | Merchant dashboard, public storefronts, platform console, webhooks |
| **Database & Auth** | PostgreSQL 15, PostgREST, GoTrue | **Supabase** | Multi-tenant relational data, RLS security, user auth, media buckets |
| **Intelligence Service** | Python 3.12, FastAPI, Celery | **Render / Railway** | Catalog retrieval, extraction, grounded replies, background queues |

---

## 2. Step 1: Supabase Database & Migrations

Before deploying the frontend, ensure your remote Supabase project is configured and all migrations are applied.

### Apply Database Migrations
1. Link your Supabase project locally via the Supabase CLI:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   ```
2. Push all migrations to remote:
   ```bash
   npx supabase db push
   ```
3. Alternatively, copy and execute migration files from `supabase/migrations/` sequentially in the **Supabase Dashboard SQL Editor**.
4. Confirm PostgREST schema cache is reloaded:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

### Configure Supabase Auth URLs
In **Authentication -> URL Configuration**:
- **Site URL:** `https://app.merchander.com` (or your primary domain)
- **Redirect URLs:**
  - `https://app.merchander.com/**`
  - `https://*.merchander.store/**`
  - `http://localhost:3000/**` (for local development)

---

## 3. Step 2: Deploy Next.js Web App to Vercel

### Project Setup on Vercel
1. Import the Git repository into Vercel.
2. Select **Next.js** as the Framework Preset.
3. Root Directory: `./`
4. Build Command: `yarn build` (auto-detected from `vercel.json`).
5. Install Command: `yarn install`.

### Environment Variables
Under **Project Settings -> Environment Variables**, add the variables documented in `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`: Your production Supabase URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your production Supabase anon key.
- `SUPABASE_SERVICE_ROLE_KEY`: Your production Supabase service role key.
- `NEXT_PUBLIC_APP_URL`: Primary web address, e.g. `https://app.merchander.com`.
- `NEXT_PUBLIC_ROOT_DOMAIN`: Root domain for store subdomains, e.g. `merchander.store`.
- `NEXT_PUBLIC_CNAME_TARGET`: Custom domain CNAME target, e.g. `cname.merchander.store`.
- `PAYSTACK_SECRET_KEY`: Live Paystack secret key (`sk_live_...`).
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`: Live Paystack public key (`pk_live_...`).
- `HUBTEL_CLIENT_ID`: Production Hubtel client ID.
- `HUBTEL_CLIENT_SECRET`: Production Hubtel client secret.
- `HUBTEL_MERCHANT_ACCOUNT_NUMBER`: Production Hubtel merchant account number.
- `WHATSAPP_APP_SECRET`: Meta App Secret for verifying webhook HMAC signatures.
- `WHATSAPP_VERIFY_TOKEN`: Verification token for Meta webhook setup challenge.
- `WHATSAPP_ACCESS_TOKEN`: Permanent Meta Graph API system user token.
- `PYTHON_BRAIN_URL`: Public HTTPS endpoint of your deployed Python Intelligence service.
- `INTELLIGENCE_SERVICE_API_KEY`: Secret API key shared between Next.js and the Python brain.

### Domain & Subdomain Routing
1. In **Project Settings -> Domains**, attach your primary application domain:
   - `app.merchander.com`
2. Add a wildcard domain for merchant store subdomains:
   - `*.merchander.store`
3. Configure your DNS provider with the CNAME record pointing to `cname.vercel-dns.com`.

---

## 4. Step 3: Deploy Python Intelligence Service

The Python Intelligence brain lives in `services/intelligence`. Deploy it as a web service on Render, Railway, or any container platform.

1. **Build command:**
   ```bash
   pip install -r requirements.txt
   ```
2. **Start command:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```
3. **Environment variables:**
   - `API_KEY`: Secret string matching `INTELLIGENCE_SERVICE_API_KEY` on Vercel.
   - `SUPABASE_URL`: Production Supabase URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: Production Supabase service role key.
   - `OPENAI_API_KEY` / `GEMINI_API_KEY`: LLM provider credentials.
4. Copy the resulting public HTTPS URL and set it as `PYTHON_BRAIN_URL` in your Vercel project settings.

---

## 5. Step 4: Webhook Registrations

### Meta WhatsApp Cloud API
1. Navigate to your [Meta for Developers](https://developers.facebook.com) App Dashboard.
2. Under **WhatsApp -> Configuration -> Webhook**:
   - **Callback URL:** `https://app.merchander.com/api/webhooks/whatsapp`
   - **Verify Token:** Enter the value of `WHATSAPP_VERIFY_TOKEN`.
3. Click **Verify and Save**.
4. Subscribe to the `messages` and `message_deliveries` webhook fields.

### Paystack Webhook
1. In the [Paystack Dashboard](https://dashboard.paystack.com) under **Settings -> API Configuration**:
   - **Live Webhook URL:** `https://app.merchander.com/api/webhooks/paystack`

### Hubtel Webhook
1. In the Hubtel Merchant Portal, configure the transaction callback endpoint:
   - **Callback URL:** `https://app.merchander.com/api/webhooks/hubtel`

---

## 6. Step 5: Post-Deployment Smoke Test Checklist

After deployment finishes, run through this verification checklist:

- [ ] **Health Endpoint:** Send a GET request to `/api/health`.
  ```bash
  curl -i https://app.merchander.com/api/health
  ```
  Expected: HTTP 200 with JSON payload `{"status": "ok", "env": "production", "uptime": ...}`.
- [ ] **Public Signup Flow:** Visit `https://app.merchander.com/signup` and verify step progression and archetype selection.
- [ ] **Merchant Sign-In:** Log in to an existing merchant account at `/login`.
- [ ] **Dashboard Navigation:** Verify that `/dashboard`, `/dashboard/orders`, `/dashboard/inventory`, and `/dashboard/settings/modules` load correctly.
- [ ] **Public Storefront:** Open a merchant storefront (e.g. `https://glamour.merchander.store` or `https://app.merchander.com/store/glamour`) and verify the product catalog renders.
- [ ] **Webhook Challenge:** Test the WhatsApp verification challenge via GET:
  ```bash
  curl -i "https://app.merchander.com/api/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=test_challenge_123&hub.verify_token=YOUR_TOKEN"
  ```
  Expected: HTTP 200 echoing `test_challenge_123`.
