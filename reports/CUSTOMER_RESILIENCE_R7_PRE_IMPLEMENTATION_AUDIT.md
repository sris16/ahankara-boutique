# AHANKARA STUDIOS — CUSTOMER RESILIENCE & SYSTEM STATES
**R7 — PRE-IMPLEMENTATION AUDIT (CART BUSINESS-STATE RESILIENCE)**

## 1. Executive Summary
An exhaustive read-only inspection of the Ahankara Studios cart architecture has been completed. The system already possesses robust server-side inventory checks and evaluates the cart state securely (`_evaluateCart`). However, there are significant gaps in client-server synchronization, UI error semantics, and business conflict resolution. 

Crucially, **a business conflict (inventory shortage) currently results in a `400 ValidationError` rather than a `409 ConflictError`**. The frontend catches this and attempts a naïve optimistic reversion without subsequently re-syncing the cart state with the server, leaving the user with a "stale" cart and a transient toast notification.

## 2. Existing Cart Architecture

- **Cart Provider & State (`use-cart.tsx`)**: Manages `cart`, `isLoading`, `isInitialized`, and `error`. It handles optimistic UI updates for `updateItemQuantity` and `removeItem`.
- **Server Evaluation (`cart.service.ts`)**: `_evaluateCart` determines line-item availability (sets `available: boolean` and `stockStatus` to `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`, or `INSUFFICIENT_STOCK`).
- **Checkout Enforcement (`order.service.ts` & `checkout-client.tsx`)**: The backend rejects checkout requests if any cart item is unavailable. The `/cart` and `/checkout` pages respect this by disabling the checkout button (`hasIssues` / `hasUnavailableItems`).

## 3. Cart State Machine Analysis

### 3.1 Initial Loading vs Empty
- **Correct**: `isInitialized = false` displays a loading spinner.
- **Correct**: When `cart.items.length === 0`, it correctly shows the `EmptyState`.

### 3.2 Network/API Failure vs Mutation Error (THE FLAW)
- **Violation**: The `error` state in `use-cart.tsx` is shared globally. If a user tries to `addItem` to an empty cart and the backend rejects it (e.g., due to insufficient stock), `error` is populated but the cart remains empty (`hasItems === false`).
- **Impact**: `CartDrawer` incorrectly renders the global `ErrorState` ("Bag Unavailable — We couldn't load your shopping bag at this time"), misleading the user into thinking the API is down when it was merely a business conflict.

### 3.3 Inventory Conflicts Flow (THE STALENESS FLAW)
- **Backend Response**: Throws `ValidationError` (maps to `400 Bad Request`), not `409`. 
- **Current Client Flow**:
  1. Customer changes quantity from `1` to `5`.
  2. `useCart` optimistically sets quantity to `5`.
  3. API responds with `400` ("Insufficient stock available").
  4. `useCart` catches the error, reverts to `prevCart` (quantity `1`), and throws.
  5. `CartDrawer` catches the error and displays a toast.
  6. **Missing Step**: The cart is NEVER refreshed. The client remains unaware that the server evaluation might now consider the item `LOW_STOCK`.

## 4. Client/Server Synchronization Analysis

- **Initial Load**: Fetched correctly once when the `useAuth` hook finishes loading.
- **Drawer Open**: Opening the `CartDrawer` **does not** trigger a `refreshCart()`. If an item goes out of stock while the customer is browsing, they will not know until they attempt a mutation or proceed to checkout.
- **After Rejection**: When a mutation is rejected, the client reverts to its last known optimistic state rather than fetching the authoritative server state.

## 5. Checkout Boundary Analysis

- **Cart Page (`/cart`)**: Computes `hasIssues` correctly and disables the "Proceed to Checkout" button.
- **Cart Drawer (`CartDrawer.tsx`)**: **Fails** to compute `hasIssues`. The checkout button remains enabled, allowing the customer to click it, route to `/checkout`, and only then realize they are blocked.
- **Checkout Page (`/checkout`)**: Computes `hasUnavailableItems` correctly and disables the submit button.

## 6. Proposed R7 Remediation (Scope for Implementation)

1. **Fix Shared Error State Semantic Violation**: 
   - Decouple API fetch/load errors from mutation errors in `use-cart.tsx`. `CartDrawer` should only display the `ErrorState` ("Bag Unavailable") if the `getCart` fetch actually fails.
2. **Implement Resync on Conflict**:
   - `updateItemQuantity` and `addItem` must call `await refreshCart()` inside their `catch` blocks when a mutation fails. This guarantees the UI immediately reflects the authoritative server stock evaluation (`OUT_OF_STOCK`, `INSUFFICIENT_STOCK`) instead of a stale optimistic state.
3. **Trigger Sync on Drawer Open**:
   - Update `openCart` (or `CartDrawer` `useEffect`) to silently call `refreshCart()` when the drawer is opened to guarantee fresh inventory data.
4. **Fix Cart Drawer Checkout Handoff**:
   - Implement the `hasIssues` boolean logic in `CartDrawer.tsx` (mirroring `CartClient.tsx`) to disable the checkout button if items are out of stock.

## 7. Deferred R8+ Scope
- **Automatic cart quantity reduction**: Right now the backend rejects the update. We will not change the backend to auto-reduce quantities. We will rely on the UI to display the badge and require the user to adjust.
- **Payment failure mechanisms**: Strictly out of scope for R7.

## 8. Final Recommendation
**R7 READY FOR IMPLEMENTATION.** The audit confirms that the backend already enforces the correct rules; the gaps are entirely contained within the client's failure to sync, separate error semantics, and disable drawer checkout buttons.
