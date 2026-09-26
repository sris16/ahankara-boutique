# AHANKARA STUDIOS — P2-D CUSTOMER PRICE TRANSPARENCY AUDIT

## 1. Executive Summary
This read-only audit evaluates the current customer-facing pricing and delivery UX across the e-commerce journey. The backend correctly operates as the authoritative source of truth for pricing calculations, cart subtotals, coupons, and secure order creation. However, the customer experience lacks delivery transparency on the Product Details Page (PDP) and Cart, as well as delivery estimates during checkout.

## 2. Current Customer Pricing Architecture
The existing architecture enforces a strictly backend-authoritative pricing mechanism:
- Product prices are fetched from the database.
- Cart computes subtotals securely on the server.
- `PricingService` securely orchestrates coupon applications and integrates dynamic shipping logic from `ShippingService`.
- Checkout APIs rely on `PricingService` recalculations, entirely discarding client-supplied monetary values.
- Razorpay integrations pull the exact `totalAmount` from the immutable Order snapshot.

## 3. PDP Audit
- **Product price**: Displayed correctly via `<ProductForm />`.
- **Delivery messaging**: **MISSING**. No prompt to "Enter PIN code to check delivery".
- **Serviceability**: **MISSING**. No visual indicator if the address is serviceable.
- **Delivery estimate**: **MISSING**. No estimated delivery date (e.g., 3-5 business days).
- **Shipping price**: **MISSING**.
- **Missing Abstraction**: `ShippingService` currently requires an `addressId` and a `userId` to generate shipping rates. It lacks an abstraction like `checkServiceabilityByPostalCode(postalCode: string, weightInGrams: number, subtotal: number)` which would allow anonymous checking on the PDP.

## 4. Cart Audit
- **Subtotal**: Handled securely and accurately in `CartDrawer.tsx` and `cart-client.tsx`.
- **Discount**: Item-level discounts are reflected. Global coupons happen at checkout.
- **Estimated delivery**: **MISSING**.
- **Estimated shipping**: Currently hardcoded as `"Calculated at checkout"`.
- **Conclusion**: The Cart accurately reflects product totals, but delegates shipping visibility strictly to checkout.

## 5. Checkout Audit
The `checkout-client.tsx` accurately displays:
- Items and item-level pricing
- Global Coupon discount (only visible if > ₹0)
- Subtotal
- Shipping (Displays "Free" if ₹0, else exact rate)
- Taxes (Only visible if > ₹0, currently hardcoded to ₹0 internally)
- Total Payable
- **MISSING**: `estimatedDeliveryAt` is not displayed because the `PricingService` response omits it. Zero-value rows like taxes are correctly hidden.

## 6. Address Change Audit
Address updates securely trigger an async `updatePricing` call.
- **Loading state**: Checkout button spins, `pricingProcessing` locks inputs.
- **Error state**: Unserviceable addresses correctly render a red alert banner (`pricingError`).
- **Race-condition protection**: Handled via `requestVersionRef` implemented in P2-C.
- **Stale state prevention**: Handled via `setPricingInfo(null)` implemented in P2-C.
- **Address ownership security**: Enforced securely by `addressId` + `userId` verification in backend APIs.

## 7. Coupon + Shipping Audit
The backend `PricingService` securely calculates:
1. `Cart subtotal`
2. Applies `Coupon` to `eligibleSubtotal`
3. Results in `discountedSubtotal`
4. Passes `discountedSubtotal` to `ShippingService`
- This correctly means if a 10% coupon drops a ₹2,100 cart to ₹1,890, and the free-shipping threshold is ₹2,000, the user will be charged shipping. Verified in `pricing.service.ts:148-156`.

## 8. Delivery Estimate Audit
- The `ShippingProviderAdapter` interface currently calculates and returns `estimatedDeliveryAt: Date | null` via `ShippingRateQuote`.
- **BROKEN CHAIN**: `ShippingService.getRatesForCheckout` discards this field and only returns `{ shippingAmount, isServiceable }`.
- `PricingService` is consequently unaware of delivery estimates, preventing the UI from accessing them.

## 9. Order Confirmation Audit
The `order-confirmation/[orderId]/page.tsx` securely fetches the historical Order snapshot.
It accurately breaks down:
- Subtotal
- Coupon/Discount amount
- Shipping amount
- Tax amount (if applicable)
- Total Paid
This exactly matches the required design and uses historical snapshot data rather than live calculation.

## 10. Financial Consistency Audit
The chain is fully intact:
`Frontend displayed total` == `PricingService calculation` == `Order.totalAmount` == `Razorpay amount` == `Customer paid amount`. No deviations are possible.

## 11. Mobile UX Audit
- **PDP**: Standard responsive design; missing delivery checking UX.
- **Cart**: Sticky order summary sidebar drops below cart items on mobile; quantities adjust elegantly.
- **Checkout**: Stacked column design on mobile works nicely.
- No massive redesign needed, only insertion of new UX components.

## 12. Accessibility Audit
- Screen readers are notified via `aria-live` regions in checkout.
- `aria-labels` are present on icon buttons.
- Future PDP delivery inputs must follow standard WCAG guidelines (labels, focus states, aria-live for results).

## 13. Performance Audit
- PDP pricing runs statically / dynamically without heavy lifting.
- Checkout dynamically calls the pricing API only when the address or coupon changes.
- **Recommendation**: When building PDP PIN check, debouncing the input (or requiring a "Check" button click) is vital to prevent spamming Shiprocket's live-rates API.

## 14. Security Audit
- Client cannot override `shippingAmount` or `totalAmount`.
- Address IDs are securely validated against session `userId`.
- Coupon logic is backend-authoritative.
- Razorpay strictly trusts `Order.totalAmount`.
- No security flaws identified.

