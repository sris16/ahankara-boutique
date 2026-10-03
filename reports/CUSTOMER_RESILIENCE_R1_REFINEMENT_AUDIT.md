# AHANKARA STUDIOS — CUSTOMER RESILIENCE & SYSTEM STATES
**R1 — Architecture Refinement Audit**

## 1. Executive Summary
This R1 Refinement Audit re-evaluates the assumptions of the initial resilience audit by conducting a deep, read-only trace of the actual data, HTTP semantics, component rendering, and backend concurrency behaviors currently deployed in the AHANKARA STUDIOS repository. 

The primary finding is that the backend API and services are highly sophisticated, actively tracking inventory races, idempotency, and specific session states. The frontend, however, underutilizes these capabilities, often flattening distinct server signals (e.g., `409 Conflict`, `400 Validation`, `500 Server Error`) into generic catch-all errors or failing to provide contextual recovery paths.

## 2. Verified Architecture
- **Rendering Framework**: Next.js App Router with a mix of Server Components (e.g., `ProductsPage`) and Client Components (hooks like `useCart`, `useCheckout`).
- **Idempotency**: Implemented for critical mutations (e.g., `POST /api/me/checkout` requires an `Idempotency-Key`).
- **Database Concurrency**: Handled robustly via `prisma.$transaction` and raw SQL `UPDATE ... WHERE quantity >= required` checks to prevent race conditions.

## 3. Failure Ownership Model
Failures were traced to determine their true authoritative source and appropriate UI scope:

| Failure | Origin | Detection Layer | Appropriate Scope | Current Behavior | Desired Behavior | Recovery Action | Authority |
|---|---|---|---|---|---|---|---|
| **Catalog API 500** | Server | SSR `catch` | Route | Renders `<CatalogEmptyState />` | Route | Refresh Data | Server |
| **Product Not Found** | Server | SSR `throw` | Route | `error.tsx` (Route Error) | Route | Return to Catalog | Server |
| **Product API 500** | Server | SSR `throw` | Global/Route | `error.tsx` (Route Error) | Route | Refresh Data | Server |
| **Cart Quantity Race** | DB | API `PATCH` | Action | Throws `ApiError` | Action | Refresh Cart | API |
| **Checkout Stock Race** | DB | API `409` | Action | Generic inline text | Action | Return to Cart | API |
| **Network Offline** | Browser | `apiClient` | Global/Action | Throws `NETWORK_ERROR` | Global/Action | Wait for connection | Browser |
| **Payment Timeout** | Gateway | Client | Action | Unknown/Hangs | Action | Check Status | Server Webhook |
| **Session Invalid** | Auth | `apiClient` 401 | Action | Logs out silently | Action | Prompt Sign In | Auth Server |

## 4. Render vs Data Failure Analysis
The current application successfully distinguishes some render and data failures, but mixes them elsewhere:
- **Server Components (Render Failures)**: In `src/app/(storefront)/products/[slug]/page.tsx`, if `ProductService.getProductBySlug` fails (non-404), it throws an error. Because this runs during SSR, the server stops rendering the component tree and passes the error to the React Error Boundary (`error.tsx`), wiping out the page. This is a **Render Failure**.
- **Server Components (Data Failures)**: In `products/page.tsx`, `getCatalogData` catches the promise rejection (`.catch(() => null)`) and passes `null` down to the UI, which explicitly renders `CatalogEmptyState` with an `isError` flag. This correctly treats a backend failure as a **Data Failure** without triggering `error.tsx`.
- **Client Hooks (Data Failures)**: `useCart` and `useCheckout` catch API failures and set local `error` state strings. These are appropriately treated as Data Failures, not Render Failures. React Error Boundaries are **NOT** appropriate here.

