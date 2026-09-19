# AHANKARA STUDIOS
# ADMIN FULL FORENSIC AUDIT REPORT

## 1. Executive Summary

This read-only audit covered the local admin application at `http://localhost:3001` using repository inspection, authenticated Playwright runtime verification, direct safe GET requests, Prisma schema inspection, and API/security boundary checks.

The supplied ADMIN account authenticated successfully. `/admin` redirected to `/admin/dashboard`. The dashboard, orders, products, categories, collections, coupons, customers, and inventory list surfaces rendered with current database data or explicit empty states.

One confirmed core runtime failure remains: the inventory variant detail page crashes while rendering transaction history. The transactions endpoint returns HTTP 200, but the response is unwrapped by `apiClient` before `TransactionHistoryTable` destructures `{ data, meta }`, leaving `transactions` undefined and causing `Cannot read properties of undefined (reading 'length')`.

The admin security boundary is substantially present: the server layout checks the session and ADMIN role, and all 37 discovered admin API route files perform an ADMIN role check. Unauthenticated direct API access returned a structured 401. A CUSTOMER-role browser/API test was not performed because no safe customer credentials were supplied.

### Route classification

- PASS: 13 of 16 discovered admin UI routes
- PARTIAL: 1 of 16, product detail because the persisted product has no images/media
- FAIL: 1 of 16, inventory variant detail
- NOT VERIFIED: 1 of 16, coupon detail because the database contains no coupons
- BLOCKED: 0

Mutation workflows were intentionally not submitted. They are reported as `NOT RUNTIME VERIFIED — MUTATION SAFETY CONSTRAINT`.

## 2. Audit Scope

Audited source and runtime surfaces:

- 16 admin page route files under `src/app/(admin)/admin`
- 37 admin API route files under `src/app/api/admin`
- Admin layout, desktop/mobile navigation, header, page components, shared API clients, types, validators, services, auth, error handling, and Prisma schema
- Authenticated ADMIN browser session
- Logged-out `/admin` and direct admin API boundary
- Invalid order and product resource IDs
- Desktop viewport and 375px mobile viewport
- Browser console errors, warnings, navigation results, and failed requests

Not performed:

- No source, configuration, dependency, schema, or database mutation
- No product, category, collection, coupon, order, shipment, return, refund, exchange, inventory, or customer mutation
- No customer-role login because no safe customer password was available
- No production-host or DNS testing

## 3. Environment

- Target: `http://localhost:3001`
- Next.js: 16.2.10
- React: 19.2.4
- Node.js: local Node 24.x environment as specified by the audit brief
- PostgreSQL / Prisma: local project configuration, Prisma schema inspected read-only
- Browser: Playwright MCP
- Account used: pre-provisioned ADMIN account, ACTIVE status
- Repository baseline: worktree was already dirty before this audit; unrelated existing changes were preserved

## 4. Admin Route Inventory

