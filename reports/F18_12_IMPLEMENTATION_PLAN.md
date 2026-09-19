# F18.12 — ADMIN CUSTOMERS IMPLEMENTATION PLAN

## Overview
F18.12 (Admin Customers) is entirely missing from the Admin panel. The objective of Stage B is to build the Customer Listing and Customer Detail views, along with the ability to manage customer status, strictly adhering to the F18 Server Component architecture.

## Proposed Changes

### 1. Navigation Modification
**File:** `src/components/admin/layout/AdminSidebar.tsx` [MODIFY]
**Proposed Change:** Add an active link for "Customers" pointing to `/admin/customers` in the sidebar navigation array, leveraging an appropriate Lucide icon (e.g., `Users`).

### 2. Customer Listing Page
**File:** `src/app/(admin)/admin/customers/page.tsx` [NEW]
**Action:** Create a Server Component.
- **Authorization:** Enforce `await AuthService.requireRole(requestHeaders, UserRole.ADMIN);`.
- **Data Fetching:** Direct Prisma query (`prisma.user.findMany({ where: { role: 'CUSTOMER' }, orderBy: { createdAt: 'desc' }})`).
- **Serialization:** Safe boundary `JSON.parse(JSON.stringify(rawUsers))`.
- **UI:** Pass to a new Client Component `<CustomerList />`.

### 3. Customer Detail Page
**File:** `src/app/(admin)/admin/customers/[customerId]/page.tsx` [NEW]
**Action:** Create a Server Component.
- **Authorization:** Enforce `await AuthService.requireRole(requestHeaders, UserRole.ADMIN);`.
- **Data Fetching:** Direct Prisma query (`prisma.user.findUnique`) including related `addresses`, `orders`, and standard user fields.
- **Serialization:** Safe boundary `JSON.parse(JSON.stringify(rawUser))`.
- **UI:** Pass to a new Client Component `<CustomerProfile />`.

### 4. Admin Customer Components
**File:** `src/components/admin/customers/CustomerList.tsx` [NEW]
**File:** `src/components/admin/customers/CustomerProfile.tsx` [NEW]
**Action:** Create standard AHANKARA STUDIOS Admin UI components to display lists (tables) and profile views (cards) for the serialized customer data. Implement a status mutation toggle in the profile.

### 5. Customer Status Mutation API
**File:** `src/app/api/admin/customers/[customerId]/status/route.ts` [NEW]
**Action:** Create a `PATCH` route to handle status changes (e.g., ACTIVE vs suspended).
- **Authorization:** Strictly enforce `await AuthService.requireRole(requestHeaders, UserRole.ADMIN);`.
- **Logic:** `prisma.user.update({ where: { id: customerId }, data: { status: newStatus } })`.

## Security Requirements
All new Server Components and API routes must independently invoke `AuthService.requireRole(..., UserRole.ADMIN)`.

## Regression Protection
- The existing `UserService` and `prisma/schema.prisma` will remain untouched.
- All prior F18.1–F18.11 functionality will remain untouched.

## Verification
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
