# F18.10 — ADMIN EXCHANGES IMPLEMENTATION PLAN

## Overview
F18.10 (Exchanges) requires implementing the Admin Exchanges interface. The backend `ExchangeService` is fully functional, but the Admin UI and APIs are missing. This plan strictly follows the smallest correct implementation principle without modifying existing verified services.

## Proposed Changes

### 1. New API Routes
**File:** `src/app/api/admin/exchanges/[exchangeId]/approve/route.ts` [NEW]
**File:** `src/app/api/admin/exchanges/[exchangeId]/complete/route.ts` [NEW]
**Security:** Both routes will enforce `await AuthService.requireRole(req.headers, UserRole.ADMIN)`.
**Action:** These will call `ExchangeService.approveExchange(exchangeId)` and `ExchangeService.completeExchange(exchangeId)` respectively, returning JSON responses.

### 2. New Client Component
**File:** `src/components/admin/orders/ExchangeManager.tsx` [NEW]
**Action:** Create a standard UI component to display exchange requests associated with an order. Include actionable buttons to "Approve" (for `REQUESTED` exchanges) and "Complete" (for `APPROVED` exchanges). Display the original item and the requested replacement variant.

### 3. Order Detail Page Modification
**File:** `src/app/(admin)/admin/orders/[orderId]/page.tsx` [MODIFY]
**Current State:** Fetches `Order`, `Shipment`, and `ReturnRequest` data.
**Proposed Change:**
- Add a direct Prisma query for Exchanges:
  ```typescript
  const rawExchangeRequests = await prisma.exchangeRequest.findMany({
    where: { orderId },
    include: {
      items: {
        include: {
          orderItem: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  ```
- Serialize it safely: `const exchangeRequests = JSON.parse(JSON.stringify(rawExchangeRequests));`
- Render the new `<ExchangeManager exchangeRequests={exchangeRequests} />` in the layout.
**Serialization:** Maintains the established F18 architecture pattern of `JSON.parse(JSON.stringify())` to safely cross the Server Component boundary.
**Regression Protection:** The existing Order, Shipment, and Return queries and components will remain completely untouched.

## Security
The `UserRole.ADMIN` boundary will be enforced precisely at the API boundary.

## Verification
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
