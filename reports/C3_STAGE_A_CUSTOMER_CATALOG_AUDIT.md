# C3 STAGE A - CUSTOMER CATALOG AUDIT

## 1. Executive Summary
This document provides a strict, read-only audit of the existing AHANKARA STUDIOS customer product catalog. The catalog currently functions via URL-driven query parameters managing search, category, collection, price, and pagination states. However, the root `page.tsx` suffers from an architectural anti-pattern where a Server Component makes HTTP loopback requests to internal `/api` routes instead of invoking the existing backend services directly. Stage B will focus on resolving this data-fetching architecture, elevating the visual design to the premium brand standard, and introducing optimal image loading, without altering backend contracts or database schemas.

## 2. Current Catalog Architecture
- **State Management:** URL-driven via query parameters (`q`, `category`, `collection`, `sort`, `page`, `minPrice`, `maxPrice`).
- **Data Fetching:** React Server Component (`page.tsx`) wrapping Client Components for interaction.
- **Flaw:** Uses `apiClient.get` (HTTP loopback) to fetch data from its own Next.js `/api` endpoints on the server.

## 3. Route Inventory
- `src/app/(storefront)/products/page.tsx`: The primary catalog page.
- Category and Collection specific routes do not exist. Navigation is entirely handled by `?category=id` and `?collection=slug` query parameters on `/products`.

## 4. Component Inventory
- **CatalogFilters.tsx**: Client component. Renders desktop sidebar and mobile drawer. Handles Search input, Sort select, Category list, Collection list, and Price range inputs.
- **FilterChips.tsx**: Client component. Displays active URL filters with remove functionality.
- **CatalogPagination.tsx**: Renders page links using `next/link`.
- **ProductCard.tsx**: Reusable Server Component. Presents product summary, badges, and pricing.

## 5. Product API Contract
**Endpoint:** `GET /api/products`
**Query parameters:**
- `search` (string)
- `categoryId` (string)
- `collectionSlug` (string)
- `sortBy` (string: "newest", "price-low-high", "price-high-low", "name")
- `page` (number)
- `limit` (number, defaults to 4 on homepage, 12 typically, handled by service)
- `minPrice` (number in paise)
- `maxPrice` (number in paise)
**Response shape:** `{ data: ProductSummary[], meta: PaginationMeta }`

## 6. ProductService Contract
- `ProductService.getPublicProducts(query)`
- Validates query via `productListFilterSchema`.
- Applies `status = PUBLISHED` and `category.isActive = true` rules.
- Directly supports all current catalog filters.
- Maps Prisma results into DTOs containing `hasAvailableStock`.

## 7. Search Architecture
- **Implemented:** Yes, via the `q` URL parameter.
- **Execution:** Server-side via `ProductService` (`name` and `shortDescription` ILIKE search).
- **UI:** A text input in `CatalogFilters.tsx`.
- **Debouncing:** None (form submit triggers URL change).
- **Empty State:** Handled gracefully with a fallback message in `page.tsx`.

## 8. Filter Architecture
- **Category:** Passed as `category=id`.
- **Collection:** Passed as `collection=slug`.
- **Price:** Passed as `minPrice` and `maxPrice` (in paise).
- **State:** Entirely URL-driven. No duplicate React state except for controlled inputs before submission.

## 9. Sorting Architecture
- **Options:** Newest, Price: Low to High, Price: High to Low, Name.
- **State:** URL parameter `sort`.
- **Default:** "newest" if not provided.

## 10. Pagination Architecture
- **Implementation:** URL parameter `page`.
- **Meta:** `ProductListResponse` provides `total`, `page`, `limit`, and `totalPages`.
- **Behavior:** `CatalogPagination.tsx` generates direct `next/link` anchors (no `onClick` push, highly accessible). Returns to `page=1` automatically when any filter changes.

## 11. Category Architecture
- Fetched via `CategoryService.getCategoryTree()`.
- Listed as clickable links in the filter sidebar.
- No dedicated `/categories/[slug]` routes exist; it is fully integrated into `/products`.

## 12. Collection Architecture
- Fetched via `CollectionService.getCollections()`.
- Listed as clickable links in the filter sidebar.
- No dedicated `/collections/[slug]` routes exist.

## 13. URL State Architecture
- Perfect compliance with Next.js best practices: Shareable, refreshable, server-renderable URLs.
- E.g., `/products?q=dress&sort=price-low-high&page=2`.
- Back/forward navigation works natively.

## 14. Server/Client Boundary
- `page.tsx` is an RSC (Server Component).
- `CatalogFilters.tsx` and `FilterChips.tsx` are Client Components using `useRouter` and `useSearchParams`.
- **Issue:** The RSC makes an internal HTTP fetch (`apiClient.get`) instead of directly invoking `ProductService.getPublicProducts`.

