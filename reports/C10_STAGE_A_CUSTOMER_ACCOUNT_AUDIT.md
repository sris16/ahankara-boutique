# C10 STAGE A CUSTOMER ACCOUNT AUDIT

## 1. Executive Summary
The Customer Account Experience encompasses `/account/profile` and `/account/addresses` (Orders were handled in C9). The backend services (`AuthService`, `UserService`, `AddressService`) enforce ownership securely and there are no identified IDOR vulnerabilities. However, the frontend suffers from an architectural inefficiency: both Profile and Addresses pages rely on client-side fetching (`useAuth`, `useAddress`) for their initial state. This creates unnecessary API waterfalls and delays First Contentful Paint. Additionally, private SEO metadata (`noindex`) is missing from these routes.

## 2. Existing Customer Account Architecture
The `/account` layout correctly intercepts unauthenticated users and enforces access control via `auth.api.getSession()`. The UI utilizes a sidebar `AccountNav`.

## 3. Route Inventory
- `/account/profile`
- `/account/addresses`
- `/account/orders` (Completed in C9)
- `/account/orders/[orderId]` (Completed in C9)
- *Note: There is no root `/account` dashboard.*

## 4. Component Inventory
- `AccountNav`: Renders sidebar navigation.
- `ProfileForm`: Client-side form for editing name/phone.
- `AddressCard`: UI for displaying saved addresses.
- `AddressForm`: UI for adding/editing addresses.

## 5. Authentication Audit
- **Server:** `account/layout.tsx` validates session using `auth.api.getSession()`.
- **Client:** `useAuth` hook hits `/api/me` to get session context, which is used heavily by the current client components. This creates a waterfall where components render empty until the client fetches the session.

## 6. Authorization / IDOR Audit
- **Secure:** `UserService.updateProfile` derives `userId` from the authenticated server context.
- **Secure:** `AddressService` uses `getAddressById(addressId, userId)` to verify ownership before ANY mutation (update, delete, set default).
- No IDOR vulnerabilities discovered. The server is authoritative.

## 7. Account Dashboard Audit
- There is no central dashboard. Users navigate directly to sub-routes. This is acceptable for a minimal boutique approach, though a redirect from `/account` to `/account/profile` might be needed if users hit the root route.

## 8. Profile Audit
- Customers can update `Name` and `Phone`.
- `Email` is read-only.
- Updates use `accountApi.updateProfile` which securely patches via `UserService`.

## 9. Security Audit
- No native password change flows exist in this account UI (Better Auth handles core credential management).
- The profile form correctly handles success/error states but lacks `aria-live` announcements.

## 10. Address Management Audit
- Full CRUD operations exist (`useAddress` hook).
- Form validates on the client but initial load is entirely CSR.
- Indian PIN logic/complex validation seems delegated to standard inputs; no custom backend hooks found beyond schema validation.

## 11. Order Integration Audit
- `AccountNav` securely and cleanly links to `/account/orders` (C9).

## 12. Wishlist Integration Audit
- Wishlist is a separate root (`/wishlist`). The `AccountNav` could optionally link to it, but it functions correctly as-is.

## 13. Cart/Checkout Integration Audit
- No conflicts with `CartService` or `Checkout` flows.

## 14. Server/Client Boundary Audit
- **Issue:** `/account/profile/page.tsx` and `/account/addresses/page.tsx` render client components that fetch their own data on mount.
- **Proposed Architecture:** Server Components should fetch data (`AuthService.requireAuth`, `AddressService.getUserAddresses`) and pass it as initial props to Client Components, which handle mutations.

## 15. Performance Audit
- Observed client-side waterfall: `layout.tsx` fetches session -> client renders -> `useAuth` fetches session -> `useAddress` fetches addresses.
- Fixing the boundary will eliminate these roundtrips.

## 16. UI/UX Audit
- UI is basic. It needs elevation to the premium AHANKARA STUDIOS aesthetic (minimal typography, generous padding, removed generic dashboard shading).

