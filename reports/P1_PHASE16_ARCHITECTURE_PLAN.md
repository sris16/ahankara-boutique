# P1 PHASE 16 ARCHITECTURE PLAN

## 1. Executive Summary
This architecture plan outlines the design for Phase 16: Search, Filters, and Discovery Refinement for the AHANKARA STUDIOS storefront. Building upon the solid foundation established in previous phases, F16 focuses on enhancing the user experience for discovering products. The plan details the implementation of global navbar search, price range filtering, active filter chips, advanced numbered pagination, and improved mobile UX, all while strictly preserving existing backend contracts, F13-F15 functionality, and performance optimization through URL-driven state management.

## 2. Current-State Constraints
- The backend API (`/api/products`) supports `search`, `categoryId`, `collectionSlug`, `minPrice`, `maxPrice`, `sortBy`, `page`, and `limit`.
- The backend does NOT currently support an `availability` or `inStock` query parameter for filtering products.
- Prices in the backend are represented in paise and must be converted to rupees in the frontend.
- `CatalogFilters` currently controls route navigation via `URLSearchParams`.
- Global `Navbar` currently lacks a search input.
- F13 (Fulfillment), F14 (Coupons), and F15 (Customer Accounts) are strictly frozen.

## 3. F16 Goals
1. Make products easily discoverable from any page via a global Navbar search.
2. Introduce advanced filtering (price ranges) and active filter chips for transparency.
3. Improve pagination with numbered page navigation.
4. Enhance the mobile filter drawer with robust accessibility (focus trapping, ARIA).
5. Ensure the URL remains the single source of truth for all discovery state.
6. Preserve the authority and structure of the backend catalog API.

## 4. Search Architecture
- **Global Search in Navbar**:
  - **Desktop Presentation**: An expandable search input or a sleek, persistent inline input in the Navbar, aligning with a premium aesthetic.
  - **Mobile Presentation**: A search icon in the mobile menu or header that expands into a full-width input.
  - **Interaction**: Submit-based (pressing Enter or clicking a search icon). This avoids unnecessary API thrashing and the complexity of debouncing client/server requests.
  - **Destination**: On submit, navigate to `/products?q=<encoded-query>`.
  - **Clear Behavior**: An 'X' button inside the input to quickly clear the text.
- **Why Submit-Based?**: The current architecture uses Server Components (`ProductsPage`) for fetching. Debouncing or instant search would require migrating the entire product grid to a Client Component or relying heavily on `router.refresh()`/`router.push()`, which could cause UX jarring or excessive server loads without proper caching. Submit-based search keeps the architecture simple and robust.

## 5. Filter Architecture
- **Extension of `CatalogFilters`**:
  - Retain `category`, `collection`, and `sort`.
  - Introduce `Price Inputs` for minimum and maximum bounds.
- **Price Handling UI**: Users will input prices in Rupees. The component will convert these to Paise when updating the URL (`value * 100`) and vice-versa when parsing the URL.
- **Application Behavior**:
  - Desktop: Filters apply immediately upon input blur or dropdown selection, updating the URL.
  - Mobile: Filters are adjusted within the drawer and applied *immediately* (as `CatalogFilters` currently does), though we could consider an "Apply" button to prevent repeated background requests if multiple filters are changed rapidly. Given the current `router.push()` architecture, immediate application is consistent.

## 6. Price Handling
- **Boundary**: Backend uses paise. URL parameters `minPrice` and `maxPrice` will store values in paise to perfectly match backend expectations. Frontend UI will display and accept inputs in Rupees.
- **Validation**:
  - Minimum allowed value: 0 (Rupees).
  - Empty values: Omitted from the URL.
  - Invalid range handling: If `minPrice` > `maxPrice`, the UI will automatically swap them or clamp the `maxPrice` to `minPrice`.
  - Decimals: Stripped or rounded in the UI to maintain clean integer Rupee amounts before converting to paise.

## 7. Availability Strategy
- **Backend Verification**: The backend `productListFilterSchema` does NOT currently support an `availability`, `inStock`, or `status` parameter that exposes stock availability as a filter.
- **Decision**: Backend extension is strictly required to implement availability filtering cleanly at the database query level. Doing client-side filtering would require fetching all products, which breaks pagination.
- **Action**: Availability filtering will remain OUT OF SCOPE for F16 to avoid modifying the backend database query and API contract.

## 8. Active Filter Chips
- **Design**: A new `FilterChips` component placed above the product grid on the `/products` page.
- **Behavior**:
  - Renders a dismissible "chip" for each active parameter: `q`, `category` (resolved to name), `collection` (resolved to name), `minPrice` / `maxPrice`.
  - **Removing a chip**: Updates the URL by `params.delete(key)` and sets `params.set('page', '1')`. Preserves all other parameters.
  - **Clear All**: Deletes all discovery parameters and navigates to `/products`.

## 9. Pagination Architecture
- **Design**: Upgrade `CatalogPagination` to support numbered pages.
- **Window Algorithm**: Show first page, last page, current page, and +/- 1 page around the current page, using ellipses (`...`) for gaps.
- **Preservation**: The `buildPageUrl` function already correctly clones the existing `searchParams` and overrides only the `page` parameter. This ensures all active filters and search queries are preserved.
- **Disabled States**: Prev/Next buttons disable when on the first/last page respectively.

## 10. Mobile Filter Architecture
- **UX Improvements**: The mobile drawer will be updated for strict accessibility.
- **Accessibility Requirements**:
  - Trigger button gets `aria-expanded` and `aria-controls`.
  - Drawer gets `role="dialog"` and `aria-modal="true"`.
  - Focus trapping: Pressing Tab cycles within the drawer.
  - Escape key closes the drawer.
  - Clicking the backdrop closes the drawer.
  - Body scrolling is prevented (`overflow: hidden` on `body`) when the drawer is open.

