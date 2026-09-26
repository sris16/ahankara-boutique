# AHANKARA STUDIOS — P2-E CHECKOUT & PAYMENT FINALIZATION AUDIT REPORT

## 1. Executive Summary
A comprehensive read-only audit of the checkout finalization, payment processing, and inventory consistency flow was conducted. The core architectural chain securely delegates authority to the backend, leveraging `PricingService` and robust transaction boundaries. Idempotency, expiration, and stock allocation are well-structured.

However, a **CRITICAL** vulnerability exists in the Razorpay integration. The backend fails to convert INR (Rupees) to Paise during Razorpay Order creation. Because the backend does not subsequently fetch the actual payment amount captured from the Razorpay API during verification, a malicious user can manipulate the frontend client to pay exactly 1% of the total order value, which the backend will successfully verify and fulfill.

## 2. Exact Files Inspected
- `src/server/services/payment.service.ts`
- `src/server/services/razorpay.service.ts`
- `src/server/services/order.service.ts`
- `src/server/validators/checkout.validator.ts`
- `src/components/checkout/PaymentHandler.tsx`
- `src/app/(storefront)/order-confirmation/[orderId]/page.tsx`

## 3. Exact Routes Inspected
- `POST /api/me/checkout`
- `POST /api/me/orders/[orderId]/payment`
- `POST /api/me/orders/[orderId]/payment/verify`
- `POST /api/webhooks/razorpay`
- `POST /api/admin/cron/expire-orders`

## 4. Current Checkout Flow
1. User calls `/api/me/checkout` with `shippingAddressId` and `couponCode`.
2. `OrderService.createCheckoutOrder` validates the cart, calculates authoritative pricing, reserves inventory, and creates an `Order` in `PENDING_PAYMENT` status.
3. User calls `/api/me/orders/[orderId]/payment`.
4. `PaymentService.createPaymentAttempt` generates a Razorpay Order and creates a local `Payment` record.
5. The frontend `<PaymentHandler />` opens the Razorpay checkout widget.
6. Upon completion, the frontend calls `/api/me/orders/[orderId]/payment/verify`.
7. `PaymentService.verifyCheckoutPayment` validates the cryptographic signature and confirms the order.

## 5. Financial Authority Chain
**FACT:** The backend maintains total financial authority. The client API contract (`checkoutSchema`) strictly ignores client-supplied pricing.
**FACT:** The `PricingService` recalculates all subtotal, shipping, and discounts dynamically on the server before committing the Order snapshot to the database.
**RISK:** None. The pricing authority boundary is exceptionally robust.

## 6. Razorpay Amount Integrity
**FACT:** The database stores `totalAmount` in full currency units (Rupees, e.g., `5000`).
**FACT:** `PaymentService` passes `order.totalAmount` directly to `RazorpayService.createOrder` without multiplying by 100.
**FACT:** Razorpay `orders.create` requires amounts in Paise. Therefore, an order for ₹5,000 (5000) is submitted as 5000 Paise (₹50).
**FACT:** The frontend `<PaymentHandler />` attempts to pass `paymentAttempt.amount * 100` to Razorpay.
**RISK:** **CRITICAL**. Ordinary customers will experience broken checkouts, as Razorpay will block the transaction due to an amount mismatch (frontend requests ₹5000, but Razorpay Order is for ₹50). A malicious user can intercept the frontend configuration, pass the unmultiplied amount, successfully pay ₹50 via Razorpay, and receive a valid cryptographic signature.

## 7. Payment Verification Audit
**FACT:** `PaymentService.verifyCheckoutPayment` strictly validates the cryptographic signature.
**FACT:** The method checks `payment.amount === order.totalAmount` using the local database records.
**FACT:** The method **never** fetches the actual payment record from the Razorpay API (`RazorpayService.fetchPayment(paymentId)`) to verify the captured amount.
**RISK:** **CRITICAL**. Combined with the unit mismatch in Section 6, the system will accept the ₹50 payment signature as completely valid. Because local DB `payment.amount` (5000) matches local DB `order.totalAmount` (5000), the backend finalizes the order as fully paid.

## 8. Webhook Audit
**FACT:** The `/api/webhooks/razorpay` endpoint accurately verifies signatures.
**FACT:** The webhook processing is idempotent using `PaymentWebhookEvent`.
**FACT:** The webhook calls the same `finalizeSuccessfulPayment` logic.
**RISK:** **CRITICAL**. The webhook parses `payload.payload.payment.entity.amount`, but the backend ignores this value, relying entirely on the local DB match. It suffers from the exact same 1% payment vulnerability as the synchronous verification.

