# AHANKARA STUDIOS — P2-B SHIPPING RATE ENGINE IMPLEMENTATION PLAN

## 1. Current Architecture
The current AHANKARA STUDIOS architecture heavily relies on `PricingService.calculateCheckoutPricing` and `CartService._evaluateCart` for backend-authoritative calculation. However, `PricingService` currently hardcodes `shippingAmount` to 0. `ShippingProviderAdapter` only abstracts shipment creation and tracking, missing rate/serviceability calculations.

## 2. Existing Reusable Components
- `PricingService`: Contains cart aggregation and coupon logic.
- `Order` schema: Preserves `shippingAmount`, `subtotal`, `totalAmount` securely.
- `ShiprocketShippingProvider` / `MockShippingProvider`: Existing provider infrastructure.
- `CheckoutClient`: Currently handles API interactions for checkout natively.

## 3. Confirmed Gaps
- `ShippingProviderAdapter` lacks `getRates()` and `getServiceability()`.
- No dynamic shipping amount injection in `PricingService`.
- No Admin `ShippingConfiguration` model exists to determine if shipping is Flat Rate vs. Live Rates.
- No `GET /api/me/checkout/pricing` endpoint to allow the frontend to recalculate shipping when the address changes before final order creation.

## 4. Provider Interface Analysis
Instead of three separate methods, we only need one cohesive method to provide a unified quote:

```typescript
export interface GetShippingRatesRequest {
  destinationPostalCode: string;
  totalWeightInGrams: number;
  orderSubtotal: number; // For free-shipping thresholds or COD checks
}

export interface ShippingRateQuote {
  provider: ShippingProvider;
  isServiceable: boolean;
  cost: number | null; // in paise
  estimatedDeliveryAt: Date | null;
}
```
**Decision**: We will add `getRates(request: GetShippingRatesRequest): Promise<ShippingRateQuote>` to `ShippingProviderAdapter`.

## 5. Shipping Calculation Architecture
We will enhance `PricingService.calculateCheckoutPricing`:
`static async calculateCheckoutPricing(userId: string, couponCode?: string | null, shippingAddressId?: string | null)`

**Flow**:
1. Calculate Cart Subtotal and Total Weight.
2. Apply Coupon (Yields `discountedSubtotal`).
3. If `shippingAddressId` is provided:
   - Validate Address belongs to user.
   - Load Admin `ShippingConfiguration`.
   - If `freeShippingThreshold` is met by `discountedSubtotal`, `shippingAmount = 0`.
   - Else if Mode is `FLAT_RATE`, `shippingAmount = config.flatRateAmount`.
   - Else if Mode is `LIVE_RATES`, call `provider.getRates()` for the configured provider, extract cost, and set `shippingAmount`.
4. Return comprehensive `CouponValidationResponse` (which we will rename/alias to `PricingResponse`).

## 6. Mock Provider Design
`MockShippingProvider.getRates` will be deterministic:
- If `destinationPostalCode` ends in `"000"`, return `isServiceable: false`.
- Otherwise, return `isServiceable: true, cost: 5000` (₹50), with delivery 3 days from now.

## 7. Shiprocket Provider Design
`ShiprocketShippingProvider.getRates` will integrate with Shiprocket's `/v1/external/courier/serviceability/` API.
It will require `pickup_postcode` (from env), `delivery_postcode`, and `weight`. It will parse the recommended courier's `rate` and `etd` (estimated time of delivery) to populate the `ShippingRateQuote`. Live implementation is entirely feasible.

## 8. Admin Configuration Architecture
We require a centralized toggle for the boutique owner to dictate shipping rules.
We will create a singleton Prisma model.

## 9. Prisma Model Proposal
```prisma
model ShippingConfiguration {
  id                    String           @id @default("default")
  mode                  String           // "FLAT_RATE" | "LIVE_RATES"
  flatRateAmount        Int              // in paise
  freeShippingThreshold Int?             // in paise
  defaultProvider       ShippingProvider @default(SHIPROCKET)
  updatedAt             DateTime         @updatedAt

  @@map("shipping_configuration")
}
```
*Why?* It allows admin flexibility without redeploying. Only Admins can mutate it. Order historical integrity is maintained because actual checked-out amounts are snapshotted on the `Order` model.

