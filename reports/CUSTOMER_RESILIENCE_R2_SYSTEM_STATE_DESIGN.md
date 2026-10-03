# AHANKARA STUDIOS — CUSTOMER RESILIENCE & SYSTEM STATES
**R2 — SYSTEM-STATE DESIGN SYSTEM**

## 1. R2 Executive Summary
This document specifies the resilience design system for AHANKARA STUDIOS. Following the R1 discoveries, the architecture eschews monolithic "SystemState" abstractions in favor of highly composable, contextual UI primitives. The goal is to provide specific, accurate communication during data, network, and runtime failures without inventing false signals (like treating all errors as maintenance, or ambiguity as payment failure) while adhering strictly to the brand's minimalist, editorial aesthetic.

## 2. Design Principles
- **Accuracy over Aesthetics**: Never lie to the customer. Do not show "Maintenance" if the server is just slow. Do not show "Payment Failed" if the connection drops.
- **Graceful Degradation**: Preserve as much usable UI as possible. Localize failures to sections or actions rather than destroying the route.
- **Brand Continuity**: Resilience UI must feel like AHANKARA STUDIOS—minimalist, uppercase tracking, muted palettes. No generic SaaS illustrations.
- **Composability**: Combine primitive components (e.g., `ErrorState`, `Toast`) instead of creating a monolithic `SystemState` switch statement.

## 3. Canonical State Taxonomy
1. **Loading**: Data is actively being retrieved (`LOADING`, `SKELETON`, `PROCESSING`).
2. **Empty**: The request succeeded, but the result is a zero-length valid set (`EMPTY`, `NO_RESULTS`).
3. **Failure**: The request failed (`ERROR`, `SERVER_ERROR`, `TIMEOUT`).
4. **Network**: Physical connectivity issues (`OFFLINE`).
5. **Auth**: Session validation failed (`AUTH_REQUIRED`, `FORBIDDEN`).
6. **Conflict**: Race conditions during mutation (`CONFLICT`).

## 4. State Ownership Model
- **Global**: App-wide issues (e.g., `OfflineBanner`).
- **Route**: Page-level fatal failures (`error.tsx`, `not-found.tsx`).
- **Section**: Non-critical area failures (e.g., "Related Products" widget failing).
- **Action**: User-initiated mutation failures (e.g., adding to cart, submitting checkout).

## 5. Render vs Data State Rules
- **Render Failures**: Occur during React rendering (including SSR data fetching that is allowed to throw). Must be caught by Next.js `error.tsx` or a React Error Boundary. Use `ErrorState` as the fallback UI.
- **Data Failures**: API rejections handled in client hooks or caught explicitly in Server Components. State is managed locally. Use `ErrorState` inline or `Toast` depending on context.

## 6. Global State Rules
- Used exclusively for absolute, application-wide conditions.
- **Implementation**: Persistent, non-blocking top banners (e.g., OfflineBanner).

## 7. Route State Rules
- Replaces the entire `page.tsx` payload while retaining the `layout.tsx` (Navbar, Footer).
- **Implementation**: Used for 404s and uncaught SSR Render failures.

## 8. Section State Rules
- Confined to a specific semantic block (e.g., `<RelatedProducts />`).
- **Implementation**: Displays an inline `<ErrorState />` or `<EmptyState />` bounded by the parent container's dimensions.

## 9. Component/Action State Rules
- Bound directly to user interaction.
- **Implementation**: Button spinners, input validation text, or `Toast` notifications. Never replaces the page layout.

## 10. Loading State Specification
- **Full Page/Route**: Use a simple spinner or logo pulse.
- **Section**: Use `<Skeleton />` matching the expected content layout.
- **Action**: Use a minimal spinner inside the button (`PROCESSING`).

## 11. Empty State Specification
- Indicates a valid `0` result. Must NOT be used to mask API errors.
- **Visuals**: Center-aligned, muted icon, clear explanation.
- **Component**: Reuse `<EmptyState />`. Support variants (`default`, `inline`).

## 12. Error State Specification
- Indicates failure to load required data.
- **Visuals**: Distinct from `EmptyState` by utilizing `destructive/10` subtle backgrounds or an `AlertCircle` icon.
- **Component**: Reuse `<ErrorState />`. 

## 13. Offline State Specification
- Indicates `navigator.onLine === false`.
- **Behavior**: Must NOT block the page. Customers can still view loaded products. Mutations should be disabled or queued.
- **Component**: A new `<OfflineBanner />` at the top of the viewport.

## 14. Timeout State Specification
- **Trigger**: Request exceeds explicit timeout threshold.
- **Behavior**: Treat as a Data Failure. Display standard `ErrorState` with specific copy: "This is taking longer than expected."
- **Action**: Primary action is "Retry".

## 15. Service Unavailable Specification
- **Trigger**: 500, 502, 504 errors. (503 is not uniquely emitted by backend).
- **Behavior**: Use `ErrorState`. "We couldn't load this right now."
- **Note**: DO NOT use "Maintenance" copy, as there is no authoritative 503 maintenance signal from the backend.

## 16. Authentication State Specification
- **Trigger**: 401 UNAUTHORIZED.
- **Behavior**: If mid-checkout or action, present an inline sign-in dialog or toast redirecting to `/login`. Do not claim "Session Expired" as the backend doesn't distinguish it from missing sessions.
- **Action**: "Sign In".

## 17. Authorization State Specification
- **Trigger**: 403 FORBIDDEN.
- **Behavior**: Full route replacement for unauthorized pages. If triggered by account suspension, use severe copy as detected via `error.message`.
- **Action**: "Return Home".

## 18. Not Found Specification
- **Trigger**: 404 NOT_FOUND.
- **Behavior**: Use `<EmptyState />` tailored to the resource type (Product, Collection, Order).
- **Action**: "Continue Shopping" / "Go Back".

