# AHANKARA STUDIOS — CUSTOMER RESILIENCE & SYSTEM STATES

## R8 — PRE-IMPLEMENTATION AUDIT

### Checkout & Payment Resilience

#### 1. Executive Summary
An exhaustive read-only inspection of the checkout and payment architecture has been completed. The system leverages a two-step order/payment initialization process, integrating with Razorpay and validating via Webhook and frontend verification endpoints. While the core transactions and idempotency mechanisms are generally robust, we have identified a critical risk related to client-side generated idempotency keys and naive assumptions regarding payment states during network failures.

#### 2. Existing Checkout Architecture
- **Cart Validation**: Handled both via `CartService.getOrCreateCart` and `_evaluateCart`.
- **Order Initialization**: Client submits shipping/billing addresses and a client-generated `idempotencyKey` to `checkoutApi.createOrder`. The `OrderService` atomically reserves inventory and creates a `PENDING_PAYMENT` order.
- **Payment Initialization**: Client calls `createPaymentAttempt`, which creates a Razorpay order and a `PENDING` payment record.
- **Client Execution**: `PaymentHandler.tsx` mounts the Razorpay SDK and opens the checkout modal.
- **Verification**: On success, the frontend calls the verification API, which captures the payment, finalizes the order (`CONFIRMED`), and deducts inventory.

#### 3. Existing Payment Architecture
- Uses a `Payment` Prisma model mapped one-to-many to `Order`.
- Maintains local `status` (`PENDING`, `PAID`, `FAILED`, `REFUNDED`) against `providerPaymentId`.
- An independent Webhook listener (`/api/webhooks/razorpay`) processes `payment.captured` and `payment.failed` autonomously, offering server-to-server reconciliation.

#### 4. Checkout State Machine
- `PENDING_PAYMENT` (Order) + `PENDING` (Payment)
- Cart Empty/Invalid -> Hard block (`400 ValidationError`).
- Checkout submission -> `isSubmitting` state.

#### 5. Payment State Machine
- `PENDING`
- `PAID`
- `FAILED`
- `REFUNDED`
- *Note:* The system does not possess an `UNKNOWN` or `PROCESSING` state for payment verification failures.

#### 6. Payment Verification Flow
1. Razorpay invokes `handler` in `PaymentHandler.tsx`.
2. Frontend calls `/api/me/orders/[id]/payment/verify`.
3. Backend validates signature and amount against Razorpay API.
4. Backend updates Order -> `CONFIRMED`, Payment -> `PAID`, commits stock, and clears Cart.
5. If frontend connection dies, Webhook handles identical finalization securely.

#### 7. Order/Payment Consistency
1. **Order before payment**: Yes, `PENDING_PAYMENT` order is created before Razorpay interaction.
2. **Payment without order**: No, `Payment` requires an `orderId`.
3. **Idempotency**: Present in DB (`userId_idempotencyKey`), but **circumvented by client** (new key generated per click).
4. **Duplicate Orders**: Possible if user double-clicks before React state disables the button (both requests reserve stock if available).

#### 8. Price & Inventory Race Conditions
- **Prices/Coupons**: The backend completely calculates and overrides prices securely via `PricingService.calculateCheckoutPricing`. Client-side totals are strictly cosmetic.
- **Inventory**: `InventoryService.reserveStock` executes an atomic raw SQL `UPDATE ... WHERE quantity - reservedQuantity >= required`. It securely handles race conditions.

#### 9. Failure Boundary Matrix

| Surface | Failure | Current Behavior | Correct Semantic State | Recovery | R8 Scope |
| ------- | ------- | ---------------- | ---------------------- | -------- | -------- |
| Order Creation | Invalid Cart (Insufficient Stock) | 400 Error thrown, caught, toast displayed | Stay on checkout, highlight cart issue | User adjusts cart | None (already handled by R7) |
| Order Creation | Double-click race condition | Client generates new idempotency key, creates duplicate orders | Only one order created | Debounce/persist key | **YES** |
| Payment Execution | Customer cancels/closes modal | Modal closes, `paymentAttempt` cleared | PENDING_PAYMENT order remains | Click 'Place Order' again | None (Correct) |
| Verification | Razorpay succeeds, network fails | Catch block sets `checkoutError` to "Payment failed: Network Error" | Payment status is actually UNKNOWN/PROCESSING | Poll/Check status | **YES** |
| Verification | Webhook clears cart, user retries | Client fails with "Cannot checkout empty cart" | Inform user payment is confirmed | Redirect to success | **YES** |

#### 10. Recovery Action Matrix
- **Network/timeout during verification** → Do NOT automatically declare payment failed. The Webhook will process it. Must verify status before allowing a retry.
- **Payment cancellation** → Correctly restores checkout state.
- **Inventory conflict** → Reject and require cart adjustment. (Correctly enforced).

#### 11. Critical Payment Safety Scenarios

**Scenario 1: Payment succeeds → frontend crashes.**
- *Current*: Webhook captures and finalizes the order. Customer sees no success screen.
- *Risk*: Customer is confused, but business state is completely sound.

**Scenario 2: Payment succeeds → verification API times out.**
- *Current*: `checkout-client.tsx` catches the timeout and incorrectly reports "Payment failed: Network error".
- *Risk*: Customer attempts to pay again, or panics. Business state is processing/sound.

**Scenario 3: Payment succeeds → customer refreshes browser.**
- *Current*: Webhook captures. Customer returns to empty cart (cleared by webhook) and doesn't see order success.
- *Risk*: Confusion, but business state is secure.

**Scenario 4: Customer clicks Pay twice.**
- *Current*: The client generates a `crypto.randomUUID()` *inside* `handleCheckoutSubmit`. Two concurrent network requests create two distinct orders and reserve 2x inventory.
- *Risk*: **High.** Duplicate orders and locked inventory.

**Scenario 5: Razorpay is processing → customer's network disappears.**
- *Current*: Equivalent to Scenario 2. Erroneous "Payment failed" message.

#### 12. Confirmed R8 Issues
1. **Idempotency Key Flaw**: Generating the key inside the submit handler defeats its purpose against double-clicks.
2. **False Negative on Verification Timeout**: A network failure during `verifyPayment` sets a destructive "Payment failed" UI error, misleading the customer when the webhook might have successfully finalized the payment.

#### 13. Correct Existing Behavior
- Backend price and inventory enforcement (Atomic raw SQL reservations).
- Webhook autonomous finalization and stock commits.
- Initial Order -> Payment -> Verification state machine structure.

#### 14. Unverified/Theoretical Concerns
- None. Duplicate checkout and false-negative verifications were successfully verified in the codebase.

#### 15. Safe R8 Implementation Scope
1. **Fix Idempotency Key**: Generate the idempotency key once per checkout session (e.g., in a `useRef` or on component mount), not per click.
2. **Handle Verification Network Failures**: Do not map `verifyPayment` network/timeout errors to "Payment failed". Display an "Unknown / Processing" state and query the backend for the actual order status, or prompt the user to check their email/orders page.

#### 16. Deferred R9+ Scope
- Advanced retry queues.
- Web-socket based real-time webhook UI updates.

#### 17. Acceptance Criteria
- Double-clicking "Place Order" results in only one order creation.
- A simulated network failure during `verifyPayment` does not display a destructive "Payment failed" alert.

#### 18. Final Decision
**R8 — READY FOR IMPLEMENTATION**
