# PRODUCTION DEPLOYMENT GUIDE

This document serves as the authoritative deployment blueprint for AHANKARA STUDIOS on Vercel.

## 1. Required Accounts & Infrastructure
* **Hosting:** Vercel (Next.js zero-config deployment)
* **Database:** PostgreSQL provider (e.g., Supabase, Neon, AWS RDS) with PgBouncer/Accelerate enabled for serverless connection pooling.
* **Authentication:** Better Auth (No external provider required for email/password, but Google OAuth requires GCP console setup).
* **Payments:** Razorpay (Test mode enabled; requires Live mode activation/KYC).
* **Media Storage:** Cloudinary (Free/Pro tier).
* **Transactional Email:** Resend (Requires domain verification).
* **Shipping Integration:** Shiprocket (Currently mocked; requires KYC for live credentials).

## 2. Environment Variables Matrix

| Variable | Required | Exposure | Purpose | Source/Notes |
|----------|----------|----------|---------|--------------|
| `DATABASE_URL` | **Yes** | Server | Primary Postgres connection. | Must point to a connection pooler if using Vercel. |
| `NODE_ENV` | **Yes** | Server | Defines execution mode. | Automatically set to `production` by Vercel. |
| `BETTER_AUTH_SECRET` | **Yes** | Server | Secures session cookies. | Generate via `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | **Yes** | Server | Base URL for auth callbacks. | Set to `https://ahankarastudios.com`. |
| `GOOGLE_CLIENT_ID` | Optional | Server | Google OAuth integration. | Google Cloud Console. |
| `GOOGLE_CLIENT_SECRET` | Optional | Server | Google OAuth integration. | Google Cloud Console. |
| `RESEND_API_KEY` | **Yes** | Server | Sends transactional emails. | Resend dashboard. |
| `AUTH_EMAIL_FROM` | **Yes** | Server | Sender address for emails. | Must be a verified domain (e.g., `onboarding@ahankarastudios.com`). |
| `CLOUDINARY_CLOUD_NAME` | **Yes** | Server | Identifies Cloudinary account. | Cloudinary dashboard. |
| `CLOUDINARY_API_KEY` | **Yes** | Server | Media upload permissions. | Cloudinary dashboard. |
| `CLOUDINARY_API_SECRET` | **Yes** | Server | Media upload/delete signing. | Cloudinary dashboard. |
| `RAZORPAY_KEY_ID` | **Yes** | Server | Server-side API key. | Razorpay dashboard (Test/Live). |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | **Yes** | **Public** | Client-side Checkout modal. | Razorpay dashboard. MUST match Server Key ID. |
| `RAZORPAY_KEY_SECRET` | **Yes** | Server | Server-side signature signing. | Razorpay dashboard (Test/Live). |
| `RAZORPAY_WEBHOOK_SECRET` | **Yes** | Server | Webhook validation. | Generated during Razorpay webhook setup. |
| `SHIPROCKET_EMAIL` | Optional | Server | Live shipping API access. | Required only when activating Shiprocket in DB. |
| `SHIPROCKET_PASSWORD` | Optional | Server | Live shipping API access. | Required only when activating Shiprocket in DB. |
| `SHIPROCKET_PICKUP_LOCATION` | **Yes** | Server | Default warehouse location. | Matches Shiprocket configuration name. |
| `SHIPROCKET_WEBHOOK_SECRET`| Optional | Server | Validates shipping updates. | Generated during Shiprocket webhook setup. |

> **Security Warning:** NEVER commit the actual `.env.production` file. Populate these securely in the Vercel project settings.

## 3. Database Setup & Prisma Migration
Since the application relies on Prisma ORM and Next.js App Router:
1. **Provision Database**: Create a PostgreSQL instance.
2. **Apply Migrations**: Vercel handles the build process, but you must instruct it to run migrations safely.
3. **Build Command Override in Vercel**: 
   Change the default Vercel build command to:
   ```bash
   npx prisma generate && npx prisma migrate deploy && next build
   ```
   *(This ensures migrations are safely applied and the Prisma Client is generated before the Next.js compilation).*

## 4. Vercel Configuration
AHANKARA STUDIOS is a Next.js application, which inherently means **zero-config is required** for standard functionality. 
- You do NOT need a `vercel.json` file for routing or caching.
- Custom headers are already handled by `next.config.ts`.
- **Cron Jobs**: The application currently has a cron endpoint `POST /api/admin/cron/expire-orders`. Since this is secured behind `AuthService.requireRole`, it is NOT currently compatible with Vercel Cron (which issues unsigned GET requests or uses a basic bearer token). This must be triggered manually by an admin or refactored for Vercel Cron.

## 5. Domain Configuration
- Assign `ahankarastudios.com` as the primary production domain in Vercel.
- Configure DNS (A and CNAME records) as prompted by Vercel.
- Add `ahankarastudios.com` to Resend for DKIM/SPF verification to enable email sending.

## 6. Payment & Shipping Integrations
### Razorpay Production Activation
1. Complete KYC in the Razorpay Dashboard to unlock Live Mode.
2. Generate Live API Keys.
3. Replace Test Keys in Vercel Environment Variables.
4. Set up a Webhook in Razorpay pointing to `https://ahankarastudios.com/api/webhooks/razorpay`.
5. Select `order.paid` and `payment.failed` events.
6. Enter a secure Webhook Secret and update Vercel environment variables.

### Shiprocket Production Activation
1. Complete KYC with Shiprocket.
2. Add your Shiprocket email and password to Vercel environment variables.
3. In the Ahankara Studios Admin Dashboard, navigate to Shipping Configuration.
4. Switch the Default Provider from `MockShippingProvider` to `Shiprocket`. (This updates the DB `ShippingConfiguration` row; no code deployment required).

## 7. CI/CD (GitHub Actions)
A minimal, non-destructive GitHub Actions workflow is recommended for pull requests:
```yaml
name: CI
on: [push, pull_request]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx prisma generate
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm run build
```
*(Playwright tests are omitted from this baseline CI as they require a running Postgres database and local server, which introduces flakiness without dedicated container orchestration).*

## 8. Smoke Testing & Rollback
After Vercel reports a successful deployment, execute the **Production Smoke Test Plan**.
If critical failures occur:
1. Navigate to the **Deployments** tab in Vercel.
2. Select the previous stable deployment.
3. Click **Promote to Production** (Instant rollback).
4. Review logs in Vercel observing 500 errors to diagnose the fault.
