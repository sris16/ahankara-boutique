# AHANKARA STUDIOS — CUSTOMER RESILIENCE & SYSTEM STATES
**Pre-Implementation Architecture Audit (R1)**

## 1. Executive Summary
This document provides a comprehensive, read-only architectural audit of the current state of customer resilience, error handling, and system states in the AHANKARA STUDIOS repository. The audit investigates the existing Next.js App Router mechanisms, the fetch/API layer, payment state transitions, and the cart/checkout lifecycle. 

The primary finding is that while the backend services (Payment, Order, Cart) are highly resilient and robustly transactional, the frontend currently lacks localized error boundaries, offline detection, and a unified API error resolution model. Most UI errors currently trigger coarse-grained route-level error boundaries or unhandled fetch rejections.

## 2. Existing Architecture
- **Framework**: Next.js App Router.
- **State Management**: React Context / Hooks (`useCart`, `useCheckout`, `useAddress`).
- **Data Fetching**: Custom `apiClient` (`src/lib/api/client.ts`) wrapping native `fetch`.
- **Payment Gateway**: Razorpay (Client script loaded on demand + Server Webhooks + Sync Verification).

## 3. Existing Error Handling
- **Next.js Global Error (`src/app/global-error.tsx`)**: Exists. Renders a barebones fatal error page and attempts to track analytics.
- **Storefront Route Error (`src/app/(storefront)/error.tsx`)**: Exists. Replaces the entire active page route with an `<ErrorState />` component if an exception bubbles up. Leaves the layout (Navbar/Footer) intact but wipes out all local page content.
- **No Local Boundaries**: There are no nested `error.tsx` files within `(storefront)` (e.g., in `/products`, `/cart`, `/checkout`), meaning any product data failure destroys the entire view for that route.

## 4. Existing Loading States
- **Storefront Route Loading (`src/app/(storefront)/loading.tsx`)**: Exists. Uses a simple centered `Loader2` spinner.
- **Inline Loading**: Components like `checkout-client.tsx` maintain local `isSubmitting` / `isProcessing` states to show inline spinners on buttons.
- **Skeletons**: A `<Skeleton />` component exists in `src/components/ui/skeleton.tsx`, but its usage is not fully pervasive across the storefront.

## 5. Existing Empty States
- **Not Found (`src/app/(storefront)/not-found.tsx`)**: Renders a custom `<EmptyState />` component for 404s.
- **Cart (`CartDrawer.tsx` / `checkout-client.tsx`)**: Both handle empty cart scenarios explicitly using the `<EmptyState />` component, preventing users from accessing checkout with an empty bag.

## 6. Authentication Failure Analysis
- **Provider**: Better Auth with email OTP.
- **Handling**: Handled primarily via `401 Unauthorized` responses from the `apiClient`.
- **Missing**: There is no explicit global interceptor that detects a `401` session expiration mid-session and gracefully opens a re-authentication modal; it typically relies on the route rejecting the user or the hook state updating.

## 7. Cart Failure Analysis
- **Inventory Evaluation**: Handled beautifully on the server (`cart.service.ts`). It evaluates `PRODUCT_UNAVAILABLE`, `OUT_OF_STOCK`, and `INSUFFICIENT_STOCK`.
- **UI Reflection**: The `checkout-client.tsx` detects `hasUnavailableItems` and renders a prominent inline `AlertTriangle` warning banner, disabling the checkout button.
- **Update Failures**: `CartDrawer.tsx` catches quantity update/removal errors and surfaces them via the `useToast` hook.

## 8. Checkout Failure Analysis
- **Validation Failures**: Client-side form validation handles missing addresses gracefully.
- **Pricing/Coupon Failures**: `checkout-client.tsx` handles coupon rejection gracefully with inline red text and toasts.
- **Network Failures during Submit**: Handled via try/catch, resulting in a toast and an inline error banner (`checkoutError`).

## 9. Payment Failure Analysis
- **Architecture**: Deeply transactional (`payment.service.ts`).
- **Initiation**: `checkoutApi.createPaymentAttempt` securely creates a pending order.
- **Client Execution**: `PaymentHandler.tsx` loads the Razorpay script and opens the modal.
- **Failures**: 
  - If the user closes the modal, `PaymentHandler` triggers `onClose`, leaving the order pending.
  - If Razorpay triggers `payment.failed`, `onError` is called with the reason.
  - **Crucial Safety**: The server does *not* blindly accept client failure. The database relies on webhooks and idempotent sync calls (`verifyPayment`). If the client network drops during payment, the server webhook will ultimately settle the order state.
- **Recovery**: `OrderPaymentRetry.tsx` allows customers to resume payment for `PENDING_PAYMENT` orders.

## 10. Order/Tracking Failure Analysis
- **Not Found**: Navigating to an invalid order ID triggers standard 404 boundaries.
- **Payment Ambiguity**: If a payment amount mismatches or limit is exceeded, the server sets the order to `PAYMENT_REVIEW` rather than failing outright.

## 11. API/Data Failure Analysis
- **Client Fetch Wrapper**: `src/lib/api/client.ts`
- **Behavior**: Throws `ApiError` instances on non-2xx responses.
- **Missing**: No centralized categorization of 500s vs 503s vs 429s. A 503 Maintenance Mode will currently manifest as a generic "unexpected API error".

