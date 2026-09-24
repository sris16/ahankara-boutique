# C6 STAGE A CUSTOMER WISHLIST AUDIT

## 1. Executive Summary
The existing Wishlist functionality provides a secure, authenticated experience for saving favorite products. The underlying `WishlistService` correctly respects user isolation and handles inventory status. However, there are significant architectural and user experience gaps: the Wishlist page is entirely client-rendered (resulting in loading spinners), `ProductCard` components lack quick-add Wishlist functionality, optimistic UI updates are missing, and unpublished products remain visible in customer wishlists.

## 2. Wishlist Route
- **Dedicated Route**: `src/app/(storefront)/wishlist/page.tsx`
- **Render Type**: Client Component (`"use client"`).
- **Data Loading**: Fetched entirely client-side via the `useWishlist()` hook upon mount.
- **Authentication**: Checked client-side using `useAuth()`. Unauthenticated users see a prompt to log in instead of being redirected via server middleware or layout.

## 3. Files Inspected
- `src/app/(storefront)/wishlist/page.tsx`
- `src/hooks/use-wishlist.tsx`
- `src/lib/api/wishlist.ts`
- `src/app/api/me/wishlist/route.ts`
- `src/app/api/me/wishlist/[wishlistItemId]/route.ts`
- `src/app/api/me/wishlist/[wishlistItemId]/move-to-cart/route.ts`
- `src/server/services/wishlist.service.ts`
- `src/components/catalog/ProductCard.tsx`
- `src/components/product/ProductForm.tsx`

## 4. Existing Wishlist Components
- `WishlistPage` (`src/app/(storefront)/wishlist/page.tsx`): Displays the wishlist grid, handles removal, and moves items to cart.
- `WishlistProvider` / `useWishlist`: Context managing the global state of the user's wishlist and syncing with `/api/me/wishlist`.
- `ProductForm`: Contains the only UI integration for adding/removing items from the wishlist on the product details page.

## 5. Existing Backend Wishlist Contract
The backend contracts are solid. `WishlistService` handles:
- `getWishlist(userId)`
- `addProduct(userId, data)`
- `removeProduct(userId, wishlistItemId)`
- `moveToCart(userId, wishlistItemId, data)`

## 6. Authentication Integration
- Integrates seamlessly with the existing `useAuth()` client hook.
- Server-side routes are protected by `AuthService.requireAuth(req.headers)`.
- No modifications needed to Better Auth mechanisms.

## 7. Authorization / Ownership Audit
- High security. `userId` is strictly derived from the server-side session token inside `AuthService.requireAuth`.
- `removeProduct` and `moveToCart` operations explicitly verify that `item.userId === userId` before acting.
- No IDOR vulnerabilities present.

## 8. Security Audit
- The client is never trusted for authorization or user identity.
- Data deletion is correctly scoped to the requester.
- Move-to-cart verifies the requested variant belongs to the actual product in the wishlist.

## 9. Product Data Contract
- **Gap Found**: `WishlistService.getWishlist()` fetches products without checking `status === 'PUBLISHED'`. If an admin unpublishes or archives a product, it continues to appear in the customer's wishlist, which could lead to broken links (`404` when clicking).
- The service dynamically calculates `effectiveStartingPrice` and `hasAvailableStock` at request time, ensuring no stale pricing is displayed.

## 10. API Loopback Audit
- No server-side API loopbacks exist because `src/app/(storefront)/wishlist/page.tsx` is implemented as a pure Client Component.

## 11. Server / Client Boundary Audit
- **Gap Found**: `src/app/(storefront)/wishlist/page.tsx` should be refactored into a Server Component. It currently relies entirely on client-side rendering, which creates an unnecessary flash of a loading spinner (`<Loader2>`). It should directly query `WishlistService.getWishlist` on the server for instant page load.

## 12. Performance Audit
- `useWishlist` does a full re-fetch (`refreshWishlist()`) every time an item is added, removed, or moved to the cart.
- **Gap Found**: Missing optimistic UI updates. Toggling wishlist status from the product page requires a round trip to update the heart icon's state.

## 13. ProductCard Integration Audit
- **Gap Found**: `src/components/catalog/ProductCard.tsx` currently has NO wishlist button (Heart icon). Users cannot add items to their wishlist from collection/catalog views. They must click into the product details page first.

## 14. UI / UX Audit
- **Wishlist Page**: The empty state uses basic text and requires refinement to match the premium editorial feel (generous whitespace, refined typography).
- **Product Details Integration**: Functional but lacks a smooth micro-interaction/optimistic update.