## 10. PricingService Integration Plan
Described in section 5. The Pricing engine remains the single source of truth. No duplicate pricing math is introduced.

## 11. Checkout API Plan
We will create a new endpoint: `GET /api/me/checkout/pricing?addressId=...&couponCode=...`
This allows the `CheckoutClient` to debounce-poll the server whenever the user toggles their delivery address, instantly surfacing the accurate shipping fee before the final "Place Order" click.

## 12. Address/Serviceability Flow
Customer Selects Address → Frontend calls API → API hits `PricingService` → Service fetches Rates → If `!isServiceable`, API returns a validation error preventing checkout.

## 13. Coupon/Shipping Interaction
**Rule**: Free-shipping thresholds evaluate against the `discountedSubtotal` (AFTER the coupon is applied). This protects the boutique from giving away free shipping when a coupon drastically reduces the order value.

## 14. Order Snapshot Requirements
No changes to `Order`. `shippingAmount` will naturally absorb the dynamically computed shipping cost.

## 15. Security Model
- **No Quote Tokens**: A complex quote token system is unnecessary. The `shippingAmount` is recomputed securely in memory at the exact moment of order creation inside `OrderService.createCheckoutOrder`.
- **Address Validation**: `shippingAddressId` is strictly verified against `user.id`.
- **Authoritative Totals**: Razorpay amount is derived purely from the backend. The client cannot forge `shippingAmount = 0`.

## 16. Error Handling
- Unserviceable PIN codes throw `ValidationError('Your location is not serviceable')`.
- Provider API failures log internally and fallback to `FLAT_RATE` safely or reject gracefully.

## 17. Test Strategy
- **Serviceable/Unserviceable**: Provide `"110000"` to mock provider, ensure checkout rejects. Provide valid PIN, ensure checkout accepts.
- **Coupon Interaction**: Test cart = ₹2100, Threshold = ₹2000. Apply 10% coupon (Subtotal = ₹1890). Ensure shipping fee is successfully applied.
- **Security Check**: Attempt to forge `shippingAmount` in the POST body to `/api/me/checkout`; ensure backend overrides it.

## 18. Exact Files Expected to Change
- `src/server/services/pricing.service.ts`
- `src/server/services/shipping/providers/shipping-provider.interface.ts`
- `src/server/services/shipping/providers/mock-shipping.provider.ts`
- `src/server/services/shipping/providers/shiprocket.provider.ts`
- `src/app/(storefront)/checkout/checkout-client.tsx`
- `src/server/services/order.service.ts` (Pass address ID to pricing)

## 19. Exact Files that MUST NOT Change
- `src/server/services/razorpay.service.ts` (Payment tokenization remains pure)
- `src/server/services/cart.service.ts` (Cart math remains pure)

## 20. Migration Requirements
A Prisma migration is required to create `shipping_configuration`. A seed script must populate the `id: "default"` record to prevent application crashes on first boot.

## 21. Implementation Sequence
1. Prisma schema update & Migration.
2. Enhance `ShippingProviderAdapter` & Providers.
3. Update `PricingService` with shipping logic.
4. Add `GET /api/me/checkout/pricing`.
5. Wire `CheckoutClient` to dynamic endpoint.

## 22. Risks and Rollback Considerations
Shiprocket API downtime during checkout. Mitigation: Wrap live rate queries in a 3-second timeout and fallback to `FLAT_RATE` if unresponsive, avoiding checkout blockages.

## 23. Definition of Done
When a customer selects an address, the exact shipping cost appears. Checkout safely prevents unserviceable PIN codes. The final Razorpay total perfectly aligns with the sum of products, minus discounts, plus precise shipping.
