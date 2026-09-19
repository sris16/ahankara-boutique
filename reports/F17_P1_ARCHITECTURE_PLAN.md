# F17 P1 — Architecture Plan

## 1. Executive Summary
This document provides the architecture plan for **F17: PDP Conversion & SEO Discoverability**. It dictates how to safely implement Related Products, Recently Viewed, Web Share, and SEO infrastructure (Sitemaps, robots.txt, JSON-LD) without altering the frozen backend or database schemas.

## 2. Inspect Current PDP
- **Route**: `src/app/(storefront)/products/[slug]/page.tsx`
- **Architecture**: Next.js Server Component. Fetches data via `apiClient.get(/api/products/${slug})`.
- **Status**:
  - Variant selection / pricing: IMPLEMENTED
  - Breadcrumbs: IMPLEMENTED
  - Related Products: MISSING
  - Recently Viewed: MISSING
  - Web Share: MISSING
  - JSON-LD Structured Data: MISSING

## 3. Related Products Architecture
**Strategy**: "You Might Also Like"
1. **Relation Strategy**: Leverage the existing `/api/products` endpoint which accepts `categoryId`.
2. **Fallback**: If the category returns fewer than 4 products, fallback to global `sortBy=newest` (or rely solely on category if preferred, but category is safest and most relevant).
3. **Product Count**: Limit to 4 products (`limit=4` or `limit=5` to ensure we have 4 after filtering).
4. **Current Product Exclusion**: The API does not natively support "exclude ID". We will fetch `limit=5`, filter out the current product's ID on the server, and slice to 4.
5. **Out of stock / Draft**: The existing public API automatically filters for `status=PUBLISHED` and `isActive=true`.
6. **Data Fetching Boundary**: A dedicated Server Component (`RelatedProducts`) wrapped in a React `<Suspense>` boundary. This ensures the main PDP renders instantly without waiting for the related products query.

## 4. Recently Viewed Architecture
**Strategy**: Client-side `localStorage`.
1. **Schema**: Store an array of slugs (e.g., `['black-dress', 'white-shirt']`).
2. **Limit**: Maximum 5 products.
3. **Exclusion**: The current PDP's slug is moved to the front of the array. When rendering "Recently Viewed", the current slug is excluded from the visual list (showing up to 4 historical products).
4. **Data Fetching**: Since we only store slugs (to avoid stale pricing/inventory in localStorage), the Client Component will hydrate and perform a parallel `Promise.all` fetch using `apiClient.get` for the historical slugs. This is safe, cached by Next.js, and avoids inventing a new batch API.
5. **Privacy**: No user IDs, tokens, or PII are stored.
6. **Error Handling**: Graceful failure if localStorage is blocked (Private Browsing) or JSON is malformed.

## 5. Web Share Architecture
**Strategy**: Native `navigator.share` with fallback.
1. **Component**: A lightweight Client Component (`ProductShareButton`).
2. **Behavior**: Checks `if (navigator.share)`. If true, invokes native OS sharing dialog.
3. **Fallback**: If unsupported (e.g., older desktop browsers), fall back to `navigator.clipboard.writeText(url)` and show a temporary "Copied to clipboard" toast/icon state.
4. **Data**: Uses the canonical URL of the current window (`window.location.href`).

## 6. Product SEO Metadata & JSON-LD
**Strategy**: Native Next.js metadata and JSON-LD injection.
1. **JSON-LD**: Inject a `<script type="application/ld+json">` tag in the PDP Server Component.
2. **Schema.org/Product**:
   - `name`: `product.name`
   - `description`: `product.shortDescription || product.description`
   - `image`: `product.images[0]?.secureUrl`
   - `sku`: `product.variants[0]?.sku` (first variant as representative)
   - `brand`: Hardcoded safe fallback `{"@type": "Brand", "name": "AHANKARA STUDIOS"}`.
   - `offers`: `priceCurrency: "INR"`, `price: currentPrice / 100`, `availability`: mapped from `hasAvailableStock` (`https://schema.org/InStock` vs `OutOfStock`).
3. **Constraint**: Do NOT invent `aggregateRating` or `review` schemas, as the backend does not support reviews.

## 7. Sitemap & Robots Architecture
**Strategy**: Dynamic Next.js route handlers.
1. **`src/app/sitemap.ts`**:
   - Directly imports `prisma` (safe in Next.js App Router for server-only files) OR uses existing server services to retrieve all published Products, active Categories, and active Collections.
   - Using services is safer to respect business logic: `ProductService.getPublicProducts({ limit: 1000 })`, etc.
   - URLs generated: `/`, `/products`, `/products/[slug]`, `/products?category=[id]`.
2. **`src/app/robots.ts`**:
   - `User-Agent: *`
   - `Allow: /`
   - `Disallow: /admin, /account, /api, /checkout, /cart, /wishlist`
3. **Canonical Base URL**: Utilize `process.env.BETTER_AUTH_URL` or fallback to `http://localhost:3000` to construct absolute URLs required by sitemaps.

## 8. Performance Strategy
- **Suspense**: `<RelatedProducts>` will be wrapped in `<Suspense fallback={<ProductCardGridSkeleton />}>`.
- **Client Hydration**: `<RecentlyViewed>` will only fetch and render after initial client mount (using `useEffect`) to prevent hydration mismatch and avoid blocking the main server thread.

## 9. File Plan
**CREATE**:
- `src/components/product/RelatedProducts.tsx` (Server Component)
- `src/components/product/RecentlyViewed.tsx` (Client Component)
- `src/components/product/ProductShareButton.tsx` (Client Component)
- `src/components/product/ProductJsonLd.tsx` (Server Component)
- `src/app/sitemap.ts` (Server Route)
- `src/app/robots.ts` (Server Route)

**MODIFY**:
- `src/app/(storefront)/products/[slug]/page.tsx` (Integrate above components)

## 10. API Contract
- **F17 requires ZERO backend API changes.**
- `RelatedProducts` uses existing: `GET /api/products?categoryId=[id]&limit=5`
- `RecentlyViewed` uses existing: `GET /api/products/[slug]`

## 11. Database & Dependencies
- **Database**: NO Prisma changes, NO migrations, NO seeds.
- **Dependencies**: NO new dependencies. Native Web Share, localStorage, and React Suspense are sufficient.

## 12. Frozen Phase Protection
- **F13, F14, F15, F16** remain completely untouched. Changes are strictly confined to the Storefront PDP and root SEO files.

## 13. Testing Strategy
- **Related Products**: Verify category match, current product exclusion, and empty states.
- **Recently Viewed**: Verify localStorage deduplication, ordering (newest first), max length of 5, and hydration safety.
- **SEO**: Validate `sitemap.xml` format and JSON-LD schema using Google Rich Results Test (locally via HTML inspection).

## 14. P2 Implementation Plan
- **P2.1**: Implement JSON-LD (`ProductJsonLd.tsx`) and Native Share (`ProductShareButton.tsx`).
- **P2.2**: Implement `RelatedProducts.tsx` with `<Suspense>`.
- **P2.3**: Implement `RecentlyViewed.tsx` with localStorage caching.
- **P2.4**: Integrate all components into the PDP.
- **P2.5**: Implement `sitemap.ts` and `robots.ts`.
- **P2.6**: Final QA and Regression Testing.

**F17 P1 STATUS: READY FOR ARCHITECTURE APPROVAL**