## 11. Desktop Filter Architecture
- **Organization**: The sidebar (`CatalogFilters`) will present filters vertically.
- **Sections**:
  - Search (existing)
  - Sort (existing)
  - Categories (existing)
  - Collections (existing)
  - Price Range (new: Min/Max inputs)
- **Visibility**: Sections will remain always visible (not collapsible) to minimize click fatigue, as the current list of categories/collections is manageable.

## 12. Category/Collection Discovery
- **Global Navbar**: We will add simple navigation links for "New Arrivals" and "Collections" (already present and pointing to `/products`). We will refrain from building complex mega-menus or category dropdowns in the Navbar to avoid excessive complexity and mobile menu bloat. Discovery relies heavily on the dedicated `/products` page and homepage sections.

## 13. URL State Architecture
- **Canonical Route**: `/products`
- **Parameters**: `q`, `category` (UUID), `collection` (Slug), `sort` (enum), `page` (integer), `minPrice` (paise), `maxPrice` (paise).
- **Rules**:
  - Default values (e.g., page 1, sort newest) can be omitted from the URL to keep it clean.
  - Any change to search or filters *must* reset the `page` parameter to `1`.
  - Browser Back/Forward acts natively since all state is pushed to the Next.js router.
  - Copied URLs accurately reflect the exact discovery state.

## 14. Server/Client Boundaries
- **SERVER**:
  - `ProductsPage` (app/products/page.tsx): Reads search parameters, fetches data, renders grid.
  - `ProductCard`: Server-rendered for optimal performance and SEO.
- **CLIENT**:
  - `Navbar` (existing): Managing mobile menu state and search input.
  - `CatalogFilters` (existing): Managing input state and router pushing.
  - `FilterChips`: Client component to manage removing parameters dynamically.
  - `CatalogPagination` (existing inline -> moved to client if interaction demands, but can remain server-rendered UI utilizing standard `<Link>` tags).

## 15. API Contract
- **Reuse**: The existing `GET /api/products` endpoint via `apiClient.get`.
- **No changes** will be made to `product.service.ts` or `product.validator.ts`.

## 16. Accessibility Architecture
- **Labels**: All inputs (Search, Min Price, Max Price) will have clear associated labels or `aria-label` attributes.
- **Semantic HTML**: `<nav>` for pagination, `<ul>`/`<li>` for filter lists, `<button>` for actions.
- **Screen Readers**: Using `aria-live="polite"` for empty search states or result counts (e.g., "Showing X of Y results").

## 17. Performance Architecture
- **Data Fetching**: Kept entirely on the Server Component level. No duplicate client-side fetching.
- **Transitions**: Native Next.js `<Link>` and `router.push` ensure smooth, cache-aware transitions.
- **Images**: `next/image` or existing optimized `<img>` tags on product cards using Cloudinary secure URLs.

## 18. Responsive Architecture
- **Desktop**: 64-width sidebar (`aside`) on the left, flexible product grid on the right.
- **Tablet**: Adjust grid columns to 3 (or 2 depending on screen size), sidebar remains visible until mobile breakpoint.
- **Mobile**: Sidebar hides, replaced by a sticky "Filter & Sort" toggle button that summons the accessible drawer. Grid reduces to 2 columns.

## 19. Error/Empty/Loading Architecture
- **No Search Results**: "We couldn't find anything matching '[Query]'." Provide a button to "Clear Search".
- **Filter Empty State**: "No pieces found for the selected filters." Provide a "Clear All Filters" button.
- **Loading State**: Existing `Suspense` boundary utilizing `ProductCardSkeleton`.
- **API Failure**: Gracefully handled; `apiClient` catch blocks return empty arrays, falling back to empty states rather than crashing the page.

## 20. Component/File Plan
- **Modify**: `src/components/layout/Navbar.tsx` (Add search input).
- **Modify**: `src/app/(storefront)/products/page.tsx` (Integrate `FilterChips`).
- **Modify**: `src/components/catalog/CatalogFilters.tsx` (Add price range UI, improve mobile accessibility).
- **Modify**: `src/components/catalog/CatalogPagination.tsx` (Create dedicated file, implement numbered window logic).
- **Create**: `src/components/catalog/FilterChips.tsx` (New component).

## 21. Security
- Query parameters remain fully validated by the backend Zod schemas (`productListFilterSchema`).
- No sensitive data is placed in the URL.
- The frontend strictly respects backend authority on pricing and availability.

## 22. Testing Strategy
- **Search**: Enter text in Navbar, submit, verify `/products?q=` routing, verify empty state.
- **Filters**: Enter Min/Max price, apply, verify conversion to paise in URL, verify backend respect.
- **Chips**: Click 'X' on a category chip, verify parameter deletion and page reset.
- **Pagination**: Click page 3, verify `page=3` in URL, verify filters are preserved.
- **Mobile**: Open filter drawer, verify Tab key trapping, verify Escape closes it, prevent body scroll.
- **Regression**: Ensure F13-F15 routes and components remain untouched.

## 23. Scope / Non-Scope
- **IN SCOPE**: Global Search, Price Filtering, Filter Chips, Numbered Pagination, Mobile UX.
- **NOT IN SCOPE**: Autocomplete, debounced search, availability filtering (requires backend change), infinite scroll, Quick Add-to-Cart.

## 24. F13/F14/F15 Freeze Protection
- This architectural plan strictly isolates all changes to `src/app/(storefront)/products/` and `src/components/catalog/` and the `Navbar`.
- The Admin, Customer Account, Orders, and Database layers are structurally isolated and will not be impacted.

## 25. P1 Conclusion
P1 STATUS: COMPLETE — READY FOR ARCHITECTURE APPROVAL
