# F18.13 — ADMIN CANCELLATIONS & REFUNDS IMPLEMENTATION PLAN

## Overview
F18.13 addresses the final missing post-checkout capabilities in the Admin Order Details view: Cancellations and Refunds. The objective of Stage B is to build the Admin UI components for viewing and executing cancellations and processing refunds, supported by secure Admin API endpoints, without modifying the existing, verified backend business logic.

## Proposed Changes

### 1. Data Fetching & Serialization Extension
**File:** `src/app/(admin)/admin/orders/[orderId]/page.tsx` [MODIFY]
**Action:** Extend the existing direct Prisma query inside the Server Component.
- **Query Update:** Include `cancellation` and `refunds` in the `prisma.order.findUnique` (or add them to the `Promise.all` fetching block depending on the exact page architecture).
- **Serialization:** Implement `const cancellation = JSON.parse(JSON.stringify(rawCancellation))` and `const refunds = JSON.parse(JSON.stringify(rawRefunds))`.
- **UI Extension:** Pass the serialized data down to `<CancellationManager cancellation={cancellation} orderId={orderId} />` and `<RefundManager refunds={refunds} orderId={orderId} />`.

### 2. Admin APIs
**File:** `src/app/api/admin/orders/[orderId]/cancel/route.ts` [NEW]
**Action:** Create POST route.
- **Auth:** `await AuthService.requireRole(requestHeaders, UserRole.ADMIN)`.
- **Service:** Call `CancellationService.cancelOrder(orderId, session.user.id, UserRole.ADMIN, { reason, note })`.

**File:** `src/app/api/admin/refunds/[refundId]/process/route.ts` [NEW]
**Action:** Create POST route.
- **Auth:** `await AuthService.requireRole(requestHeaders, UserRole.ADMIN)`.
- **Service:** Call `RefundService.processRefund(refundId)`.

### 3. Client Components
**File:** `src/components/admin/orders/CancellationManager.tsx` [NEW]
**Action:**
- If an order is not cancelled, provide a button to "Cancel Order" with an optional reason field.
- If an order is cancelled, display the cancellation details (initiator, reason, date).
- Connect button to `/api/admin/orders/[orderId]/cancel`.

**File:** `src/components/admin/orders/RefundManager.tsx` [NEW]
**Action:**
- List all refunds associated with the order.
- Display refund amount, status (`PENDING`, `SUCCEEDED`, `FAILED`), and reason.
- For `PENDING` refunds, display a "Process Refund" button connected to `/api/admin/refunds/[refundId]/process`.

## Security Requirements
- All Server Components and API routes must explicitly enforce `AuthService.requireRole(..., UserRole.ADMIN)`.
- `CancellationService` and `RefundService` are considered immutable and fully trusted to handle inventory, liability bounds, and state transition conflicts securely.

## Verification Plan
1. **Compilation:** `npx tsc --noEmit`
2. **Linting:** `npm run lint` (ensure no new errors).
3. **Build:** `npm run build`
4. **Security Testing:** Ensure non-admin users cannot access the new API endpoints.
