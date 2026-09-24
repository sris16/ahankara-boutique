# C7 STAGE A CUSTOMER AUDIT

## 1. Executive Summary
Following the completion of the Customer Wishlist (C6), the next logical feature in the customer journey is the **Customer Cart (C7)**. The current codebase already has functional Cart APIs, services, and a basic `CartPage`. However, the current Cart implementation suffers from the same architectural and UX deficiencies that the Wishlist previously had. It relies entirely on Client Components, lacks optimistic UI updates, and is missing a critical premium feature: a global Slide-Out Cart (Cart Drawer). The audit recommends C7 focus entirely on elevating the Cart experience to production-quality standards.

## 2. Existing Customer Architecture
- **Cart Context**: `src/hooks/use-cart.tsx` handles global cart state, initialized after authentication loading.
- **Cart API**: `/api/me/cart` securely wraps `CartService`.
- **Cart Service**: `src/server/services/cart.service.ts` effectively evaluates pricing, validates inventory limits, and enforces product publication status.
- **Client/Server Split**: `src/app/(storefront)/cart/page.tsx` is completely CSR (`"use client"`), resulting in an unnecessary initial loading spinner flash.

## 3. Existing Routes
- `src/app/(storefront)/cart/page.tsx`
- `src/app/api/me/cart/route.ts`
- `src/app/api/me/cart/items/[cartItemId]/route.ts`

## 4. Existing Components
- `CartPage`: A full-page cart displaying line items, quantity adjustments, and an order summary.
- `ProductForm`: Includes an `handleAddToCart` function that adds items to the cart.
- `Navbar`: Contains a `ShoppingBag` link showing total item count, but links directly to `/cart`.

## 5. Existing Services
- `CartService.getOrCreateCart`: Dynamically evaluates cart validity, calculating current pricing, stock availability (IN_STOCK, OUT_OF_STOCK, INSUFFICIENT_STOCK), and item validity.
- Handles `addItem`, `updateItemQuantity`, and `removeItem`.

## 6. Existing API Contracts
- `GET /api/me/cart` -> Returns `CartResponse`
- `POST /api/me/cart/items` -> Adds variant to cart
- `PUT /api/me/cart/items/[cartItemId]` -> Updates quantity
- `DELETE /api/me/cart/items/[cartItemId]` -> Removes item

## 7. Current Functionality
The user can add products to their cart from the Product Details Page (PDP). They can view their cart at `/cart`. They can change quantities, remove items, and see an order summary. If an item becomes unavailable, the cart flags it.

## 8. Architecture Audit
- **Gap**: `src/app/(storefront)/cart/page.tsx` uses client-side fetching exclusively. This should be a Server Component leveraging `CartService` directly for instant loading.
- **Gap**: No global Cart Drawer (Slide-out cart). Premium boutiques rarely force customers to navigate to a new page to view their cart contents after adding an item.

## 9. Security Audit
- `CartService` correctly enforces `AuthService.requireAuth`.
- Ownership checks are robust (verifies `item.cartId === cart.id`).
- Backend remains the source of truth for pricing and availability during `_evaluateCart`.
- Safe from IDOR and client-side pricing manipulation.

## 10. Performance Audit
- **Gap**: `use-cart.tsx` does NOT implement optimistic UI updates. Every quantity change triggers a blocking API call, freezing the cart buttons (`isUpdating`) until the server responds. This feels sluggish.
- **Gap**: CSR initial load on the `/cart` page creates a waterfall: Document -> JS -> Auth Fetch -> Cart Fetch.

## 11. UX/UI Audit
- **Gap**: Clicking "Add to Cart" on the PDP just turns the button green and says "Added to Cart". It does not visually confirm the cart contents via a drawer.
- The empty state on `/cart` is basic and could be refined to the AHANKARA STUDIOS aesthetic.
- Quantity adjustment buttons are functional but unrefined during their disabled (loading) state.

## 12. Accessibility Audit
- Cart actions (remove, + / -) lack refined `aria-label`s specifying the product name (e.g., "Increase quantity for [Product]").
- Focus states are standard but not elevated.

## 13. Responsive Audit
- The cart table uses a standard `flex-col` to `lg:flex-row` pattern. Mobile layout hides the desktop row structure and uses a stacked view. It's functional but can be visually tightened.

## 14. SEO/Privacy Audit
- Cart is a private route. It needs explicit `robots: "noindex, nofollow"` metadata when converted to a Server Component.