## 19. Conflict State Specification
- **Trigger**: 409 CONFLICT (e.g., inventory races).
- **Behavior**: Action-level state. Present via inline alert in checkout or toast. Do NOT redirect without user consent.
- **Action**: "Refresh Cart" or "Review Order".

## 20. Payment State Specification
- **Trigger**: Payment mutation ambiguity (network drop, timeout).
- **Behavior**: Do NOT transition to a FAILED state. Preserve `PENDING_PAYMENT`.
- **Action**: Display `OrderPaymentRetry` state. Primary action: "Check Payment Status" or "Try Payment Again".

## 21. Recovery Action Model
- **Retry**: Re-executes the exact same failed fetch/mutation. Use for timeouts and 5xx errors.
- **Refresh**: Reloads the broader context. Use for 409 Conflicts.
- **Reconcile**: Asks the server for truth. Use for Payment Ambiguity.
- **Return**: Navigates away. Use for 404s and 403s.

## 22. Existing UI Primitive Reuse Plan
- `<EmptyState />`: **REUSE & EXTEND**. Add `variant="inline"` support.
- `<ErrorState />`: **REUSE & EXTEND**. Add `variant="inline"` support.
- `<Skeleton />`: **REUSE**.
- `<Toast />`: **REUSE**.
- `<Badge />`: **REUSE**.

## 23. Proposed Component Architecture
- Avoid a monolithic `<SystemState />`.
- Introduce `<OfflineBanner />` for global network state.
- Introduce `<ImageWithFallback />` wrapping `next/image` to catch `onError` events and render a branded placeholder when network loading fails.
- Introduce `<LocalErrorBoundary />` to catch render failures within specific layout sections (e.g., widgets) without killing the page route.

## 24. Accessibility Requirements
- **Announcements**: Offline states and toasts must use `role="alert"` or `aria-live="polite"`.
- **Focus**: `ErrorState` retry buttons must be logically tab-focusable.
- **Color**: Error states must not rely solely on red text; use icons (`AlertCircle`) and structural borders.

## 25. Mobile Requirements
- **Inline States**: `<ErrorState>` and `<EmptyState>` must scale down padding on `< 768px` viewports. Actions should span `w-full` on mobile and `w-auto` on desktop.
- **Offline Banner**: Must be sticky and consume minimal vertical space on mobile to prevent viewport crowding.

## 26. Animation/Reduced Motion Rules
- `OfflineBanner`: Slide down from top (`slide-in-from-top`).
- Respect `prefers-reduced-motion` utility classes for all state transitions.

## 27. Final State Catalog
| State | Meaning | Scope | UI Pattern | Primary Recovery |
|---|---|---|---|---|
| **Loading** | Request in progress | Any | Skeleton/Spinner | None |
| **Empty** | Valid zero-result | Section/Route | `EmptyState` | Contextual |
| **Offline** | Browser has no network | Global | `OfflineBanner` | Wait/Reconnect |
| **Timeout** | Request exceeded timeout | Action/Section | `ErrorState` (Timeout copy) | Retry |
| **Server Error** | Server failed (500) | Section/Route | `ErrorState` | Retry |
| **Conflict** | State changed (409) | Action | Inline error / Toast | Refresh |
| **Unauthorized**| Auth required (401) | Action/Route | Redirect / Dialog | Sign In |
| **Forbidden** | Access denied (403) | Route | `ErrorState` | Home |
| **Not Found** | Resource absent (404) | Route | `EmptyState` | Home/Catalog |
| **Payment Pend**| Payment unresolved | Action/Route | `OrderPaymentRetry` | Check Status |

## 28. Component Inventory
| Component | Purpose | Action | Reason |
|---|---|---|---|
| `EmptyState` | 0-result displays | **EXTEND** | Needs `variant="inline"` for section usage. |
| `ErrorState` | Failure displays | **EXTEND** | Needs `variant="inline"` for section usage. |
| `Skeleton` | Loading displays | **REUSE** | Sufficient as-is. |
| `Toast` | Action errors | **REUSE** | Sufficient as-is. |
| `OfflineBanner` | Network status | **NEW** | Missing global primitive for `navigator.onLine`. |
| `ImageWithFallback`| Media failure | **NEW** | Missing network fallback for `next/image`. |
| `LocalErrorBoundary`| Section isolation | **NEW** | Need a React Boundary that doesn't trigger route `error.tsx`. |

## 29. Rejected/Unnecessary Abstractions
- **`<SystemState />`**: Rejected. Overly complex and leads to prop drilling. Composability of `ErrorState` and `EmptyState` is vastly superior.
- **`<MaintenanceState />`**: Rejected. The backend lacks a 503 maintenance signal.
- **Global Automatic API Retries**: Rejected. Dangerous for mutations without strict per-request idempotency control.

## 30. R3 Implementation Prerequisites
- Finalize the visual styles of `OfflineBanner`.
- Update `apiClient` to support explicit timeouts via `AbortController`.
- Implement `LocalErrorBoundary`.

---

### FINAL R2 STATUS
**READY FOR R3**

**Approved Primitives**: `EmptyState`, `ErrorState`, `OfflineBanner`, `ImageWithFallback`, `LocalErrorBoundary`.
**Approved Taxonomy**: Empty ≠ Error, Offline ≠ Server Error, Ambiguity ≠ Payment Failed.
**Backend Limitations**: No 503 maintenance signal; generic 401s; rely on 409 for conflicts.
**R3 Boundaries**: Implementation will strictly apply these states to the fetching layers (`apiClient`), route boundaries, and critical customer funnels (Cart, Checkout). No backend code will be modified.
