# PHASE 15: CUSTOMER ACCOUNT / PROFILE / ADDRESSES
**P1 ARCHITECTURE PLAN**
**Date:** September 13, 2026

## 1. Executive Summary
This document outlines the architecture for Phase 15, focusing on completing the Customer Account experience. The architecture leverages the mature Address APIs, strict security patterns, and immutable order snapshots established in previous phases. The primary backend addition is a customer-facing profile update endpoint (`PATCH /api/me`), accompanied by new `/account/profile` and `/account/addresses` frontend routes.

## 2. Approved Scope
- **Navigation:** Update `AccountLayout` sidebar to include "Profile" and "Addresses" alongside "My Orders".
- **Profile:** New `/account/profile` page to view and edit basic customer-editable fields (Name and Phone).
- **Addresses:** New `/account/addresses` page to list, create, edit, delete, and set default addresses.
- **Backend:** Introduce `PATCH /api/me` to safely update allowed profile fields.

## 3. Profile Architecture
The Profile section strictly separates display-only from editable fields:
- **DISPLAY-ONLY:** Email, Account Status. (Email changes are restricted to avoid bypassing Better Auth's verification flow).
- **EDITABLE:** Name, Phone.
- **PROTECTED (HIDDEN):** Role, Status, Authentication Credentials, Internal Timestamps.

## 4. Profile Backend Endpoint
A new endpoint will be created to securely update customer-editable profile fields.
- **Route:** `PATCH /api/me`
- **Controller Behavior:** 
  1. Authenticate user via `AuthService.requireAuth(req.headers)`.
  2. Validate request body against a new `updateProfileSchema` (Zod).
  3. Strip out any protected fields (e.g., role, status, email, userId).
  4. Perform the update via a new `UserService.updateProfile(userId, data)` method.
  5. Return standard `successResponse(user)`.
- **Allowed Request Body:** `{ name?: string, phone?: string }`

## 5. Address Architecture
The Address management will seamlessly use the existing mature `api/me/addresses` endpoints:
- `GET /api/me/addresses`
- `POST /api/me/addresses`
- `GET/PATCH/DELETE /api/me/addresses/[addressId]`

The UI at `/account/addresses` will feature:
- A list of address cards indicating Default Shipping/Billing statuses.
- "Edit", "Delete", and "Set Default" actions directly invoking the backend.
- A "Create Address" button revealing the Address Form.

## 6. Address Form Reuse Strategy
The existing `src/components/address/AddressForm.tsx` will be reused.
To support both Checkout (inline) and Account (modal/standalone) contexts:
- The component will utilize its existing controlled React state (no `react-hook-form`).
- It will receive minor props adjustments to support an optional `onCancel` callback (allowing it to be closed without saving when used in the Account section).

## 7. Account Navigation
`src/app/(storefront)/account/layout.tsx` will be updated to include:
- **Profile:** `/account/profile` (Icon: User)
- **Addresses:** `/account/addresses` (Icon: MapPin)
- **My Orders:** `/account/orders` (Icon: Package)
The layout will remain responsive (horizontal scroll on mobile, vertical sidebar on desktop).

## 8. API Client Plan
All backend endpoints will return standard `successResponse` envelopes (`{ success: true, data: T }`).
Frontend API calls will reside in `src/lib/api/account.ts` (or similar) and leverage the global `apiClient`:
- `getProfile()` -> `apiClient.get('/api/me')`
- `updateProfile(data)` -> `apiClient.patch('/api/me', data)`
For addresses, the existing `src/lib/api/address.ts` and `useAddress` hook fully cover `getAddresses`, `createAddress`, `updateAddress`, `deleteAddress`, `setDefaultShipping`, and `setDefaultBilling`.

## 9. Checkout Integration
No modifications to Checkout are required. The Checkout module already consumes `useAddress()`. Because the Account section will modify the same unified address store via `/api/me/addresses`, any address created or modified in `/account/addresses` will instantly be available in Checkout.

## 10. Order Snapshot Safety
- **Strict Immutability:** Customer address mutations in Phase 15 MUST NOT modify historical orders. 
- Checkout explicitly creates `OrderAddress` snapshots at the time of purchase. Customer addresses (`Address` model) are structurally independent from `OrderAddress`. Address updates and deletions will safely not cascade to placed orders.

## 11. Security Architecture
- **Identity Derivation:** All profile and address operations MUST derive the `userId` directly from the server-validated session (`AuthService.requireAuth`).
- **No Client User IDs:** The API will never accept `userId` from the request body or path for these endpoints.
- **IDOR Protection:** `AddressService` queries intrinsically scope `WHERE { id: addressId, userId: session.user.id }`. Customers cannot view, edit, or delete other customers' addresses.
- **Field Protection:** Only `name` and `phone` can be patched in `/api/me`. `role` and `status` are strictly protected.

## 12. Error Handling
- Premium user-facing error states via native React UX patterns.
- Form submissions will gracefully display Zod validation errors without crashing.
- No internal stack traces, Prisma errors, or SQL paths will be exposed.
- Toast notifications (using existing patterns) or inline alerts will confirm successes and display non-fatal errors.

## 13. Responsive UX
- **Mobile:** Address cards stack vertically. Account navigation flows horizontally. Forms provide adequate touch targets (min 44px) and numeric keypads for phone/postal codes.
- **Desktop:** Sidebar layout for navigation. Address cards display in a responsive grid.

## 14. Accessibility
- All form inputs will possess semantic `<label>` elements.
- Validation errors will utilize `aria-describedby` or role="alert".
- Destructive actions (Address Deletion) will require explicit confirmation.
- Focus states will be clearly visible for keyboard navigation.

## 15. Dependencies
- **NO new dependencies.** 
- Forms will be constructed using React `useState` and controlled inputs (no `react-hook-form`), strictly adhering to existing F14 conventions.

## 16. Exact File/Route Plan
**Backend:**
- `src/server/validators/user.validator.ts` (Add `updateProfileSchema`)
- `src/server/services/user.service.ts` (Add `updateProfile` method)
- `src/app/api/me/route.ts` (Add `PATCH` method)

**Frontend:**
- `src/app/(storefront)/account/profile/page.tsx` (New Profile Page)
- `src/app/(storefront)/account/addresses/page.tsx` (New Addresses Page)
- `src/components/account/ProfileForm.tsx` (New Profile Component)
- `src/components/account/AddressCard.tsx` (New Address Display Component)
- `src/app/(storefront)/account/layout.tsx` (Modify Navigation)
- `src/lib/api/account.ts` (New API Client Methods)

## 17. Backend Change Plan
1. **Validator:** Export `updateProfileSchema = z.object({ name: z.string().optional(), phone: phoneSchema.optional() })`.
2. **Service:** `UserService.updateProfile(userId, data)` that updates the DB and returns the serialized user.
3. **Route:** Implement `PATCH /api/me` enforcing auth and stripping out sensitive fields.

## 18. Database Impact
- **NO Prisma schema changes expected.**
- **NO migrations expected.**
- **NO seed changes expected.**
- The existing models (`User` and `Address`) possess all necessary capabilities.

## 19. F13/F14 Freeze Protection
- F13/F14 code (Shiprocket, Orders, Coupons, Pricing) will remain completely untouched. Phase 15 is entirely decoupled from those domains.

## 20. Branding Protection
- The architecture guarantees **0 occurrences** of "AHANKARA BOUTIQUE". 
- All new UI will exclusively use **AHANKARA STUDIOS**.

## 21. Implementation Sequence
- **F15.1** Backend profile update endpoint (`PATCH /api/me` & `UserService.updateProfile`)
- **F15.2** Frontend API bindings (`lib/api/account.ts`)
- **F15.3** Account navigation update (`layout.tsx`)
- **F15.4** Frontend profile page (`/account/profile` & `ProfileForm.tsx`)
- **F15.5** Account address page & Address Card UI (`/account/addresses`)
- **F15.6** Form reuse configuration (`AddressForm.tsx` context adaptations)
- **F15.7** Security/static verification (tsc, lint, IDOR checks)
- **F15.8** Checkout integration verification (Manual smoke test)
- **F15.9** Browser runtime verification (Full UI tests)
- **F15.10** Final freeze

## 22. Runtime Test Plan
- **PROFILE:** Load profile, edit name, edit phone, verify persistence across refreshes. Ensure `role` or `email` spoofing fails gracefully.
- **ADDRESSES:** Create, edit, and delete addresses. Mark an address as Default Shipping and verify previous defaults are unset. Attempt unauthorized IDOR deletion via API.
- **CHECKOUT:** Confirm addresses created in the Account section immediately appear in Checkout.
- **REGRESSION:** Complete a full checkout flow to ensure Order Snapshot Immutability remains intact.

## 23. Risks / Edge Cases
- **Checkout Disruption:** Care must be taken when modifying `AddressForm.tsx` to not break its inline layout within the Checkout flow. All new props (`onCancel`, etc.) must be strictly optional.
- **Default Address Race Conditions:** The backend already relies on Prisma `$transaction`s to handle default-toggling, which prevents race conditions.

## 24. Questions Requiring Approval
1. Does the initial profile limitation to `name` and `phone` only (with `email` remaining read-only to avoid complex re-verification flows) meet the immediate Phase 15 requirements?
2. Are you aligned with reusing the existing controlled `AddressForm` (with optional `onCancel` prop) rather than duplicating the component?

---
**F15 P1 ARCHITECTURE: READY FOR REVIEW**