## 5. HTTP/API Error Semantics
The backend utilizes a robust `AppError` subclass system mapped in `error-handler.ts`:
- **400 (`VALIDATION_ERROR`)**: Used for Zod failures or domain validation (e.g., "Cannot checkout empty cart").
- **401 (`UNAUTHORIZED`)**: "Authentication required" or "User account not found". The UI (`useAuth`) treats all 401s identically as "not logged in". It cannot currently distinguish between "session expired" and "never authenticated".
- **403 (`FORBIDDEN`)**: Used for access control and account status. `useAuth` explicitly parses the error message string to detect `account suspended` vs `account deactivated` to update UI state. 
- **404 (`NOT_FOUND`)**: Explicitly used for missing resources.
- **409 (`CONFLICT`)**: Heavily utilized by `InventoryService` ("Insufficient available stock", "Cannot release more stock..."). The backend exposes rich semantics for e-commerce races.
- **429 (`TOO_MANY_REQUESTS`)**: Defined in backend but unhandled explicitly by the frontend API client.
- **500 (`INTERNAL_SERVER_ERROR`)**: Generic fallback.
- **503 (Maintenance)**: **Does not exist.** The backend does not expose a 503 signal. Treating generic failures as "Maintenance" would be factually incorrect in this architecture.

## 6. Network Failure Semantics
- **`navigator.onLine`**: Not utilized.
- **`fetch` Exceptions**: The `apiClient` wraps `fetch`. If `fetch` rejects (e.g., DNS failure, server unreachable, physical offline), `apiClient` catches it and throws a generic `ApiError(..., 0, "NETWORK_ERROR")`.
- The application currently **cannot distinguish** between offline, timeout, DNS failure, or a completely dead server. All are grouped under "NETWORK_ERROR".

## 7. Timeout/Retry Analysis
- **Timeouts**: There are no explicit request timeouts (`AbortController` is not used in `apiClient`). Requests can hang indefinitely.
- **Retries**: There is no automatic retry logic in the `apiClient`.
- **Recommendation**: 
  - Read-only GET requests (e.g., fetching products) can safely use limited automatic retries (with jitter).
  - Mutations (e.g., `POST /api/me/checkout`) must NEVER auto-retry at the network layer unless the exact `Idempotency-Key` is perfectly preserved. The current checkout API supports idempotency.

## 8. Concurrency & Stale Data Analysis
- **Inventory Race**: Handled flawlessly by the backend. `InventoryService.reserveStock` uses atomic SQL updates (`quantity - reservedQuantity >= required`). If two users try to buy the last item, the second receives a `409 ConflictError`. The frontend currently catches this and shows a generic text error in checkout.
- **Cart Race**: `CartService.getOrCreateCart` evaluates inventory dynamically. If stock changes while a user is browsing, the next cart load correctly marks the item as `OUT_OF_STOCK` or `INSUFFICIENT_STOCK`. 
- **Stale UI**: The frontend does not actively poll or revalidate data unless the user navigates or mutates. Price/Inventory data can become stale if a tab is left open.

## 9. Authentication/Session Analysis
- **Flow**: Better Auth manages sessions. `apiClient` sends requests. If a session expires on the server, the next API request returns `401`.
- **UI Behavior**: `useAuth` catches the `401`, silently sets `user: null`, and relies on the user encountering a gated route or failing action.
- **Distinction**: The architecture does not distinguish "Invalid" from "Expired". A 401 is an absolute loss of authentication.

## 10. Payment State Machine
The payment flow relies on an authoritative server state machine, preventing false negatives on network drops.
- **States**: `PENDING_PAYMENT` -> `CONFIRMED` / `FAILED` / `EXPIRED`.
- **Initiation**: Client requests order creation. Order is generated with `PENDING_PAYMENT` and a 15-minute `reservationExpiresAt`. Inventory is actively reserved.
- **Client Execution**: Razorpay modal opens.
- **Failure**: If the user closes the modal or the browser disconnects, the server retains the `PENDING_PAYMENT` state. A background job (`expirePendingOrders`) releases the stock and marks `EXPIRED` if not paid within 15 minutes.
- **Safety**: The frontend can safely allow customers to "Try Payment Again" (`OrderPaymentRetry.tsx`) for `PENDING_PAYMENT` orders.

## 11. Cart Failure Matrix
| Scenario | Backend Response | Current UI | Correct UI | Recovery |
|---|---|---|---|---|
| Item Out of Stock | `availability.available: false` | AlertTriangle Banner | AlertTriangle Banner | Remove Item |
| Quantity update race | `409 Conflict` | Catch & Revert Optimistic | Toast + Revert | Refresh Cart |
| Cart API offline | `NETWORK_ERROR` | Toast error | Toast + Offline Banner | Retry on reconnect |