| Route | Feature | Source Status | Runtime Status | Auth | APIs / data | Issues |
|---|---|---|---|---|---|---|
| `/admin` | Admin entry | Redirect implemented | PASS, redirects to dashboard | Server layout | Session/role | None observed |
| `/admin/dashboard` | Operations dashboard | Implemented | PASS | Server layout | Recent orders, low stock | Mobile table overflow; shared React warning on some pages |
| `/admin/orders` | Order list | Implemented | PASS | Server layout | Orders service/API | No visible search, filter, sort, or pagination controls in rendered state |
| `/admin/orders/[orderId]` | Order detail/fulfillment | Implemented | PASS for existing order | Server layout | Order, shipment, cancellation, fulfillment | Mutation controls not submitted |
| `/admin/products` | Product list | Implemented | PASS | Server layout | Product/category/variant/inventory data | No visible pagination in one-record state |
| `/admin/products/new` | Product creation form | Implemented | PASS render only | Server layout | Categories/collections | Create mutation not verified |
| `/admin/products/[productId]` | Product editor | Implemented | PASS render, PARTIAL data | Server layout | Product, variants, images | Existing product has `0/10 images`; image upload not verified |
| `/admin/categories` | Category manager | Implemented | PASS render | Server layout | Category hierarchy | Add/edit/delete not verified |
| `/admin/collections` | Collection manager | Implemented | PASS empty state | Server layout | Collections | No collection record; mutations not verified |
| `/admin/coupons` | Coupon list | Implemented | PASS empty state | Server layout | Coupons | No coupon record; detail unavailable |
| `/admin/coupons/new` | Coupon form | Implemented | PASS render | Server layout | Coupon validator/API | Create mutation not verified |
| `/admin/coupons/[couponId]` | Coupon editor | Implemented | NOT VERIFIED | Server layout | Coupon detail | No coupon exists to obtain a safe ID |
| `/admin/customers` | Customer list | Implemented | PASS | Server layout | Users/orders | Search interaction not verified |
| `/admin/customers/[customerId]` | Customer detail/status | Implemented | PASS render | Server layout | User, address, order history | Status mutation not verified |
| `/admin/inventory` | Inventory list | Implemented | PASS | Server layout | Low-stock API, inventory data | Shared React warning |
| `/admin/inventory/[productId]/variants/[variantId]` | Inventory management/history | Implemented | FAIL | Server layout | Variant, inventory transactions | Transaction response/client mismatch crashes page |

### API route inventory

The 37 discovered API route files cover categories, collections, coupons, cron expiration, customer status, exchanges, inventory, orders, products/variants/images, refunds, returns, shipments, and an admin test route. All inspected route files use `AuthService.requireRole(...ADMIN)` or equivalent enum-based ADMIN checks.

## 5. Feature Verification Matrix

| Feature | Implemented | Runtime Verified | Status | Severity | Notes |
|---|---:|---:|---|---|---|
| Admin entry and dashboard | Yes | Yes | PASS | - | `/admin` redirects to dashboard; current orders and empty low-stock state render |
| Order list/detail | Yes | Yes | PASS | - | Four orders listed; existing confirmed order detail rendered |
| Product list/editor | Yes | Yes | PARTIAL | P2 | Product renders but persisted record has no media |
| Product create form | Yes | Render only | NOT VERIFIED | - | No mutation submitted |
| Categories | Yes | Yes | PASS | - | Hierarchy and existing category rendered |
| Collections | Yes | Yes | PASS | - | Explicit no-collections state rendered |
| Coupons | Yes | List/form only | PARTIAL | P2 | No records; detail route unavailable |
| Customers | Yes | Yes | PASS | - | List/detail/order history rendered |
| Inventory list | Yes | Yes | PASS | - | Quantity 99, available 99, low-stock API 200 |
| Inventory variant history | Yes | Yes | FAIL | P1 | Page error caused by transaction response contract mismatch |
| Shipping | Backend/components | Read-only render | NOT VERIFIED | - | No shipment mutation submitted; provider behavior classified below |
| Returns/refunds/exchanges | API/backend | No safe mutation | NOT VERIFIED | - | No admin page discovered; mutation safety constraint |
| ADMIN authorization | Yes | Admin + logged out | PASS | - | Admin session succeeds; direct logged-out API returns 401 |
| CUSTOMER authorization | Yes in source | No customer session | NOT VERIFIED | - | Requires safe customer credentials |

## 6. Dashboard Findings

### PASS

- `RecentOrders` rendered four latest orders, including order number, customer, status, total, and date.
- `LowStockAlerts` rendered `No low-stock items right now.`.
- The direct low-stock request returned HTTP 200 with `{ "success": true, "data": [] }`.
- Historical dashboard failures `Failed to load recent orders` and `Failed to load low stock alerts` were not reproduced during this ADMIN session.
- Desktop and mobile headers expose admin menu and sign-out controls.

### Finding D-001 — Mobile dashboard table exceeds viewport

