# AHANKARA STUDIOS — TRANSPARENT PRICING & DELIVERY CHARGES ARCHITECTURE AUDIT (P2-A)

## 1. PROJECT ARCHITECTURE
- **Next.js**: The repository uses App Router with React Server Components and client-side hooks.
- **Backend/Service**: Core business logic is contained in `src/server/services/`. Pricing authority specifically lives in `PricingService` and `CartService`.
- **API**: Next.js API Routes expose checkout and cart operations (`src/app/api/...`).
- **Prisma**: Database models include full monetary breakdown fields.
- **Payment**: Managed through Razorpay (`RazorpayService`).
- **Shipping**: Provider pattern with `ShippingProviderAdapter`.

Pricing and checkout responsibilities are strongly centralized in the backend (`PricingService.calculateCheckoutPricing` and `CartService._evaluateCart`).

## 2. PRISMA FINANCIAL MODELS
- **Order**: Contains monetary fields (`subtotal`, `shippingAmount`, `discountAmount`, `taxAmount`, `totalAmount`). All fields are stored in `Int` representing **paise** (1 INR = 100 paise).
- **OrderItem**: Contains `unitPrice`, `compareAtPrice`, `lineTotal`, `discountAmount` (all `Int` in paise).
- **Product & ProductVariant**: Contains `basePrice`, `compareAtPrice`, and variant-level `price`.
- **Coupon**: Contains `value` (in paise or percentage based on `CouponType`), `minimumOrderAmount`, `maximumDiscountAmount`.
- **Payment / Refund**: Contains `amount` in `Int` (paise).

There are no dedicated models for Tax configuration, Convenience Fees, or Shipping Rates. All monetary amounts are securely locked into the snapshot fields upon Order creation.

## 3. ORDER FINANCIAL SNAPSHOT
**EXISTS**.
The `Order` model currently preserves exact snapshots: `subtotal`, `discountAmount`, `shippingAmount`, `taxAmount`, and `totalAmount`.
Historical orders can be accurately reconstructed without recalculating today's prices because the final determined values at checkout are frozen on the `Order` record.

## 4. PRODUCT PRICING
Product pricing logic resides in the database via `basePrice` on `Product` and `price` overrides on `ProductVariant`.
The authoritative calculation for cart pricing dynamically uses `v.price !== null ? v.price : p.basePrice` inside `CartService` and `PricingService`.

## 5. CART PRICING
`CartService._evaluateCart()` loops through cart items, fetches authoritative variant/product prices from Prisma, and calculates `subtotal` and `lineTotal`.
- Prices from the client are **not** trusted.
- Inventory is strictly validated before item insertion/update.
- Cart subtotal purely aggregates `unitPrice * quantity`.
- No shipping or coupon logic is applied in the cart evaluation currently.

## 6. COUPON SYSTEM
**EXISTS.**
`PricingService.calculateCheckoutPricing()` handles all coupon logic:
- Validates minimum order amounts, maximum discount caps.
- Restricts usage by user or globally.
- Applies to specific products, categories, or collections.
- Validates active dates.
Calculates percentage vs. fixed and prevents discounts from exceeding the eligible subtotal.

## 7. CHECKOUT ARCHITECTURE
Flow: Customer visits `/checkout` → Client-side UI calls `checkoutApi.createOrder()` → Server invokes `PricingService.calculateCheckoutPricing()` for the final authoritative total → `prisma.order.create` stamps snapshot values → `PaymentHandler` requests a Razorpay attempt via `checkoutApi.createPaymentAttempt()` → Server delegates to `RazorpayService` to create the provider order using `order.totalAmount`.

## 8. ADDRESS ARCHITECTURE
**EXISTS.**
`Address` model manages user addresses. The client passes `shippingAddressId` and `billingAddressId` during checkout creation. Address PIN codes exist (`postalCode`), but no specific shipping distance/rate calculation executes against the selected address currently.

