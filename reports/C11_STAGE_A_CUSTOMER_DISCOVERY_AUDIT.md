# C11 STAGE A CUSTOMER DISCOVERY AUDIT

## 1. Executive Summary
This audit inspects the remaining customer-facing features of the Ahankara Studios storefront. The C2-C10 phases have established the core commerce flow (Home, Catalog, PDP, Auth, Cart, Checkout, Orders, Account). However, there is a distinct gap in "Content Discovery and Information Architecture." Specifically, while products can be filtered by Category or Collection IDs, there are no dedicated Category or Collection landing pages utilizing the rich editorial metadata (images, descriptions, SEO tags) stored in the database. Furthermore, essential static legal/informational pages (Privacy Policy, Terms of Service, About, Contact) are completely missing, despite being referenced as placeholders in the global Footer. C11 will address these content and discovery gaps.

## 2. Identified C11 Scope
The scope encompasses:
1. **Category Landing Pages**: Dedicated pages at `/categories/[slug]` that display the category's hero image, description, and metadata before rendering the associated product grid.
2. **Collection Landing Pages**: Dedicated pages at `/collections/[slug]` that display the collection's hero image, editorial description, date constraints, and metadata before rendering the associated product grid.
3. **Static Legal & Info Pages**: Implementation of `/privacy-policy`, `/terms-of-service`, `/about`, and `/contact` to resolve the `cursor-not-allowed` placeholders in the footer.

## 3. Existing Architecture
Currently, users discovering categories or collections via the homepage (`/`) or navbar are routed directly to `/products?category=[id]` or `/products?collection=[slug]`.
The `ProductsPage` Server Component reads these query parameters and passes them to `ProductService.getPublicProducts()`. The page header statically displays "All Pieces" instead of resolving the category/collection metadata, entirely bypassing the rich data stored in the `Category` and `Collection` models.
For static pages, there are no route folders.

## 4. Route Inventory
- `src/app/(storefront)/categories/[slug]/page.tsx` - **MISSING**
- `src/app/(storefront)/collections/[slug]/page.tsx` - **MISSING**
- `src/app/(storefront)/privacy-policy/page.tsx` - **MISSING**
- `src/app/(storefront)/terms-of-service/page.tsx` - **MISSING**
- `src/app/(storefront)/about/page.tsx` - **MISSING**
- `src/app/(storefront)/contact/page.tsx` - **MISSING**

## 5. Component Inventory
- `src/components/layout/Footer.tsx` - Contains dead placeholders for Privacy Policy and Terms of Service.
- `src/components/layout/Navbar.tsx` - Links to `/products` and `/products?sortBy=newest`, but has no direct links to standalone category/collection hubs.

## 6. API Inventory
- `src/app/api/categories/[slug]/route.ts` - **EXISTS** (Fetches category by slug via `CategoryService`)
- `src/app/api/collections/[slug]/route.ts` - **EXISTS** (Fetches collection by slug via `CollectionService`)

## 7. Service Inventory
- `CategoryService.getCategoryBySlug(slug: string, activeOnly: boolean)` - **EXISTS**
- `CollectionService.getCollectionBySlug(slug: string, activeOnly: boolean)` - **EXISTS**

## 8. Database / Prisma Dependencies
- `Category` model - Contains `imageUrl`, `description`, `metaTitle`, `metaDescription`. Currently unused by frontend.
- `Collection` model - Contains `imageUrl`, `description`, `metaTitle`, `metaDescription`, `startsAt`, `endsAt`. Currently unused by frontend except for homepage cards.

## 9. Authentication Audit
- Public discovery pages and static pages require NO authentication.
- Must remain accessible to unauthenticated visitors and web crawlers.

## 10. Authorization / IDOR Audit
- The services use `activeOnly = true` for public requests, properly hiding `DRAFT` or inactive categories/collections.
- No IDOR risks as these are inherently public data sets.

## 11. Server / Client Boundary Audit
- Category and Collection landing pages should be 100% Server Components to maximize SEO benefits using Next.js App Router metadata generation.
- No client-side data fetching should occur for these discovery pages.

## 12. Functionality Audit
- **Category Landings**: MISSING.
- **Collection Landings**: MISSING.
- **Static Pages**: MISSING.
- **Footer Links**: BROKEN (intentionally disabled via CSS).

## 13. UI / UX Audit
- Without landing pages, the transition from clicking a beautiful "Summer Collection" card on the homepage to a generic "All Pieces" catalog grid is abrupt and breaks the premium editorial immersion expected of AHANKARA STUDIOS.
- The lack of an "About" or "Contact" page degrades brand trust.

## 14. Accessibility Audit
- The `cursor-not-allowed` spans in the footer are technically not accessible navigation landmarks. They must be replaced with true `<Link>` elements.

