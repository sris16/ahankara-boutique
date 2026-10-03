# AHANKARA STUDIOS — CUSTOMER RESILIENCE & SYSTEM STATES

## R11 — ADMIN RESILIENCE — PRE-IMPLEMENTATION AUDIT

### 1. Executive Summary
An exhaustive read-only audit of the AHANKARA STUDIOS Admin architecture (`src/app/(admin)/*`) was conducted. The goal was to identify systemic resilience flaws relating to error handling, layout stability, authorization error swallowing, and API mutation failures. 

The audit reveals two severe architectural flaws in the Admin workspace that compromise both security UX and operational stability. Client-component mutations and API boundaries, however, are largely stable and handle failures gracefully via standard error responses.

### 2. Confirmed Resilience Issues

#### Issue 1: Complete Absence of an Admin Error Boundary
**Locations Affected**: Entire `/admin` namespace (`src/app/(admin)/*`)
**Description**: 
There is no `error.tsx` present in `src/app/(admin)/` or `src/app/(admin)/admin/`. The Next.js App Router relies on `error.tsx` to catch exceptions thrown in Server Components and preserve the surrounding Layout. 
**Consequence**: 
If any admin page throws an unhandled exception (e.g., a database connection timeout in `CategoryService.getCategoryTree`, or a Prisma error in `prisma.user.findMany()`), the error bypasses the `(admin)/layout.tsx` entirely and bubbles up to the root `src/app/global-error.tsx`. This causes the entire Admin Application Shell (Sidebar, Header, Navigation) to violently unmount, replacing it with the public-facing "Critical Interruption" fallback screen.
**Remediation**:
Introduce `src/app/(admin)/admin/error.tsx` using a standardized layout-preserving Admin Error Boundary component.

#### Issue 2: Authorization Error Conflation and Swallowing
**Locations Affected**: 
- `src/app/(admin)/admin/orders/page.tsx`
- `src/app/(admin)/admin/orders/[orderId]/page.tsx`
- `src/app/(admin)/admin/coupons/[couponId]/page.tsx`
**Description**:
Several Server Components wrap `AuthService.requireRole(requestHeaders, UserRole.ADMIN)` inside a broad data-fetching `try/catch` block.
- In `orders/page.tsx` and `orders/[orderId]/page.tsx`, catching this error sets `hasError = true` and renders a red "Failed to load order details" banner.
- In `coupons/[couponId]/page.tsx`, catching this error logs to the console and explicitly triggers a 404 `notFound()`.
**Consequence**:
If an unauthenticated user or unauthorized Customer navigates to these routes, `AuthService.requireRole` correctly throws an `UnauthorizedError` or `ForbiddenError`. However, because the page catches it, it never bubbles to the framework. The framework is prevented from securely redirecting the user or rendering a 401/403 page. Instead, unauthorized users are presented with broken "Failed to Load" or "Not Found" UI components natively within the page layout.
**Remediation**:
Extract `AuthService.requireRole` calls outside of broad `try/catch` blocks in all Admin Server Components. Let Auth exceptions bubble up so they can be handled securely (either intercepted by the concurrent Layout redirect, or caught by the new Admin Error Boundary as a 403 state).

### 3. Audited but CORRECT Areas (No action needed)
1. **Admin Layout Guard**: `src/app/(admin)/layout.tsx` correctly implements a server-side redirect for unauthorized users (`if (sessionData.user.role !== "ADMIN") redirect(...)`). 
2. **Client-Side Mutations**: Client components like `RefundManager.tsx`, `ProductForm.tsx`, and `ShipmentCreationDialog.tsx` correctly catch mutation errors and surface them via localized `setError()` state, permitting safe operational retries without full page reloads.
3. **Admin API Routes**: `src/app/api/admin/*` routes consistently utilize the `handleError(error)` utility to securely format and return `ApiError` responses, preventing sensitive stack traces from leaking during infrastructure failures.

### 4. Proposed R11 Implementation Plan
1. Create `src/app/(admin)/admin/error.tsx` to safeguard the Admin shell during Server Component crashes.
2. Refactor `admin/orders/page.tsx` to unwrap `AuthService.requireRole`.
3. Refactor `admin/orders/[orderId]/page.tsx` to unwrap `AuthService.requireRole`.
4. Refactor `admin/coupons/[couponId]/page.tsx` to unwrap `AuthService.requireRole`.
