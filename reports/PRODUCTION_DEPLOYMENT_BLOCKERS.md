# PRODUCTION DEPLOYMENT BLOCKERS

This document details the exact remaining steps, credentials, and infrastructure blockers required before AHANKARA STUDIOS can officially go live on the `ahankarastudios.com` domain.

## 1. BLOCKING (Cannot deploy codebase)
*Currently, there are no code-level blockers preventing a basic deployment. The application builds successfully and tests pass.*

## 2. REQUIRED BEFORE LIVE (Must resolve before customer traffic)

### 2.1 INFRASTRUCTURE BLOCKERS
* **Database Provisioning**: A production PostgreSQL database must be created (e.g., Supabase/Neon).
* **Vercel Project Setup**: The GitHub repository must be linked to a Vercel project, and all production environment variables from the Matrix must be securely populated.
* **Domain DNS Configuration**: `ahankarastudios.com` must be routed to Vercel via A/CNAME records.
* **Resend Domain Verification**: `ahankarastudios.com` must be verified in Resend using DNS records (TXT/MX/SPF/DKIM) so that `AUTH_EMAIL_FROM` does not get blocked as spam.

### 2.2 EXTERNAL BLOCKERS (Third-Party Approvals)
* **Razorpay KYC & Live Activation**: Razorpay is currently operating in Test Mode. The business owner must submit KYC documents to Razorpay, gain approval, and generate Live API Keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`). A live webhook must also be configured with a secret.

## 3. REQUIRED AFTER LIVE (Day 1 Operations)

### 3.1 EXTERNAL BLOCKERS
* **Shiprocket KYC & Credentials**: The application is currently using the `MockShippingProvider`. To print real shipping labels and pull live rates, the business must complete Shiprocket KYC and input `SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD` into Vercel. 
* **Database Configuration Flip**: After Shiprocket credentials are added, an admin must log into the live Ahankara Studios dashboard and switch the Default Shipping Provider to Shiprocket.

### 3.2 CODE BLOCKERS
* **Cron Job Refactoring for Vercel**: The `expire-orders` cron currently resides at `POST /api/admin/cron/expire-orders` and strictly requires an Admin session token. Vercel Cron triggers require unauthenticated GET requests (secured via a `CRON_SECRET` bearer token). To automate unpaid order expiration natively via Vercel, this route handler must be refactored to validate against `process.env.CRON_SECRET` rather than `AuthService.requireRole`.

## 4. OPTIONAL (Enhancements)
* **Google OAuth Setup**: Creating a GCP project and acquiring `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` to enable social login.
* **CI/CD Pipeline Activation**: Committing the recommended GitHub Actions workflow to run linting and typechecking automatically on Pull Requests.

---

### Production Readiness Status
- **Code:** READY
- **Database:** NOT READY (Requires live Postgres URL & Vercel deployment)
- **Vercel:** NOT READY (Requires project creation and env variable setup)
- **Domain:** NOT READY (Requires DNS routing)
- **Payments:** NOT READY (Requires Razorpay KYC & Live credentials)
- **Email:** NOT READY (Requires Resend domain verification)
- **Cloudinary:** READY (Assuming existing credentials can be migrated to production)
- **Shipping:** NOT READY (Requires Shiprocket KYC; currently uses Mock)
- **CI/CD:** NOT READY (Workflow file not committed)

### Final Recommendation
**Do NOT deploy automatically.** 
Stop and acquire the necessary accounts (Vercel, Live Postgres Database), secure the Domain DNS, and submit KYC for Razorpay and Shiprocket. Once the Vercel project is configured with the database URL and environment variables, deploy the application in Test Mode first to execute the Production Smoke Test Plan before finalizing the Razorpay Live switch.