## 15. Serialization Analysis
- `apiClient.get` parses JSON, so current objects are plain JSON.
- If we switch to direct `ProductService` calls, dates will be `Date` objects, which Next.js App Router RSCs can safely pass to Client Components. However, since `ProductCard` is a Server Component, serialization across the network boundary is a non-issue.

## 16. Image Architecture
- `ProductCard.tsx` uses `<Image>` (Updated in C2).
- Need to ensure catalog respects layout stability.

## 17. Loading State Analysis
- `page.tsx` uses `<Suspense>` with a grid of 8 `ProductCardSkeleton` components.
- No global `loading.tsx` intercepting the entire `/products` route, which means the filters render immediately while products suspend (a good UX pattern).

## 18. Empty State Analysis
- Functional. Displays "No pieces found" when `data.length === 0`.
- Could use an aesthetic upgrade to match the premium brand.

## 19. Error State Analysis
- Handled gracefully via `.catch(() => null)` in data fetching.
- A global `error.tsx` exists (created in C1) to catch catastrophic failures.

## 20. Accessibility Analysis
- Form inputs have placeholders but lack explicit `<label>` tags.
- Links and pagination are keyboard navigable.
- Mobile filter trigger uses `aria-expanded` and `aria-controls`.

## 21. Responsive Analysis
- Desktop: Sidebar (`w-64`) on the left, grid on the right.
- Mobile: Sidebar hidden, "Filter & Sort" button opens a fixed drawer.
- Valid standard implementation, requires visual polishing.

## 22. SEO Analysis
- Basic `<title>` and `<description>` metadata exists.
- URL parameters may cause duplicate content indexing if canonical tags are not strictly enforced in layout.

## 23. Performance Analysis
- The primary issue is the API loopback latency in `page.tsx`.
- Images are optimized (C2).

## 24. Security Analysis
- Safe. `ProductService.getPublicProducts` enforces `PUBLISHED` status internally. No risk of IDOR or unauthorized visibility.

## 25. C2 Regression Compatibility
- Fully compatible. The C2 homepage uses identical URLs (`/products?collection=...`, `/products?sortBy=newest`) which route correctly.

## 26. Protected Dependencies
- `src/server/services/product.service.ts`
- `src/server/services/category.service.ts`
- `src/server/services/collection.service.ts`
- `prisma/schema.prisma`

## 27. Functionality Gap Matrix

| Area | Current State | Desired C3 State | Gap | Severity |
| ---- | ------------- | ---------------- | --- | -------- |
| Architecture | Internal API loopback | Direct Service invocation | High | Critical |
| Aesthetics | Functional but generic | Premium AHANKARA styling | High | High |
| Accessibility | Missing explicit labels | Fully compliant | Medium | Medium |
| Empty States | Basic text | Premium branded empty state | Low | Low |

---

## 30. PROPOSED C3 STAGE B PLAN
1. **Refactor Data Fetching:** Replace `apiClient.get` with direct calls to `ProductService`, `CategoryService`, and `CollectionService` in `page.tsx`.
2. **Elevate Catalog Aesthetics:** Refine `page.tsx` and filter components to match the "quiet luxury" brand. Adjust typography, whitespace, and colors.
3. **Accessibility:** Add `aria-label` or `<label>` to Search and Price inputs in `CatalogFilters.tsx`.
4. **Validation:** Run TypeScript, Lint, and Build checks.

## 31. EXACT FILE CHANGE PLAN
**Files likely to be modified in C3 Stage B:**
- `src/app/(storefront)/products/page.tsx`
- `src/components/catalog/CatalogFilters.tsx`
- `src/components/catalog/FilterChips.tsx`

**Files likely to be created in C3 Stage B:**
- None

**Files that must remain protected:**
- `src/server/services/*.ts`
- `src/app/api/**/*.ts`
- `prisma/schema.prisma`

## 32. BACKEND DEPENDENCY ASSESSMENT
C3 Stage B can be completed using existing services and APIs. No backend changes are necessary.

## 33. DATABASE DEPENDENCY ASSESSMENT
No database changes anticipated.

## 34. SECURITY RISK ASSESSMENT
No immediate risks. Current query handling is well-validated by zod schemas in the service layer.

## 35. PERFORMANCE RISK ASSESSMENT
Switching to direct service invocation will improve TTFB significantly. Client JS is minimal (only filters/drawers).

## 36. C3 STAGE B TESTING PLAN
- **Functional:** Verify sorting, filtering, and pagination URLs correctly query the database.
- **Responsive:** Test mobile filter drawer across 320px-430px bounds. Verify grid wraps correctly.
- **Technical:** Execute `npx tsc --noEmit && npm run lint && npm run build`.
