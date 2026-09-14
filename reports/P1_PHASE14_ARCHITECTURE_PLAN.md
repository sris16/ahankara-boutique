# AHANKARA STUDIOS — PHASE 14 ARCHITECTURE & IMPLEMENTATION PLAN
**Module:** Admin Coupons + Pricing
**Status:** READY FOR REVIEW
**Date:** September 13, 2026

## 1. Architecture Summary
Phase 14 will implement the Administrative React UI for the Ahankara Studios Coupon and Pricing system. The backend models, validation rules, and checkout pricing algorithms are mature, robust, and completely functional. The frontend will consume the existing REST APIs to provide a seamless, secure, and intuitive Coupon Management experience for administrators, utilizing Next.js App Router conventions, Server Components, and the established Ahankara Studios design system.

## 2. Existing Backend Contract
The backend natively supports:
- **Coupon CRUD:** Create, Read, Update, Delete (or Deactivate).
- **Core Fields:** `code`, `name`, `description`, `type`, `value`, `minimumOrderAmount`, `maximumDiscountAmount`, `usageLimit`, `usageLimitPerUser`, `isActive`, `startsAt`, `endsAt`.
- **Restrictions:** Relationships to Products, Categories, and Collections.
- **Validation:** Customer cart pricing is authoritatively computed by `PricingService.calculateCheckoutPricing`.

## 3. Admin Routes
The following routes will be created:
1. `/admin/coupons` - Server Component. Fetches all coupons. Contains the `CouponTable` and empty states.
2. `/admin/coupons/new` - Server Component. Renders the Create `CouponForm`.
3. `/admin/coupons/[couponId]` - Server Component. Fetches coupon details and redemptions. Renders the Edit `CouponForm` and `CouponUsageSummary`.

*Note: The backend only supports returning all coupons (`findMany`). Server-side pagination, search, and filtering are not natively supported by the existing API, so the UI will handle these client-side.*

## 4. API Client Design
The `src/lib/api/admin.ts` client will be extended with:
- `getCoupons(headers?: HeadersInit): Promise<Coupon[]>` (GET `/api/admin/coupons`)
- `getCoupon(id: string, headers?: HeadersInit): Promise<Coupon>` (GET `/api/admin/coupons/[id]`)
- `createCoupon(data: CreateCouponInput): Promise<Coupon>` (POST `/api/admin/coupons`)
- `updateCoupon(id: string, data: UpdateCouponInput): Promise<Coupon>` (PATCH `/api/admin/coupons/[id]`)
- `deleteCoupon(id: string): Promise<{message: string}>` (DELETE `/api/admin/coupons/[id]`)

## 5. Type Design
Frontend-safe serialized types will be added to `src/types/admin.ts`:
```typescript
export type CouponType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface AdminCoupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: CouponType;
  value: number;
  minimumOrderAmount: number;
  maximumDiscountAmount: number | null;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { redemptions: number };
}

// + Extended AdminCouponDetail interface for editing (including relations)
// + CreateCouponInput and UpdateCouponInput types mimicking the zod schemas
```

## 6. Component Architecture
- **`CouponTable`** (Client): Renders the list of coupons. Handles client-side search/filtering.
- **`CouponStatusBadge`** (Client): Visual indicator for active/inactive/expired states.
- **`CouponForm`** (Client): Reusable form for create/edit. Utilizes `react-hook-form` and `zodResolver`.
- **`DiscountTypeSelector`** (Client): Specialized input for choosing Fixed vs Percentage and validating values.
- **`CouponRestrictionEditor`** (Client): Multi-select inputs to map Products, Categories, and Collections.
- **`CouponUsageSummary`** (Client): Displays redemption counts and limits.

## 7. Server / Client Boundaries
- **Server Components:** `page.tsx` routes will fetch data securely using `await headers()` and explicit cookie forwarding (e.g., `{ Cookie: cookieHeader }`). Hardcoded `auth_session` reads are strictly prohibited.
- **Client Components:** Forms and tables requiring interactivity, toast notifications, or state management will be marked `"use client"`.

