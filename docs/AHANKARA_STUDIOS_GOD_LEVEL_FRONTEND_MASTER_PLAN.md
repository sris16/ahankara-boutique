# AHANKARA STUDIOS — GOD-LEVEL FRONTEND ENHANCEMENT MASTER PLAN

**Document Status:** MASTER / LOCKED ROADMAP  
**Project:** AHANKARA STUDIOS  
**Repository:** `ahankara-boutique`  
**Scope:** CUSTOMER/STOREFRONT FRONTEND ONLY  
**Backend:** EFFECTIVELY FROZEN  
**Implementation Status:** PLAN ONLY — NO IMPLEMENTATION AUTHORIZED BY THIS DOCUMENT

---

## 1. PURPOSE

This document is the authoritative master roadmap for the AHANKARA STUDIOS customer/storefront frontend enhancement project.

The objective is to transform the existing functional storefront into a:

- Premium
- Elegant
- Modern
- Fashion-oriented
- Editorial
- Responsive
- Accessible
- Fast
- Reliable
- Production-quality

professional ecommerce experience.

The existing backend, business logic, APIs, database, authentication, authorization, payment, shipping, inventory, pricing, and order lifecycle are already substantially implemented and tested.

The frontend must be enhanced ON TOP OF that foundation.

---

# 2. NON-NEGOTIABLE ARCHITECTURAL RULES

## 2.1 Backend is the source of truth

The frontend must consume and present the existing backend capabilities.

Do NOT redesign the backend merely to make frontend development easier.

Do NOT:

- rewrite backend services
- replace backend APIs
- invent duplicate APIs
- duplicate business logic in React
- create duplicate database models
- unnecessarily modify Prisma
- replace Better Auth
- replace authorization architecture
- replace Razorpay
- replace shipping architecture
- rewrite order lifecycle logic
- bypass server-side authorization
- expose secrets
- hardcode authoritative prices
- hardcode shipping rates
- hardcode discounts
- invent inventory state
- invent tracking data
- create fake backend responses

If a requirement appears to require backend work:

STOP.

First inspect the existing implementation.

Document:

1. What frontend requirement is blocked.
2. Which existing API/service was inspected.
3. Why the existing backend cannot support it.
4. Why frontend-only implementation is insufficient.
5. Exact backend files that would need modification.
6. Security implications.
7. Regression risks.
8. Required testing.

Do not silently modify backend code.

---

# 3. BACKEND FREEZE

Unless an explicit blocker is discovered and separately approved, treat the following as protected:

- `prisma/schema.prisma`
- `src/server/services/*`
- `src/server/validators/*`
- payment business logic
- shipping business logic
- order lifecycle
- authentication architecture
- authorization architecture
- webhook handling
- existing API contracts

Frontend enhancement should primarily work within:

- `src/app/(storefront)/*`
- `src/components/ui/*`
- `src/components/catalog/*`
- `src/components/layout/*`
- frontend-specific components/hooks
- frontend styling
- frontend assets
- public assets

---

# 4. BRANDING RULE

The visible brand is:

# AHANKARA STUDIOS

Never display:

# AHANKARA BOUTIQUE

in customer-facing or admin-facing visible UI, navigation, page titles, metadata, branding, etc.

Internal/legacy/backend identifiers may remain unchanged where technically appropriate.

---

# 5. OFFICIAL BRAND ASSETS

The official AHANKARA STUDIOS logo supplied by the project owner must be treated as the authoritative logo.

Recommended asset structure:

```text
public/
├── brand/
│   ├── ahankara-studios-logo.jpg
│   ├── ahankara-studios-logo.png
│   ├── ahankara-studios-logo.svg
│   ├── favicon/
│   └── social/
│
├── images/
│   ├── hero/
│   ├── editorial/
│   ├── collections/
│   ├── categories/
│   ├── lifestyle/
│   └── backgrounds/
```

Use the official logo wherever appropriate:

- desktop navbar
- mobile navbar
- footer
- authentication
- checkout
- order confirmation
- loading experience where appropriate
- favicon
- social/metadata assets where appropriate

Do not create a fake replacement logo.

---

# 6. DESIGN PHILOSOPHY

AHANKARA STUDIOS must NOT feel like:

