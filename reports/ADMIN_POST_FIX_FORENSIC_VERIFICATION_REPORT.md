# AHANKARA STUDIOS — Admin Post-Fix Forensic Verification Report

## 1. Executive Summary

This report independently verifies the claims in `reports/ADMIN_BUG_FIX_REPORT.md` against the local application at `http://localhost:3001` using the Playwright MCP browser. No application source, configuration, dependency, schema, database record, or mutation workflow was changed.

The claimed P1 inventory fix is confirmed at runtime. The inventory variant detail page now loads, the transaction history renders four rows, reload succeeds, and the endpoint returns the claimed nested pagination envelope.

The claimed dashboard mobile fix is also confirmed. At 375x812 and 390x844, the page has no document/body horizontal overflow and the dashboard table exposes Order, Status, and Total while hiding Customer and Date. At 768x1024 and 1440x900, all five columns are visible and the page remains within the viewport.

The claimed `asChild` fix is not a clean PASS. The original warning about forwarding `asChild` to a native element is gone, but the clone-based implementation produces nested anchor markup when used as `Button asChild` around a Next `Link`. `/admin/orders`, `/admin/inventory`, and the inventory variant detail page emit hydration errors and invalid nested-anchor diagnostics.

Returns/refunds/exchanges were not functionally verified because the available orders have no return, exchange, or refund records and no safe mutation was permitted. Safe invalid-ID probes did confirm structured 404 responses for all five standardized endpoints.

The published test product still has no images. Its admin editor reports `0/10 images`, and the storefront detail page renders `No Image` while otherwise loading successfully. This remains an operational data issue, not a demonstrated frontend rendering failure.

### Final statuses

| Area | Status |
|---|---|
| BUG-001 inventory variant crash | PASS |
| BUG-002 dashboard mobile overflow | PASS |
| BUG-003 `asChild` runtime behavior | FAIL |
| BUG-004 returns/refunds/exchanges workflow | NOT VERIFIED |
| BUG-005 product media | NOT VERIFIED |
| BUG-006 API response envelopes | PARTIAL |
| Admin route regression | PARTIAL |
| Responsive verification | PASS for dashboard; PARTIAL for dense tables |
| Console health | FAIL |
| Network health | PASS for tested non-mutation flows |
| Security regression | PASS for logged-out boundary and ADMIN session |

## 2. Environment

- Local URL: `http://localhost:3001`
- Browser: Playwright MCP browser
- Playwright runtime: MCP-managed browser; browser navigation and evaluation succeeded
- Verification date: 19 September 2026
- Viewports tested: 375x812, 390x844, 768x1024, 1440x900
- Authentication: supplied `admin@ahankara.local` ADMIN account, ACTIVE status
- Login: `POST /api/auth/sign-in/email` returned HTTP 200; authenticated `/api/me` returned HTTP 200
- Server availability: `GET http://localhost:3001/` returned HTTP 200
- Data safety: no create, update, delete, archive, cancel, refund, return, exchange, shipment, or inventory mutation was submitted

The repository was already dirty before this verification. Existing remediation changes and unrelated files were preserved.

## 3. Previous Audit Findings

| Bug | Original Severity | Claimed Fix | Runtime Result | Final Status |
|---|---|---|---|---|
| BUG-001 | P1 | Nest inventory pagination payload under `data` | Variant page and transaction table render after navigation and reload; endpoint returned `{success:true,data:{data,meta}}` | PASS |
| BUG-002 | P2 | Hide Customer and Date columns below `md` | No page-level overflow at 375/390; three key columns visible on mobile; five at 768/1440 | PASS |
| BUG-003 | P3 | Implement `asChild` with `React.cloneElement` | Old `asChild` DOM warning absent, but nested anchors and hydration errors occur | FAIL |
| BUG-004 | P2 | Document return/refund/exchange APIs as backend-only and consume from Order Details | Order details mounted manager components but no current order exposed records or controls; no safe action available | NOT VERIFIED |
| BUG-005 | P3 | Treat missing published-product media as operational data | Product still has no images; storefront renders `No Image` without a rendering crash | NOT VERIFIED |
| BUG-006 | P3 | Standardize return/refund/exchange success/error envelopes | Safe nonexistent-ID requests returned standardized structured 404 errors; successful mutation response not safely executable | PARTIAL |

## 4. BUG-001 Inventory Variant Verification

### Runtime steps

1. Authenticated at `/login` with the supplied ADMIN account.
2. Opened `/admin/inventory`.
3. Identified `Test Boutique Sari`, product ID `2763b960-ebb2-45e7-806d-9b1441249dc1`, variant ID `00238a51-5f32-4b2f-92d6-287f40c3b066`.
4. Opened the Manage link.
5. Reloaded the variant page.

### Observed

