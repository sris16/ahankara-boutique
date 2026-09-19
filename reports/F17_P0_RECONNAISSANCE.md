# F17 P0 — Reconnaissance Report

## 1. Executive Summary
Phase 17 P0 reconnaissance has been completed. The backend is extremely mature (supporting complex cancellation/return/exchange and fulfillment state machines), while the frontend has caught up significantly through F16 (Search/Discovery). The largest remaining product gap is in **cross-selling and organic discoverability**. The frontend currently strands users on the Product Detail Page without automated discovery loops (Related Products) or history (Recently Viewed), and lacks technical SEO infrastructure (Sitemaps, JSON-LD) essential for driving organic traffic to a high-end boutique.

## 2. Current Frontend Architecture
- **App Router Strategy**: Server Components prioritized for data fetching (PDP, Catalog, Account) with targeted Client Components for interactivity (Forms, Dialogs, Cart).
- **Storefront**: Fully responsive, featuring a static marketing homepage (`StorefrontHomepage`), a dynamic catalog (`ProductsPage`), and a robust PDP (`ProductPage`).
- **Cart/Checkout**: Mature, secure, handling variant availability checks, coupon validation, and multi-address management (F6-F7).
- **Customer Account**: Comprehensive profile, address book, and deep order history with post-purchase actions (F8/F9/F15).

## 3. Current Backend Capabilities
- **Prisma Schema**: Highly developed up to V12. Includes sophisticated order routing, multi-provider shipping, inventory transactions, and coupons.
- **Notable Missing Backend Features**: Product Reviews/Ratings, Customer Notifications/Transactional Emails (outside of Auth OTPs), and CMS/Marketing Banners are *not* supported by the current schema.
- **Product Retrieval**: Fully supports querying by `categoryId`, `collectionId`, `limit`, and `sortBy` via `ProductService` and `/api/products`.

## 4. Frontend ↔ Backend Gap Analysis
| Backend Capability | Existing Endpoint | Frontend Exposure | Missing UX |
| :--- | :--- | :--- | :--- |
| **Category Proximity** | `GET /api/products?category=x` | Partial (Used for main catalog filtering) | **Related Products** widget on PDP |
| **Sitemap / SEO Data** | Prisma `Product/Category/Collection` models | Missing | `sitemap.ts`, `robots.ts`, structured JSON-LD |
| **Cancellations/Returns** | `/api/me/orders/[id]/cancel` | Fully Exposed | None (F8/F9 implemented) |
| **Coupons** | `/api/me/cart/coupon/validate` | Fully Exposed | None (Checkout integration exists) |

## 5. Customer Journey Audit
1. **Home**: High visual impact, but static.
2. **Product Discovery**: Excellent (F16 added robust search, filtering, and pagination).
3. **Product Detail**: **Friction Point**. Lacks cross-sell ("You Might Also Like"), Re-engagement ("Recently Viewed"), and native sharing features.
4. **Checkout/Order**: Seamless and secure.
5. **Post-Purchase**: Excellent (Returns/Exchanges/Tracking fully exposed).

## 6. Storefront UX Audit
- **Implemented**: Navigation, Search, Filters, Empty/Loading states, Mobile accessibility.
- **Missing**: Cross-category discovery loops, SEO technicals, Marketing banner management.

## 7. Product Detail Audit
- **Implemented**: Variant selection, Primary/Gallery images, Base/Compare pricing, Stock validation, Breadcrumbs.
- **Missing**: Related Products, Recently Viewed, Native Sharing, Structured Data.
- **Backend Unsupported**: Product Reviews & Ratings.

## 8. Cart + Checkout Audit
- **Status**: Complete. Supports stock validation, coupon application, address selection, and Razorpay boundary. No major gaps for F17.

## 9. Account Audit
- **Status**: Complete (F15). Profile, Address CRUD, and Order details are polished.

## 10. Admin Audit
- **Status**: Complete and FROZEN (F10-F14). Supports Catalog, Inventory, Orders, Fulfillment, and Coupons.

