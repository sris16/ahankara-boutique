# F18.11 — ADMIN COUPONS IMPLEMENTATION PLAN

## Overview
F18.11 (Coupons) requires fixing the Server Component architecture for the Admin Coupons module. The underlying UI, database schema, and API endpoints are fully implemented and verified. The objective is to replace internal HTTP fetch calls with direct Prisma database queries, protected by explicit Server Component authorization boundaries.

## Proposed Changes

### 1. Coupons List Page Modification
**File:** `src/app/(admin)/admin/coupons/page.tsx` [MODIFY]
**Current State:** Uses `adminApi.getCoupons({ Cookie: cookieHeader })`.
**Proposed Change:**
- Add explicit server-side role verification: `await AuthService.requireRole(requestHeaders, UserRole.ADMIN);`
- Replace `adminApi` call with a direct Prisma query matching the API's behavior:
  ```typescript
  const rawCoupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { redemptions: true }
      }
    }
  });
  ```
- Serialize data for the Client Component: `const coupons = JSON.parse(JSON.stringify(rawCoupons));`

### 2. Coupon Details Page Modification
**File:** `src/app/(admin)/admin/coupons/[couponId]/page.tsx` [MODIFY]
**Current State:** Uses `adminApi.getCouponById(...)`.
**Proposed Change:**
- Add explicit server-side role verification: `await AuthService.requireRole(requestHeaders, UserRole.ADMIN);`
- Replace `adminApi` call with a direct Prisma query:
  ```typescript
  const rawCoupon = await prisma.coupon.findUnique({
    where: { id: resolvedParams.couponId },
    include: {
      products: true,
      categories: true,
      collections: true,
      redemptions: {
        take: 10,
        orderBy: { redeemedAt: 'desc' }
      }
    }
  });
  ```
- Serialize data safely: `const coupon = JSON.parse(JSON.stringify(rawCoupon));`

## Security Requirements
The `UserRole.ADMIN` boundary will be enforced precisely inside the Server Components using `AuthService.requireRole()`, removing reliance on cookie passing.

## Regression Protection
- The underlying API routes (`src/app/api/admin/coupons/*`) will **not** be modified. Client-side mutations inside `CouponForm` will continue functioning without issues.
- The UI structure and styling will remain exactly the same.
- Pre-existing verified models in F18.1-F18.10 are completely protected from these targeted updates.

## Verification
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