## 15. Responsive Audit
- To be determined during Stage B implementation. The new landing page heroes must scale properly on mobile.

## 16. Performance Audit
- Since the Category and Collection pages will be Server Components, they can leverage Next.js caching.
- Product grids embedded in these pages can reuse the existing `ProductCard` components.

## 17. SEO / Privacy Audit
- **Critical SEO Gap**: Missing category/collection landing pages means missed opportunities for indexing rich keywords like "Premium Summer Dresses Collection".
- Stage B must implement dynamic `generateMetadata` for these routes utilizing the database's `metaTitle` and `metaDescription` fields.
- Static legal pages must have `robots: { index: true }` or allow default indexing.

## 18. Security Audit
- No sensitive data exposed.
- Only `active` and public entities will be queried.

## 19. Loading / Error / Empty State Audit
- Custom `not-found.tsx` states should be utilized if a category or collection slug is invalid or inactive.

## 20. Regression Assessment
- Modifying `Footer.tsx` will have a global impact but carries zero functional regression risk.
- Reusing `CatalogFilters` or `ProductCard` on the new landing pages should be done via composition, avoiding changes to the base C3 catalog code.

## 21. Functionality Gap Matrix
| Area | Current State | Required State | Gap | Severity | Stage B Recommendation |
| ---- | ------------- | -------------- | --- | -------- | ---------------------- |
| Category Landing | Redirects to `/products?category=id` | Dedicated `/categories/[slug]` | Complete | HIGH | Build RSC landing page |
| Collection Landing | Redirects to `/products?collection=slug` | Dedicated `/collections/[slug]` | Complete | HIGH | Build RSC landing page |
| Legal Pages | Placeholders in Footer | Real pages at `/privacy-policy`, etc. | Complete | MEDIUM | Build static RSC pages |
| Footer Navigation | Spans with `cursor-not-allowed` | Functional Next.js `<Link>` elements | Complete | LOW | Update Footer.tsx |

## 22. Proposed Stage B Scope
- Implement dynamic Server Components for `/categories/[slug]` and `/collections/[slug]`.
- These pages will fetch the entity data, render an editorial hero section (image + description), and below it, render the associated products.
- Implement static text-based Server Components for `/privacy-policy`, `/terms-of-service`, `/about`, and `/contact`.
- Update `Footer.tsx` to link to these new routes.

## 23. Proposed Stage B Files
### Files to modify:
- `src/components/layout/Footer.tsx`

### Files to create:
- `src/app/(storefront)/categories/[slug]/page.tsx`
- `src/app/(storefront)/collections/[slug]/page.tsx`
- `src/app/(storefront)/privacy-policy/page.tsx`
- `src/app/(storefront)/terms-of-service/page.tsx`
- `src/app/(storefront)/about/page.tsx`
- `src/app/(storefront)/contact/page.tsx`

## 24. Files That Must Remain Untouched
- `src/app/(storefront)/products/page.tsx` (C3)
- `src/app/(storefront)/page.tsx` (C2)
- All Backend Services (C1-C12)
- Prisma Schema
- C7, C8, C9, C10 components and logic.

## 25. Backend Dependency Assessment
NONE. The required `CategoryService.getCategoryBySlug` and `CollectionService.getCollectionBySlug` methods already exist and are fully functional.

## 26. Database Dependency Assessment
NONE. The database schema perfectly supports this with `metaTitle`, `imageUrl`, and `description` fields.

## 27. Risks / Concerns
- We must ensure that the new landing pages do not conflict with the existing `/products` filtering logic. The landing pages should serve as an editorial wrapper that then displays the products, providing a richer entry point.

## 28. Validation Plan
### Automated
```bash
npx tsc --noEmit
npm run lint
npm run build
```
### Manual
- Verify navigating to `/collections/[slug]` renders the correct hero image and metadata.
- Verify 404 is thrown for invalid/inactive slugs.
- Verify Footer links are functional.
- Verify responsive layout of the new landing pages.

## 29. C11 Stage A Conclusion
C11 Stage A audit successfully identified that while the functional catalog is complete, the editorial discovery experience for Categories and Collections is missing. Implementing these landing pages, alongside necessary static legal pages, will complete the Information Architecture of the storefront.

---
C2 — CLOSED
C3 — CLOSED
C4 — CLOSED
C5 — CLOSED
C6 — CLOSED
C7 — CLOSED
C8 — CLOSED
C9 — CLOSED
C10 — CLOSED

C11 Stage A — COMPLETE
C11 Stage B — NOT STARTED
C11 — NOT STARTED

STATUS — WAITING FOR EXPLICIT AUTHORIZATION