## 9. SHIPPING PROVIDER ABSTRACTION
`ShippingProviderAdapter` interface currently dictates:
- `createShipment`
- `cancelShipment`
- `assignAWB`
- `getTracking`
**MISSING**: There is currently no `getServiceability`, `getShippingRates`, or `getDeliveryEstimate` abstracted.

## 10. SHIPROCKET INTEGRATION
- **EXISTS**: Authentication, shipment creation, weight mapping (placeholder), AWB, tracking webhook handling.
- **MISSING**: Serviceability checking, live rate calculation, estimated delivery projection to frontend.

## 11. MOCK SHIPPING PROVIDER
- **EXISTS**: Shipment creation, dummy tracking.
- **MISSING**: Serviceability checking, dummy shipping cost, rate calculation. It currently hardcodes `estimatedDeliveryAt` as 3 days from creation, but not as an exposed upfront estimate.

## 12. SHIPPING API ROUTES
Existing:
- `POST /api/webhooks/shipping-updates`
- `GET /api/me/orders/[orderId]/tracking`
**MISSING**: No routes exist for calculating rates mid-checkout (e.g., `POST /api/checkout/rates`).

## 13. PAYMENT / RAZORPAY
**SECURE.**
- Razorpay orders are created exclusively in `RazorpayService.createOrder()` using the `totalAmount` retrieved directly from the backend Prisma `Order` model.
- The frontend absolutely cannot influence the payment amount.
- Webhooks and signature verifications guarantee the final paid amount matches the expected amount.
- **Security Check**: A malicious client cannot manipulate prices, totals, or Razorpay amounts.

## 14. CUSTOMER CHECKOUT UI
`src/app/(storefront)/checkout/checkout-client.tsx` presents address selection, cart summary, and coupon entry.
It renders a summary breakdown: Subtotal, Discount, Shipping, Taxes, Total.
Currently, Shipping displays as "Free" because the backend hardcodes `0`.

## 15. CART UI
`CartDrawer.tsx` / `cart-client.tsx` displays the cart subtotal. It does not currently estimate shipping or taxes.

## 16. PRODUCT DETAIL PAGE
`ProductForm` handles quantity and cart insertion. Pricing displays MRP and selling price. No dynamic delivery/PIN-code checking UI currently exists on the PDP.

## 17. ADMIN ORDER UI
Order snapshot fields (`subtotal`, `shippingAmount`, etc.) are natively available to the Admin UI due to the Prisma schema, requiring only front-end table formatting.

## 18. ADMIN SHIPPING CONFIGURATION
**MISSING.**
No configuration tables, settings, or models exist for admin-defined shipping zones, flat rates, or free-shipping thresholds.

## 19. TAX ARCHITECTURE
**MISSING.**
While `taxAmount` exists on the Order snapshot, there are zero tax-rate models (e.g., GST) or calculations. Taxes are hardcoded to `0`.

## 20. CONVENIENCE / PAYMENT FEES
**MISSING.**
"No customer-facing convenience/payment fee currently exists."

## 21. REFUNDS
Refund models exist (`Refund` in paise). Returns and exchanges are modeled. Refunds handle `amount`, but no complex partial-refund calculator differentiating shipping vs. product exists actively in standard pricing services.

## 22. CANCELLATIONS
`OrderCancellation` models exist, but recalculations of partial shipping deductions upon cancellation are not implemented.

## 23. HISTORICAL PRICE INTEGRITY
**SECURE.**
Historical orders remain financially immutable because amounts are hard-stamped on `Order` and `OrderItem`. Changes to product prices or shipping rules will not alter past orders.

## 24. MONEY / ROUNDING / PRECISION
- **Currency**: INR
- **Representation**: Integers (Paise). `100` = ₹1.00.
- **Rounding**: `Math.round()` is safely utilized in `PricingService` for percentage coupons. No dangerous floating-point math dictates the database.

## 25. SECURITY AUDIT
- All client-to-server boundaries are secured.
- Product price, shipping charge, discount, and totals are computed strictly server-side.
- Payment amounts are authoritative.
- **PASS**.