- a generic Tailwind template
- a SaaS dashboard
- a default ecommerce starter
- an over-animated demo
- a UI component showcase

The visual language should communicate:

- premium fashion
- refinement
- editorial sophistication
- intentional whitespace
- strong typography
- high-quality imagery
- restrained motion
- sophisticated interaction
- clarity
- confidence

Premium does NOT mean adding effects everywhere.

---

# 7. MASTER IMPLEMENTATION ORDER

The enhancement program follows this sequence:

```text
BRAND ASSETS
    ↓
DESIGN SYSTEM
    ↓
TYPOGRAPHY
    ↓
GLOBAL COMPONENTS
    ↓
NAVIGATION
    ↓
HOMEPAGE
    ↓
CATALOG
    ↓
PRODUCT DETAIL
    ↓
CART
    ↓
CHECKOUT
    ↓
AUTH
    ↓
ACCOUNT
    ↓
ORDERS
    ↓
TRACKING
    ↓
EDITORIAL / LOOKBOOK
    ↓
MOTION
    ↓
SELECTIVE 3D
    ↓
MOBILE
    ↓
ACCESSIBILITY
    ↓
PERFORMANCE
    ↓
SEO
    ↓
E2E REGRESSION
    ↓
FINAL POLISH
```

Do not randomly jump between phases.

---

# 8. PHASE 1 — VISUAL IDENTITY SYSTEM

Create a coherent design-token system.

## Color

Establish semantic tokens such as:

- background
- foreground
- surface
- surface-muted
- surface-elevated
- primary
- primary-foreground
- accent
- accent-muted
- border
- border-subtle
- success
- warning
- error

Colors should be derived from the actual AHANKARA brand identity and official logo/assets rather than blindly applying a generic luxury palette.

## Typography

Create a consistent hierarchy:

- Display
- Heading XL
- Heading L
- Heading M
- Heading S
- Body L
- Body M
- Body S
- Caption
- Eyebrow
- Button
- Navigation
- Price

Define:

- font weights
- tracking
- line heights
- responsive sizes
- editorial styles
- product-price styles

## Spacing

Create a consistent spacing scale.

## Radius

Use radius intentionally. Do not make every component excessively rounded.

## Elevation

Use restrained shadows and depth.

## Motion tokens

Define:

- instant
- fast
- standard
- slow
- cinematic

with consistent easing and timing.

---

# 9. PHASE 2 — GLOBAL COMPONENT SYSTEM

Upgrade reusable components before rebuilding individual pages.

Target areas include:

- `src/components/ui/*`
- `src/components/layout/*`
- `src/components/catalog/*`

Components to enhance:

- Buttons
- Inputs
- Selects
- Product cards
- Editorial cards
- Collection cards
- Category cards
- Dialogs
- Drawers
- Dropdowns
- Toasts
- Alerts
- Badges
- Skeletons
- Empty states
- Error states

Every interactive component must support appropriate:

- hover
- active
- focus
- disabled
- loading
- success
- error

states.

---

# 10. PHASE 3 — GLOBAL NAVIGATION

## Desktop

Create a premium navigation system using actual catalog/category capabilities.

Potential structure:

```text
AHANKARA STUDIOS

SHOP
COLLECTIONS
NEW
ABOUT

                         SEARCH
                         ACCOUNT
                         WISHLIST
                         BAG
```

## Mega Menu

Where supported by the existing catalog:

- categories
- collections
- featured links
- imagery
- editorial content

Do not invent backend content that does not exist.

## Mobile

Create a premium full-height/mobile navigation experience.

It must be:

- touch-friendly
- keyboard accessible
- animated
- fast
- easy to close
- screen-reader appropriate

---

# 11. PHASE 4 — HOMEPAGE

Transform the homepage into the primary brand experience.

Potential sequence:

```text
Hero
↓
New Arrivals
↓
Featured Collection
↓
Editorial Statement
↓
Category Showcase
↓
Curated Products
↓
Brand Story
↓
Newsletter
↓
Footer
```

The exact content must use real project data/assets.

## Hero

Potential characteristics:

- full-bleed imagery
- editorial typography
- subtle parallax
- controlled image scaling
- text reveal
- CTA reveal
- responsive cropping

Do not overanimate.

---

# 12. PHASE 5 — PRODUCT DISCOVERY / CATALOG

