# PHASE 15: CUSTOMER ACCOUNT / PROFILE / ADDRESSES
**P0 RECONNAISSANCE REPORT**
**Date:** September 13, 2026

## 1. Executive Summary
The foundation for Phase 15 (Customer Account & Addresses) is partially established from previous phases. The authentication layer (Better Auth) and address management backend are robust and secure. However, the frontend account shell currently only supports Order History, and there is no backend capability for customers to update their own profile information (name, phone, etc.). 

## 2. Existing Frontend Account Structure
- **Layout & Navigation:** `src/app/(storefront)/account/layout.tsx` enforces authentication via `auth.api.getSession` and renders a responsive sidebar navigation. Currently, only "My Orders" is implemented in the navigation array.
- **Pages:** `/account/orders` and `/account/orders/[orderId]` are fully implemented from Phase 8.
- **Missing Pages:** There is no `/account/profile` or `/account/addresses`.
- **Reusable Components:** `AddressForm.tsx` and `AddressSelector.tsx` exist in `src/components/address/` but are currently tailored for the checkout flow.

## 3. Existing Backend Account/Profile APIs
- **GET `/api/me`:** Returns the current authenticated user's serialized data via `AuthService.requireAuth(req.headers)`.
- **Missing Functionality:** There is currently NO backend endpoint (e.g., `PATCH /api/me`) that allows a customer to update their `name` or `phone`. This must be built.

## 4. Existing Address APIs
The Address API is fully mature and located under `src/app/api/me/addresses/`:
- **GET `/api/me/addresses`:** Lists customer addresses.
- **POST `/api/me/addresses`:** Creates a new address.
- **GET/PATCH/DELETE `/api/me/addresses/[addressId]`:** Manages a specific address.

## 5. Prisma/Data Model
- **User Model:** Contains `name`, `email`, `phone`, `role`, `status`. Modification of `role` and `status` must be strictly protected.
- **Address Model:** Fully supports the required fields (`fullName`, `phone`, `addressLine1`, `addressLine2`, `landmark`, `city`, `state`, `postalCode`, `country`). It supports multiple addresses per user and includes `isDefaultShipping`, `isDefaultBilling`, and `type` (HOME, WORK, OTHER).
- **Conclusion:** Phase 15 can be implemented entirely using the existing Prisma schema. No migrations are required.

## 6. Profile Capabilities
- Currently, profile information is read-only for customers. The `UserService` only supports `create`, `findById`, and `findByEmail`.
- Better Auth handles email/password changes natively, but we need an application-level endpoint to update metadata like `name` and `phone`.

## 7. Address Capabilities
- `AddressService` (`src/server/services/address.service.ts`) perfectly handles default address switching. When a new address is marked as default, the service automatically unsets the previous default in a Prisma transaction.
- The first address created for a user is automatically marked as the default.

## 8. Authentication/Session Architecture
- Uses **Better Auth** (`src/lib/auth.ts`).
- Server-side auth is enforced via `AuthService.requireAuth(headers)`, which strictly checks if the user exists and is `ACTIVE` (blocks `SUSPENDED` or `DEACTIVATED` users).
- **No new authentication mechanism is required.**

## 9. Checkout Integration
- `src/app/(storefront)/checkout/page.tsx` uses the `useAddress()` hook (`src/hooks/use-address.tsx`) to load addresses.
- The checkout consumes the existing `/api/me/addresses` endpoints. Any address created in the new Account section will automatically be available in Checkout.

## 10. Order Snapshot Integration
- **Strict Immutability:** When an order is placed, checkout creates an `OrderAddress` record. 
- The `Order` model links to `OrderAddress`, NOT the mutable customer `Address` model.
- **Conclusion:** Changing or deleting a customer address in Phase 15 will safely have zero impact on historical order data.

## 11. API Response Shapes
- F14 revealed a risk with response envelopes. 
- I verified that `src/app/api/me/route.ts` and `src/app/api/me/addresses/route.ts` both use `successResponse(...)` from `src/utils/api-response.ts`.
- This means they correctly return `{ success: true, data: ... }`, which is 100% compatible with the global `apiClient` (`src/lib/api/client.ts`). No F14-style fetch workarounds are needed here.

## 12. Validation Rules
- `src/server/validators/address.validator.ts` enforces exact rules:
  - Phone numbers use strict regex.
  - Postal codes must be exactly 6 digits if the country is India.
  - Minimum length constraints exist on `fullName`, `addressLine1`, `city`, and `state`.
- Frontend forms must adhere exactly to these Zod rules.

## 13. Security/IDOR Analysis
- **PASS:** `AddressService.getAddressById(addressId, userId)` strictly requires the `userId` of the authenticated session. 
- All `update`, `delete`, and `setDefault` operations fetch the address using this scoped method first. A customer physically cannot modify or delete another customer's address.

## 14. Existing UX Components
- The account sidebar (`AccountLayout`) needs to be updated to include links to Profile and Addresses.
- Reusing `AddressForm.tsx` is highly recommended, but it currently lacks a "Cancel" button (as it was designed for inline checkout). It may need minor UI props adjustments.

## 15. Dependency Audit
- `package.json` confirms `react-hook-form` is **NOT** installed.
- All forms in Phase 15 must be built using native React `useState` and controlled inputs, matching the architecture of F14.

## 16. Branding Audit
- A global grep search for "AHANKARA BOUTIQUE" yielded **0 occurrences**. 
- The brand is fully transitioned to "AHANKARA STUDIOS".

## 17. F13/F14 Freeze Verification
- `git status` confirms that NO F13/F14 backend routing, Shiprocket logic, or Coupon logic has been modified. The freeze is intact.

## 18. Recommended P1 Architecture Questions
Before moving to P1, the following should be considered:
1. Should Profile and Addresses be separate routes (`/account/profile` and `/account/addresses`), or combined into a single dashboard? (Separate is usually standard).
2. Do we want to allow users to update their email address, or restrict profile edits to just Name and Phone for now?

---
**F15 P0 RECONNAISSANCE: COMPLETE**