## 12. Checkout Failure Matrix
| Scenario | Nature | Current UI | Correct UI | Recovery |
|---|---|---|---|---|
| Missing Address | Validation | Block Submit | Form highlight | Correct Form |
| Empty Cart | Business Rule | 400 Bad Request | Redirect to Cart | Return to Cart |
| Idempotency Hit | Reconciliation | Returns Existing Order | Proceed to Payment | Continue |
| Inventory Race | Conflict | 409 -> Checkout Error | Clear error detailing item | Return to Cart |

## 13. Order/Tracking Failure Analysis
- **Missing Order**: Resolves to a 404 HTTP response.
- **Payment Retry**: Valid ONLY if order is `PENDING_PAYMENT`. If `EXPIRED`, the backend correctly rejects payment attempts.

## 14. Media Failure Analysis
- **Current Usage**: `next/image` is used extensively (e.g., `ProductCard.tsx`).
- **Data Fallbacks**: Components gracefully handle missing data (e.g., rendering a CSS/HTML AHANKARA badge if `item.image` is null).
- **Network Fallbacks**: If the image URL exists but fails to load over the network, `next/image` displays a native browser broken image icon. There is **no** `onError` fallback replacing broken network images. 

## 15. Existing Design-System Analysis
- The `src/components/ui` directory contains robust primitives: `badge.tsx`, `dialog.tsx`, `empty-state.tsx`, `error-state.tsx`, `skeleton.tsx`, `toast.tsx`.
- The existing `<ErrorState />` and `<EmptyState />` are excellent for full-page or section-level replacements.
- There is **no** `<OfflineBanner />` or `<ImageWithFallback />`.

## 16. Recovery Action Matrix
| State | Action | Justification |
|---|---|---|
| Route SSR 500 | Refresh Data | Since data failed to load, reloading the page is the only option. |
| Cart Mutation 409 | Return to Cart | Inventory changed; user must review new cart state. |
| Payment Dropped | Try Payment Again | Order is safely `PENDING_PAYMENT` on backend. |
| 401 mid-checkout | Sign In | Session expired; user must re-authenticate to use idempotency keys. |

## 17. Frontend vs Backend Contract Classification
- **Network Detection**: FRONTEND-ONLY.
- **Timeout Handling**: FRONTEND-ONLY.
- **Local Error Boundaries**: FRONTEND-ONLY.
- **Concurrency (409)**: EXISTING BACKEND SUPPORT. The backend already throws semantic errors.
- **Image Fallbacks**: FRONTEND-ONLY.
- **Maintenance Mode (503)**: BACKEND CONTRACT GAP. The backend does not expose a 503 signal.

## 18. E2E Failure Simulation Capability
The existing `e2e/verification.spec.ts` relies on standard Playwright tests. Many tests are currently blocked due to external dependencies (OTP emails, Razorpay). However, Playwright's `page.route()` is fully capable of simulating 400, 401, 409, 500, and network aborts. Testing resilience is highly viable without modifying the backend.

## 19. Architectural Risks
- **Adding generic retries to `apiClient`** could cause duplicated payments or orders if the `Idempotency-Key` logic in checkout is bypassed or mismanaged during a retry cycle.
- **Assuming `navigator.onLine` implies a working server**. The browser can be online while the API is unreachable.

## 20. Genuine Architectural Gaps
1. **Render vs Data Failure Mix**: `[slug]/page.tsx` throws SSR errors to `error.tsx` instead of catching and rendering a localized error state (as `products/page.tsx` does).
2. **Missing Request Timeouts**: Fetch can hang indefinitely.
3. **Missing Image Network Fallback**: Broken images degrade luxury branding.
4. **Coarse Conflict Handling**: 409 Inventory conflicts during checkout are treated as generic errors rather than explicit "Return to Cart" workflows.

## 21. R1 Status
**READY FOR R2**

The architecture is verified. The backend provides robust semantic signals (409, 400, Idempotency) that the frontend currently underutilizes. Implementation in R2 should focus strictly on the React/Frontend layer to catch, interpret, and gracefully degrade based on these existing signals. No backend modifications are necessary.
