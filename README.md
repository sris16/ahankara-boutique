# Ahankara Boutique E-Commerce Platform — Backend Version 1

## Project Overview
This repository contains the V1 backend foundation for the Ahankara Boutique E-Commerce Platform. This version establishes the core infrastructure, Next.js architecture, and PostgreSQL + Prisma database integration, preparing for full domain implementation in subsequent versions.

## Technology Stack
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Runtime**: Node.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **Styling**: Tailwind CSS (Foundation only)

## Prerequisites
- Node.js (v18.17.0 or higher)
- PostgreSQL (v14 or higher) running locally or accessible remotely
- npm (v9 or higher)

## Environment Setup
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Update the `DATABASE_URL` in `.env` with your actual PostgreSQL connection string. Ensure the database is accessible.

## Installation
Run the following command to install all project dependencies:
```bash
npm install
```

## Database Configuration & Prisma Setup
This project uses Prisma ORM to interact with PostgreSQL.

1. **Generate Prisma Client:**
   ```bash
   npm run db:generate
   ```
2. **Run Migrations:**
   To apply the initial schema to your database:
   ```bash
   npm run db:migrate
   ```
3. **Open Prisma Studio:** (Optional)
   To view and interact with your database using Prisma's GUI:
   ```bash
   npm run db:studio
   ```

## Development Commands
- Start the development server: `npm run dev`
- Build for production: `npm run build`
- Start production server: `npm run start`
- Run linter: `npm run lint`

## Health Endpoint
You can verify that the application is running and successfully connected to the database by accessing:
`GET /api/health`

**Expected Successful Response:**
```json
{
  "success": true,
  "status": "healthy",
  "database": "connected",
  "timestamp": "2023-10-25T12:00:00Z"
}
```

## Current Version 1 Scope
- Next.js + TypeScript project initialization with App Router.
- PostgreSQL + Prisma integration.
- Standardized API response utilities.
- Centralized error handling and validation (Zod) foundation.
- System health-check API endpoint.
- Fundamental backend folder architecture (`src/utils`, `src/lib`, etc.).

## Features Intentionally Deferred
- Customer registration and authentication (Auth.js)
- Product and variant management
- Cart, checkout, and order systems
- Razorpay payment processing
- External API integrations (Shiprocket, Cloudinary, Resend)
- Any actual frontend/UI development (Customer facing and Admin Dashboard)

## Version 2 Scope
- Created User model with `UUID` id, `role`, `status`, and verification timestamps.
- Created Address model supporting Indian formats (6-digit PIN validation).
- Implemented `AddressType` enum (HOME, WORK, OTHER).
- Created safe backend service logic (`UserService`, `AddressService`) with proper user isolation.
- Added Prisma transactions to handle switching `isDefaultShipping` and `isDefaultBilling`.

## Version 3 Scope — Authentication & Authorization
- **Authentication Framework**: Integrated **Better Auth** (`^1.6.24`) with PostgreSQL & Prisma 7 adapter.
- **Email Verification**: Integrated **Resend** (`^6.18.0`) service layer for transactional email verification and OTP dispatch.
- **Database Schema**: Expanded `User` model (`emailVerified`, `image`, relations) and added `Session`, `Account`, and `Verification` models.
- **Customer Registration**: Secure public registration defaulting strictly to `CUSTOMER` role and `ACTIVE` status. Includes email normalization and duplicate prevention.
- **Admin Security**: Admin accounts are provisioned via controlled development mechanisms (`AuthService.seedAdminUser`). No public `/register-admin` endpoint exists.
- **Session Management**: Reusable `AuthService.requireAuth` and `AuthService.requireRole` helpers enforcing active session, `CUSTOMER` / `ADMIN` roles, and blocking `SUSPENDED` / `DEACTIVATED` accounts.
- **Address Security Migration**: Completely deleted insecure V2 URL-trusted routes (`/api/users/[userId]/addresses`). Introduced secure `/api/me/addresses` routes where user identity is strictly derived from verified Better Auth sessions.
- **Self Profile Endpoint**: Added `GET /api/me` returning sanitized authenticated user details.
- **Rate Limiting**: Added `checkRateLimit` utility enforcing request limits on sensitive authentication endpoints.

## Version 4 Scope — Categories & Collections
- Created `Category` architecture for deeply nested category hierarchies (`parentId` reference). Includes prevention of self-parent loops and cycle detection.
- Protected parent category deletion (cannot delete categories containing children).
- Implemented `Collection` architecture for curated merchandising groups with features like `isFeatured` and automatic availability scheduling (`startsAt`, `endsAt`).
- Deterministic, standardized URL-safe slug architecture for both entities, enforcing uniqueness.
- **Admin APIs**: `POST`, `GET`, `PATCH`, `DELETE` operations secured with `requireRole(ADMIN)`.
- **Public APIs**: Read-only fetch operations that automatically filter for `isActive: true` and current schedule validity.
- **IMPORTANT**: Products are NOT implemented in Version 4. This establishes taxonomy before product inclusion.

