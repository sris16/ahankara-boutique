# C9 STAGE A CUSTOMER ORDER EXPERIENCE AUDIT

## 1. Executive Summary
The existing Customer Order Experience encompasses `/account/orders` and `/account/orders/[orderId]`. The backend order services, including `OrderService`, `PostPurchaseService`, and `ShippingService`, are mature, transactional, and securely scoped by user IDs. The frontend implementation successfully renders order history and details as Server Components, but currently suffers from an architectural flaw: Server Components are making local HTTP fetch calls (`orderApi`) instead of invoking the services directly. Additionally, there are UX gaps (e.g., missing retry payment flows), missing SEO privacy tags, and the design needs a premium editorial upgrade.

## 2. Existing Order Architecture
The backend uses robust Prisma models mapping `Order`, `OrderItem`, `Shipment`, `ReturnRequest`, `ExchangeRequest`, and `Refund`. State transitions are rigorously validated.

## 3. Existing Customer Routes
- `/account/orders` (Order History)
- `/account/orders/[orderId]` (Order Detail)

## 4. Existing API Routes
- `/api/me/orders`
- `/api/me/orders/[orderId]`
- `/api/me/orders/[orderId]/cancel`
- `/api/me/orders/[orderId]/returns`
- `/api/me/orders/[orderId]/exchanges`
- `/api/me/orders/[orderId]/payment/verify`
- `/api/me/orders/[orderId]/tracking`

## 5. Existing Order Components
- `TrackingModule`
- `CancelOrderDialog`
- `ReturnItemDialog`
- `ExchangeItemDialog`

## 6. Existing Services
- `OrderService`: Securely retrieves customer orders via `userId`.
- `PostPurchaseService`: Calculates item eligibility and proportional discounts for returns/exchanges.
- `ShippingService`: Supports Mock and Shiprocket providers, tracking events, and AWB assignment.

## 7. Existing Prisma Models
`Order`, `OrderItem`, `OrderAddress`, `Shipment`, `ShipmentTrackingEvent`, `ReturnRequest`, `ExchangeRequest`, `Refund`.

## 8. Order History Audit
- **Status**: Implemented as a Server Component.
- **Gap**: Makes a local HTTP call (`orderApi.getOrders`) instead of calling `OrderService.getCustomerOrders` directly.
- **UI Gap**: Generic placeholders instead of product images for order items.

## 9. Order Detail Audit
- **Status**: Implemented as a Server Component.
- **Gap**: Makes a local HTTP call (`orderApi.getOrderById`).
- **Data**: Exposes snapshots, tracking, and post-purchase requests correctly.

## 10. Payment Status Audit
- **Handled States**: PENDING, PAID, FAILED, REFUNDED.
- **UI Gap**: There is no prominent "Retry Payment" UI flow for orders stuck in `PENDING_PAYMENT` or `FAILED` states.

## 11. Shipping/Tracking Audit
- **IMPLEMENTED**: `Shipment` records, status transitions, `ShippingService`, `MockShippingProvider`, `ShiprocketShippingProvider`, `TrackingModule`.
- **MOCKED**: Actual courier assignment defaults to mock unless configured.

## 12. Cancellation Audit
- **IMPLEMENTED**: Handled safely for orders not yet shipped. Button rendered conditionally based on `isCancellable` logic.

## 13. Return Audit
- **IMPLEMENTED**: Item eligibility evaluated in `PostPurchaseService`. `ReturnItemDialog` conditionally rendered for DELIVERED orders.

## 14. Exchange Audit
- **IMPLEMENTED**: `ExchangeItemDialog` conditionally rendered.

## 15. Refund Audit
- **IMPLEMENTED**: Refund records are visible in the Order Details page with correct statuses.

## 16. Authentication Audit
- **Status**: The API endpoints securely verify the session.
- **Gap**: The Server Components currently rely on passing `cookieHeader` to the API routes. This should be refactored to check session directly and invoke services.

## 17. Authorization/IDOR Audit
- **Status**: Secure. `OrderService.getCustomerOrders(userId)` and `getCustomerOrderById(userId, orderId)` strictly enforce ownership.