- Severity: P2
- FILE: `src/components/admin/dashboard/RecentOrders.tsx`; dashboard layout at `src/app/(admin)/admin/dashboard/page.tsx`
- RUNTIME: `/admin/dashboard`, viewport 375x812
- OBSERVED: Accessibility bounds reported a recent-orders table 703px wide inside a 343px content region.
- EXPECTED: The table should be intentionally scrollable with a clear contained overflow treatment, or collapse into a mobile-friendly card/list layout.
- IMPACT: Order columns are not fully visible on a phone without horizontal scrolling; mobile scanning is degraded.
- LIKELY ROOT CAUSE: The table preserves desktop minimum/content widths without a mobile presentation.

## 7. Orders Findings

- `/admin/orders` rendered four records with status, payment status, totals, customer data, and detail links.
- `/admin/orders/[orderId]` rendered item quantities, payment summary, customer addresses, order status, shipment data, tracking timeline, cancellation, and fulfillment controls.
- Existing order detail had a cancelled SHIPROCKET shipment and tracking timeline; no request failed during page load.
- Invalid order ID rendered a meaningful `Failed to load order details` message and `Return to Orders` link rather than a blank page.
- No order mutation, cancellation, refund, exchange, shipment creation, or fulfillment action was submitted.
- Search, filtering, sorting, and pagination were not visible in the observed list state and were not runtime verified.

## 8. Products Findings

- `/admin/products` rendered status/category filters, search input, add-product link, product row, price, category, variant count, and edit link.
- `/admin/products/new` rendered required name, slug, base price, category, optional compare-at price, descriptions, SEO, feature flag, and create button.
- `/admin/products/[productId]` rendered status, archive button, editable product fields, one active variant, and media controls.
- Direct API evidence showed product and variant prices stored as paise (`150000`) and UI-formatted as rupees (`₹1500.00`), which is consistent for the observed record.
- The observed product has an empty `images` array and the editor displays `0/10 images` / `No images uploaded yet.`. This is data completeness, not proof of an image pipeline defect.
- Invalid product ID returned HTTP 404 and produced a browser failed-resource error; the admin shell remained around the 404 page.
- Product create/edit/archive/publish, variant, and image mutations were not submitted.

## 9. Categories Findings

- Existing category hierarchy rendered with name, order, edit, and delete controls.
- Prisma `Category` supports parent/children, active state, ordering, metadata, and product/coupon relationships.
- Add/edit/delete and hierarchy loop-prevention behavior were not mutation-tested.
- No console errors or failed requests were observed on the loaded page.

## 10. Collections Findings

- Page rendered `No collections found. Create one to start merchandising.` and an Add Collection button.
- Prisma `Collection` and `ProductCollection` models exist and support active/featured state, dates, ordering, and product assignment.
- No collection record existed, so edit/detail/product assignment behavior was not runtime verified.
- No console errors or failed requests were observed on the loaded page.

## 11. Coupons Findings

- List rendered search, create link, table headers, and an explicit `No coupons have been created yet.` state.
- New-coupon form rendered percentage/fixed amount selection, value, minimum/maximum amounts, usage limits, dates, active state, and UUID restriction fields.
- No coupon data existed; `/admin/coupons/[couponId]` could not be safely exercised.
- Coupon create/update/delete/enable-disable behavior was not submitted.
- Source API uses separate raw fetch handling and does not use the shared `apiClient` response contract; this should be covered by a focused contract test later.

## 12. Customers Findings

- Customer list rendered search and customer cards with name, email, status, order count, and joined date.
- Customer detail rendered account ID, role, status combobox, phone, joined date, address, and order history.
- Sensitive account identifiers, email, address, and phone data are visible to ADMIN as expected for an operational customer tool; least-data exposure was not independently validated against business requirements.
- Customer status mutation and search behavior were not submitted.
- No console errors or failed requests were observed on these pages.

## 13. Inventory Findings

### PASS: inventory list