Upgrade:

- product listing
- categories
- collections
- product cards
- sorting
- filtering
- availability
- wishlist
- variant information

## Product cards

Potential improvements:

- alternate image on hover
- subtle image transition
- wishlist
- quick add
- product metadata
- premium badges
- sold-out state
- new state

Mobile must not depend on hover.

---

# 13. PHASE 6 — FILTERING / SORTING

Create a premium filtering experience using only backend-supported query/data capabilities.

Desktop:

```text
FILTERS                     PRODUCTS
Category
Collection
Color
Size
Price
Availability
```

Mobile:

```text
FILTER     SORT
```

Potential controls:

- color swatches
- size chips
- price range
- availability
- selected-filter pills
- clear all
- apply

Do not implement frontend filtering that conflicts with backend behavior.

---

# 14. PHASE 7 — PRODUCT DETAIL PAGE

Create an immersive premium PDP.

Potential desktop structure:

```text
┌─────────────────────┬─────────────────────────┐
│                     │ PRODUCT NAME            │
│                     │ PRICE                   │
│      PRODUCT        │ VARIANTS                │
│       IMAGE         │ QUANTITY                │
│                     │ ADD TO BAG              │
│                     │ DELIVERY                │
│                     │ DESCRIPTION             │
└─────────────────────┴─────────────────────────┘
```

Potential features:

- sticky product information
- immersive gallery
- fullscreen image viewer
- zoom
- responsive image gallery
- elegant variant controls
- stock state
- delivery checker
- wishlist
- add-to-cart
- related products where backend supports them

---

# 15. PHASE 8 — PRODUCT GALLERY

Improve:

- large editorial imagery
- thumbnails
- mobile swipe
- fullscreen
- zoom
- keyboard controls
- accessible labels
- image transitions

Potential shared image transitions may be used where technically safe.

---

# 16. PHASE 9 — VARIANT EXPERIENCE

Where product data supports it, use visually refined variant controls.

Examples:

```text
COLOR

● Ivory
● Black
● Rust
```

and:

```text
XS   S   M   L   XL
```

States must accurately reflect backend availability.

---

# 17. PHASE 10 — SELECTIVE 3D

3D is allowed, but only when it materially improves the experience.

Potential uses:

- hero decorative object
- editorial brand object
- sophisticated interactive section
- actual 3D product presentation if real assets exist

Potential technology:

- Three.js
- React Three Fiber
- `@react-three/drei`

Do NOT introduce WebGL everywhere.

3D must not unnecessarily harm:

- mobile performance
- accessibility
- battery
- loading time
- checkout usability
- product clarity

If a 3D effect does not improve the experience, do not use it.

---

# 18. PHASE 11 — CART EXPERIENCE

Enhance the existing Cart Drawer and cart page without changing cart business logic.

Potential:

```text
YOUR BAG

Product
Image
Name
Variant
Quantity
Price

You may also like

Subtotal
Shipping
Discount
Total

CHECKOUT
```

Enhance:

- insertion animation
- removal animation
- quantity feedback
- subtotal transitions
- loading states
- errors
- cross-selling where backend data supports it

Never invent product recommendations or pricing.

---

# 19. PHASE 12 — WISHLIST

Enhance:

- heart animation
- product transitions
- quick add
- availability
- empty wishlist state
- responsive layout

---

# 20. PHASE 13 — CHECKOUT

Business logic MUST remain unchanged.

Improve presentation only.

Potential visual structure:

```text
CHECKOUT

01 DELIVERY
02 SHIPPING
03 PAYMENT
04 REVIEW
```

or another structure that fits the existing implementation.

The backend remains authoritative for:

- subtotal
- shipping
- taxes
- discount
- final amount

Do not duplicate authoritative calculations in React.

---

# 21. PHASE 14 — PAYMENT EXPERIENCE

Keep Razorpay architecture unchanged.

Improve only the frontend experience for:

- initiation
- loading
- success
- failure
- cancellation
- retry
- transition to order confirmation

Never expose:

- Razorpay secret
- webhook secret
- server credentials

---

# 22. PHASE 15 — ORDER CONFIRMATION

Create a premium post-purchase experience.

Potential:

