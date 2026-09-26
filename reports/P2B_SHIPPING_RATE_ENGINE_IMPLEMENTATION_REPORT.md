# AHANKARA STUDIOS — P2-B SHIPPING RATE ENGINE IMPLEMENTATION REPORT

## 1. Implementation Summary
The P2-B Shipping Rate Engine has been successfully implemented. The backend pricing engine (`PricingService.calculateCheckoutPricing`) now natively handles dynamic shipping costs by consulting the central `ShippingConfiguration` and `ShippingProviderAdapter`.
The frontend checkout calculates the live rate dynamically through a new debounce-capable API endpoint whenever the customer modifies their address or applies a coupon.

## 2. Files Changed
- `prisma/schema.prisma`: Added `ShippingConfiguration` model.
- `prisma/migrations/20260926053131_add_shipping_configuration/`: Created migration.
- `src/server/services/shipping/providers/shipping-provider.interface.ts`: Added `GetShippingRatesRequest` and `getRates`.
- `src/server/services/shipping/providers/mock-shipping.provider.ts`: Implemented mock rate calculation and PIN-based unserviceable logic.
- `src/server/services/shipping/providers/shiprocket.provider.ts`: Implemented live `/v1/external/courier/serviceability/` rate pulling.
- `src/server/services/shipping.service.ts`: Added `getRatesForCheckout` orchestrator.
- `src/server/services/pricing.service.ts`: Updated `calculateCheckoutPricing` to invoke shipping logic and properly include shipping amount in the final total.
- `src/server/services/order.service.ts`: Passed `shippingAddressId` down during actual checkout order creation.
- `src/app/api/me/checkout/pricing/route.ts`: Created new preview API.
- `src/lib/api/checkout.ts`: Added `getCheckoutPricing` API client method.
- `src/hooks/use-checkout.ts`: Exported `updatePricing`.
- `src/app/(storefront)/checkout/checkout-client.tsx`: Updated to poll the preview API when `selectedShippingId` changes.

## 3. Provider Behavior
- **Mock**: Deterministically returns `isServiceable: false` if postal code ends in `000`. Otherwise, returns a fixed 5000 paise (₹50) cost.
- **Shiprocket**: Consults the actual Shiprocket serviceability endpoint, identifying the cheapest standard courier rate and mapping ETD.

## 4. Pricing Flow
1. **Frontend Selection**: Customer selects `Address A`.
2. **Preview Request**: `CheckoutClient` uses `useEffect` to trigger `GET /api/me/checkout/pricing?addressId=A`.
3. **Backend Logic**: `PricingService` securely verifies the user's address, computes the cart's total physical weight, computes the subtotal, subtracts any coupon, and then delegates to `ShippingService.getRatesForCheckout`.
4. **Configuration Application**: `ShippingService` evaluates `ShippingConfiguration` (Flat Rate vs Live Rates vs Free Shipping Threshold).
5. **Provider Quote**: Provider generates the quote.
6. **Final Preview**: Pricing engine computes `discountedSubtotal + shippingAmount + taxAmount` and returns it.

## 5. Final Order Recalculation Behavior
When the customer clicks "Place Order", `checkoutApi.createOrder` sends the final payload.
The `OrderService` **re-invokes** `PricingService.calculateCheckoutPricing` completely server-side, regenerating the exact shipping cost and totals, ensuring the final Razorpay token and DB snapshotted fields are 100% immune to client manipulation.

## 6. Security/IDOR Verification
- Address ID is strictly verified via `prisma.address.findFirst({ where: { id: addressId, userId } })`. A customer cannot spoof an address.
- Shipping cost is not accepted in any `POST` body.
- Razorpay auth relies entirely on the server-generated `Order.totalAmount`.

## 7. Known Limitations
- The `ShippingConfiguration` is missing an Admin UI to toggle the settings (this falls under standard admin scope, not P2-B checkout scope). It currently defaults via Prisma schema.
- Shiprocket Live Rates require `SHIPROCKET_PICKUP_LOCATION` to be configured in `.env`.

## 8. Verification Results
- Database Migration generated successfully.
- TypeScript compilation successful.
- Build successful.
- Git tracked exactly the expected files. No unintentional modifications.