- Inventory list rendered product/SKU, variant details, physical quantity, reserved, available, status, and Manage link.
- The observed record reported quantity 99, reserved 0/blank display, available 99, and `IN STOCK`.
- `/api/admin/inventory/low-stock` returned HTTP 200 with an empty data array.
- Historical `Cannot convert object to primitive value` was not reproduced on `/admin/inventory` itself.

### FAIL: variant inventory detail

- Severity: P1
- FILE: `src/components/admin/inventory/TransactionHistoryTable.tsx`, transaction loading and render; `src/lib/api/admin.ts`, `getInventoryTransactions`; `src/app/api/admin/products/[productId]/variants/[variantId]/inventory/transactions/route.ts`
- RUNTIME: `/admin/inventory/2763b960-ebb2-45e7-806d-9b1441249dc1/variants/00238a51-5f32-4b2f-92d6-287f40c3b066`
- OBSERVED: Page displayed `This page couldn’t load`. Console error: `TypeError: Cannot read properties of undefined (reading 'length')` in `TransactionHistoryTable`. The request returned HTTP 200.
- API RESPONSE: Route returns `{ success: true, data: result.data, meta: result.meta }`.
- CLIENT EXPECTATION: `adminApi.getInventoryTransactions` calls `apiClient.get`, which returns the envelope's `data`; `TransactionHistoryTable` then destructures `{ data, meta }` from that already-unwrapped value.
- EXPECTED: Component should receive a stable `{ data, meta }` result or use the unwrapped array consistently.
- IMPACT: Admin cannot open the inventory variant management page or inspect transaction history, and the error boundary replaces the full page.
- LIKELY ROOT CAUSE: Proven frontend/API response-shape mismatch.

- Inventory adjustment and threshold controls are present in source/UI but were not submitted: `NOT RUNTIME VERIFIED — MUTATION SAFETY CONSTRAINT`.
- Negative inventory, concurrency, and transaction history pagination were not mutation or multi-session tested.

## 14. Shipping Findings

- Shipment UI is embedded in order detail and renders provider, status, included items, AWB, courier, provider order ID, and tracking timeline.
- Source `ShippingService` supports `MOCK` and `SHIPROCKET` adapters; the Prisma enum also contains `DELHIVERY` and `MANUAL`, while the service default switch only implements MOCK and SHIPROCKET.
- `MockShippingProvider` and live Shiprocket adapter must be treated differently. No new shipment was created, AWB assigned, status changed, or shipment cancelled.
- Current runtime data included a SHIPROCKET shipment record, but this audit did not prove that external Shiprocket calls are production-ready or KYC-enabled.
- Status transition and transaction logic exist in source, including row locking and fulfillment synchronization; runtime mutation verification is blocked by the no-mutation constraint.

Classification: implemented backend/components; provider mode is data/config dependent; production Shiprocket behavior NOT VERIFIED.

## 15. Returns / Refunds / Exchanges Findings

- Discovered API-only admin routes:
  - Returns: approve and inspect
  - Refunds: process
  - Exchanges: approve and complete
- Each inspected route performs an ADMIN role check and delegates to a service layer.
- Return inspection validates a non-empty item array, UUID return-item IDs, and non-negative integer accepted quantities.
- Refund processing redundantly calls `requireAuth` and then `requireRole`, which is functionally safe but unnecessary duplication.
- No admin page/navigation entry was discovered for these workflows.
- No mutation was submitted: `NOT RUNTIME VERIFIED — MUTATION SAFETY CONSTRAINT`.
- API response conventions differ from the shared `apiClient` convention in the inspected return/refund/exchange routes: they return raw objects or `{ error }` responses instead of the standard `{ success, data, ... }` envelope. Frontend compatibility is therefore not runtime verified.

## 16. Authentication Findings

