# F18.7 — ADMIN ORDERS AUDIT

### 1. Executive Summary
The Stage A Audit of the Admin Orders module reveals that core functionalities (Order listing, details, fulfillment/shipping) are successfully implemented across the UI, APIs, and Backend Services. The only defect is identical to F18.1–F18.6: Server Components are using the `adminApi` to perform internal HTTP fetches. Search, status filtering, manual order status transitions, and admin return/refund processing are not currently supported by the backend contracts and are therefore not in scope.

### 2. Repository Structure
- `src/app/(admin)/admin/orders/*`: Server components rendering orders
- `src/components/admin/orders/*`: Client components managing UI interactions
- `src/app/api/admin/orders/*`: Backend HTTP endpoints
- `src/server/services/order.service.ts`: Business logic & Prisma interactions

### 3. Route Inventory
- `/admin/orders`: Uses `adminApi.getOrders`
- `/admin/orders/[orderId]`: Uses `adminApi.getOrderById` and `adminApi.getOrderShipments`

### 4. Component Inventory
- `OrderListTable.tsx`: Displays paginated orders.
- `OrderCustomerDetails.tsx`: Displays customer, shipping, and billing data.
- `OrderItemsList.tsx`: Lists SKUs, variants, prices, and fulfillment status.
- `OrderSummaryCards.tsx`: Top-level order overview.
- `ShipmentManager.tsx`: Manages shipments within an order.

### 5. API Endpoint Inventory
- `GET /api/admin/orders`: Fetches paginated orders.
- `GET /api/admin/orders/[orderId]`: Fetches single order details.
- `POST /api/admin/orders/[orderId]/shipments`: Creates a shipment.
- `GET /api/admin/orders/[orderId]/shipments`: Fetches shipments.

### 6. Backend Service Map
- `OrderService.getAllOrders(page, limit)`
- `OrderService.getAdminOrderById(orderId)`
- `ShippingService.createShipment(...)`

### 7. Validator Map
- Validators present for Shipment Creation (`createShipmentSchema`).

### 8. Prisma/Data Model Map
- Models `Order`, `OrderItem`, `Shipment`, `ShipmentItem`, `Address`, `User`. All associations and relational paths are intact.

### 9. Authentication Audit
Admin APIs require a valid logged-in session.

### 10. Authorization Audit
All relevant Admin Order APIs explicitly enforce `AuthService.requireRole(req.headers, UserRole.ADMIN)`.

### 11. IDOR Audit
Since the admin interface requires an `ADMIN` role that inherently has full visibility of all orders, unauthorized cross-tenant/user access by an admin is non-applicable. Customer endpoints strictly filter by `userId`.

### 12. Order Listing Audit
**COMPLETE**. Fetches paginated orders and sorts them by recency.

### 13. Order Detail Audit
**COMPLETE**. Full introspection into customer, item, financial, and fulfillment info is available.

### 14. Status Management Audit
**NOT IN SCOPE**. Manual transitions are not supported.

### 15. Payment Audit
**COMPLETE**. Visualized via `OrderSummaryCards`.

### 16. Shipping/Fulfillment Audit
**COMPLETE**. Native `ShipmentManager` supports AWBs, item assignment, and event tracking.

### 17. Cancellation Audit
**NOT IN SCOPE**. Admin cancel-order logic is not provided by the backend contract. Shipment cancellations are supported natively.

### 18. Return/Refund Audit
**NOT IN SCOPE**. Handled by separate domains (F18.9, F18.11).

### 19. Server/Client Boundary Audit
**BROKEN**. Both `page.tsx` and `[orderId]/page.tsx` use `adminApi` internal HTTP proxy fetching, passing cookie headers unnecessarily and violating Next.js serialization rules.

### 20. Serialization Audit
Currently, raw dates and decimals cross boundaries inside the HTTP fetch JSON parsing. After removing the proxy, `JSON.parse(JSON.stringify())` must be utilized.

### 21. Runtime/Error Audit
Currently prone to NEXT.js serialization faults if edge functions intercept headers incorrectly.

### 22. Gap Matrix
| Capability | Existing UI | API | Service | DB Support | Auth | Status | Required Action |
|------------|-------------|-----|---------|------------|------|--------|----------------|
| Order Listing | ✅ | ✅ | ✅ | ✅ | ✅ | **PARTIAL** | Refactor Server Component |
| Order Detail | ✅ | ✅ | ✅ | ✅ | ✅ | **PARTIAL** | Refactor Server Component |
| Search/Filters | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | **NOT IN SCOPE** | Do Nothing |
| Shipping/Fulfil| ✅ | ✅ | ✅ | ✅ | ✅ | **COMPLETE** | Do Nothing |

### 23. Existing vs Missing Functionality
Only direct backend service invocations within Server Components are missing.

### 24. Exact Root Cause(s)
`adminApi.getOrders`, `adminApi.getOrderById`, and `adminApi.getOrderShipments` are being executed server-side.

### 25. Exact Files Proposed for Modification
- `src/app/(admin)/admin/orders/page.tsx`
- `src/app/(admin)/admin/orders/[orderId]/page.tsx`

### 26. Files Explicitly Protected from Modification
- `src/server/services/order.service.ts`
- `src/components/admin/orders/*`
- `src/app/api/admin/orders/*`
- Customer Storefront

### 27. Testing Plan
- Execute `npx tsc --noEmit`
- Execute `npm run lint`
- Execute `npm run build`
- Manually view `/admin/orders` and `/admin/orders/[orderId]`

### 28. Security Testing Plan
- Ensure `AuthService.requireRole` prevents non-admins from loading the pages.

### 29. Regression Testing Plan
- Verify F18.1-F18.6 stability.

### 30. Risks
Minimal. Resolving a well-documented F18 pattern.

### 31. Stage A Conclusion
Audit is COMPLETE. The Orders module needs a minor server-component proxy correction. No new features need to be invented.