## 15. Existing Reusable Infrastructure
- `PricingService.calculateCheckoutPricing`
- `ShippingProviderAdapter` (Mock and Shiprocket implementations)
- `useCart` / `useCheckout` context hooks
- Checkout UI summary components

## 16. Missing Capabilities
- **Backend**: `ShippingService.getRatesByPostalCode()` for anonymous PDP checking.
- **Backend**: Propagating `estimatedDeliveryAt` up through `ShippingService` -> `PricingService` -> Checkout API.
- **Frontend**: PDP Serviceability Checking UI.
- **Frontend**: Checkout Delivery Estimate display.

## 17. Risks / Bugs
- Calling Shiprocket APIs heavily on the PDP could trigger rate limits. A robust caching strategy or explicit "Check" button requirement is necessary.

## 18. Exact Files Requiring Modification
1. **`src/server/services/shipping.service.ts`**
   - Current: Returns only `shippingAmount` and `isServiceable`.
   - Required: Expose `estimatedDeliveryAt` from provider quotes. Add `getRatesByPostalCode` function.
   - Reason: Enable delivery dates and anonymous PDP checking.
2. **`src/server/services/pricing.service.ts`**
   - Current: Computes pricing but ignores delivery dates.
   - Required: Pass through `estimatedDeliveryAt` returned by `ShippingService`.
   - Reason: Make delivery dates available to the frontend API.
3. **`src/types/checkout.ts`**
   - Current: Doesn't contain `estimatedDeliveryAt` on the Pricing/CouponResponse.
   - Required: Add `estimatedDeliveryAt?: string | Date` to `CouponValidationResponse`.
4. **`src/app/(storefront)/checkout/checkout-client.tsx`**
   - Current: Displays shipping price.
   - Required: Display `estimatedDeliveryAt` if available under shipping cost.
   - Reason: Customer transparency.
5. **`src/app/(storefront)/products/[slug]/page.tsx`** (or a child component)
   - Current: Displays product details and add-to-cart form.
   - Required: Add a client-side `<DeliveryChecker />` component.
   - Reason: PDP customer transparency.
6. **`src/app/api/products/delivery/route.ts`** (New File)
   - Required: Create an endpoint that accepts a `postalCode` and `weightInGrams`, calling `ShippingService.getRatesByPostalCode`.
   - Reason: Serves the PDP delivery checker without requiring an address/cart.

## 19. Exact Files That Must NOT Be Modified
- `src/server/services/cart.service.ts` (Mathematics are sound).
- `src/server/services/razorpay.service.ts` (Security is sound).
- `prisma/schema.prisma` (Order financial schema is complete).
- `src/server/services/order.service.ts` (Pricing security snapshot is sound).

## 20. Proposed P2-D Implementation Scope
1. Update backend interfaces to pass `estimatedDeliveryAt` upwards.
2. Display `estimatedDeliveryAt` in the Checkout UI.
3. Add `getRatesByPostalCode` to `ShippingService` and expose via a new public API endpoint `/api/products/delivery`.
4. Build a React `<DeliveryChecker />` component and mount it on the PDP.

## 21. Proposed Implementation Sequence
1. Modify `shipping.service.ts` and `pricing.service.ts` (Backend).
2. Update checkout UI to consume the new `estimatedDeliveryAt` field (Frontend).
3. Create the new Delivery API route (Backend).
4. Implement and mount the PDP Delivery Checker (Frontend).

## 22. Definition of Done
- Delivery estimates are visible in Checkout (if provided by the active provider).
- Customers can enter a PIN code on the PDP to verify serviceability, shipping cost, and delivery date without logging in or adding items to the cart.
- Security constraints remain strictly intact.

## 23. Final Recommendation
**READY FOR IMPLEMENTATION**

---

### Final Classification Table

| Capability                   | Status   | Existing Location                 | Reusable | Missing Work                         |
| ---------------------------- | -------- | --------------------------------- | -------- | ------------------------------------ |
| Product pricing              | EXISTS   | `ProductForm.tsx`                 | YES      | None                                 |
| Cart subtotal                | EXISTS   | `CartDrawer.tsx`                  | YES      | None                                 |
| Coupon pricing               | EXISTS   | `pricing.service.ts`              | YES      | None                                 |
| Shipping calculation         | EXISTS   | `shipping.service.ts`             | YES      | None                                 |
| Serviceability               | EXISTS   | `shipping.service.ts`             | YES      | Abstract for postal-code-only        |
| Delivery estimate            | PARTIAL  | `shipping-provider.interface.ts`  | YES      | Propagate upwards to UI              |
| Checkout pricing             | EXISTS   | `checkout-client.tsx`             | YES      | Show delivery date                   |
| Address recalculation        | EXISTS   | `checkout-client.tsx`             | YES      | None                                 |
| PDP delivery                 | MISSING  | N/A                               | NO       | Build DeliveryChecker UI & API       |
| Cart shipping transparency   | EXISTS   | `cart-client.tsx`                 | YES      | Keep as "Calculated at checkout"     |
| Checkout breakdown           | EXISTS   | `checkout-client.tsx`             | YES      | None                                 |
| Order confirmation breakdown | EXISTS   | `order-confirmation/[id]/page.tsx`| YES      | None                                 |
| Financial consistency        | EXISTS   | `order.service.ts`                | YES      | None                                 |
| Mobile UX                    | EXISTS   | Globally                          | YES      | None                                 |
| Accessibility                | EXISTS   | Globally                          | YES      | Add ARIA to new components           |