## 26. DUPLICATION / ARCHITECTURAL RISKS
Building a new checkout rate engine could accidentally diverge from `PricingService.calculateCheckoutPricing()`.
**Recommendation**: Evolve `PricingService.calculateCheckoutPricing` to accept the selected `shippingAddressId` and securely return the authoritative shipping cost alongside the existing subtotal/coupon. Do not build a second pricing engine.

## 27. GAP MATRIX
| Capability | Status | Existing Location | Reusable? | Missing Work |
|------------|--------|-------------------|-----------|--------------|
| Product Pricing | EXISTS | `Product.basePrice`, `Variant.price` | YES | NONE |
| Cart Subtotal | EXISTS | `CartService._evaluateCart` | YES | NONE |
| Coupon Engine | EXISTS | `PricingService.calculateCheckoutPricing` | YES | NONE |
| Razorpay Auth | EXISTS | `RazorpayService.createOrder` | YES | NONE |
| Order Snapshot | EXISTS | `Order` schema fields | YES | NONE |
| Address Model | EXISTS | `Address` schema | YES | NONE |
| Shipping Cost | MISSING | Hardcoded to `0` | NO | Rate calculation logic |
| Serviceability | MISSING | N/A | NO | Abstract provider method & API |
| Tax Engine | MISSING | Hardcoded to `0` | NO | Tax configuration (if required) |
| Delivery Estimate | MISSING | N/A | NO | Abstract provider method & UI |
| Admin Shipping Config | MISSING | N/A | NO | Config schema & Admin UI |

## 28. REQUIRED FUTURE ARCHITECTURE
1. **Shipping Configuration**: A mechanism (DB model or env) to define flat-rates vs. Shiprocket live rates, and free shipping thresholds.
2. **Provider Expansion**: Add `getShippingRates(address, items)` to `ShippingProviderAdapter`.
3. **Pricing Engine Upgrade**: Update `PricingService.calculateCheckoutPricing(userId, couponCode, addressId)` to execute the provider's rate calculation securely.
4. **Checkout Route Upgrade**: Expose a safe `GET /api/checkout/pricing` route that re-evaluates totals whenever address or coupon changes on the frontend.

## 29. PROPOSED PHASE BREAKDOWN
- **P2-A** — Architecture Audit (Complete)
- **P2-B** — Admin Shipping Configuration & Shipping Rate Engine (Backend/Providers)
- **P2-C** — Checkout Pricing Integration (API & Frontend Re-evaluation)
- **P2-D** — Cart/PDP Transparency (Delivery Estimates on product pages)
- **P2-E** — E2E + Production Validation

## 30. FILE IMPACT ANALYSIS
- **A. Modify**: `src/server/services/pricing.service.ts`, `src/app/(storefront)/checkout/checkout-client.tsx`, `ShippingProviderAdapter`
- **B. Reuse**: `CartService`, `RazorpayService`, `OrderService`, `Coupon` models
- **C. DO NOT MODIFY**: `Razorpay` signature verification logic, existing `subtotal` calculation logic
- **D. Prisma Impact**: Minor (Adding Shipping Config models)
- **E. API Impact**: New endpoint needed to poll live pricing during checkout.

## 31. SECURITY REQUIREMENTS
- Backend-authoritative pricing, shipping, coupon, final total, and Razorpay amount.
- No client-provided monetary values trusted.
- Order financial snapshot at creation.
- Historical order totals immutable.
- Address changes trigger recalculation.
- No Razorpay merchant fee automatically exposed as a customer fee.

## 32. FINAL CAPABILITY CLASSIFICATION
1. **Complete**: Product pricing, Cart subtotals, Coupon rules, Razorpay integration, Order snapshots, Security boundaries.
2. **Missing**: Dynamic Shipping Rates, Delivery Estimates, Serviceability PIN-code validation, Admin Shipping Settings.
3. **Do Not Rebuild**: Do not rebuild cart aggregation, payment tokenization, or coupon discount math.
4. **Next Phase**: P2-B should focus strictly on expanding the `ShippingProviderAdapter` to support rate queries and creating backend shipping settings.