```text
✓

ORDER CONFIRMED

Thank you for choosing
AHANKARA STUDIOS.

Order #XXXX

TRACK ORDER
CONTINUE SHOPPING
```

Use tasteful motion.

---

# 23. PHASE 16 — ORDER TRACKING

Use actual backend tracking data.

Potential visual timeline:

```text
✓ Order placed
│
✓ Payment confirmed
│
✓ Order confirmed
│
✓ Processing
│
✓ Packed
│
● Shipped
│
○ Out for delivery
│
○ Delivered
```

Never invent tracking events.

Inspect actual tracking API/service/models first.

---

# 24. PHASE 17 — ACCOUNT EXPERIENCE

Transform the account area from a dashboard-like interface into a premium customer relationship experience.

Potential structure:

```text
HELLO, CUSTOMER

Overview
Orders
Wishlist
Addresses
Profile
```

Focus on:

- clear information architecture
- premium typography
- mobile usability
- personalized visual hierarchy

---

# 25. PHASE 18 — ORDERS

Create premium order cards containing actual backend information.

Potential:

```text
ORDER #12345

[PRODUCT IMAGES]

Delivered
₹XXXX

VIEW ORDER
```

Do not invent statuses or amounts.

---

# 26. PHASE 19 — ORDER DETAIL

Organize:

- order status
- tracking
- items
- delivery address
- payment
- price breakdown
- available actions

Actions only appear when supported by backend state.

---

# 27. PHASE 20 — AUTHENTICATION UX

Keep Better Auth unchanged.

Redesign only the presentation of:

- login
- signup
- verification
- forgot password
- reset password
- logout-related states

Potential desktop layout:

```text
┌──────────────────────┬────────────────────────┐
│                      │                        │
│    BRAND IMAGE       │      SIGN IN           │
│                      │                        │
│    EDITORIAL         │      FORM              │
│                      │                        │
└──────────────────────┴────────────────────────┘
```

Mobile must remain practical and fast.

---

# 28. PHASE 21 — EMPTY STATES

Create branded empty experiences for:

- cart
- wishlist
- orders
- search
- filtered catalog
- unavailable content

Each should explain the situation and provide a useful next action.

---

# 29. PHASE 22 — LOADING SYSTEM

Create a unified AHANKARA loading language.

Possible elements:

- logo reveal
- subtle line animation
- branded skeletons
- progressive image loading
- content reveal

Do not add unnecessary full-screen loading delays.

---

# 30. PHASE 23 — ERROR SYSTEM

Every important failure should communicate:

- what happened
- what the user can do
- retry where appropriate

Never hide errors.

---

# 31. PHASE 24 — ABOUT PAGE

Transform into brand storytelling.

Potential:

```text
Hero
↓
AHANKARA Philosophy
↓
Craft
↓
Materials
↓
Visual Story
↓
Brand Statement
↓
CTA
```

Use real approved brand content/assets.

---

# 32. PHASE 25 — CONTACT PAGE

Create a premium contact experience while preserving existing functionality.

Potential sections:

- customer care
- email
- phone
- contact form if already supported
- relevant information

---

# 33. PHASE 26 — LEGAL PAGES

Upgrade presentation only.

Maintain:

- readability
- accessibility
- proper headings
- mobile usability
- clear navigation

Do not over-design legal information.

---

# 34. PHASE 27 — FOOTER

Create a polished fashion-brand footer.

Potential:

```text
AHANKARA STUDIOS

SHOP
COLLECTIONS
NEW ARRIVALS

ABOUT
OUR STORY
CONTACT

CUSTOMER CARE
SHIPPING
RETURNS

NEWSLETTER

SOCIAL

© AHANKARA STUDIOS
```

Only include links/content actually supported by the project.

---

# 35. PHASE 28 — EDITORIAL / LOOKBOOK

Investigate the current content architecture first.

If frontend-only implementation is appropriate, introduce a premium editorial/lookbook experience.

Potential:

- full-screen photography
- asymmetric grids
- editorial typography
- image storytelling
- horizontal galleries
- subtle parallax
- scroll storytelling

Do not create fake content.

Use approved assets.

---

# 36. PHASE 29 — SEARCH

If backend search exists, create a premium search experience.

Potential:

```text
SEARCH

Search AHANKARA

Recent Searches
Popular Categories
Products
Collections
```