- ADMIN credentials authenticated through `/login`; sign-in endpoint returned HTTP 200 and subsequent `/api/me` returned HTTP 200.
- The application uses one user identity model with a `role` field; admin accounts remain normal users and can access the storefront.
- `AuthService.requireAuth` retrieves the Better Auth session, re-reads the user from Prisma, and rejects missing, suspended, or deactivated users.
- `AuthService.requireRole` enforces exact role equality.
- Admin layout performs a server-side session check and redirects unauthenticated users to `/login`; non-admin users are redirected to `/account/orders`.
- Logged-out `/admin` redirected to `/login`.
- Logged-out direct `GET /api/admin/orders` returned HTTP 401 with `{ success:false, message:"Authentication required", error:{code:"UNAUTHORIZED"} }`.
- Session expiration and CUSTOMER-role browser/API behavior were not runtime verified.

## 17. Authorization / Security Findings

### PASS

- All 37 discovered admin API route files contain an explicit ADMIN role check in source inspection.
- The admin page boundary is server-side, not merely based on hidden navigation.
- Direct API access was tested without a session and rejected.
- Public customer registration source explicitly defaults new accounts to CUSTOMER and ACTIVE, ignoring client-provided role/status fields.

### NOT VERIFIED

- CUSTOMER session attempting `/admin` and a representative admin API: no safe customer credentials available.
- IDOR behavior across every detail API: only invalid order/product page IDs were tested; no cross-user resource mutation was attempted.
- CSRF behavior, cookie flags, session expiry, rate limiting, and production secret configuration.

### Observed risk

- Admin API route conventions are inconsistent. Some use `handleError`/standard envelopes; others return raw objects and ad hoc `{ error }` responses. This increases the chance of frontend error-handling gaps and should be normalized or contract-tested.
- A public admin test route exists at `src/app/api/admin/test/route.ts`; it is ADMIN-protected in source but should be reviewed for production exposure and removal/disablement policy.

## 18. API Contract Findings

| Page / component | Endpoint | Method | Observed response | Frontend expectation | Result |
|---|---|---|---|---|---|
| Dashboard recent orders | `/api/admin/orders?limit=5` | GET | `{ success, data: { orders, pagination } }` | Orders list shape | PASS in dashboard |
| Dashboard low stock | `/api/admin/inventory/low-stock` | GET | `{ success, data: [] }` | Low-stock array | PASS |
| Product list | `/api/admin/products` | GET | `{ success, data: { data, meta } }` | `AdminProductListResponse` after client unwrap | PASS |
| Inventory transactions | `/api/admin/.../inventory/transactions` | GET | `{ success, data: array, meta }` | `{ data, meta }` after client call | FAIL; destructuring mismatch |
| Coupons | `/api/admin/coupons` | GET | Raw-fetch path, separate envelope handling | `AdminCoupon[]` | No data; not fully verified |
| Returns/refunds/exchanges | Admin action routes | PATCH/POST | Raw object or `{ error }` | No current admin page consumer found | NOT VERIFIED |

The shared `apiClient` unwrap behavior is defined in `src/lib/api/client.ts`; the inventory transaction caller incorrectly treats the unwrapped result as the full response object.

## 19. Database / Prisma Findings

- `User` has `role` and `status` enums, sessions, addresses, orders, cart, wishlist, returns, exchanges, and coupon redemptions.
- `Product.basePrice`, variant prices, and compare-at prices are integer paise; runtime UI formatting correctly showed ₹1,500 for 150000.
- Product images are a separate relation and the observed product has zero image rows.
- `Category` supports self-referential parent/children relations; hierarchy mutation safety was not tested.
- `Collection` and `ProductCollection` support merchandising and assignment; no collection records currently exist.
- Inventory includes quantity, reserved quantity, threshold, and transaction records; the list page rendered these values correctly.
- Order, payment, shipment, return, exchange, and refund models/services exist in the inspected architecture.
- Potentially important enum breadth mismatch: Prisma `ShippingProvider` includes `DELHIVERY` and `MANUAL`, while the inspected `ShippingService` switch only handles MOCK and SHIPROCKET.
- No schema mutation or destructive database command was performed.

## 20. UI / UX Findings

