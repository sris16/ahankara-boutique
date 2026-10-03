# AHANKARA STUDIOS — CUSTOMER RESILIENCE & SYSTEM STATES
**R7 — IMPLEMENTATION REPORT**

## Overview
Phase R7 targets Cart Business-State Resilience. We successfully addressed structural synchronization issues in the cart workflow. The goal was to accurately distinguish and handle UI presentation between empty cart states, network failures, and legitimate backend business rejections (like insufficient inventory) without relying on sweeping generic error boundaries or misleading loading states.

## Implemented Changes

1. **Separated Cart Load Errors from Mutation/Business Errors (`use-cart.tsx`)**
   - **Fix:** Removed global `setError` calls from the catch blocks of `addItem`, `updateItemQuantity`, and `removeItem`.
   - **Reasoning:** Previously, a rejected update (e.g. attempting to add more quantity than the inventory allows) set a global `error` object. The `CartDrawer` interpreted this global error (when `cart` was empty) as a full cart API failure, throwing a catastrophic "Bag Unavailable" screen. Now, the global `error` is only set when `refreshCart()` genuinely fails to load the cart. Mutation failures throw directly to the caller, where they are appropriately caught and presented as non-blocking toasts.
   
2. **Resync After Rejected Mutations (`use-cart.tsx`)**
   - **Fix:** Added `await refreshCart(true)` within the `catch` blocks of mutation functions (`addItem`, `updateItemQuantity`, `removeItem`).
   - **Reasoning:** When the API returned a `400 ValidationError` due to a stock shortage, the optimistic UI incorrectly rolled back to a stale state. It failed to fetch the authoritative cart state which includes newly computed `stockStatus` evaluations (`INSUFFICIENT_STOCK`, `LOW_STOCK`). Re-syncing guarantees the customer instantly sees the server's correct stock limitations rather than remaining stuck on stale data.

3. **Refresh When Cart Drawer Opens (`use-cart.tsx`)**
   - **Fix:** Added `refreshCart(true)` to the `openCart` hook. Added a `silent` boolean parameter to `refreshCart` to prevent disruptive loading spinners.
   - **Reasoning:** Previously, if a customer had an item in their cart and the inventory depleted while they browsed, opening the `CartDrawer` revealed cached, outdated quantity information. Synchronizing silently upon drawer open ensures the server's business logic dictates the cart state immediately.

4. **Block Invalid Checkout Directly from Cart Drawer (`CartDrawer.tsx`)**
   - **Fix:** Added authoritative `hasIssues` boolean calculation identical to `/cart` and injected it into the "Proceed to Checkout" `disabled` prop.
   - **Reasoning:** Prevents users from progressing to the checkout page if items in the cart are identified as unavailable or out of stock by the backend. This matches the behavior of the cart summary pages.

## Status
R7 Implementation is functionally complete and conforms strictly to the provided constraints (no backend modifications, no new dependencies, no rewriting checkout logic).
