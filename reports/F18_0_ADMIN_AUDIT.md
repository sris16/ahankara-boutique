# F18.0 ADMIN AUDIT + API CONTRACT VERIFICATION REPORT

## 1. Executive Summary
- **Overall Admin Status**: 🟡 PARTIAL. The Admin interface is partially implemented with routes existing, but suffers from architectural SSR mismatches and incomplete functional implementations.
- **Major Blockers**: Server Components routing requests through HTTP fetch (`adminApi`) instead of direct service invocation, causing localhost port mismatches and "Cannot convert object to primitive value" crashes.
- **Security Status**: ✅ STRONG (Backend) / 🟡 NEEDS REVIEW (Frontend). `AuthService.requireRole` is consistently applied on the API layer.
- **Backend Readiness**: ✅ COMPLETE for most operations (Orders, Products, Inventory, Returns, Shipments exist).
- **Frontend Readiness**: 🟡 PARTIAL. Needs significant UI completion (Coupons, Orders, Categories).

## 2. Repository Structure
Relevant Admin directories:
- `src/app/(admin)/admin/` - Admin page routes
- `src/app/api/admin/` - Admin backend API routes
- `src/components/admin/` - Admin UI components
- `src/lib/api/admin.ts` - Admin API SDK
- `src/types/admin.ts` - DTOs
- `src/server/services/` - Core business logic

## 3. Admin Route Inventory
| Route | File | Type | API | Auth | Status |
|---|---|---|---|---|---|
| `/admin` | `src/app/(admin)/layout.tsx` | Server | N/A | Session Check | ✅ COMPLETE |
| `/admin/dashboard` | `src/app/(admin)/admin/dashboard/page.tsx` | Server | `adminApi` HTTP | Layout | 🔴 BROKEN |
| `/admin/orders` | `src/app/(admin)/admin/orders/page.tsx` | Server | `adminApi` HTTP | Layout | 🟡 PARTIAL |
| `/admin/orders/[id]`| `src/app/(admin)/admin/orders/[orderId]/page.tsx` | Server | `adminApi` HTTP | Layout | 🟡 PARTIAL |
| `/admin/products` | `src/app/(admin)/admin/products/page.tsx` | Server | `adminApi` HTTP | Layout | 🟡 PARTIAL |
| `/admin/inventory`| `src/app/(admin)/admin/inventory/page.tsx` | Server | `adminApi` HTTP | Layout | 🔴 BROKEN |
| `/admin/categories`| `src/app/(admin)/admin/categories/page.tsx`| Client | `adminApi` HTTP | Layout | 🟡 PARTIAL |
| `/admin/collections`| `src/app/(admin)/admin/collections/page.tsx`| Client | `adminApi` HTTP | Layout | 🟡 PARTIAL |
| `/admin/coupons` | `src/app/(admin)/admin/coupons/page.tsx` | Client | `adminApi` HTTP | Layout | 🟡 PARTIAL |

## 4. Admin Component Inventory
| Component | Path | Used By | Type | API Dependency | Status |
|---|---|---|---|---|---|
| `AdminSidebar` | `layout/AdminSidebar.tsx` | `layout.tsx` | Client | None | 🟡 PARTIAL (Hardcoded "Soon") |
| `LowStockAlerts` | `inventory/LowStockAlerts.tsx` | Dashboard | Client | `/api/admin/inventory/low-stock` | 🔴 BROKEN (When SSR) |
| `RecentOrders` | `dashboard/RecentOrders.tsx` | Dashboard | Client | `/api/admin/orders` | 🔴 BROKEN (When SSR) |
| `InventoryTable` | `inventory/InventoryTable.tsx`| Inventory | Client | None (Props) | 🟡 PARTIAL |
| `ProductTable` | `products/ProductTable.tsx` | Products | Client | None (Props) | 🟡 PARTIAL |
| `OrderListTable` | `orders/OrderListTable.tsx` | Orders | Client | None (Props) | 🟡 PARTIAL |

## 5. API Endpoint Inventory
| Method | Endpoint | Handler | Auth | Validator | Service | Frontend Consumer | Status |
|---|---|---|---|---|---|---|---|
| GET/POST | `/api/admin/products` | `products/route.ts` | `requireRole` | `productListFilterSchema` | `ProductService` | `adminApi.getProducts` | ✅ COMPLETE |
| GET | `/api/admin/inventory/low-stock`| `low-stock/route.ts` | `requireRole` | None | `InventoryService` | `LowStockAlerts` | ✅ COMPLETE |
| GET/POST | `/api/admin/orders` | `orders/route.ts` | `requireRole` | None | `OrderService` | `RecentOrders` | ✅ COMPLETE |
| GET/POST | `/api/admin/categories` | `categories/route.ts`| `requireRole` | `categorySchema` | `CategoryService` | `adminApi.getCategories` | ✅ COMPLETE |

