# F18.13 — ADMIN CANCELLATIONS & REFUNDS AUDIT

## 1. Identified Module
**Module Name**: Admin Cancellations & Refunds
**Intended Admin Capability**: Allow administrators to view and execute Order Cancellations and manually process Refunds directly from the Admin Order Details page.
**Justification**: Previous F18 phases implemented Orders (F18.7), Fulfillment (F18.8), Returns (F18.9), Exchanges (F18.10), Coupons (F18.11), and Customers (F18.12). The Phase 8 testing report ("Cancellations, Returns, Exchanges & Refunds") confirms that Cancellations and Refunds are core lifecycle features. While the backend services and schema for these exist, they currently lack any Admin UI or Admin APIs.

## 2. Existing Implementation Status
- **Backend Services**: ✅ COMPLETE. `CancellationService.cancelOrder()` and `RefundService.processRefund()` exist and correctly handle complex inventory/liability boundaries.
- **Prisma Schema**: ✅ COMPLETE. `OrderCancellation` and `Refund` models exist and relate correctly to `Order`.
- **Admin Server Components**: ⚪ NOT IMPLEMENTED. `cancellation` and `refunds` are not fetched in `AdminOrderDetailPage`.
- **Admin UI Components**: ⚪ NOT IMPLEMENTED. `CancellationManager` and `RefundManager` do not exist.
- **Admin API Routes**: ⚪ NOT IMPLEMENTED. Endpoints to trigger these actions from the Admin panel are missing.

## 3. Functionality Gap Matrix

| Capability | UI | API | Service | DB | Auth | Status | Required Action |
| ---------- | -- | --- | ------- | -- | ---- | ------ | --------------- |
| View Cancellation | ⚪ NOT IMPLEMENTED | N/A | ✅ COMPLETE | ✅ COMPLETE | ✅ COMPLETE | PARTIAL | Create UI, fetch in RSC |
| Execute Cancel | ⚪ NOT IMPLEMENTED | ⚪ NOT IMPLEMENTED | ✅ COMPLETE | ✅ COMPLETE | ✅ COMPLETE | PARTIAL | Create UI & Admin API |
| View Refunds | ⚪ NOT IMPLEMENTED | N/A | ✅ COMPLETE | ✅ COMPLETE | ✅ COMPLETE | PARTIAL | Create UI, fetch in RSC |
| Process Refund | ⚪ NOT IMPLEMENTED | ⚪ NOT IMPLEMENTED | ✅ COMPLETE | ✅ COMPLETE | ✅ COMPLETE | PARTIAL | Create UI & Admin API |

## 4. Route Inventory
- **Existing Order Route**: `src/app/(admin)/admin/orders/[orderId]/page.tsx` (Extend this page rather than creating a new route).
- **Missing APIs**:
  - `POST /api/admin/orders/[orderId]/cancel`
  - `POST /api/admin/refunds/[refundId]/process`

## 5. Component Inventory
- **Missing Components**:
  - `CancellationManager.tsx`
  - `RefundManager.tsx`
- **Reusability**: Use existing styling patterns from `ReturnManager.tsx` and `ExchangeManager.tsx`.

## 6. Authentication & Authorization Audit
All new API routes must explicitly enforce:
```ts
await AuthService.requireRole(requestHeaders, UserRole.ADMIN);
```
No IDOR risk for Admins as they have global access, but the APIs must validate that the `orderId` or `refundId` exists. Customer-facing cancellation APIs exist but are correctly isolated.

## 7. Server / Client Boundary Audit
Data fetched in the Server Component must be serialized before passing to the new Client Components:
```ts
const cancellation = JSON.parse(JSON.stringify(rawCancellation));
const refunds = JSON.parse(JSON.stringify(rawRefunds));
```
This is critical as both models contain `Date` objects (`createdAt`, `processedAt`, `requestedAt`).

## 8. Exact File Impact Assessment
**Files Proposed for Modification:**
1. `src/app/(admin)/admin/orders/[orderId]/page.tsx`
   - *Reason*: Must be modified to fetch `cancellation` and `refunds` via Prisma, serialize them, and pass them to the new components.

**Files Proposed for Creation:**
1. `src/components/admin/orders/CancellationManager.tsx`
   - *Reason*: UI to display cancellation status and provide a button to cancel an order.
2. `src/components/admin/orders/RefundManager.tsx`
   - *Reason*: UI to display pending/succeeded refunds and provide a button to manually process pending refunds.
3. `src/app/api/admin/orders/[orderId]/cancel/route.ts`
   - *Reason*: Admin endpoint to invoke `CancellationService.cancelOrder()`.
4. `src/app/api/admin/refunds/[refundId]/process/route.ts`
   - *Reason*: Admin endpoint to invoke `RefundService.processRefund()`.

## 9. Protected Files
- `src/server/services/cancellation.service.ts`
- `src/server/services/refund.service.ts`
- `prisma/schema.prisma`
- All F18.1–F18.12 modules and APIs.
- **Database changes required: NO**
- **Backend service changes required: NO**

## 10. Risks
- **RSC Serialization**: Failure to stringify `Date` objects will crash the Order Details page.
- **State Transition Errors**: Attempting to cancel an already fulfilled order or process an already processed refund. (Mitigated by robust backend services which will throw appropriate errors).

**F18.13 Stage A is COMPLETE.**
