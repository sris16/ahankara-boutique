# AHANKARA STUDIOS — CUSTOMER RESILIENCE & SYSTEM STATES
**R5 — PRE-IMPLEMENTATION AUDIT (API/DATA FAILURE)**

## 1. Executive Summary
The R5 audit reveals that the backend and `apiClient` correctly throw semantic HTTP errors and network states, but the frontend React layer (both Hooks and Server Components) aggressively swallows these errors. This results in severe conflation where 500 Server Errors, Network Failures, and Timeouts are silently converted into legitimate "Empty" states or 404s. The backend contracts are sufficient; the flaw lies entirely in the frontend presentation layer. 

## 2. Current API Error Architecture
- **API Client**: `src/lib/api/client.ts` correctly differentiates `NETWORK_ERROR`, `TIMEOUT_ERROR`, `CALLER_ABORT`, and parses HTTP statuses directly into `ApiError` instances containing the `statusCode`.
- **Backend Errors**: `src/utils/errors.ts` defines explicit classes (`NotFoundError`, `ConflictError`, `UnauthorizedError`) matching standard HTTP semantics.
- **Frontend Handling**: Extensive use of `try/catch` blocks returning `[]` or `null`, followed by `.length === 0` checks, which forces the UI into an `EmptyState` instead of an `ErrorState`.

## 3. API Client Error Semantics
- **Network Failure**: Throws `ApiError("Network error", 0, "NETWORK_ERROR")`.
- **Timeout**: Throws `ApiError("Request timed out", 0, "TIMEOUT_ERROR")`.
- **4xx/5xx**: Throws `ApiError` retaining the `response.status` and `code`.

## 4. HTTP Status Mapping (Conceptual vs Actual)
- **401**: Conceptually Unauthorized. The API client passes this, but some components (like Account) redirect manually rather than handling the API response contextually.
- **403**: Forbidden. Passed by API client.
- **404**: Not Found. Passed by API client.
- **409**: Business Conflict (Inventory). Passed by API client and correctly surfaced as toast messages in Cart.
- **5xx**: Server Error. Passed by API client, but swallowed by frontend components.

## 5. Network vs Timeout Analysis
The API client correctly identifies timeouts via `AbortController` and network failures via `navigator.onLine` and native `fetch` failure. However, contexts like `useCart` genericize this to `new Error("Failed to load cart")`, dropping the specific network/timeout distinction for recovery.

## 6. Catalog Failure Analysis
`products/page.tsx` catches `ProductService.getPublicProducts` failures by returning `null`. The `ProductResults` component checks `!productsResponse` and renders `<CatalogEmptyState isError={!productsResponse} />`. While it flags the error, it still relies on the visual Empty State component instead of a dedicated Error State.

## 7. Category & Collection Failure Analysis
In `products/page.tsx`, `getTaxonomyData()` catches failures and returns `[]`. If the taxonomy API goes down, the page will simply render without categories/collections, effectively hiding the filters rather than showing a local error.

## 8. Homepage Local Failure Analysis
`StorefrontHomepage` fetches `getFeaturedCollections()`, `getTopCategories()`, and `getNewArrivals()`. All three catch errors and return `[]` or `null`. A failure simply omits the content, causing silent data loss rather than wrapping the sections in a `<LocalErrorBoundary>`.

## 9. PDP Failure Analysis
`products/[slug]/page.tsx` explicitly checks for `NotFoundError` (404) to trigger `notFound()`. However, any other error (like a 500) bubbles up to the route's `error.tsx` (Global Page Replacement). `RelatedProducts` correctly utilizes a `<LocalErrorBoundary>` to isolate failures.

## 10. Account Failure Analysis
`account/page.tsx` calls `OrderService.getCustomerOrders`. A `try/catch` swallows any failure into `recentOrders = []`. The UI then checks `recentOrders.length === 0` and renders "No orders yet. Explore Collections", deeply conflating a server outage with a new customer state.

## 11. Wishlist Failure Analysis
`useWishlist` catches errors during initialization and sets an `error` state while `wishlist` remains `[]`. `WishlistClient` completely ignores the `error` state and checks `displayList.length === 0`, incorrectly flashing "Your wishlist is empty" during an outage.

