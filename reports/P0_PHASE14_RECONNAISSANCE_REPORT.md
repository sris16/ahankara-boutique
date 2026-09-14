# AHANKARA STUDIOS — PHASE 14 RECONNAISSANCE REPORT
**Module:** Admin Coupons + Pricing
**Status:** READ-ONLY RECONNAISSANCE COMPLETE
**Date:** September 13, 2026

## 1. Executive Summary
Phase 14 focuses on exposing the existing backend coupon and pricing capabilities to the Admin frontend. The backend Coupon models, validators, and checkout pricing algorithms are mature, robust, and completely functional. The customer validation and checkout enforcement logic is strictly authoritative. The primary F14 task will be constructing the React frontend UI to manage these capabilities.

## 2. Coupon Data Model
The Prisma `Coupon` model includes:
- **Core:** `code`, `name`, `description`, `type` (`PERCENTAGE` | `FIXED_AMOUNT`), `value` (paise/percentage).
- **Limits:** `minimumOrderAmount`, `maximumDiscountAmount`, `usageLimit`, `usageLimitPerUser`, `usedCount`.
- **Status/Time:** `isActive`, `startsAt`, `endsAt`.
- **Restrictions (Relations):** `CouponProduct`, `CouponCategory`, `CouponCollection`.
- **Usage (Relations):** `CouponRedemption`.

## 3. Coupon Business Rules
- **Type/Discount:** Can be a fixed amount or a percentage (max 100%).
- **Activation/Expiry:** Controlled by `isActive`, `startsAt`, and `endsAt`.
- **Usage Limits:** Global limits (`usageLimit`) and per-customer limits (`usageLimitPerUser`) are enforced.
- **Cart Eligibility:** Calculates `eligibleSubtotal` by checking if items fall into explicitly allowed products, categories, or collections (or global if none are specified). 
- **Validation:** Enforces `minimumOrderAmount` against only the *eligible* subtotal. Caps percentage discounts using `maximumDiscountAmount`.

## 4. Coupon Services
- **`PricingService`:** The source of truth for all cart evaluation and discount computation. Calculates `subtotal`, `eligibleSubtotal`, `discountAmount`, and `totalAmount`.
- **`OrderService`:** Calls `PricingService.calculateCheckoutPricing` during checkout to deterministically compute and snapshot all order pricing fields.
- **`PaymentService`:** Idempotently increments `Coupon.usedCount` and creates a `CouponRedemption` record within the payment confirmation transaction lock.

## 5. Existing Admin APIs
The backend already provides full REST capability at `src/app/api/admin/coupons`:

| METHOD | PATH | BEHAVIOR |
|--------|------|----------|
| GET | `/api/admin/coupons` | Lists all coupons with `_count.redemptions`. |
| POST | `/api/admin/coupons` | Creates a coupon and associated product/category/collection restrictions. |
| GET | `/api/admin/coupons/[id]` | Retrieves full coupon details + top 10 redemptions. |
| PATCH | `/api/admin/coupons/[id]` | Updates coupon details and fully overrides restriction mappings via transactional delete/create. |
| DELETE | `/api/admin/coupons/[id]` | Deletes the coupon. If redemptions exist, it gracefully soft-deactivates (`isActive: false`) instead. |

## 6. Customer Coupon Validation Flow
1. **Endpoint:** `POST /api/me/cart/coupon/validate`
2. **Payload:** `{ "code": "STRING" }`
3. **Logic:** Calls `PricingService.calculateCheckoutPricing` returning an authoritative payload containing the exact discount and final totals.
4. **Mutations:** None. Read-only and idempotent.

## 7. Pricing Calculation Flow
- The frontend computes estimates for cart rendering, but checkout relies **entirely** on the backend.
- During `POST /api/me/checkout`, the frontend only sends `{ shippingAddressId, billingAddressId, couponCode }`.
- The backend fetches the cart, executes `PricingService.calculateCheckoutPricing(userId, couponCode)`, and uses the backend-computed `totalAmount` for the order.

## 8. Order / Payment Interaction
- **Checkout:** Snapshots the `couponCode`, `couponType`, `couponValue`, and `discountAmount` directly on the `Order` record.
- **Payment:** `PaymentService.verifyRazorpayPayment` creates a `CouponRedemption` record and increments `usedCount` atomically. 
- **Cancellations/Refunds:** Currently, coupon usage remains consumed after cancellation. Reverting usage requires manual admin intervention or future policy changes.

## 9. Security Analysis
- **Pricing Authority:** The frontend cannot pass subtotal, discount, or total values. The backend enforces all calculations.
- **Coupon Manipulation:** Customers cannot bypass eligibility rules, expiry dates, or usage limits. The backend strictly evaluates these.
- **Admin Security:** All coupon APIs require `UserRole.ADMIN`.
- **Concurrency:** `PaymentService` issues a `SELECT ... FOR UPDATE` lock during redemption to prevent race conditions on `usageLimit`.

## 10. Frontend Recon
- **Admin UI:** Currently, there is no `/admin/coupons` directory or frontend logic. F14 requires a completely new Admin section.
- **Storefront Checkout UI:** The customer-facing checkout will require a coupon input field that consumes `POST /api/me/cart/coupon/validate`.

## 11. API Gaps & Minimal Backend Extensions
**API GAPS: NONE**
The backend `PricingService` and Admin controllers are perfectly mature and fully feature-complete for F14.
- Restriction selections on the frontend can be populated using the existing `GET /api/admin/products`, `/categories`, and `/collections` endpoints.

## 12. Database / Migration Impact
- **Prisma Schema:** No changes required.
- **Migrations:** None required.
- **Data Safety:** Existing F13 data remains untouched.

## 13. F13 Freeze Protection
- F13 Admin Orders, Shipments, Tracking, and Inventory logic was rigorously inspected and remains completely segregated and isolated from this recon. F13 is securely frozen.

## 14. Branding Audit
- "AHANKARA BOUTIQUE" string occurrences: **0**
- The application is correctly and exclusively branded as "AHANKARA STUDIOS".

## 15. Recommended F14 Architecture Direction
Since the backend is fully mature, F14 is strictly a **Frontend Implementation Phase**. 
We need to implement:
1. `src/app/(admin)/admin/coupons/page.tsx` (Data Table)
2. `src/app/(admin)/admin/coupons/new/page.tsx` (Form)
3. `src/app/(admin)/admin/coupons/[couponId]/page.tsx` (Edit Form + Redemption Stats)
4. A standard Form component utilizing `zod` for frontend validation matching `createCouponSchema`.
5. Reusable Multi-Select inputs for mapping Products, Categories, and Collections.
6. A `CouponInput` in the Storefront Cart/Checkout to apply and render `PricingService` results.

**RECON STATUS:** PASS
No blockers exist. The backend is perfectly equipped. Proceed to architectural planning for the React UI.