### Working

- Consistent admin shell with brand, admin identity, role badge, sign-out, desktop navigation, and mobile menu.
- Clear page headings and empty states for collections, coupons, and low-stock inventory.
- Order detail provides useful operational groupings for status, payment, fulfillment, customer, addresses, and shipments.

### Improvements

- Product and inventory screens expose destructive buttons such as archive, delete, cancel, and adjustment controls; confirmation behavior was not exercised.
- Orders list is visually operational but has no visible search/filter/sort controls in the observed UI despite the audit scope expecting those capabilities.
- Backend-only returns/refunds/exchanges have no discoverable admin navigation, making implemented functionality operationally unreachable from the visible sidebar.
- Product media empty state is clear but storefront product cards/details display `No Image` for the current product.

## 21. Accessibility Findings

- Positive: semantic headings, labeled form controls, tables with column headers, named navigation, named sign-out and mobile menu buttons, and dialog name `Admin Navigation Menu` were observed.
- Positive: icon controls in the mobile header have accessible names for menu and sign-out where rendered.
- P3: several back/navigation icon buttons in forms/detail pages have no accessible name in the snapshot; the adjacent button often contains only an icon.
- P3: some table cells rely on visual formatting/status text and need keyboard/assistive technology interaction testing beyond the snapshot.
- P3: shared React `asChild` prop warning indicates invalid DOM output and should be resolved for clean semantic markup.
- Color contrast and focus-visible styling were not measured programmatically.

## 22. Responsive Findings

- At 375x812, the admin mobile menu and header rendered without overlap.
- At 375x812, dashboard recent-orders table bounds were 703px wide inside a 343px content area. This is a confirmed responsive issue, classified P2.
- Inventory list tables also use dense multi-column layouts and should receive a dedicated mobile check before production.
- Forms use single-column stacking in source/UI and appeared structurally usable, but all controls were not keyboard-tested at mobile size.
- Tablet viewport behavior was not separately verified.

## 23. Performance Findings

- Server-rendered admin pages avoid exposing their primary data fetches as browser API waterfalls; dashboard data rendered server-side.
- Authenticated storefront/layout requests also issued `/api/me`, addresses, wishlist, and cart requests during navigation. These are not admin failures but are shared-shell overhead visible in the network log.
- No obvious duplicate admin data request was observed for the loaded pages.
- Tables do not visibly demonstrate pagination controls in the observed small data sets; large-dataset query/payload behavior was not verified.
- No profiling, bundle analysis, database query plan, or production latency test was performed.

## 24. Error Handling Findings

- Dashboard has Suspense skeletons and explicit low-stock/recent-order failure components in source; current data loaded successfully.
- Invalid order ID has a meaningful page-level error and return link.
- Invalid product ID reaches a 404 page and emits a failed-resource console error; this is acceptable for a missing resource but could be improved with a route-specific recovery message.
- Inventory transaction failure is not contained by the component's intended error state because the shape mismatch throws during render after the request succeeds.
- Inconsistent API envelopes make shared error handling less predictable.

## 25. Browser Console / Network Findings

| ID | Severity | Observation | Runtime evidence |
|---|---|---|---|
| C-001 | P1 | Inventory transaction component crashes on undefined `transactions` | `/admin/inventory/.../variants/...`; HTTP 200 transaction request; page error |
| C-002 | P3 | React rejects `asChild` prop on a DOM element | Product edit, orders, inventory list/detail and other admin pages |
| C-003 | P3 | Invalid product ID emits 404 failed-resource error | `/admin/products/not-a-real-product` |
| C-004 | Informational | Next.js dev tools/issues overlay visible in development | Admin pages in local dev |

No 5xx response was observed during the tested GET flows. The only expected 4xx response was logged-out API 401 and invalid-product 404. No image, font, or static script failure was observed during the audited admin pages.

## 26. Navigation Findings