## Version 5 Scope — Product Catalog & Product Images
- **Product Model**: Introduced robust product schema handling Name, Slug, Descriptions, Base Price, Compare-At Price, Category references, and explicit Collections matching.
- **Product Status Lifecycle**: Products support `DRAFT`, `PUBLISHED`, and `ARCHIVED` statuses, preventing unintended public visibility.
- **Money Representation**: Base Price and Compare-At price are correctly stored as integers (minor units / paise) avoiding floating-point precision issues.
- **Cloudinary Architecture**: Integrated robust server-side Cloudinary upload and deletion operations, organizing media elegantly into unique product folders, while cleanly segregating operations using `CloudinaryService`.
- **Product Images Model**: Advanced product media management resolving strict primary image rules, transactional image switching, explicit sort ordering, dimension scaling, and DB orphan-cleanup.
- **APIs**:
  - **Admin APIs**: Feature-complete authenticated APIs providing Create, Retrieval, Full-Update, Publish, Archive, and Collection-Membership transactional assignment. Deep media management provided through dedicated image endpoints.
  - **Public APIs**: Read-only APIs gracefully surfacing only `PUBLISHED` products adhering to `Category` and `Collection` public-visibility policies. Supports pagination, complex filtering (category, collection, price bounds), generic search, and targeted sorting.
- **Security**: Robust `ADMIN` lock enforced across all mutations.
- **NOTE**: Product Variants and Inventory are NOT part of Version 5.

## Version 6 Scope — Product Variants & Inventory Management
- **ProductVariant Model**: Advanced variant architecture managing Size, Colour, SKU (unique constraint), and override Pricing logic in integers (paise). Supports safe normalizations across properties.
- **Inventory & Stock Management**: Rigid 1:1 `Inventory` linkage utilizing atomic database transactions (`$executeRaw`) to flawlessly protect against parallel stock reservation races, negative stock, and logic desyncs.
- **Inventory Audit Logging**: Transparent immutable `InventoryTransaction` event tracking for granular traceability around RESTOCK, RESERVATION, SALE, and ADJUSTMENT operations.
- **Availability State**: `IN_STOCK`, `LOW_STOCK`, and `OUT_OF_STOCK` correctly mapped alongside the `hasAvailableStock` derived boolean preventing inactive/dry listings from frontend consumption.
- **APIs**:
  - **Admin APIs**: Secured APIs allowing CRUD operations over Variants, manual Stock Adjustment operations, and Low-Stock querying.
  - **Public APIs**: Enhanced public Product payload mapping cleanly parsed inventory states and variant parameters dynamically without leaking warehouse operational limits to unauthenticated entities.
- **Security & Integrity**: End-to-end admin boundary checking. Strict logical variant isolation and database constraints enforcing non-destructive cascades.

## Version 11 Scope — Shipping, Logistics & Real-Time Order Tracking
- **Shipping Architecture**: Established a provider-neutral fulfillment architecture de-coupling logistics from the commercial payment lifecycle.
- **Provider Abstraction**: Integrated a strict `ShippingProviderAdapter` interface for future external courier implementations (Shiprocket, Delhivery).
- **Mock Provider**: Created a robust `MockShippingProvider` for reliable development/testing integration and webhooks simulation.
- **Shipment & ShipmentItem Models**: Models 1:N order fulfillment safely, linking shipments directly back to order items cleanly to support partial and split fulfillments.
- **Tracking Events**: `ShipmentTrackingEvent` creates a deterministic, chronological history of tracking updates driven by courier webhooks.
- **Fulfillment Lifecycle & State Machine**: Implemented `FulfillmentStatus` (on Order) and `ShipmentStatus` (on Shipment) ensuring strict state validation (e.g. blocking cancellation of delivered packages, filtering out-of-order webhook events).
- **Immutable OrderAddress Usage**: Shipments are explicitly built against the V8 immutable snapshot of the customer's delivery address to protect against subsequent user profile modifications.
- **Customer Tracking API**: Created a secure public tracking endpoint `GET /api/me/orders/[orderId]/tracking` surfacing only safe fulfillment details per authorized customer.
- **Admin Fulfillment APIs**: Developed complete `admin/shipments` ecosystem for dispatch, status reconciliation, and cancellation mutations.
- **Webhook Idempotency Architecture**: Built safe, transaction-bound state transitions ignoring duplicated payload event identities.
- **Inventory & Payment Boundaries**: Verified that fulfillment acts entirely independent of product inventory commits (V9) and financial coupon pricing limits (V10), protecting core platform metrics.
- **Deferred Provider Integration**: Live Courier API integration natively deferred pending final business vendor selection.

## Version 12 Scope — Order Cancellation, Returns, Exchanges & Refunds
- **Cancellation Architecture**: Evaluates order and fulfillment state to ensure pre-shipment order cancellation is allowed. Automatically releases stock reservation (unpaid) or creates a refund liability and logical restock (paid).
- **Return Architecture & State Machine**: Granular control over the returns lifecycle (`REQUESTED` -> `APPROVED` -> `RECEIVED` -> `ACCEPTED` / `PARTIALLY_ACCEPTED`). Restocks physical inventory *only* after items are safely returned and inspected.
- **Refund Architecture & Constraints**: Ledger-based `Refund` system decoupled from raw provider webhooks. Features idempotency protections, concurrency locking, and maximum-refund calculations guarding against over-refunding.
- **Coupon-Aware Refund Calculations**: `PostPurchaseService` allocates historical order discounts precisely down to the paise, dynamically scaling partial returns to ensure users only get back the exact effective price paid, rather than standard catalog price.
- **Exchange Architecture**: Allows size/variant swaps. Ensures exchange stock is successfully reserved upfront upon request approval, while deferring the original item's restock until successful return delivery.
- **Strict Return/Exchange Quantity Protection**: Protects against concurrent or overlapping return/exchange attempts across items, accurately tracking `purchasedQuantity` vs `remainingEligibleQuantity` via deterministic math.
- **Security**: Customers have strictly constrained pathways ensuring they cannot authorize their own returns, set refund values, or manipulate external users' properties.
- **Deferred External Integrations**: Real Razorpay refund endpoints and LIVE reverse logistics courier endpoints are currently deferred until final business vendor selection.