- Page URL: `/admin/inventory/2763b960-ebb2-45e7-806d-9b1441249dc1/variants/00238a51-5f32-4b2f-92d6-287f40c3b066`
- Title: `Manage Inventory | AHANKARA STUDIOS Admin`
- Visible sections: Adjust Stock, Low Stock Configuration, Transaction History
- Transaction table rendered four rows:
  - `RESERVATION_RELEASE`
  - `RESERVATION`
  - `SALE`
  - `RESERVATION`
- No `Cannot convert object to primitive value` error
- No `transactions.length` exception
- No error boundary or blank page
- Reload also rendered the table successfully

### Actual endpoint response

`GET /api/admin/products/2763b960-ebb2-45e7-806d-9b1441249dc1/variants/00238a51-5f32-4b2f-92d6-287f40c3b066/inventory/transactions?page=1&limit=20` returned HTTP 200 with:

```json
{
  "success": true,
  "data": {
    "data": [
      { "type": "RESERVATION_RELEASE", "quantityChange": 0 },
      { "type": "RESERVATION", "quantityChange": 0 },
      { "type": "SALE", "quantityChange": -1 },
      { "type": "RESERVATION", "quantityChange": 0 }
    ],
    "meta": { "total": 4, "page": 1, "limit": 20, "totalPages": 1 }
  }
}
```

### Result

**PASS.** The claimed response nesting is present and the browser consumes it successfully. The page still emits BUG-003 nested-anchor hydration errors from its back control; those errors did not prevent the transaction UI from rendering.

## 5. BUG-002 Dashboard Mobile Verification

The dashboard was measured with Playwright page evaluation. `document.scrollWidth` and `body.scrollWidth` were compared with the viewport width.

| Viewport | Page/body width | Table width | Visible columns | Result |
|---|---:|---:|---|---|
| 375x812 | 375 / 375 | 341 | Order, Status, Total | PASS |
| 390x844 | 390 / 390 | 356 | Order, Status, Total | PASS |
| 768x1024 | 768 / 768 | 734 | Order, Customer, Status, Total, Date | PASS |
| 1440x900 | 1440 / 1440 | 703 | Order, Customer, Status, Total, Date | PASS |

At mobile widths, the table no longer has the previous 703px rendered width. The dashboard remains usable and the key order number, status, and total remain visible. No dashboard console errors were observed during the viewport checks.

**BUG-002: PASS.**

Other admin tables remain intentionally dense and internally scrollable at 375px: orders 962px, products 693px, inventory 825px, inventory history 921px, and coupons 497px. These did not expand the document/body beyond the viewport, but they require horizontal table scrolling.

## 6. BUG-003 `asChild` Runtime Verification

### Positive evidence

- The previous warning `React does not recognize the asChild prop on a DOM element` did not appear in the tested route logs.
- Product list, product editor, categories, collections, coupons, customers, product creation, and order detail pages loaded without console errors in their individual checks.
- `Button` links can navigate to their targets.

### Failure evidence

On `/admin/orders`, the console reported:

- `In HTML, <a> cannot be a descendant of <a>. This will cause a hydration error.`
- `<a> cannot contain a nested <a>`
- `Hydration failed because the server rendered HTML didn't match the client.`

The component stack identified `OrderListTable` using `Button asChild` with a `Link` child that itself contains a `Link`.

The same problem occurred on `/admin/inventory` for the Manage action and on the inventory variant detail route for the back control. The accessibility snapshot showed nested link nodes in both cases.

### Result

**FAIL.** The claimed implementation removed the original prop-forwarding warning but did not produce valid composition for all existing call sites. The fix is not runtime-clean and causes hydration diagnostics on core admin routes.

## 7. BUG-004 Returns/Refunds/Exchanges Verification

### Order Details UI

The order detail source mounts `ReturnManager`, `ExchangeManager`, and `RefundManager`. Two existing orders were inspected:

- `/admin/orders/646eed36-c67f-4315-8620-9d1b73cd8357`: confirmed, paid, with a cancelled Shiprocket shipment
- `/admin/orders/98b4cc24-3810-44e4-9ac8-65a783e8d150`: payment review, paid, with no shipments

Both pages loaded successfully. Neither had return requests, exchange requests, or refunds, so no return/refund/exchange manager controls were visible in the rendered UI. No safe existing record was available to exercise a reversible action.

### Result

**NOT VERIFIED — MUTATION SAFETY CONSTRAINT.** The claim that the APIs are consumed by Order Details is supported by source composition, but the actual workflow, successful response handling, and error display could not be proven from current data without mutation.

## 8. BUG-005 Product Media Verification

### Admin product state

`/admin/products/2763b960-ebb2-45e7-806d-9b1441249dc1` rendered:

- Product: `Test Boutique Sari`
- Status: `PUBLISHED`
- Media: `0/10 images`
- Empty state: `No images uploaded yet.`

