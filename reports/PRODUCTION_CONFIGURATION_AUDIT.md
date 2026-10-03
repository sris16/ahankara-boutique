# PRODUCTION CONFIGURATION AUDIT

## 1. Application & Framework
- **Framework:** Next.js 16.2.10 (App Router)
- **Node Environment:** Requires Node.js ^20.19.0 based on TypeScript types.
- **Dependencies:** React 19.2.4, Prisma 7.9.0, Tailwind CSS v4, Better Auth 1.6.24, Razorpay, Resend, Cloudinary.
- **`next.config.ts`:**
  - Enforces strict security headers (e.g., `X-Frame-Options`, `Strict-Transport-Security`).
  - Omits CSP intentionally to support Razorpay's dynamic iframe/script injection.
  - Excludes `console.log` in production, preserving `error` and `warn`.
  - Configures remote patterns for Cloudinary (`res.cloudinary.com`) and Unsplash (`images.unsplash.com`).

## 2. Database Configuration
- **ORM:** Prisma
- **Provider:** PostgreSQL (`@prisma/adapter-pg`)
- **Connection:** Driven by the `DATABASE_URL` environment variable. Production environments will need connection pooling (e.g., PgBouncer or Prisma Accelerate) for heavy concurrent loads, as no explicit pooler is defined in the schema.

## 3. Environment Variables & Secrets
Defined structurally in `src/utils/env.ts` with Zod schemas.

### Required Server-Side Secrets (Must NOT reach the browser)
- `DATABASE_URL`: Postgres connection string.
- `BETTER_AUTH_SECRET`: Minimum 32-byte cryptographic key for session signing.
- `RAZORPAY_KEY_SECRET`: Secret key for Razorpay API.
- `RAZORPAY_WEBHOOK_SECRET`: Secret for webhook signature verification.

### Required Public Variables (Browser accessible)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Client identifier for the Razorpay Checkout modal.

### Optional / Feature-Dependent Secrets
- `BETTER_AUTH_URL`: Origin URL, required for authentication routing.
- `RESEND_API_KEY`: Required for live production emails.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Required for image uploads/deletions.
- `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_WEBHOOK_SECRET`: Required if live shipping integration is enabled.

## 4. Third-Party Integrations
- **Better Auth:** Requires a valid `BETTER_AUTH_URL` and `BETTER_AUTH_SECRET`.
- **Resend:** Configured for emails via `AUTH_EMAIL_FROM`. Fails securely or drops silently in development if API key is absent, but required for production.
- **Cloudinary:** Remote patterns are already configured in Next.js.
- **Razorpay:** Setup for both client-side and server-side webhook flows. Currently in test mode (inferred by `.env.example`).
- **Shipping (Shiprocket / MockShippingProvider):** The application relies on `MockShippingProvider` for V1/Testing. Shiprocket integration exists structurally but requires live credentials and KYC to activate.

## 5. Deployment Infrastructure (Gaps & Findings)
- **Production Domain:** `https://ahankarastudios.com`
- **Docker:** ❌ `Dockerfile` and `docker-compose.yml` are absent.
- **Vercel / PaaS:** ❌ No `vercel.json` or specific cloud configuration files exist. Next.js can be deployed zero-config to Vercel, but custom settings (e.g., cron jobs, specific Node versions) may require it.
- **CI / CD (GitHub Actions):** ❌ No `.github/workflows` directory exists. The repository currently has no automated pipelines.
- **Playwright Configuration:** Configured to run sequentially against a locally booted production server (`PORT=3001 npm run start`).

## 6. Summary
The codebase is structurally prepared for production, but lacks the necessary CI/CD pipelines and deployment infrastructure manifests. Vercel is highly recommended given the Next.js architecture, zero-config requirements, and App Router paradigms.
