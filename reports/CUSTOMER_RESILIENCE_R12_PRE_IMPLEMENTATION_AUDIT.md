# AHANKARA STUDIOS — CUSTOMER RESILIENCE & SYSTEM STATES

## R12 — OFFLINE, SESSION, LOADING & MUTATION RECOVERY — PRE-IMPLEMENTATION AUDIT

### 1. Executive Summary
An exhaustive read-only audit of the AHANKARA STUDIOS codebase was conducted to identify remaining resilience vulnerabilities spanning network failures, loading boundaries, session expiration, and client error swallowing. 

While R8-R11 successfully hardened checkout idempotency, payment verifications, and major error boundaries, this audit reveals significant gaps in **Loading State Resilience** and **Silent Error Swallowing**. Specifically, blocked routing, checkout pricing deadlocks, and silent data mutation failures present critical risks to the customer experience.

### 2. Confirmed Resilience Issues

#### Issue 1: Blocked Routing via Missing Loading Boundaries
**Location**: `/src/app/(storefront)/*` and `/src/app/(admin)/*`
**Description**: There are no route-level `loading.tsx` boundaries implemented across the storefront or admin namespaces.
**Impact**: Because React Server Components (like `getProduct` in `/products/[slug]/page.tsx`) must resolve before Next.js transitions the route, slow network or database conditions cause a "frozen browser" effect. The customer clicks a link, receives no visual feedback, and the UI remains unresponsive until the fetch completes.
**Severity**: CRITICAL
**R12 Candidate**: Yes

#### Issue 2: Silent Session Expiration Deadlocks
**Location**: `src/lib/api/client.ts`, `src/hooks/use-auth.tsx`, `CartProvider`
**Description**: When a customer's session expires on the server, subsequent client mutations (e.g., `cartApi.addItem`) correctly receive a 401 Unauthorized response. However, `useAuth` does not globally intercept this.
**Impact**: The client catches the 401, displays a generic "Failed to update" toast, and leaves the user trapped on the protected route (e.g., Checkout) with a stale authenticated UI. The user is never explicitly logged out or redirected to `/login`.
**Severity**: CRITICAL
**R12 Candidate**: Yes

#### Issue 3: Checkout Pricing Lock / Hidden Error State
**Location**: `src/app/(storefront)/checkout/checkout-client.tsx` (Lines 95-99, 262-267)
**Description**: If `updatePricing(selectedShippingId)` fails (e.g., transient network drop), the `useCheckout` hook catches the error and sets `pricingError`. The `CheckoutClient` uses `Boolean(pricingError)` to permanently disable the "Checkout" button.
**Impact**: The actual error message is never displayed to the user. The checkout button simply greys out permanently. The customer cannot recover or retry without a hard browser refresh.
**Severity**: HIGH
**R12 Candidate**: Yes

#### Issue 4: Admin Infrastructure Error-to-404 Conflation
**Location**: `src/app/(admin)/admin/products/[productId]/page.tsx`
**Description**: The data fetch block wraps `ProductService.getProductById` in a `try/catch` that blindly calls `notFound()` for all exceptions.
**Impact**: Transient infrastructure failures (e.g., Prisma timeouts) are converted into semantic 404s. This bypasses the newly implemented R11 Admin Error Boundary.
**Severity**: HIGH
**R12 Candidate**: Yes

#### Issue 5: Admin Error-to-Empty Data Spoofing
**Location**: `src/app/(admin)/admin/products/page.tsx` (and categories/collections)
**Description**: Server-side `try/catch` blocks wrap catalog fetches, log the error to the console, and silently pass empty arrays (`[]`) to the UI tables.
**Impact**: Database failures are spoofed as legitimate empty states. The admin user incorrectly sees "0 Products found" instead of an error boundary.
**Severity**: HIGH
**R12 Candidate**: Yes

#### Issue 6: Return/Exchange Eligibility Business-State Spoofing
**Location**: `src/app/(storefront)/account/orders/[orderId]/page.tsx` (Lines 78-89)
**Description**: When mapping `orderData.items` to fetch eligibility, the `try/catch` block catches `PostPurchaseService.getItemEligibility` failures and defaults the eligible quantity to `0`.
**Impact**: If a transient database error occurs, the UI silently disables the customer's ability to return or exchange the item, incorrectly presenting an infrastructure failure as a strict business-rule rejection.
**Severity**: CRITICAL
**R12 Candidate**: Yes

### 3. Audited but CORRECT Areas (No action needed)
1. **Checkout Idempotency**: `OrderService.createCheckoutOrder` safely handles retries. If the order was created but the response timed out, the stable idempotency key returns the existing order safely.
2. **Payment Idempotency**: `PaymentService.createPaymentAttempt` checks for existing pending payments and returns them safely upon retry.
3. **RSC Navigation Integrity**: Browser "Back" button behavior during checkout properly respects history replacement (`router.replace`), routing users back to the cart instead of a stale checkout process.
4. **Order Confirmation Resiliency**: `order-confirmation/[orderId]/page.tsx` correctly distinguishes between 404s and network errors (verified R9 regression check).

### 4. Implementation Scope & Recommendations
**Confirmed Fixes:**
1. Implement `loading.tsx` at the `(storefront)` and `(admin)` layout levels utilizing existing skeleton/spinner components.
2. Update `apiClient` or `useAuth` to globally intercept 401 responses and trigger a hard redirect/logout.
3. Expose `pricingError` in the `CheckoutClient` UI with a localized "Retry Pricing" button.
4. Refactor `admin/products/[productId]/page.tsx` to throw non-404 errors.
5. Refactor `admin/products/page.tsx` (and peers) to throw errors to the R11 boundary rather than returning empty arrays.
6. Refactor the `itemEligibilities` loop in `orders/[orderId]/page.tsx` to throw infrastructure errors, allowing the local page error boundary to prompt a safe retry.

**Files that would need modification:**
- `src/app/(storefront)/loading.tsx` (New)
- `src/app/(admin)/loading.tsx` (New)
- `src/lib/api/client.ts` or `src/hooks/use-auth.tsx`
- `src/app/(storefront)/checkout/checkout-client.tsx`
- `src/app/(admin)/admin/products/[productId]/page.tsx`
- `src/app/(admin)/admin/products/page.tsx`
- `src/app/(admin)/admin/categories/page.tsx`
- `src/app/(admin)/admin/collections/page.tsx`
- `src/app/(storefront)/account/orders/[orderId]/page.tsx`

**Deferred / Out of Scope (R13+):**
- Offline ServiceWorker (PWA) caching for read-only catalog browsing.

**DO NOT IMPLEMENT YET.** This report is strictly for audit phase completion.