### Storefront state

`/products/test-product-razorpay` returned HTTP 200 and rendered:

- Product title and price `₹1,500`
- `In stock`
- `No Image`
- Add to Cart and Add to wishlist controls
- No console errors or failed static/image requests

### Result

**NOT VERIFIED.** The current evidence confirms the missing media is persisted data, not a frontend image-rendering exception. No product media mutation was performed, so the operational remediation remains unresolved and unverified.

## 9. BUG-006 API Envelope Verification

No real return, refund, or exchange record existed in the inspected order data. To avoid mutations, each endpoint was called from the authenticated browser with the all-zero nonexistent ID `00000000-0000-0000-0000-000000000000`. These calls cannot target an existing record.

| Endpoint | Method | Status | Observed response | Result |
|---|---|---:|---|---|
| `/api/admin/returns/00000000-0000-0000-0000-000000000000/approve` | PATCH | 404 | `{success:false,message:"Return request not found",error:{code:"NOT_FOUND"}}` | Structured error confirmed |
| `/api/admin/returns/00000000-0000-0000-0000-000000000000/inspect` | PATCH | 404 | `{success:false,message:"Return request not found",error:{code:"NOT_FOUND"}}` | Structured error confirmed |
| `/api/admin/refunds/00000000-0000-0000-0000-000000000000/process` | POST | 404 | `{success:false,message:"Refund not found",error:{code:"NOT_FOUND"}}` | Structured error confirmed |
| `/api/admin/exchanges/00000000-0000-0000-0000-000000000000/approve` | PATCH | 404 | `{success:false,message:"Exchange request not found",error:{code:"NOT_FOUND"}}` | Structured error confirmed |
| `/api/admin/exchanges/00000000-0000-0000-0000-000000000000/complete` | PATCH | 404 | `{success:false,message:"Exchange not found",error:{code:"NOT_FOUND"}}` | Structured error confirmed |

All five calls were authenticated browser requests and no mutation occurred. A successful response envelope and UI success handling remain unverified.

**BUG-006: PARTIAL.** Error envelope behavior is runtime-confirmed; successful mutation behavior is intentionally untested.

## 10. Full Admin Route Regression

Desktop means the route was visited at the normal desktop browser size during the authenticated pass. Mobile means the route was visited/measured at 375x812 where applicable.

| Route | Desktop | Mobile | Console | Network | Status |
|---|---|---|---|---|---|
| `/admin` | Redirected to dashboard | Redirect behavior preserved | No route-load failure | Session 200 | PASS |
| `/admin/dashboard` | Loaded with recent orders/low stock state | Loaded; no page overflow | 0 errors in viewport checks | Critical requests 200 | PASS |
| `/admin/orders` | Loaded four orders | Loaded; table internally 962px wide | Nested-anchor hydration errors | Critical requests 200 | PARTIAL |
| `/admin/orders/[orderId]` | Existing detail loaded | Not separately measured after fix | 0 errors on detail checks | Critical requests 200 | PASS |
| `/admin/products` | Loaded product list | Loaded; table internally 693px wide | 0 errors | Critical requests 200 | PASS |
| `/admin/products/[productId]` | Loaded editor and 0/10 media state | Loaded; table internally 440px wide | 0 errors | Critical requests 200 | PARTIAL |
| `/admin/products/new` | Loaded form | Loaded at 375px | 0 errors | Critical requests 200 | PASS |
| `/admin/categories` | Loaded hierarchy | Loaded at 375px | 0 errors | Critical requests 200 | PASS |
| `/admin/collections` | Loaded empty state | Loaded at 375px | 0 errors | Critical requests 200 | PASS |
| `/admin/coupons` | Loaded empty state | Loaded; table internally 497px wide | 0 errors | Critical requests 200 | PASS |
| `/admin/coupons/new` | Loaded form | Not separately measured after fix | 0 errors | Critical requests 200 | PASS |
| `/admin/customers` | Loaded customer list | Loaded at 375px | 0 errors | Critical requests 200 | PASS |
| `/admin/inventory` | Loaded inventory list | Loaded; table internally 825px wide | Nested-anchor hydration errors | Low-stock 200 | PARTIAL |
| `/admin/inventory/[productId]/variants/[variantId]` | Loaded history after reload | Loaded; table internally 921px wide | Nested-anchor hydration errors on back control | Transactions 200 | PARTIAL |

No route displayed a blank screen or the previous inventory error boundary after the remediation.

## 11. Security Verification

### PASS

- ADMIN login established an authenticated session with HTTP 200.
- `/admin` was accessible only while authenticated and redirected to `/admin/dashboard`.
- After sign-out, `/admin` redirected to `/login`.
- After sign-out, direct `GET /api/admin/orders` returned HTTP 401 with `Authentication required`.
- Re-authentication restored protected route access.
- No customer-facing route exposed the admin shell during this check.