- Visible sidebar targets all eight primary admin sections and each target loaded: Dashboard, Orders, Customers, Products, Categories, Collections, Inventory, Coupons.
- Mobile menu exposes the same eight routes.
- `/admin` correctly redirects to `/admin/dashboard`.
- Product list edit link, inventory Manage link, customer detail links, order View links, and form back links were observed.
- Returns, refunds, exchanges, shipment management, and coupon detail are not visible sidebar destinations.
- No dead visible sidebar link was found.
- Backend-only functionality is effectively orphaned from primary admin navigation.

## 27. Production Readiness Findings

Classification: **PARTIALLY READY WITH A P1 BLOCKER; NOT READY for complete admin production use**.

Rationale:

- Authentication and server-side authorization boundaries are present and direct unauthenticated API access is rejected.
- Core read-only dashboard, order, catalog, customer, category, collection, coupon-list, and inventory-list pages render.
- The inventory variant management route is broken at runtime for a real existing variant, preventing a core operational workflow.
- Mutation workflows were not safely runtime verified.
- Responsive table overflow and invalid DOM prop warnings remain.
- Shipping external integration, customer-role denial, session expiry, production environment configuration, and mutation error paths remain unverified.

## 28. Complete Bug Register

| ID | Severity | Area | Problem | Evidence | Root Cause | Impact | Recommended Direction |
|---|---|---|---|---|---|---|---|
| BUG-001 | P1 | Inventory | Variant detail crashes while rendering transaction history | Runtime page error; `TransactionHistoryTable` reads `transactions.length` after 200 response | Proven client/API response-shape mismatch | Inventory management/history unavailable | Align client return type with route envelope and add a contract test |
| BUG-002 | P2 | Responsive UI | Dashboard orders table is 703px wide at 375px viewport | Playwright bounds at mobile viewport | Desktop table width is retained on mobile | Horizontal scrolling and poor order scanning | Contain overflow or provide a mobile row/card presentation |
| BUG-003 | P3 | React/runtime | `asChild` reaches a DOM element | Console error on multiple admin pages | Button composition/prop forwarding issue | Invalid DOM and noisy runtime diagnostics | Correct component composition and add console-clean smoke test |
| BUG-004 | P2 | Admin completeness | Returns/refunds/exchanges APIs have no visible admin page/navigation | API route inventory vs sidebar inventory | Backend functionality is not surfaced in admin UI | Operators cannot discover workflows | Add or document admin UI entry points after contract verification |
| BUG-005 | P3 | Data/content | Existing published product has no media and renders `No Image` storefront/admin states | Product API `images: []`; editor `0/10 images` | Missing data or incomplete media setup, root cause not proven | Poor storefront presentation | Populate/validate media workflow; do not assume code defect |
| BUG-006 | P3 | Error consistency | Admin API response envelopes are inconsistent | `apiClient`, inventory route, return/refund/exchange routes | Multiple API response conventions | Frontend integration failures become more likely | Standardize or explicitly type each client boundary |

## 29. Working Correctly

- ADMIN login and session establishment
- Server-side `/admin` authentication and role redirect
- Logged-out direct admin API rejection
- Dashboard recent orders
- Dashboard low-stock empty state
- Orders list and existing order detail
- Product list, create-form rendering, and existing product editor rendering
- Category hierarchy rendering
- Collections empty state
- Coupons list empty state and create-form rendering
- Customer list and customer detail rendering
- Inventory list and low-stock request
- Mobile admin menu/header rendering
- Invalid order recovery message

## 30. Partially Working

- Product detail/editor: functional for existing data, but current published product has no images and storefront cards show `No Image`.
- Coupons: list/create surfaces work, but no data exists for detail/update verification.
- Shipping: source and order-detail surfaces exist, but provider mutation and external integration were not verified.
- Returns/refunds/exchanges: backend routes exist but are not surfaced by admin navigation.

## 31. Broken

- Inventory variant detail/history page for the existing product variant. It fails on a successful transactions response due to an established response-shape mismatch.
- Dashboard orders table is not responsive at 375px without horizontal scrolling; this is a usability defect rather than a route-load failure.