## 6. Backend Capability Map
Frontend → API (`/api/admin/*`) → Validator (`src/server/validators/*`) → Service (`src/server/services/*`) → Prisma Model (`prisma/schema.prisma`).

## 7. Dashboard Bug Investigation
- **Evidence**: `RecentOrders.tsx` and `LowStockAlerts.tsx` report "Failed to load" during SSR.
- **Root Cause**: Server Components in Next.js attempting to route through HTTP (`adminApi.getRecentOrders(reqHeaders)`) instead of using internal services (`OrderService.getAllOrders()`). If `NEXT_PUBLIC_API_URL` defaults to 3000 but the app runs on 3001, the fetch fails.
- **Confidence**: CONFIRMED.

## 8. Inventory Bug Investigation
- **Error**: "Cannot convert object to primitive value"
- **Data Path**: `InventoryPage` → `adminApi.getProducts(..., reqHeaders)` → `apiClient.ts`
- **Root Cause**: Passing Next.js's `ReadonlyHeaders` (or a Promise resolving to it) directly as the `headers` option, which Next.js/fetch internals attempt to serialize or iterate, causing a type conversion error.
- **Confidence**: LIKELY.

## 9. Orders Audit
- List orders: ✅ COMPLETE (Backend) / 🟡 PARTIAL (Frontend - Sidebar says "Soon")
- Customer data: ✅ COMPLETE (Backend) / 🟡 PARTIAL (Frontend)

## 10-19. Module Audits (Products, Categories, Collections, Inventory, Coupons, Fulfillment, Returns, Exchanges, Refunds, Customers)
- **Backend**: Most operations are ✅ COMPLETE in Prisma schemas, validators, and services.
- **Frontend**: Mostly 🟡 PARTIAL or ⚪ NOT IMPLEMENTED.
- **Customers**: ⚪ NOT IMPLEMENTED (No dedicated customer management UI).

## 20. Authentication Audit
- Better Auth implemented correctly (`src/lib/auth.ts`).
- Session cookies managed via `auth.api.getSession`.

## 21. Authorization Audit
- `AuthService.requireRole(req.headers, UserRole.ADMIN)` is heavily used in `/api/admin/*`.
- ✅ COMPLETE.

## 22. IDOR / Security Audit
- No major IDORs identified in read-only audit. Admin role requirement acts as a blanket protector, but resource-specific checks (e.g. `order.userId`) are correctly ignored for Admins.

## 23. API Contract Mismatches
- Minor mapping differences (e.g., Dates serialized to strings) need frontend type accommodations, handled correctly by DTOs in `src/types/admin.ts`.

## 24. Server/Client Boundary Audit
- **Security-Critical**: The core issue of F18.0 is that Server Components (e.g., `InventoryPage`, `DashboardPage`) are using `apiClient` HTTP requests to talk to themselves, rather than invoking services. This leaks overhead and causes the bugs identified.

## 25. Environment / Base URL Audit
- `.env` maps `NEXT_PUBLIC_API_URL="http://localhost:3001"`. Server fetches might bypass this or fail if not correctly passed.

## 26-28. State & Cache Audit
- Caching is minimal in admin requests; standard React loading states are used.

## 29. Dependency Graph
- Products → Categories/Collections → Inventory → Orders → Fulfillment → Returns/Refunds.

## 30. F18 GAP MATRIX
| Module | Status | Priority | Main Gap |
|---|---|---|---|
| Dashboard | 🔴 BROKEN | P1 | SSR HTTP fetching causing crashes |
| Inventory | 🔴 BROKEN | P1 | SSR Headers passing causing primitive error |
| Orders | 🟡 PARTIAL | P2 | Frontend UI completion |

## 31. Backend Dependency Assessment
- NO BACKEND CHANGES REQUIRED. Existing services and APIs are robust.

## 32. Database Dependency Assessment
- NO DATABASE CHANGES REQUIRED.

## 33. Recommended F18 Implementation Order
1. F18.1 Dashboard (Fix SSR HTTP calls)
2. F18.2 Inventory (Fix primitive error, complete UI)
3. F18.3 Products
... (Standard order follows)

## 34. Exact First Implementation Files (F18.1)
- `src/app/(admin)/admin/dashboard/page.tsx` (Refactor to use Services)
- `src/app/(admin)/admin/inventory/page.tsx` (Refactor to use Services)
- `src/components/admin/layout/AdminSidebar.tsx` (Remove "Soon" block)

## 35. Risks
- Runtime Risks: Mixing Server/Client fetch patterns.

## 36. F18.0 Conclusion
- Working: Backend Services, API Routes, DB Schema, Better Auth.
- Broken: Server Component HTTP fetch logic in Dashboard/Inventory.
- Missing: Fully populated UI matrices for operations.
- F18.1 must fix the SSR fetch pattern in Dashboard/Inventory by replacing HTTP calls with direct `Service` invocations.
- No DB/Backend changes required. Storefront remains frozen.
