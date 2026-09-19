# F18.11 — ADMIN COUPONS AUDIT

### 1. Executive Summary
The Stage A Audit of F18.11 confirms that this phase corresponds to **Admin Coupons**. The underlying functionality is already substantially implemented and verified: the Prisma schema models `Coupon` and `CouponRedemption` exist, the API routes handle mutations safely with Zod validation, and the Client Components (`CouponForm`, `CouponTable`) function properly. The only defect is an architectural one: the Server Components are performing internal HTTP proxy fetches (using `adminApi.getCoupons()` and `adminApi.getCouponById()`) with Next.js `headers()`, which results in serialization bugs (`Cannot convert object to primitive value`) and fails to follow the direct backend access pattern established in F18.1–F18.10.

### 2. Exact F18.11 Scope
- **Module Name:** Coupons
- **Required Functionality:** Admin capability to view, create, edit, and manage discount coupons and their usage/redemptions.
- **Current Status:** UI Forms/Tables (COMPLETE), DB/Prisma (COMPLETE), Admin APIs (COMPLETE), Server Component Architecture (BROKEN).

### 3. Repository Structure
- `src/app/(admin)/admin/coupons/page.tsx` (BROKEN ARCHITECTURE)
- `src/app/(admin)/admin/coupons/[couponId]/page.tsx` (BROKEN ARCHITECTURE)
- `src/app/(admin)/admin/coupons/new/page.tsx` (COMPLETE)
- `src/app/api/admin/coupons/route.ts` (COMPLETE)
- `src/app/api/admin/coupons/[couponId]/route.ts` (COMPLETE)
- `src/components/admin/coupons/CouponForm.tsx` (COMPLETE)
- `src/components/admin/coupons/CouponTable.tsx` (COMPLETE)

### 4. Route Inventory
- `/admin/coupons` -> Server Component (BROKEN)
- `/admin/coupons/[couponId]` -> Server Component (BROKEN)
- `/admin/coupons/new` -> Server Component (STATIC/COMPLETE)

### 5. Component Inventory
All required Client Components are fully implemented.

### 6. API Endpoint Inventory
All required Admin API routes (`GET`, `POST`, `PATCH`, `DELETE`) are fully implemented and function properly.

### 7. Backend Service Map
There is no dedicated `CouponService`; coupon mutation logic resides directly within the Admin API endpoints. This is acceptable since it acts as the primary mutation handler. No new backend services need to be fabricated.

### 8. Validator Map
- `createCouponSchema` and `updateCouponSchema` in `src/server/validators/coupon.validator.ts` are COMPLETE.

### 9. Prisma/Data Model Map
- `Coupon`, `CouponProduct`, `CouponCategory`, `CouponCollection`, `CouponRedemption` are COMPLETE.

### 10. Authentication Audit
Admin routes rely on `AuthService.requireRole`. Server components are currently passing `cookieHeader` to HTTP requests, bypassing direct server-side validation. This is flawed.

### 11. Authorization Audit
Direct server-side invocation of `AuthService.requireRole(requestHeaders, UserRole.ADMIN)` must be used in the Server Components instead of relying on the API proxy.

### 12. IDOR/Security Audit
Since the proxy call relies on Client-side HTTP handling embedded inside a Server Component, replacing it with direct Prisma queries securely guarded by `AuthService` will mitigate potential bypass risks.

### 13. Functionality Audit
All actual domain functionality is present. Only the Server-to-Server fetching architecture is flawed.

### 14. Server/Client Boundary Audit
**BROKEN**. The Server Components are attempting to pass the Request headers object into a Client-fetch utility (`adminApi`), which causes Next.js runtime errors (`Cannot convert object to primitive value`).

### 15. Serialization Audit
**MISSING**. Direct Prisma access will retrieve raw `Date` objects which must be serialized using `JSON.parse(JSON.stringify())` before passing to Client Components.

### 16. Existing vs Missing Functionality
- **Admin UI Components:** ✅ COMPLETE
- **Admin API:** ✅ COMPLETE
- **Database Schema:** ✅ COMPLETE
- **Server Component Data Fetching:** 🔴 BROKEN (Internal proxy)

### 17. Gap Matrix
| Capability | UI | API | Service | DB | Auth | Status | Required Action |
| ---------- | -- | --- | ------- | -- | ---- | ------ | --------------- |
| List Coupons | ✅ | ✅ | N/A | ✅ | 🔴 | **BROKEN** | Replace proxy with direct DB |
| View Coupon Details | ✅ | ✅ | N/A | ✅ | 🔴 | **BROKEN** | Replace proxy with direct DB |
| Create Coupon | ✅ | ✅ | N/A | ✅ | ✅ | **COMPLETE** | None |
| Update Coupon | ✅ | ✅ | N/A | ✅ | ✅ | **COMPLETE** | None |

### 18. Exact Root Causes
The F18.11 Server Components (`page.tsx`, `[couponId]/page.tsx`) were not updated to the new architecture established during F18.1–F18.10. They incorrectly use `adminApi` instead of fetching from the database directly.

### 19. Exact Files Proposed for Modification
- `src/app/(admin)/admin/coupons/page.tsx`
- `src/app/(admin)/admin/coupons/[couponId]/page.tsx`

### 20. Files Explicitly Protected
- `src/app/api/admin/coupons/route.ts`
- `src/app/api/admin/coupons/[couponId]/route.ts`
- All other F18.1-F18.10 modules.
- `prisma/schema.prisma`

### 21. Backend Dependency Assessment
Prisma handles all coupon relationships seamlessly.

### 22. Database Dependency Assessment
No changes needed.

### 23. Security Risk Assessment
Removing the internal API fetch reduces attack surfaces by firmly establishing a Server Component boundary.

### 24. Data Integrity Risk Assessment
No database changes are needed.

### 25. Stage B Implementation Plan
See `F18_11_IMPLEMENTATION_PLAN.md`.

### 26. Testing Plan
Execute `npm run build` after implementation.

### 27. Security Testing Plan
Verify `AuthService` guards the Server Component routes.

### 28. Regression Testing Plan
Ensure the coupon listing, detail view, and redemption lists continue to render correctly without crashing.

### 29. Risks
None if implemented minimally according to the established F18 pattern.

### 30. Stage A Conclusion
**F18.11 Stage A is COMPLETE.** The module requires only architectural fixes to the Server Components. No backend or database changes are needed.