Desktop can use an overlay.

Mobile can use a full-screen search interface.

---

# 37. PHASE 30 — MOTION SYSTEM

Create a consistent motion language.

## Micro motion

- buttons
- icons
- wishlist
- hover states

## Component motion

- drawers
- dialogs
- dropdowns
- accordions

## Page motion

- section entrances
- product reveals

## Cinematic motion

- hero
- editorial sections
- PDP gallery

## Navigation motion

- mobile menu
- page transitions
- shared image transitions where appropriate

Motion must remain restrained and purposeful.

---

# 38. PHASE 31 — MOBILE-FIRST QUALITY

Every customer page must work properly at:

- 320px
- 375px
- 390px
- 430px
- 512px
- 768px
- 1024px
- 1280px
- 1440px+

Pay special attention to:

- navigation
- product grids
- product galleries
- filters
- drawers
- dialogs
- checkout
- forms
- order tracking
- account pages
- touch targets
- overflow

Mobile must be designed intentionally, not treated as a compressed desktop layout.

---

# 39. PHASE 32 — ACCESSIBILITY

Audit and improve:

- semantic HTML
- keyboard navigation
- focus states
- focus traps
- screen reader announcements
- labels
- ARIA
- image alt text
- contrast
- dialog accessibility
- drawer accessibility
- reduced-motion support

---

# 40. PHASE 33 — PERFORMANCE

Maintain visual quality without sacrificing speed.

Optimize:

- Next Image
- Cloudinary transformations
- hero image loading
- LCP
- lazy loading
- font loading
- client component boundaries
- hydration
- animation performance
- 3D loading
- bundle size
- unnecessary API requests

Do not optimize blindly.

Measure or inspect first.

---

# 41. PHASE 34 — SEO

Maintain and improve:

- metadata
- titles
- descriptions
- Open Graph
- canonical URLs
- sitemap
- robots
- structured data
- product metadata
- category metadata
- collection metadata

Visual enhancements must not damage SEO.

---

# 42. PHASE 35 — FINAL VISUAL QA

Inspect every customer-facing page:

- Home
- Products
- Categories
- Collections
- Product detail
- Cart
- Wishlist
- Checkout
- Order confirmation
- Account
- Profile
- Addresses
- Orders
- Order detail
- Tracking
- Login
- Signup
- Verify
- Forgot password
- Reset password
- About
- Contact
- Privacy
- Terms

Also inspect all major reusable components.

---

# 43. PHASE 36 — E2E REGRESSION

After enhancement:

```bash
npm run lint
npm run build
npx playwright test
```

Verify the customer journey:

```text
Signup
→ Verification
→ Login
→ Browse
→ Product
→ Wishlist
→ Cart
→ Checkout
→ Payment
→ Order
→ Tracking
→ Account
```

Existing business behavior must continue working.

Do not alter production code merely to satisfy a brittle test.

Investigate failures first.

---

# 44. PHASE 37 — FINAL QUALITY CERTIFICATION

The final website must be evaluated against:

## Brand

Does it unmistakably feel like AHANKARA STUDIOS?

## Visual

Does it look professionally art-directed?

## UX

Can users accomplish tasks without friction?

## Motion

Does motion feel intentional?

## Mobile

Does mobile feel deliberately designed?

## Accessibility

Can different users operate it?

## Performance

Does visual sophistication remain fast?

## Commerce

Is product discovery and purchase frictionless?

## Reliability

Does existing backend functionality continue to work?

---

# 45. MASTER PRIORITY ORDER