## 15. Functionality Gap Matrix

| Area | Current State | Required State | Gap | Proposed Action |
| ---- | ------------- | -------------- | --- | --------------- |
| Rendering | Pure CSR | SSR Initial Load | Spinner flash | Convert `/cart` to Server Component |
| Interaction | Full Page Only | Global Drawer | Clunky UX | Create a Slide-out Cart Drawer |
| Mutations | Blocking Network | Optimistic UI | Sluggish UX | Add optimistic updates to `useCart` |
| Add To Cart | In-button text only | Opens Drawer | Low feedback | Open Cart Drawer on Add to Cart |
| Accessibility | Basic buttons | Explicit ARIA | Screen reader issues | Add precise `aria-label`s to controls |

## 16. C2 Regression Assessment
- Safe. The Homepage only interacts with the Cart indirectly via the Navbar icon.

## 17. C3 Regression Assessment
- Safe. Catalog pages do not currently implement quick-add-to-cart, only wishlist.

## 18. C4 Regression Assessment
- Slight Risk. `ProductForm.tsx` (C4) must be modified to trigger the new Cart Drawer upon successful addition, rather than just changing button text.

## 19. C5 Regression Assessment
- Safe. Authentication boundaries are securely respected by `CartService`.

## 20. C6 Regression Assessment
- Safe. Wishlist's `moveToCart` function uses `useCart`. It will automatically benefit from optimistic updates and should also trigger the Cart Drawer.

## 21. Recommended C7 Scope
The C7 scope must focus exclusively on the **Customer Cart**.
Objectives:
1. Refactor `/cart/page.tsx` into a Server Component.
2. Implement robust Optimistic UI inside `use-cart.tsx`.
3. Build a global Cart Drawer (Slide-out cart).
4. Update `ProductForm.tsx` and `WishlistClientControls` to open the Cart Drawer on successful add/move.
5. Elevate Cart UI to AHANKARA STUDIOS premium standard.

## 22. Proposed Stage B Files
- `src/app/(storefront)/cart/page.tsx`
- `src/app/(storefront)/cart/cart-client.tsx` (NEW)
- `src/hooks/use-cart.tsx`
- `src/components/cart/CartDrawer.tsx` (NEW)
- `src/components/layout/Navbar.tsx` (To integrate Drawer toggle)
- `src/components/product/ProductForm.tsx` (To trigger Drawer)
- `src/app/(storefront)/wishlist/wishlist-controls.tsx` (To trigger Drawer)

## 23. Files That Must Remain Untouched
- `src/server/services/cart.service.ts` (API architecture is already sound)
- `src/app/api/me/cart/route.ts`
- `src/app/(storefront)/checkout/page.tsx` (Checkout logic must wait for C8)

## 24. Proposed Stage B Implementation Plan
1. **Cart Drawer**: Build `CartDrawer.tsx` utilizing a modern sliding sheet component (or custom CSS). Integrate it into the layout/Navbar.
2. **Context Upgrade**: Update `use-cart.tsx` to handle `isCartOpen` state, and add optimistic updates to `updateItemQuantity` and `removeItem`.
3. **Server Component Migration**: Rewrite `/cart/page.tsx` to pre-fetch `CartService.getOrCreateCart(userId)` and pass it down.
4. **Integration**: Modify `ProductForm` and Wishlist `MoveToCartButton` to call `openCart()` after successful network responses.

## 25. Validation Plan
- `npx tsc --noEmit` & `npm run lint` & `npm run build`.
- Manual tests: Add to cart opens drawer; quantity changes are instantly reflected; refreshing page shows correct server-rendered cart without flash; logged out users are prompted correctly.

## 26. Risks / Concerns
- Implementing optimistic UI on Cart involves complex calculations (subtotal must accurately reflect quantity * unitPrice immediately before the server responds). The client context must accurately replicate `_evaluateCart` math during the optimistic phase to avoid jumpy totals.

## 27. Backend Dependency Assessment
- Completely relies on `CartService.getOrCreateCart`. The service accurately handles inventory constraint errors, which the client must catch and gracefully roll back.

## 28. Database Dependency Assessment
- Relies on `Cart` and `CartItem` models. No changes required.

## 29. C7 Stage A Conclusion
C7 Stage A is fully completed. The Cart feature is identified as the clear C7 priority. The existing architecture is secure but requires significant UI/UX and rendering upgrades to meet the premium brand standard. Ready for Stage B authorization.
