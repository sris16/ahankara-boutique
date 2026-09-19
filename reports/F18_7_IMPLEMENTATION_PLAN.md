# F18.7 — ADMIN ORDERS IMPLEMENTATION PLAN

## Overview
Based on the Stage A Audit, F18.7 requires refactoring the Orders Server Components to remove internal HTTP proxy requests, eliminating Next.js serialization crashes and matching the F18 standard architecture.

## Modifications

### [MODIFY] `src/app/(admin)/admin/orders/page.tsx`
- **Replace imports:** Remove `adminApi` and import `OrderService`, `AuthService`, and `UserRole`.
- **Security Check:** Call `await AuthService.requireRole(reqHeaders, UserRole.ADMIN)`.
- **Data Loading:** Replace `adminApi.getOrders(page, 20)` with `await OrderService.getAllOrders(page, 20)`.
- **Serialization:** Serialize the result using `JSON.parse(JSON.stringify(...))` before passing it to `OrderListTable`.

### [MODIFY] `src/app/(admin)/admin/orders/[orderId]/page.tsx`
- **Replace imports:** Remove `adminApi` and import `OrderService`, `AuthService`, `UserRole`, and `prisma` (for shipments).
- **Security Check:** Call `await AuthService.requireRole(reqHeaders, UserRole.ADMIN)`.
- **Data Loading:**
  - Replace `adminApi.getOrderById(orderId)` with `await OrderService.getAdminOrderById(orderId)`.
  - Replace `adminApi.getOrderShipments(orderId)` with the direct Prisma call:
    ```typescript
    prisma.shipment.findMany({
      where: { orderId },
      include: {
        items: { include: { orderItem: true } },
        trackingEvents: { orderBy: { eventTime: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
    ```
- **Serialization:** Serialize both the order and the shipments using `JSON.parse(JSON.stringify(...))` before passing them to the Client Components.

## Verification
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- Ensure pages render and existing mutations (like Shipment creation) continue to function.