## 9. Payment Failure Handling
**FACT:** If a payment fails, errors out, or is closed by the user, the order safely remains in `PENDING_PAYMENT`.
**FACT:** The user can retry payment. If a `PENDING` payment attempt already exists, `PaymentService.createPaymentAttempt` idempotently returns the existing Razorpay Order ID.

## 10. Duplicate Order / Idempotency Audit
**FACT:** `OrderService.createCheckoutOrder` uses an `idempotencyKey` stored in a unique constraint (`userId_idempotencyKey`).
**FACT:** Double clicks on "Place Order" will safely return the exact same pending order rather than allocating a duplicate order or reserving double inventory.

## 11. Inventory Consistency
**FACT:** `InventoryService.reserveStock` is called synchronously inside a database transaction during checkout.
**FACT:** `InventoryService.commitStock` is called exactly once during payment finalization.
**FACT:** Failed or abandoned payments hold inventory in a reserved state until the cron job expires them.
**RISK:** None. Inventory handling is highly resilient and transactional.

## 12. Unpaid Order Expiration
**FACT:** `/api/admin/cron/expire-orders` correctly queries orders past their `reservationExpiresAt`.
**FACT:** It verifies the status is still `PENDING_PAYMENT` inside a transaction before releasing stock.
**FACT:** If an order is paid *after* expiration, `finalizeSuccessfulPayment` identifies the `EXPIRED` status and places the order in `PAYMENT_REVIEW` rather than silently swallowing the money or finalizing an oversold cart.

## 13. Order Confirmation Audit
**FACT:** `/order-confirmation/[orderId]` reads static historical data via the API.
**FACT:** No dynamic pricing recalculation occurs.
**FACT:** IDOR is prevented because the endpoint respects session identity.

## 14. Authorization / IDOR Audit
**FACT:** All `POST /api/me/orders/[orderId]/*` routes check `user.id` against the queried order.
**FACT:** A user cannot verify, view, or pay for another user's order.

## 15. API Contract Audit
**FACT:** The payment verification schema (`verifySchema`) strictly checks Razorpay strings.
**FACT:** The API returns standard HTTP 400 for validation errors. Internal stack traces do not leak.

## 16. Razorpay Edge Cases
**FACT:** Idempotency guarantees that a webhook arriving before the frontend callback (or vice versa) simply short-circuits the second request because the order transitions to `CONFIRMED`.
**FACT:** Coupon over-redemption race conditions during payment finalization are gracefully caught and transitioned to `PAYMENT_REVIEW`.

## 17. PDP Delivery Endpoint Abuse Audit
**FACT:** `GET /api/products/delivery` strictly relies on database-derived pricing and weights.
**FACT:** It is completely unauthenticated.
**RISK:** **MODERATE**. Because the Shiprocket API is directly hit on every valid request, a malicious actor or botnet could script requests to this endpoint, exhausting Shiprocket API limits or causing financial billing abuse at the provider level.

## 18. Tax Status
**FACT:** Tax is hardcoded to `0` inside `PricingService`. It is immune to client manipulation.

## 19. Build/Test Results
- `npx tsc --noEmit`: 0 errors.
- `npm run build`: Success.
- `git diff --check`: 0 whitespace errors.

## 20. Git Status
No files were modified. The working tree remains completely clean (except for earlier uncommitted P2 phases).

## 21. Findings by Severity
**[CRITICAL]** Razorpay Order Creation Unit Mismatch
**[CRITICAL]** Missing Razorpay Amount Verification (Local DB trust bypass)
**[MODERATE]** Unauthenticated Delivery Checker susceptible to provider API exhaustion.

## 22. Required Fixes
1. Modify `PaymentService.createPaymentAttempt` to multiply `order.totalAmount` by 100 before passing it to `RazorpayService.createOrder`.
2. Update `PaymentHandler.tsx` to pass the `paymentAttempt.amount` natively, without remultiplying by 100.
3. Modify `PaymentService.verifyCheckoutPayment` to actively call `RazorpayService.fetchPayment(razorpayPaymentId)` and verify that `razorpayPayment.amount === order.totalAmount * 100` and `razorpayPayment.status === 'captured'`.
4. Update `PaymentService.processWebhook` to assert that `payload.payload.payment.entity.amount === payment.amount * 100`.

## 23. Protected Files
The inspected architecture inside `payment.service.ts`, `razorpay.service.ts`, and `order.service.ts` is solid. The fixes should precisely target the conversion logic and external verification validation without redesigning the checkout lifecycle.

## 24. P2-E Final Classification
**FIXES REQUIRED BEFORE P2-F**

## 25. Recommended Next Phase
Authorize a P2-E Remediation Phase to surgically repair the Razorpay implementation before moving to frontend validation and styling (P2-F).