## 8. Coupon Form Design
The `CouponForm` will map directly to `createCouponSchema` / `updateCouponSchema`:
- **Code:** Text input, uppercase, regex validation.
- **Name/Description:** Text/Textarea.
- **Type/Value:** Select (Fixed/Percentage) + Number input (caps at 100 if Percentage).
- **Minimum/Maximum Amounts:** Number inputs (paise conversion handled on submit).
- **Usage Limits:** Optional Number inputs.
- **Dates:** `startsAt` and `endsAt` datetime pickers.
- **Restrictions:** Multi-select components populating `productIds`, `categoryIds`, and `collectionIds`.

## 9. Pricing Display Strategy
- **Admin UI:** All currency values will be divided by 100 for display (paise to INR). 
- **Checkout/Cart:** F14 does not require immediate storefront checkout UI changes unless authorized later. The backend remains strictly authoritative for `subtotal`, `discountAmount`, and `totalAmount`. The frontend will **never** perform its own discount subtractions prior to order submission.

## 10. Mutation Strategy
- Mutations will be handled via the admin API client within `onSubmit` handlers.
- **No Optimistic Updates:** Due to the critical nature of pricing, all mutations will await backend confirmation.
- **Revalidation:** `router.refresh()` will be called upon success to re-fetch Server Components.
- **Feedback:** Toast notifications will display truthful backend errors (e.g., "Coupon code already exists").

## 11. Security Architecture
- **ADMIN Authorization:** Explicitly required for all new routes.
- **Idempotency/Authority:** All pricing/validation is backend-enforced.
- **Cookie Security:** No `localStorage` JWTs. Only secure HTTP-only cookies forwarded correctly in Server Components.

## 12. Database Impact
- **Schema Changes:** NONE.
- **Migrations:** NONE.
- **Seed Changes:** NONE.

## 13. F13 Freeze Protection
F14 strictly manages Coupons. It will **NOT** modify:
- Admin Orders, ShipmentManager, ShipmentCard, AWB, Shiprocket, tracking, fulfillment, inventory reservation, order cancellation, or returns/exchanges/refunds.
- F13 remains permanently frozen.

## 14. Responsive / Accessibility Plan
- **Responsive:** Tables will use horizontal scrolling on mobile. Forms will stack inputs into single columns on small screens.
- **Accessibility:** All form fields will have explicit `<label>` associations. Focus states will use the established design system rings. Radix UI (or similar existing primitives) will ensure dialog and dropdown ARIA compliance.

## 15. Error Handling
- **Validation Errors:** Handled by `zod` and displayed inline beneath inputs.
- **Conflict Errors (409):** Displayed via toast (e.g., duplicate code).
- **Network/Server Errors:** Generic fallback toasts preventing internal stack trace exposure.

## 16. Testing Strategy
- **List & Pagination:** Verify client-side sorting and empty states.
- **Mutations:** Verify Create and Edit flows, including restriction mapping.
- **Validation:** Verify percentage > 100 rejection, end date before start date rejection.
- **Deactivation:** Verify that deleting a coupon with redemptions correctly soft-deactivates it instead.
- **Security:** Verify CUSTOMER roles are blocked from F14 routes.
- **Branding Audit:** 0 occurrences of "AHANKARA BOUTIQUE".

## 17. Implementation Sequence
1. Define Types in `src/types/admin.ts`.
2. Extend `src/lib/api/admin.ts` with Coupon methods.
3. Build shared components (`CouponStatusBadge`, `DiscountTypeSelector`).
4. Implement `/admin/coupons` list page.
5. Implement `CouponForm` logic and UI.
6. Implement `/admin/coupons/new` and `/admin/coupons/[couponId]` routes.
7. Refine Responsive & Accessibility behaviors.
8. Perform Static Validation and local runtime checks.

## 18. Risks / Unknowns
- **Client-Side Filtering:** Since the backend `findMany` returns all coupons, client-side filtering might become slow if the coupon count exceeds thousands. This is acceptable for Phase 14 but should be noted for future optimization.

## 19. Final Architecture Recommendation
The architecture strictly respects the existing backend contracts, requires zero database modifications, protects the F13 freeze, and aligns with the Ahankara Studios design system.

ARCHITECTURE STATUS:
READY FOR REVIEW