## 12. Network Failure Analysis
- **Offline Detection**: None. The `apiClient` catches `fetch` exceptions as `"Network error"` but does not detect offline state natively before firing requests.
- **Timeouts**: None. Requests can technically hang indefinitely if the connection stalls but doesn't drop.
- **Retries**: No automatic API retry mechanism exists.

## 13. Image/Media Failure Analysis
- **Next.js Image**: Used for product images.
- **Missing**: No explicit fallback mechanism (e.g., `onError` replacing the source with a placeholder) if Cloudinary fails to load an image.

## 14. Form Failure Analysis
- **Behavior**: Forms handle server rejections by catching exceptions and showing toasts or inline messages.
- **Integrity**: Buttons are correctly disabled (`isSubmitting`) to prevent duplicate submissions.

## 15. Global vs Local Failure Analysis
- **Current State**: Heavily skewed towards Global.
- If the `GET /api/home` request fails, the entire page renders `error.tsx`. 
- **Ideal State**: The architecture requires localized error boundaries using React Error Boundaries around specific page sections (e.g., `<ProductCarousel />`) so the rest of the page remains interactive.

## 16. Complete System-State Matrix

| State | Current Behavior | Location | Local/Global | Recovery | Missing? |
|---|---|---|---|---|---|
| **Global Offline** | Generic Network Error | `client.ts` | Global | Manual Retry | Yes (No offline indicator) |
| **500 Server Error** | Generic API Error | `client.ts` | Global | Manual Retry | Yes (No distinct 500 UI) |
| **503 Maintenance** | Generic API Error | `client.ts` | Global | Manual Retry | Yes (No maintenance UI) |
| **404 Not Found** | `<EmptyState />` UI | `not-found.tsx` | Global | Link to Home | No |
| **Route Loading** | `Loader2` Spinner | `loading.tsx` | Global | N/A | No (But could use Skeletons) |
| **Section Loading** | None / Blocked | Components | Local | N/A | Yes |
| **Empty Cart** | `<EmptyState />` UI | `CartDrawer.tsx` | Local | Link to Catalog | No |
| **Cart Item OOS** | Banner & Block Checkout| `checkout-client.tsx`| Local | Remove Item | No |
| **API Timeout** | Browser Default / Hang | `client.ts` | Global | Refresh | Yes |
| **Session Expired** | 401 API Error / Toast | `client.ts` | Local | Re-login | Yes (No graceful modal) |
| **Payment Failed** | Toast + Error Banner | `PaymentHandler.tsx` | Local | Try Again | No |
| **Payment Modal Closed**| Returns to Checkout | `PaymentHandler.tsx` | Local | Try Again | No |
| **Image Load Failure**| Broken Image Icon | `next/image` | Local | None | Yes (Needs Fallback) |

### 17. Architecture Gaps
1. **Lack of Local Error Boundaries**: A single component failure destroys the route view.
2. **Missing Network Resilience**: No offline detection, request timeouts, or idempotent retries.
3. **Missing Maintenance Mode**: No distinct handling for 503 status codes.
4. **Media Fragility**: Missing graceful fallbacks for image load failures.

### 18. Recommended Architecture
1. **Centralized API Error Model**: Upgrade `apiClient` to intercept 503 (Maintenance), 401 (Auth), and handle timeouts explicitly.
2. **Network Layer**: Implement a global `useNetwork` hook to detect `navigator.onLine` and display an offline banner.
3. **Local Error Boundaries**: Introduce a reusable `<LocalErrorBoundary />` wrapping distinct page sections (e.g., Recommendations, Reviews) so the page survives partial API outages.
4. **Image Fallbacks**: Create a custom `<ImageWithFallback />` component.
5. **Payment Safety**: Maintain current architecture. Do not add client-side assumptions; rely on existing webhooks and `PAYMENT_REVIEW` states.

### 19. Proposed Implementation Phases
- **Phase 1: Network & Global Resilience**: Implement timeout logic, offline detection banner, and 503 Maintenance handling in `apiClient`.
- **Phase 2: Local Resilience**: Implement `<LocalErrorBoundary />` and apply it to non-critical page sections. Upgrade loading states to Skeletons.
- **Phase 3: Media & Form Hardening**: Implement `<ImageWithFallback />` and ensure all forms have graceful error states.

### 20. Testing Strategy
- Introduce Playwright tests that utilize route interception (`page.route()`) to simulate 500, 503, 401, and offline states to verify the UI degrades gracefully.

### 21. Risks
- Adding retries to non-idempotent endpoints (POST/POST) could cause duplicate operations if not scoped correctly. (Retries should only apply to GET requests).

### 22. External Dependencies
- None required. Can be achieved natively with React context, hooks, and Next.js boundaries.

### 23. Files Likely to Change
- `src/lib/api/client.ts`
- `src/app/layout.tsx` (to add offline banner)
- Product/Home page components (to add Local Error Boundaries)

### 24. Files That Should NOT Be Changed
- `src/server/services/payment.service.ts`
- `src/server/services/order.service.ts`
- `src/server/services/cart.service.ts`
- Database schema (`prisma/schema.prisma`)

### 25. Final Recommendation
Authorize implementation of Phase 1 and Phase 2. The backend is fundamentally secure and resilient regarding payments and inventory; all focus should be on the React layer's graceful degradation and user communication during degraded network/server states.