## 15. Accessibility Audit
- The Heart icon in `ProductForm` utilizes `aria-label`.
- `WishlistPage` removal buttons use `aria-label="Remove from wishlist"`.
- Buttons are keyboard-focusable, though focus styles could be refined.

## 16. Responsive Audit
- The `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` handles resizing adequately across breakpoints (320px to 1280px+).

## 17. SEO / Privacy Audit
- As a private, authenticated route, `/wishlist` does not need indexing. If converted to a Server Component, a `<meta name="robots" content="noindex" />` (or equivalent Next.js metadata) should be ensured.

## 18. Loading / Error / Empty States
- Present but basic. Empty state relies on a standard Lucide icon and default text.

## 19. C2 Regression Assessment
- Safe. Homepage components do not currently use the wishlist hook.

## 20. C3 Regression Assessment
- Modification of `ProductCard.tsx` to include wishlist capability poses a slight regression risk to C3 catalog views; UI bounds and touch targets must be tested carefully.

## 21. C4 Regression Assessment
- Safe. `ProductForm.tsx` is functionally intact.

## 22. C5 Regression Assessment
- Safe. Authentication boundaries are strictly respected.

## 23. Functionality Gap Matrix

| Area | Current State | Required State | Gap | Proposed Action |
|---|---|---|---|---|
| Wishlist Page Render | Client Component | Server Component | Flash of loading state | Convert page to Server Component, fetch data directly via `WishlistService`. |
| Product Status | Shows all items | Shows only PUBLISHED | Unpublished items appear | Filter unpublished products in `WishlistService.getWishlist`. |
| ProductCard UI | No wishlist button | Wishlist button included | Hard to favorite items | Add interactive Heart toggle to `ProductCard.tsx`. |
| UI State Updates | Re-fetches on mutation | Optimistic updates | Slow perceived performance | Implement optimistic state in `useWishlist`. |

## 24. Proposed Stage B Files
**Files to modify:**
- `src/app/(storefront)/wishlist/page.tsx`
- `src/components/catalog/ProductCard.tsx`
- `src/hooks/use-wishlist.tsx`
- `src/server/services/wishlist.service.ts`

**Files to create:**
- (Optional) Shared Server/Client components for wishlist rendering.

**Files that must remain untouched:**
- `src/app/(storefront)/account/layout.tsx`
- `src/hooks/use-auth.tsx`
- `src/lib/auth-client.ts`

## 25. Proposed C6 Stage B Implementation Plan
1. **Backend Refinement**: Update `WishlistService.getWishlist` to only return items where `product.status === 'PUBLISHED'`.
2. **Server-Side Rendered Wishlist**: Refactor `src/app/(storefront)/wishlist/page.tsx` into a Server Component. It will use `auth.api.getSession()` and `WishlistService.getWishlist()` to render instantly, eliminating the client-side loader.
3. **ProductCard Integration**: Inject an interactive Heart toggle button into `src/components/catalog/ProductCard.tsx`, utilizing optimistic updates.
4. **Optimistic Updates**: Update `src/hooks/use-wishlist.tsx` to optimistically modify the cache before awaiting the API response, providing instant feedback.
5. **Premium UI Refinement**: Upgrade the Wishlist empty state and grid items to match the AHANKARA STUDIOS aesthetic.

## 26. Validation Plan
- Run `npx tsc --noEmit`
- Run `npm run lint`
- Run `npm run build`
- **Manual Tests**:
  - Unpublish a product and ensure it vanishes from the wishlist.
  - Click heart on a `ProductCard` in the catalog; ensure it immediately fills.
  - Load the `/wishlist` route directly via URL; ensure no loading spinner flash.
  - Access `/wishlist` logged out; ensure proper redirection or elegant empty state.

## 27. Security Risks / Concerns
None detected. Backend user verification is sound.

## 28. Performance Risks / Concerns
Without optimistic UI updates, the repeated full fetches of the wishlist upon toggling can slow perceived responsiveness, especially on slow networks.

## 29. Backend Dependency Assessment
Relies entirely on `WishlistService`.

## 30. Database Dependency Assessment
Relies on `prisma.wishlistItem`.

## 31. C2–C5 Regression Assessment
Minimal risk, provided `ProductCard` updates do not disrupt catalog grid alignments.

## 32. C6 Stage A Conclusion
C6 Stage A is fully completed. The audit confirms the underlying logic is secure and functional, but identifies key architectural (SSR) and UX (Optimistic UI, ProductCard integration) gaps. Ready for Stage B authorization.