## 17. Accessibility Audit
- Missing `aria-live` for form submission results.
- Forms are keyboard navigable.

## 18. Responsive Audit
- The `AccountNav` switches to a horizontal scroll layout on mobile. Forms stack gracefully.

## 19. SEO/Privacy Audit
- **CRITICAL:** `/account/profile` and `/account/addresses` are missing `robots: { index: false, follow: false }`.

## 20. Data Privacy Audit
- No exposure of sensitive data via URLs or external APIs.

## 21. Loading/Error/Empty State Audit
- Client components currently rely on spinners while waiting for data. Moving to Server Components will eliminate the initial loading spinner.

## 22. API/Service Architecture Audit
- Clean mapping from Client -> API Route -> Service -> Database.

## 23. Security Red Flags
- None (aside from missing `noindex` robots tags).

## 24. C6 Regression Assessment
- Wishlist remains completely untouched.

## 25. C7 Regression Assessment
- Cart remains completely untouched.

## 26. C8 Regression Assessment
- Checkout remains completely untouched.

## 27. C9 Regression Assessment
- Orders remains completely untouched.

## 28. Functionality Gap Matrix
| Feature | Status | Notes |
|---------|--------|-------|
| Profile Editing | IMPLEMENTED | Needs SSR Refactor & UI Polish |
| Address Management | IMPLEMENTED | Needs SSR Refactor & UI Polish |
| Private SEO | PROPOSED | Missing `robots: false` |
| Account Root Redirect | PROPOSED | Route `/account` should redirect to `/account/profile` |

## 29. Recommended C10 Stage B Scope
1. **Server-Side Rendering Refactor**: Move data fetching for Profile and Addresses to Server Components, passing initial data to interactive Client Components.
2. **SEO/Privacy**: Add `robots: { index: false, follow: false }` to Profile and Address pages.
3. **UI/UX Elevation**: Upgrade forms and address cards to the premium AHANKARA STUDIOS aesthetic.
4. **Account Root**: Add a redirect in `next.config.js` or `middleware` (or a `page.tsx`) to push `/account` to `/account/profile`.

## 30. Proposed Stage B Files
| File | Action | Reason |
|------|--------|--------|
| `src/app/(storefront)/account/profile/page.tsx` | MODIFY | Implement SSR data fetching and pass to `ProfileFormClient`. Add `robots`. |
| `src/components/account/ProfileForm.tsx` | MODIFY | Refactor to accept initial data props. Improve UI. |
| `src/app/(storefront)/account/addresses/page.tsx` | MODIFY | Implement SSR data fetching and pass to `AddressManagerClient`. Add `robots`. |
| `src/app/(storefront)/account/page.tsx` | CREATE | Simple server component to redirect to `/account/profile`. |
| `src/components/account/AddressCard.tsx` | MODIFY | Upgrade to premium UI. |

## 31. Files That Must Remain Untouched
- `OrderService`, `PaymentService`, `InventoryService`, `CartService`, `WishlistService`
- Database schema
- `account/orders/*` (C9)

## 32. Validation Plan
- Run `tsc`, `lint`, and `build`.
- Manual QA:
  - Verify unauthorized users are redirected to login.
  - Verify data renders instantly (SSR) without client-side spinners.
  - Verify Profile update mutation succeeds.
  - Verify Address CRUD mutations succeed.
  - Verify IDOR/ownership still securely enforced.

## 33. Backend Dependency Assessment
- `UserService` and `AddressService` fully support needed functionality. No backend changes required.

## 34. Database Dependency Assessment
- No Prisma schema changes required.

## 35. Risks / Concerns
- Modifying `useAuth` or removing it from `ProfileForm` might break other components if they share it, so we will create a tailored Client Component for the Profile page or pass props directly.

## 36. C10 Stage A Conclusion
The Customer Account foundation is secure and well-structured at the service layer. Stage B will focus purely on resolving the client-side fetch waterfall (refactoring to SSR), enforcing privacy metadata, and elevating the UI to match the brand's premium standard.
