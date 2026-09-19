# F18.6 — ADMIN INVENTORY OPERATIONS IMPLEMENTATION PLAN

## Overview
Based on the Stage A Audit, F18.6 requires refactoring the Variant Inventory Page to remove internal HTTP requests, eliminating the Next.js header serialization crash.

## Modifications

### [MODIFY] `src/app/(admin)/admin/inventory/[productId]/variants/[variantId]/page.tsx`
- **Replace imports:** Remove `adminApi` and import `ProductService`, `ProductVariantService`, `AuthService`, and `UserRole`.
- **Security Check:** Await `AuthService.requireRole(reqHeaders, UserRole.ADMIN)`.
- **Data Loading:** Replace `adminApi.getVariantById` and `adminApi.getProductById` with:
  - `ProductVariantService.getVariantById(productId, variantId)`
  - `ProductService.getProductById(productId)`
- **Serialization:** Serialize the resulting `variant` and `product` objects using `JSON.parse(JSON.stringify(...))` to strip any raw Prisma Date/Decimal values before passing them to the Client Components (`InventoryAdjustmentForm`, `InventoryThresholdForm`, `TransactionHistoryTable`).

## Verification
- Run `npx tsc --noEmit`
- Run `npm run lint`
- Run `npm run build`
- Validate that the page renders without SSR faults and that transactions load seamlessly.