## 32. Not Verified

- Coupon detail route: no coupon record exists.
- Customer-role access to admin pages/APIs: no safe customer credentials.
- Product/category/collection/coupon/customer/inventory/order/shipping/return/refund/exchange mutations.
- Search, filtering, sorting, pagination interactions beyond rendered default states.
- Cloudinary upload/delete/reorder/primary-image behavior.
- Shiprocket live calls, KYC readiness, webhooks, and production credentials.
- Session expiry, cookie security, CSRF, rate limiting, production headers, and multi-session concurrency.

Each mutation is classified `NOT RUNTIME VERIFIED — MUTATION SAFETY CONSTRAINT`.

## 33. Blocked

- No software/environment blocker prevented the read-only route audit.
- Mutation verification was intentionally blocked by the explicit no-data-mutation rule.
- CUSTOMER authorization runtime testing was blocked by the absence of safe CUSTOMER credentials.
- Coupon detail testing was blocked by the empty coupon dataset.

## 34. Recommended Improvements

### P0

- None observed.

### P1

- Correct the inventory transaction client/API response contract mismatch and add a real response-shape regression test.
- Re-run the complete inventory variant route and transaction pagination flow after the contract correction.

### P2

- Make dashboard and dense admin tables responsive at mobile widths.
- Add safe read-only/API contract tests for admin endpoints and standardize envelope handling.
- Add discoverable admin surfaces for returns, refunds, exchanges, and shipment workflows, or explicitly mark them backend-only.
- Exercise mutation workflows in an isolated test dataset or documented fixture environment.

### P3

- Remove the React `asChild` DOM warning.
- Add accessible names to icon-only back/detail controls and verify focus-visible behavior.
- Improve invalid detail-page recovery consistency between order and product routes.
- Resolve missing product media data or document the required media provisioning workflow.

### P4

- Add browser smoke coverage for every sidebar route, direct API authorization, and empty-state contracts.
- Add production-readiness checks for provider configuration and the admin test route.

## 35. Recommended Fix Order

1. Fix and test the inventory transaction response contract.
2. Add route-level admin smoke tests for all 16 UI routes and representative API GETs.
3. Normalize admin API envelopes and error handling, or encode each exception in a typed client boundary.
4. Re-test admin/customer authorization with isolated ADMIN and CUSTOMER fixtures.
5. Address mobile table overflow and shared `asChild` console errors.
6. Verify safe mutation workflows in a disposable test dataset, including inventory, catalog, coupon, order, and fulfillment paths.
7. Add/navigation-test returns, refunds, exchanges, and shipment operations.
8. Validate external Shiprocket/Cloudinary/Razorpay production configuration separately from local runtime.

## 36. Regression Risks

- Changing `apiClient` unwrapping can affect every admin and storefront caller that currently expects `data` versus an envelope.
- Normalizing API responses can break coupon and fulfillment clients using `rawFetch` or raw `NextResponse.json` responses.
- Inventory fixes can affect pagination, adjustment, threshold, and concurrency behavior.
- Responsive table changes can affect desktop column widths and order-detail information density.
- Authorization changes can accidentally block the intended single-identity ADMIN storefront access model.
- Shipping changes can alter order fulfillment synchronization and provider adapter behavior.

## 37. Final Audit Conclusion

The local AHANKARA STUDIOS admin application has a functioning server-side ADMIN boundary and a broad, mostly rendered operational surface. Read-only dashboard, catalog, order, customer, category, collection, coupon, and inventory-list workflows were observed working against current local data.

It is not a clean production-ready admin baseline because the existing inventory variant page fails for a real record, the mobile dashboard table is materially wider than the phone viewport, and runtime/API response conventions are inconsistent. Shipping and returns/refunds/exchanges remain incomplete from a user-verifiable admin workflow perspective, and all mutation paths require controlled follow-up verification. No source code or application data was changed during this audit.