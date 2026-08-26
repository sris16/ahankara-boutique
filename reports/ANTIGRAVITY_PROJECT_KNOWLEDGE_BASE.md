# Ahankara Boutique — Project Knowledge Base

## 1. Project Overview
Ahankara Boutique is an e-commerce platform backend constructed over 12 incremental versions. It provides a robust, provider-neutral, and highly strict transactional architecture for managing catalog, inventory, ordering, fulfillment, and returns/exchanges. The project currently focuses entirely on backend capabilities, with UI/frontend interactions largely deferred or unimplemented.

## 2. Complete Technology Stack
- **Framework**: Next.js (App Router) v16.2.10
- **Language**: TypeScript
- **Runtime**: Node.js
- **Database**: PostgreSQL
- **ORM**: Prisma v7.9.0
- **Validation**: Zod v4.4.3
- **Authentication**: Better Auth v1.6.24
- **Emails**: Resend v6.18.0
- **Media Storage**: Cloudinary v2.10.0
- **Payments**: Razorpay v2.9.8
- **Styling**: Tailwind CSS v4

## 3. Repository Structure
- `.agents/`, `.claude/` - AI configurations and skill instructions
- `prisma/` - Prisma schema, database config, and migrations
- `public/` - Static files
- `reports/` - Historical phase completion reports (V1 to V12)
- `src/app/` - Next.js App Router (API Routes)
- `src/lib/` - Libraries initialization (Prisma, Auth)
- `src/server/services/` - Core business logic, integrating DB and third-party APIs
- `src/server/validators/` - Zod schema validation layer
- `src/utils/` - Utility functions (Error handling, Environment validation)

## 4. Frontend Architecture
**Status**: INCOMPLETE
Currently, the frontend relies mostly on Next.js setup but lacks a customer-facing UI and Admin dashboard. Actual implementation is primarily deferred to future iterations.

## 5. Backend Architecture
**Status**: COMPLETE (for V12 capabilities)
Built using Next.js API Routes (App Router) integrating deeply with a centralized Service layer (`src/server/services`). It incorporates strict validation via Zod, unified error handling, and relies entirely on Prisma for transactional state updates. 

## 6. Database Architecture
**Status**: COMPLETE
Managed via Prisma ORM connecting to PostgreSQL. Key entities include Users, Products (Categories, Collections, Images, Variants), Inventory, Carts, Orders, Payments, Coupons, and Shipments. Relies heavily on UUIDs, strict referential integrity, and JSON/Enum fields for robust lifecycle management.

## 7. Authentication Architecture
**Status**: COMPLETE
Powered by **Better Auth**. Features role-based security (`CUSTOMER`, `ADMIN`), with session tracking, email verification via Resend, rate limiting, and strictly isolated APIs where admin privileges are required. 

## 8. Payment Architecture
**Status**: COMPLETE
Uses **Razorpay**. Includes webhooks simulation and real integration capability. Uses HMAC-SHA256 signature verification. State transitions explicitly manage idempotency, idempotency keys, late payment captures, and strictly separate payment records from order lifecycle records.

## 9. Inventory Architecture
**Status**: COMPLETE
Features rigorous exactly-once stock commitment logic. Inventory is split between `quantity` and `reservedQuantity`. Stock is managed safely via `$executeRaw` atomic updates. Integrates an immutable audit trail (`InventoryTransaction`) for operations like `RESTOCK`, `SALE`, `RESERVATION`, and `RETURN`.

## 10. Shipping Architecture
**Status**: COMPLETE
Provider-neutral abstract architecture (`ShippingProviderAdapter`). Decouples logistics from commercial payment. Shipments link to OrderItems (supporting partial fulfillment) and utilize immutable snapshot order addresses to prevent post-order edits.

## 11. Shiprocket Architecture
**Status**: IN PROGRESS / DEFERRED LIVERUN
Implemented via `ShiprocketShippingProvider` fulfilling the abstract shipping interface. Handles JWT auth, shipment creation, AWB generation, and tracking syncs. Actual live KYC and operations are paused/deferred per project rules.

