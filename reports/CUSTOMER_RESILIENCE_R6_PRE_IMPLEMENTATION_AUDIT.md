# AHANKARA STUDIOS — CUSTOMER RESILIENCE & SYSTEM STATES
**R6 — PRE-IMPLEMENTATION AUDIT (AUTHENTICATION)**

## 1. Current State of Authentication Resolution

### Client-Side Authentication (`useAuth` hook)
The `use-auth.tsx` context accurately handles errors from the `/api/me` route. When fetching the session fails, it differentiates between a `401 Unauthorized` (indicating the user is legitimately not logged in) and other status codes.
- `401 Unauthorized`: Sets `user = null` but leaves `error = null`. This correctly reflects an "Unauthenticated" state without displaying a system failure.
- `5xx` / Network Error: Appropriately populates the `error` state.
- `403 Forbidden`: Correctly checks if the response message includes "suspended" to set `isSuspended = true`.

### Server-Side Authentication (`AuthService.requireAuth`)
`AuthService.requireAuth` correctly evaluates the session validity and the database status. It deliberately throws semantic errors:
- `UnauthorizedError` if no session exists or user is not found.
- `ForbiddenError` if the user is suspended or deactivated.

## 2. Identified Violations of R6 Constraints

### Violation A: Catch-All Redirects on Protected Routes
Currently, all pages under `src/app/(storefront)/account/*` use a broad `catch` block that blindly redirects the user to `/login`:
```typescript
  try {
    user = await AuthService.requireAuth(reqHeaders);
  } catch {
    redirect("/login");
  }
```
**Why this fails R6:** If the database becomes unreachable, or a network timeout occurs during `requireAuth`, a generic `Error` (e.g., Prisma network timeout) or `500 Internal Server Error` is thrown. The catch block swallows this failure and forces a redirect to `/login`. The user is thus erroneously led to believe their session has expired or they are logged out, directly violating the directive: *"Do not turn 500 into logout"* and *"Server failure must remain an error state."*

### Violation B: Layout Authorization Drift
`src/app/(storefront)/account/layout.tsx` checks authentication using a raw `auth.api.getSession(headers)` call rather than the unified `AuthService.requireAuth`.
**Why this fails R6:** `getSession` only verifies the token. It does not perform the strict `status` checks (suspended/deactivated) enforced by `AuthService.requireAuth`. The layout handles missing sessions correctly via `redirect`, but bypasses the robust semantic error handling expected.

### Violation C: Unhandled Rejections in Onboarding
`src/app/(storefront)/onboarding/page.tsx` calls `AuthService.requireAuth(reqHeaders)` completely unwrapped.
**Why this fails R6:** If an unauthenticated user navigates here, the server throws an `UnauthorizedError`, which bubbles up to the global error boundary (500-level error view) instead of seamlessly redirecting them to `/login`.

## 3. Required R6 Remediation Plan

1. **Refactor Protected Page Auth Boundaries:**
   - Update `account/layout.tsx`, `account/page.tsx`, `account/orders/page.tsx`, `account/orders/[orderId]/page.tsx`, `account/profile/page.tsx`, `account/addresses/page.tsx`, and `onboarding/page.tsx`.
   - Modify the `try/catch` logic to specifically check `if (error instanceof UnauthorizedError) { redirect('/login'); }` and `throw error;` for everything else.
   - Replace the `auth.api.getSession` call in `layout.tsx` with `AuthService.requireAuth` for strict consistency.
   - This ensures that 500/network failures correctly reach the Next.js `error.tsx` boundary rather than triggering false logouts.

2. **Verify Client-Side Expiration Handlers:**
   - Client components rendering protected data must not blindly default to "Empty" states if `useAuth` is in a system error state (similar to what was resolved in R5 for API client fetches).
   
No backend code, API logic, or business rules need to be modified. The remediation focuses entirely on respecting the existing semantic error boundary.