## 11. API Contract Audit
- `GET /api/products`: Extremely versatile, supports pagination, filtering by category/collection, and sorting. Perfect for powering Related Products without backend modifications.

## 12. Database / Domain Audit
- **Entities**: Customers, Addresses, Products, Variants, Inventory, Orders, Payments, Coupons, Shipments, Returns, Refunds.
- **Not Present**: Reviews, Comments, Notification Preferences.

## 13. Security Audit
- Next.js Server Components securely handle most data fetching. F17 candidates like "Recently Viewed" are strictly client-side local storage (Zero PII risk). "Related Products" leverages public catalog APIs.

## 14. Performance Audit
- F16 utilized Suspense and Server Components efficiently. Any new F17 features (like Related Products) should be wrapped in `<Suspense>` boundaries to prevent blocking the main PDP render.

## 15. Accessibility Audit
- Keyboard navigation and ARIA attributes were hardened in F16. F17 UI components must maintain these standards.

## 16. SEO Audit
- **CRITICAL GAP**: The application lacks `sitemap.ts`, `robots.ts`, and structured data (JSON-LD) for products. This severely limits organic discoverability for a luxury boutique.

## 17. Dependency Audit
- **Current**: Next.js 15+, Tailwind CSS 4, Lucide React.
- **No new dependencies** are required for the recommended F17 scope.

## 18. Technical Debt
- **Minor**: The homepage is heavily hardcoded.
- **Deferred**: Moving to a fully dynamic CMS for the homepage is a massive architectural shift and should be deferred past F17.

## 19. F17 Candidate Features
1. **PDP Cross-Selling & Re-engagement**: Related Products + Recently Viewed + Native Sharing.
2. **Technical SEO Infrastructure**: Dynamic Sitemaps, robots.txt, JSON-LD Structured Data.
3. **Transactional Emails**: Order confirmation and shipping updates via Resend. (Requires backend service rewrites).

## 20. Prioritization Matrix
| Feature | Value | Backend Readiness | Frontend Effort | Risk |
| :--- | :--- | :--- | :--- | :--- |
| **PDP Enhancements** | P0 | High (API exists) | Medium | Low |
| **Technical SEO** | P1 | High | Low | Low |
| **Transactional Emails** | P2 | Medium | High | Med |

## 21. Recommended F17 Direction
**PDP Cross-Selling + SEO Infrastructure (The Discoverability & Retention Phase)**
Focusing on maximizing the value of the existing catalog by keeping users engaged on the site (Related/Recently Viewed) and ensuring search engines can properly index the boutique (Sitemaps/JSON-LD).

## 22. Proposed F17 Scope
**F17 TITLE**: PDP Conversion & SEO Discoverability
**F17 OBJECTIVE**: Implement cross-selling loops, re-engagement tools, and technical SEO to maximize organic traffic and average order value.

**IN SCOPE**:
1. "You Might Also Like" (Related Products) component on PDP.
2. "Recently Viewed" component (localStorage driven) on PDP.
3. Native Web Share integration on PDP.
4. Dynamic `sitemap.ts` (Products, Categories, Collections).
5. Dynamic `robots.ts`.
6. JSON-LD Structured Data injection for Products.

## 23. Out of Scope
- Product Reviews/Ratings (Requires schema changes).
- Admin CMS / Dynamic Homepage builder.
- Transactional Emails (Order/Shipping confirmations).

## 24. Frozen Phase Protection
- F13, F14, F15, F16 remain 100% frozen. F17 solely targets the storefront PDP and root application configurations.

## 25. Risks
- **Performance**: Fetching related products must not delay the initial PDP render. `<Suspense>` is mandatory.

## 26. Testing Strategy
- Unit test JSON-LD schemas.
- Validate `sitemap.xml` output locally.
- Verify localStorage persistence for Recently Viewed across page reloads.

## 27. Final Recommendation
F17 should focus exclusively on **Product Detail Page Enhancements (Related/Recently Viewed) and Technical SEO**. This provides the highest immediate ROI for the e-commerce funnel with zero required database schema changes or backend rewrites.