## 18. Security Audit
- No sensitive payment keys are exposed.
- All actions are gated by the authenticated user's ID.

## 19. Server/Client Boundary Audit
- **Current Architecture**: Hybrid Server Components doing local fetching.
- **Proposed Architecture**: Server Components must invoke backend services directly (Service Layer -> Database) passing the authenticated `userId`. Interactive elements (cancellation dialogs, tracking) can remain Client Components.

## 20. Performance Audit
- **Issue**: Unnecessary internal network requests (Next.js server calling itself via HTTP).
- **Fix**: Direct service invocation will significantly reduce TTFB.

## 21. UI/UX Audit
- **Status**: Functional but slightly generic.
- **Gap**: Needs the AHANKARA STUDIOS premium editorial aesthetic—sophisticated typography, minimalist layout, and refined transitions. Missing image fallbacks are unpolished.

## 22. Accessibility Audit
- Missing semantic markup in some areas. Dialogs are generally accessible via `radix-ui` (assumed standard shadcn usage), but `aria-live` is missing for tracking/status updates.

## 23. Responsive Audit
- The grid layout appropriately drops to a single column on mobile, though the left/right balance on desktop could be improved.

## 24. SEO/Privacy Audit
- **Gap**: Missing `robots: "noindex, nofollow"` in the metadata of the order pages. This is a privacy risk.

## 25. Loading/Error/Empty State Audit
- **Status**: The empty state in order history is functional.
- **Gap**: Needs a more premium design for the empty state.

## 26. Functionality Gap Matrix

| Area | Current State | Required State | Severity | Proposed Stage B Action |
| --- | --- | --- | --- | --- |
| Data Fetching | Local HTTP (`orderApi`) | Direct Service Invocation | HIGH | Refactor Server Components to use Services |
| Retry Payment | Missing | Visible Retry UI | HIGH | Add Retry Payment flow for PENDING orders |
| SEO Privacy | Missing robots | `noindex, nofollow` | HIGH | Update metadata exports |
| UI/UX | Generic | Premium Ahankara Studios | MEDIUM | Restyle order history and details |

## 27. Proposed Stage B Scope
1. Refactor `/account/orders/page.tsx` and `[orderId]/page.tsx` to directly invoke `OrderService`.
2. Introduce a "Retry Payment" / "Complete Payment" UI flow in the order details page for pending payments.
3. Add `robots: "noindex, nofollow"` to order pages.
4. Elevate the design of both pages to the premium brand aesthetic.

## 28. Proposed Stage B Files
- `src/app/(storefront)/account/orders/page.tsx`
- `src/app/(storefront)/account/orders/[orderId]/page.tsx`
- `src/components/orders/OrderPaymentRetry.tsx` (New)

## 29. Files That Must Remain Untouched
- `src/server/services/order.service.ts`
- `src/server/services/post-purchase.service.ts`
- `src/server/services/shipping.service.ts`
- `src/server/services/payment.service.ts`

## 30. Validation Plan
- Verify direct service invocation works seamlessly.
- Ensure IDOR checks hold.
- Verify the "Retry Payment" logic successfully bridges to Razorpay.

## 31. Security Risks
- Care must be taken not to bypass `userId` verification when switching to direct service calls.

## 32. Performance Risks
- Direct service invocation reduces risk and improves performance.

## 33. Backend Dependency Assessment
- Backend services are fully capable and require no changes.

## 34. Database Dependency Assessment
- No database changes required.

## 35. C2 Regression Assessment
- Untouched.

## 36. C3 Regression Assessment
- Untouched.

## 37. C4 Regression Assessment
- Untouched.

## 38. C5 Regression Assessment
- Untouched.

## 39. C6 Regression Assessment
- Untouched.

## 40. C7 Regression Assessment
- Untouched.

## 41. C8 Regression Assessment
- Untouched. The C8 checkout logic feeds seamlessly into this history.

## 42. C9 Stage A Conclusion
The C9 Stage A audit is complete. The backend order logic is robust and mature. The primary frontend gaps are architectural (local HTTP calls in Server Components), functional (missing retry payment UI), and aesthetic. Stage B implementation can safely proceed to refine the frontend boundary without altering the backend source of truth.