## 12. Cart Failure Boundary
`useCart` follows the exact same pattern as Wishlist. A failed cart retrieval leaves `cart === null`. `CartDrawer` translates this to `items = []`, and displays the `<EmptyState title="Your bag is empty" />`.

## 13. Order/Tracking Failure Boundary
`account/orders/[orderId]/page.tsx` wraps the API call in a `try/catch` and explicitly calls `notFound()` for ALL errors. A 500 Server Error or Network Timeout will falsely tell the user their order doesn't exist (404).

## 14. Global vs Local Failure Matrix
| Surface | Request | Failure | Current Behavior | Correct Semantic State | Scope | Recovery |
| --- | --- | --- | --- | --- | --- | --- |
| Products | Catalog API | 500/Net | EmptyState | ErrorState | Page | Retry |
| Products | Taxonomy API | 500/Net | Silent omission | Filter Error | Local | N/A |
| Homepage | New Arrivals | 500/Net | Silent omission | Local ErrorState | Local | Retry |
| PDP | Product API | 404 | 404 | Not Found | Page | Home |
| PDP | Product API | 500/Net | Global error.tsx | Global error.tsx | Page | Retry |
| Account | Orders API | 500/Net | EmptyState ("No orders") | ErrorState | Local | Retry |
| Order PDP | Order API | 500/Net | 404 Not Found | Global error.tsx | Page | Retry |
| Wishlist | Wishlist API | 500/Net | EmptyState | ErrorState | Page/Local | Retry |
| Cart | Cart API | 500/Net | EmptyState | ErrorState | Local | Retry |

## 15. Empty vs Error Conflation Findings
- **Account Dashboard**: Swallows `getCustomerOrders` 500 -> returns `[]` -> "No orders yet".
- **Cart Drawer**: Swallows `getCart` 500 -> returns `null` -> "Your bag is empty".
- **Wishlist**: Swallows `getWishlist` 500 -> returns `[]` -> "Your wishlist is empty".
- **Order Details**: Swallows 500 -> triggers 404 Not Found.
- **Homepage Sections**: Swallows 500 -> returns `[]` -> Silent UI omission.

## 16. Recovery Action Matrix
- **Network/Timeout**: "Retry" (Local or Page depending on context).
- **401**: "Sign In".
- **404**: "Continue Shopping" or "Go Home".
- **500**: "Retry".

## 17. Existing ErrorState / EmptyState Usage
The `ErrorState`, `EmptyState`, and `LocalErrorBoundary` primitives built in R3 are highly robust. The flaw is that they are being bypassed or misused (e.g. using `EmptyState` when `LocalErrorBoundary` should be utilized). No new generic state monoliths are required.

## 18. Backend Contract Sufficiency
The backend correctly implements HTTP status codes and semantic errors. **No backend modifications are necessary to fulfill R5.**

## 19. Payment Safety Boundary
Cart, Checkout, and Payment mutation workflows currently throw errors appropriately (or use robust 409 handling). R5 will strictly focus on *Read* data retrieval error handling to prevent payment state pollution.

## 20. Accessibility, Mobile & Performance
Removing silent empty states and replacing them with explicit `ErrorState` messages will improve accessibility by explicitly announcing failures to screen readers. Performance is unaffected as we are changing conditional branches, not adding heavy logic.

## 21. Safe R5 Implementation Scope
- Stop swallowing errors into `[]` or `null` in Server Components.
- Implement explicit `ErrorState` components or `<LocalErrorBoundary>` wrappers where errors are currently caught.
- Pass `error` state from Hooks down to the Client Components (Wishlist, Cart) to render an error view instead of `length === 0` empty views.
- Fix Order PDP conflation of 500 -> 404.

## 22. Deferred R6–R13 Items
- Authentication redirection logic (R6).
- Cart business states and 409 resolution (R7).
- Checkout/Payment handling (R8/R9).

## 23. Risks
- Wrapping Server Components in `<LocalErrorBoundary>` requires strict adherence to Next.js suspense and boundary rules to avoid accidental SSR bubbling.

## 24. Final Recommendation
**R5 — READY FOR IMPLEMENTATION**
The backend contracts are solid. The error conflations are precisely identified in the frontend logic. The fix requires targeted refactoring of conditional rendering and `try/catch` handling across the primary customer surfaces.
