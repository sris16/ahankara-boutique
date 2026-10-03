# AHANKARA STUDIOS — CUSTOMER RESILIENCE & SYSTEM STATES

## R9 — PRE-IMPLEMENTATION AUDIT

### 1. Executive Summary
A comprehensive read-only audit of the post-checkout customer journey was conducted. The objective was to identify authentic customer resilience weaknesses involving data presentation, duplicate mutations, synchronization, and error semantics. The audit found that the majority of backend and post-purchase architecture is robust, correctly enforcing idempotency, idempotency locks, and optimistic UI transitions. However, two critical vulnerabilities were identified: an Error Semantics violation on the Order Confirmation page, and a duplicate of the R8 payment verification flaw residing in the `OrderPaymentRetry` component.

### 2. Files Inspected
- `src/app/(storefront)/order-confirmation/[orderId]/page.tsx`
- `src/app/api/me/orders/[orderId]/route.ts`
- `src/app/(storefront)/account/orders/[orderId]/page.tsx`
- `src/components/orders/OrderPaymentRetry.tsx`
- `src/components/orders/CancelOrderDialog.tsx`
- `src/components/orders/ReturnItemDialog.tsx`
- `src/components/orders/TrackingModule.tsx`
- `src/server/services/order.service.ts`
- `src/server/services/cancellation.service.ts`
- `src/server/services/return.service.ts`
- `src/server/services/payment.service.ts`

### 3. Existing Architecture
The post-checkout architecture leverages Next.js App Router Server Components for authoritative state rendering (`/account/orders/[orderId]`) and Client Components for asynchronous operations. The backend heavily utilizes Prisma `$transaction` blocks with `FOR UPDATE` pessimistic row-level locking to ensure mutation safety.

### 4. Customer Journey Analysis
The journey from payment success through order viewing, cancellation, and tracking was audited. The journey relies heavily on `router.refresh()` to refetch server data following client-side asynchronous operations, ensuring authoritative synchronization. 

### 5. Order Confirmation Analysis
When a customer lands on `/order-confirmation/[orderId]`, a client-side fetch is dispatched to retrieve the order. **Vulnerability Discovered:** If the fetch fails due to a transient network timeout (`TypeError: Failed to fetch`) or a server `500` error, the UI blindly catches the error and hardcodes the presentation to `<h1 className="font-serif text-3xl mb-4">Order Not Found</h1>`. This severely conflates infrastructure failures with semantic 404s, leaving the customer believing their order was lost.

### 6. Order Synchronization Analysis
State changes during mutations (e.g., cancellations, returns) correctly issue a `router.refresh()` upon successful completion. This forces Next.js to discard the router cache and refetch the RSC payload, securely updating the page status without complex client-side polling. 

### 7. Tracking Analysis
The `TrackingModule` gracefully handles empty states (e.g., AWB allocation in progress) and distinguishes it from errors. Carrier status is securely mapped from the `MockShippingProvider` and surfaced. No critical resilience issues were found in the rendering pipeline.

### 8. Cancellation / Return / Exchange Analysis
Backend handlers (`CancellationService.cancelOrder`, `ReturnService.createReturnRequest`) utilize `FOR UPDATE` locks. Over-returning is strictly validated against `PostPurchaseService.getItemEligibility`. Cancellations are properly protected against duplicate submissions. No new vulnerabilities were discovered here.

### 9. Mutation Retry Analysis
Because the backend throws HTTP 409 Conflict errors (e.g., "A cancellation request already exists for this order"), duplicate frontend mutation retries during network timeouts are safely blocked and bubbled up as user-readable toast messages.

### 10. Stale Data Analysis
Authoritative server rendering guarantees that navigating directly to an order retrieves fresh data. Background status updates (e.g., Razorpay webhooks hitting post-render) remain stale until refreshed, but this is acceptable as polling is unnecessary unless real-time tracking is strictly required.

### 11. Error Semantic Analysis
As identified in Section 5, `OrderConfirmationPage` actively violates Error Semantics by mutating network failures into semantic 404s.

### 12. Security / Ownership Analysis
IDOR protection is strictly enforced. Attempting to view a different user's order yields a 404 (preventing information disclosure via 403s), and the authentication layer correctly isolates sessions.

### 13. Duplicate Action Analysis
`OrderPaymentRetry.tsx` contains an unpatched duplicate of the R8 payment verification vulnerability. When the `verifyPayment` API fails (e.g., due to a network timeout), the `catch` block erroneously labels it as a payment failure, dismisses the modal, and restores the "Complete Payment" CTA. This allows the customer to erroneously initialize a duplicate Razorpay checkout session for a payment that is currently being captured by the backend webhook.

### 14. Failure-State Matrix

| Surface | Operation | Failure | Current Behavior | Correct State | Severity | R9 Candidate |
| ------- | --------- | ------- | ---------------- | ------------- | -------- | ------------ |
| Order Confirmation | Load Order | Network Timeout / 500 | Shows "Order Not Found" | Shows a generic Error State / Network Failure | High | **YES** |
| Order Details | Payment Retry | Verification Timeout | Sets error, allows retry | Shows "Processing/Pending", directs to refresh | High | **YES** |
| Cancel Order | Submit Cancellation | Duplicate Submission | Backend 409 Conflict thrown, toast shown | Handled Correctly | Low | NO |
| Return Item | Submit Return | Over-quantity | Backend 409 Conflict thrown | Handled Correctly | Low | NO |

### 15. Confirmed R9 Issues
1. **Order Confirmation 404 Conflation**: Network errors are mapped to 404s on the Order Confirmation page, panicking customers.
2. **Payment Retry Idempotency Bypass**: The `OrderPaymentRetry` component treats verification network failures as payment failures, enabling the customer to execute unsafe concurrent payment retries.

### 16. False Positives / Already Correct
- Order Cancellation idempotency is perfectly enforced.
- Return quantity validation is perfectly enforced.
- Order details routing and Server Component refreshes (`router.refresh()`) securely handle state updates post-mutation.
- Cart inventory business logic (handled in R7) remains robust.

### 17. Proposed R9 Scope
1. **Refactor `OrderConfirmationPage`**: Implement granular error differentiation. A `404` should display "Order Not Found". A `500` or Network Error should display a localized `<LocalErrorBoundary>` or "Unable to load order details" with a retry button.
2. **Patch `OrderPaymentRetry`**: Migrate the exact `onVerificationUnknown` strategy developed during R8 into `OrderPaymentRetry.tsx`. A verification timeout must leave the UI in a "Payment Processing" state rather than permitting a secondary click.

### 18. Deferred R10+ Items
- WebSocket/SSE based real-time order status updates (e.g., live webhook transitions).
- Background polling for AWB generation delays.

### 19. Risks
- None. The proposed R9 scope strictly involves client-side UI error mapping and routing logic, preserving all backend transactional integrity.

### 20. Acceptance Criteria
- Simulating a network failure during Order Confirmation load presents a generic error/retry UI, not a 404.
- Simulating a network failure during `OrderPaymentRetry` verification transitions the UI to a "Processing" state and prevents duplicate clicks.

### 21. Final Recommendation
**R9 READY FOR IMPLEMENTATION**
