# F18.9 — ADMIN RETURNS IMPLEMENTATION PLAN

## Overview
F18.9 (Returns) requires implementing the Admin Returns interface. The backend `ReturnService` is fully functional, but the Admin UI and APIs are missing. This plan strictly follows the smallest correct implementation principle without modifying existing verified services.

## Proposed Changes

### 1. New API Routes
**File:** `src/app/api/admin/returns/[returnId]/approve/route.ts` [NEW]
**File:** `src/app/api/admin/returns/[returnId]/inspect/route.ts` [NEW]
**Security:** Both routes will enforce `await AuthService.requireRole(req.headers, UserRole.ADMIN)`.
**Action:** These will call `ReturnService.approveReturn` and `ReturnService.inspectAndAcceptReturn` respectively, returning JSON responses.

### 2. New Client Component
**File:** `src/components/admin/orders/ReturnManager.tsx` [NEW]
**Action:** Create a standard UI component to display return requests associated with an order. Include actionable buttons to "Approve" (for `REQUESTED` returns) and "Inspect & Accept" (for approved returns, allowing quantity input).

### 3. Order Detail Page Modification
**File:** `src/app/(admin)/admin/orders/[orderId]/page.tsx` [MODIFY]
**Current State:** Fetches `Order` and `Shipment` data but does not fetch `ReturnRequest` data.
**Problem:** Admin cannot view Returns.
**Proposed Change:**
- Add a direct Prisma query:
  ```typescript
  const rawReturns = await prisma.returnRequest.findMany({
    where: { orderId },
    include: { items: { include: { orderItem: true } } },
    orderBy: { createdAt: 'desc' }
  });
  ```
- Serialize it safely: `const returnRequests = JSON.parse(JSON.stringify(rawReturns));`
- Render the new `<ReturnManager returnRequests={returnRequests} order={order} />` below the `ShipmentManager`.
**Serialization:** Maintains the established F18.7 pattern of `JSON.parse(JSON.stringify())` to safely cross the Server Component boundary.
**Regression Protection:** The existing Order and Shipment queries and components will remain completely untouched. `OrderService` remains untouched.

## Security
The `UserRole.ADMIN` boundary will be enforced precisely at the API boundary, guaranteeing that customers cannot access these endpoints.

## Verification
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