## 12. Resend Architecture
**Status**: COMPLETE
Email delivery configured via `Resend`. Supports OTP distribution for Better Auth with strict security constraints preventing secret leakage.

## 13. Cloudinary Architecture
**Status**: COMPLETE
Manages product/media images with server-side uploads and deletions. Leverages strict unique public ID generation, preventing orphans through transactional DB references.

## 14. Environment Variable Inventory
- `DATABASE_URL` (Required, missing in fresh setup)
- `NODE_ENV` (Defaults to 'development')
- `BETTER_AUTH_SECRET` (Has default)
- `BETTER_AUTH_URL` (Has default)
- `RESEND_API_KEY` (Optional)
- `AUTH_EMAIL_FROM` (Has default)
- `CLOUDINARY_CLOUD_NAME` (Optional)
- `CLOUDINARY_API_KEY` (Optional)
- `CLOUDINARY_API_SECRET` (Optional)
- `RAZORPAY_KEY_ID` (Has default)
- `RAZORPAY_KEY_SECRET` (Has default)
- `RAZORPAY_WEBHOOK_SECRET` (Has default)
- `SHIPROCKET_EMAIL` (Optional)
- `SHIPROCKET_PASSWORD` (Optional)

## 15. Security Model
- Admin lock enforcement across catalog and fulfillment APIs.
- OTP logic ensures secrets are securely processed.
- Customers restricted from modifying other profiles, self-approving returns, or dictating refund amounts.
- Webhooks protected by HMAC verification.

## 16. Idempotency Model
Webhook replays and double-payment attempts are gracefully ignored. Fulfillment state transitions block repetitive processing. Refund engine includes concurrency locking and strict limit scaling.

## 17. Order State Machine
`PENDING_PAYMENT` -> `CONFIRMED` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED`
Alternate ends: `CANCELLED`, `EXPIRED`, `PAYMENT_REVIEW` (for late payments).

## 18. Payment State Machine
`PENDING` -> `PAID` / `FAILED` / `REFUNDED`

## 19. Inventory State Machine
`RESERVATION` (temporary stock hold) -> `SALE` (final stock decrement) OR `RESERVATION_RELEASE` (expired hold).
Others: `RESTOCK`, `ADJUSTMENT`, `RETURN`.

## 20. Shipment State Machine
`PENDING` -> `READY_TO_SHIP` -> `SHIPMENT_CREATED` -> `PICKUP_SCHEDULED` -> `PICKED_UP` -> `IN_TRANSIT` -> `OUT_FOR_DELIVERY` -> `DELIVERED` (alternatively `CANCELLED`, `RTO` paths).

## 21. Existing Test Coverage
**Status**: UNKNOWN
No formal test suite (e.g., Jest/Vitest) is evident in the root or package scripts. Validations run via TypeScript, ESLint, and manual Next.js runtime.

## 22. Existing Verification Reports
Found 14 historical reports in `reports/` (V1 to V12 completion reports and some runtime/verification specific reports).

## 23. Current Implementation Status
Backend architecture is extremely robust with V12 completing returns, cancellations, and complex refund idempotency logic. Frontend is minimal.

## 24. Known Pending Tasks
- Frontend UI development.
- Live Razorpay refund and Shiprocket LIVE integration operations (pending real business decisions).

## 25. Current Development Environment Status
- Code cloned to fresh Linux environment.
- Missing `.env` file containing critical keys (e.g. `DATABASE_URL`).
- Dependencies correctly restored.

## 26. Dependency Status
`npm install` executed cleanly. Packages are in place.

## 27. Build/Lint Status
- **Lint**: PASS (with 17 unused variable warnings, zero errors)
- **Build**: FAIL (Failed exclusively because `DATABASE_URL` is undefined, causing Zod parsing in `src/utils/env.ts` to abort the build process).

## 28. Risks or Inconsistencies Discovered
- Build fails out-of-the-box due to the absent `.env` file protecting secrets.
- Missing unit tests for the highly complex state machine and inventory lock systems (though manual verifications are extensively documented).
- Minor lint warnings (unused variables) in several services.
