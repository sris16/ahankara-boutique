# PHASE B7.3 AUDIT: PDP FORM & HYDRATION FIX

## 1. Current Architecture
- `ProductForm.tsx` wraps the product configuration (quantity, variants, add to cart, wishlist) in a root `<form>` element.
- `DeliveryChecker.tsx` is nested inside `ProductForm.tsx`.
- `DeliveryChecker.tsx` internally uses a `<form onSubmit={handleCheck}>` to manage its PIN code input and submit button.

## 2. Identified Issues
- **Nested Forms**: The current structure creates a `<form>` inside a `<form>`, which is invalid HTML.
- **Hydration Mismatch**: Invalid HTML (nested forms) is a primary cause for React's "hydration failed because the server rendered HTML didn't match the client" error. The browser automatically corrects invalid HTML by prematurely closing the outer form or moving the nested form, causing a DOM mismatch with React's virtual DOM.
- **Image Performance**: The primary product image lacks priority, triggering a Next.js LCP warning.

## 3. Proposed Fix
- Modify `DeliveryChecker.tsx` to replace the inner `<form>` with a `<div>`.
- Change the `Check` button to `type="button"` and attach `onClick={handleCheck}`.
- Add an `onKeyDown` listener to the PIN code input to capture the `Enter` key and trigger `handleCheck`, preserving keyboard accessibility.
- Update `handleCheck` to safely handle optional event arguments (calling `e?.preventDefault()`).
- Add the `priority` property to the primary product image in the PDP component (`src/app/(storefront)/products/[slug]/page.tsx` or similar).

## 4. Preservation Guidelines
- Do not modify checkout, pricing, delivery, or inventory backend APIs.
- Keep the `ProductForm`'s outer form intact (handling add-to-cart).
- Retain the exact same delivery API call and error/success rendering in `DeliveryChecker`.