| Phase | Area | Priority |
|---|---|---|
| 1 | Brand assets | CRITICAL |
| 2 | Design tokens | CRITICAL |
| 3 | Typography | CRITICAL |
| 4 | Global UI primitives | CRITICAL |
| 5 | Navbar / navigation | CRITICAL |
| 6 | Footer | HIGH |
| 7 | Homepage | CRITICAL |
| 8 | Product cards | CRITICAL |
| 9 | Product listing | CRITICAL |
| 10 | Filters / sorting | HIGH |
| 11 | PDP | CRITICAL |
| 12 | Product gallery | CRITICAL |
| 13 | Cart | CRITICAL |
| 14 | Wishlist | HIGH |
| 15 | Checkout | CRITICAL |
| 16 | Payment states | CRITICAL |
| 17 | Order confirmation | HIGH |
| 18 | Account | HIGH |
| 19 | Orders | HIGH |
| 20 | Tracking | HIGH |
| 21 | Auth | HIGH |
| 22 | About | MEDIUM |
| 23 | Contact | MEDIUM |
| 24 | Legal | MEDIUM |
| 25 | Editorial / Lookbook | HIGH |
| 26 | Motion system | CRITICAL |
| 27 | Selective 3D | HIGH / SELECTIVE |
| 28 | Mobile refinement | CRITICAL |
| 29 | Accessibility | CRITICAL |
| 30 | Performance | CRITICAL |
| 31 | SEO | HIGH |
| 32 | Full regression | CRITICAL |
| 33 | Final polish | CRITICAL |

---

# 46. IMPLEMENTATION METHODOLOGY

When implementation is eventually authorized:

Before modifying any file:

1. Read the file.
2. Understand its role.
3. Inspect related components.
4. Inspect API/service dependencies.
5. Check existing patterns.
6. Make the smallest appropriate architectural change.
7. Test it.
8. Check responsive behavior.
9. Check accessibility.
10. Check for regressions.

Reuse existing functionality wherever possible.

Do not duplicate functionality.

---

# 47. SERVER / CLIENT / RSC RULE

Preserve the project's existing Server Component / Client Component architecture.

When Prisma/database values such as:

- Date
- Decimal
- nested objects

cross a Server → Client boundary, follow the established project serialization pattern.

Do not introduce RSC serialization bugs.

Avoid unnecessary `"use client"`.

---

# 48. NO GENERIC TEMPLATE DESIGN

Do not solve the project by installing a generic ecommerce template.

Do not blindly copy:

- Tailwind templates
- SaaS layouts
- generic luxury templates
- marketplace UI
- dashboard components

Every major design decision should be intentional for AHANKARA STUDIOS.

---

# 49. NO UNCONTROLLED DEPENDENCY GROWTH

Before adding a dependency:

1. Check whether the project already has an equivalent capability.
2. Determine whether CSS/React/Next.js can solve it.
3. Determine bundle/runtime impact.
4. Determine maintenance implications.

3D libraries are allowed only when a real 3D requirement exists.

Animation libraries are allowed only where they materially improve interaction.

---

# 50. MASTER PRINCIPLE

The objective is NOT:

"Make the website prettier."

The objective is:

# Build AHANKARA STUDIOS into a premium, professional, production-quality fashion ecommerce experience.

The architecture underneath already provides the foundation.

The enhancement should transform:

```text
FUNCTIONAL STOREFRONT
        ↓
COHESIVE DESIGN SYSTEM
        ↓
PREMIUM VISUAL IDENTITY
        ↓
EDITORIAL EXPERIENCE
        ↓
INTENTIONAL MOTION
        ↓
SELECTIVE 3D
        ↓
WORLD-CLASS MOBILE UX
        ↓
ACCESSIBLE + FAST
        ↓
PRODUCTION-QUALITY STOREFRONT
```

---

# 51. ANTIGRAVITY DOCUMENT PRESERVATION INSTRUCTION

When this master plan is provided to Antigravity:

**DO NOT implement the plan.**

First create and preserve an exact project copy of this document at:

```text
docs/AHANKARA_STUDIOS_GOD_LEVEL_FRONTEND_MASTER_PLAN.md
```

If the `docs/` directory does not exist, create it.

The file must be treated as the authoritative roadmap for the frontend enhancement project.

Antigravity must:

1. Preserve this document.
2. Not rewrite or reinterpret the roadmap.
3. Not silently remove phases.
4. Not silently reorder major phases.
5. Not replace the backend-freeze rules.
6. Not begin implementation merely because this document exists.
7. Refer back to this document during future frontend implementation.
8. Update the document only when the project owner explicitly changes the master plan.

If the project owner later changes the roadmap, update the project copy deliberately and preserve the new version as the new authoritative plan.

---

# 52. CURRENT STATUS

**MASTER PLAN CREATED**

**IMPLEMENTATION AUTHORIZATION: NO**

**NEXT ACTION:**

Antigravity should store this exact plan inside the repository and confirm the stored path.

Only after that should a separate implementation phase be started.
