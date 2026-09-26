# AHANKARA STUDIOS

A comprehensive, production-hardened full-stack fashion e-commerce platform built natively on Next.js and PostgreSQL.

## Overview

AHANKARA STUDIOS is a secure, end-to-end commerce architecture providing a seamless shopping experience. The platform encapsulates a responsive customer storefront, a resilient server-authoritative checkout and payment verification system, post-purchase order management, and a dedicated administrative interface for full catalog and operational control.

## Features

### Customer Storefront
* Home and brand discovery
* Dynamic catalog and product discovery
* Hierarchical categories and curated collections
* Detailed product pages with variant sizing and imagery
* Responsive, mobile-first design

### Shopping
* Persistent cart and wishlist functionality
* Real-time stock validation and transactional reservations
* Secure checkout processing
* Integrated delivery address management
* Dynamic shipping calculation
* Coupon application and pricing engine
* Native Razorpay integration

### Customer Account
* Profile management
* Saved addresses
* Comprehensive order history and details
* Real-time fulfillment tracking
* Self-service order cancellation
* Returns and exchanges processing
* Automated refund calculations

### Admin
* Centralized dashboard
* Extensive catalog, product, and media management
* Deep category and collection curation
* Real-time inventory adjustments and tracking
* Full order lifecycle and fulfillment processing
* Administrative authorization guardrails

## Security

The platform employs a defense-in-depth security architecture:
* **Authentication:** Managed natively via Better Auth with email OTP verification.
* **Authorization:** Strict server-side role enforcement isolating Customer and Admin domains.
* **IDOR Protection:** All transactional endpoints validate mutations against verified session identities.
* **Validation:** End-to-end payload validation via Zod schemas.
* **Integrity:** Strictly backend-authoritative pricing (calculating coupons, shipping, and order totals securely).
* **Concurrency:** Transactional stock locks preventing overselling or negative inventory.
* **Environment Validation:** Boot-time validation ensuring required application secrets are present.
* **Headers:** Native Next.js security headers configured.
*(Note: Distributed rate limiting and Content Security Policy (CSP) headers are currently deferred pending final infrastructure deployment).*

## Technology Stack

* **Framework:** Next.js 16.2.10 (App Router)
* **UI:** React 19.2.4 & Tailwind CSS v4
* **Language:** TypeScript
* **Database:** PostgreSQL
* **ORM:** Prisma 7.9.0
* **Authentication:** Better Auth 1.6.24
* **Validation:** Zod 4.4.3
* **Payments:** Razorpay
* **Email:** Resend
* **Storage:** Cloudinary
* **Logistics:** Shiprocket (via Shipping Provider Abstraction)
* **Testing:** Playwright 1.63.0

## Architecture

The application implements a secure boundary between client logic and business orchestration:

`Browser UI` → `Next.js App Router (Server Actions / API)` → `Service Layer` → `Prisma` → `PostgreSQL`

**External Integrations:**
* **Razorpay:** Payment intent creation and asynchronous webhook settlement.
* **Resend:** Transactional OTP delivery and order confirmations.
* **Cloudinary:** Remote asset hosting and dynamic image transformations.
* **Shipping Provider:** Delivery availability checks and tracking webhooks.

Business logic and financial authority are strictly isolated within the server-side Service Layer.

## Project Structure

* `src/` — Core application logic (App Router, Components, Server Services, Utils)
* `prisma/` — Database schema, migrations, and ORM configuration
* `public/` — Static assets
* `e2e/` — Playwright end-to-end testing suites
* `reports/` — Critical architectural, integration, and security audit documentation

## Requirements

* Node.js v24.x or higher
* PostgreSQL v14+ (Local or Remote)

## Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Environment Configuration:
Copy the environment template and populate the required keys.
```bash
cp .env.example .env
```

3. Database Setup:
Generate the Prisma client and apply pending migrations to your PostgreSQL instance:
```bash
npm run db:generate
npm run db:migrate
```

4. Development Server:
Start the application in local development mode:
```bash
npm run dev
```

## Environment Variables

The `.env.example` file contains the complete list of system environment variables. Never commit actual credentials to version control.

* **Required Variables:** Database URL, Better Auth secret/URL, and Cloudinary configuration.
* **Optional / Deferred Variables:** Shipping provider keys and Razorpay webhook secrets (required for full purchase lifecycle, optional for UI development).
* **Development/Production:** Ensure `NODE_ENV` is appropriately mapped during build and runtime.

## Database

The database relies on Prisma ORM. For local development schema changes:
```bash
npm run db:migrate
```
To review the database schema status:
```bash
npx prisma migrate status
```

## Development

To spin up the local Turbopack development server:
```bash
npm run dev
```

## Testing

The repository relies on standard static analysis, build verification, database synchronization, and browser automation:

```bash
npx tsc --noEmit
npm run build
npx prisma migrate status
npx playwright test
```

## E2E Verification

**(P2-L Audit Status)**
The Playwright headless E2E verification suite successfully validates native UI structures:
* Public storefront rendering and navigation
* Expected error boundaries and SEO constraints
* Natively enforced Admin authorization boundaries
* Cart and Profile authentication guardrails

**Limitation:** The complete authenticated customer purchase lifecycle was not fully verified via isolated local automation. End-to-end deterministic checkout verification inherently relies on external Staging infrastructure (including Resend OTP delivery/test interception, Razorpay Test Mode rendering, and HTTPS webhook reachability) which bypasses native headless isolation contexts.

## Production Readiness

The AHANKARA STUDIOS codebase has undergone extensive architecture, security, integration, and production-hardening audits.

However, the final operational Staging validation remains. Full deployment requires:
* Real Staging authentication and Resend OTP delivery
* Razorpay Test Mode checkout invocation
* External Webhook verification mapping
* Real-world Staging Shipping Integration testing
* A complete, manual "Golden Path" customer purchase

## Branding

The customer-facing commercial brand for this application is **AHANKARA STUDIOS**. (Internal legacy references to "Boutique" should not be exposed on the public frontend).

## License

This project currently has no explicit open-source license. All rights reserved.