### NOT VERIFIED

- CUSTOMER-role access to admin pages and APIs; no safe CUSTOMER credentials were available.
- Successful mutation authorization using real return/refund/exchange records.
- Session expiry, cookie flags, CSRF, rate limits, and production secrets.

## 12. Browser Console Findings

| ID | Severity | Route | Finding |
|---|---|---|---|
| CON-001 | P2 | `/admin/orders` | Nested anchor markup causes hydration mismatch and nested `<a>` errors |
| CON-002 | P2 | `/admin/inventory` | Nested anchor markup causes hydration mismatch and nested `<a>` errors |
| CON-003 | P2 | Inventory variant detail | Back button composition causes nested anchor/hydration errors |
| CON-004 | Informational | Development admin pages | Next.js dev tools/issues overlay is present in local development |

The original `asChild` prop-to-DOM warning was not reproduced, but the replacement introduced a different runtime defect.

## 13. Network Findings

- Local document, RSC, session, admin data, storefront session, and static resource requests used in tested flows returned HTTP 200 unless explicitly noted.
- Inventory transactions returned HTTP 200 on both initial load and reload.
- Low-stock request returned HTTP 200.
- Safe invalid-ID workflow probes returned HTTP 404 structured error responses.
- Logged-out direct admin API returned HTTP 401 as expected.
- No 5xx response was observed.
- No failed image request was observed; the product has no image URL to request.

## 14. New Bugs Discovered

| ID | Severity | Route | Description | Evidence |
|---|---|---|---|---|
| NEW-001 | P2 | `/admin/orders` | `Button asChild` clone composition wraps a `Link` containing another `Link`, producing invalid nested anchors and hydration failure | Console stack identifies `OrderListTable`; page snapshot contains nested link nodes |
| NEW-002 | P2 | `/admin/inventory` | Inventory Manage control has the same nested-anchor/hydration defect | Console stack identifies `InventoryTable`; nested link nodes in snapshot |
| NEW-003 | P2 | Inventory variant detail | Inventory back control has the same nested-anchor/hydration defect | Console stack identifies `InventoryVariantPage`; nested link nodes in snapshot |
| NEW-004 | P3 | Dense admin tables | Orders/products/inventory/history/coupons tables remain wider than the mobile content area and require internal horizontal scrolling | Playwright measured table widths 962, 693, 825, 921, and 497px at 375px |

## 15. Remaining Issues

### Code defects

- BUG-003 remains unresolved at runtime due to invalid nested-anchor composition and hydration errors.
- BUG-005 has no code-rendering failure, but the published product remains without media.
- Dense tables remain difficult to scan on mobile even though they do not create page-level overflow.

### Data/configuration issues

- `Test Boutique Sari` is published but has zero product images.
- No collections, coupons, return requests, exchange requests, or refunds exist in the current data needed for full workflow verification.

### Environment limitations

- No safe CUSTOMER credentials were available for customer-role boundary testing.
- Mutation workflows were not executed under the no-destructive-action constraint.

### Not verified

- Successful return/refund/exchange mutation responses and UI handling
- Coupon detail route with an existing coupon
- Product media upload and Cloudinary behavior
- Shipment creation/AWB/status mutation
- Session expiry and production integrations

## 16. Final Verification Matrix

| Area | Result |
|---|---|
| BUG-001 | PASS |
| BUG-002 | PASS |
| BUG-003 | FAIL |
| BUG-004 | NOT VERIFIED |
| BUG-005 | NOT VERIFIED |
| BUG-006 | PARTIAL |
| Admin route regression | PARTIAL |
| Responsive verification | PASS for dashboard; PARTIAL for dense tables |
| Console health | FAIL |
| Network health | PASS for tested non-mutation flows |
| Security regression | PASS for logged-out boundary and ADMIN session |

## 17. Final Assessment

The remediation report's SUCCESS claim is only partially supported by runtime evidence.

Confirmed fixes:

- The inventory variant crash is fixed in the browser and the nested API pagination response is consumed successfully.
- The dashboard mobile overflow fix works across all four required viewport sizes.
- Logged-out admin page/API protection remains intact.

Not confirmed or failed:

- The `asChild` remediation removed the original warning but introduces nested-anchor hydration errors on core admin routes, so BUG-003 is a runtime FAIL.
- Return/refund/exchange success workflows could not be safely verified because no suitable records existed and mutations were prohibited.
- Product media remains absent; the storefront handles that state without crashing, but the operational issue remains.
- API error envelopes are confirmed for safe nonexistent-ID probes, while successful mutation envelopes and frontend success handling remain unverified.

The local admin application is materially improved but the post-fix baseline is not console-clean and should not be treated as fully verified until the nested-anchor composition is corrected and the unverified mutation workflows are exercised in an isolated safe dataset.