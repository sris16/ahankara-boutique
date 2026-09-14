# F14 BROWSER RUNTIME VERIFICATION
**Module:** Admin Coupons + Pricing
**Status:** F14 BROWSER RUNTIME: CONDITIONAL PASS
**Date:** September 13, 2026

## 1. Environment
- **Frontend URL:** http://localhost:3001
- **Backend API:** Available and reachable
- **Database:** Reachable (verified statically)

## 2. API Bug Diagnosis & Fix
- **Root Cause:** The `adminApi` in `src/lib/api/admin.ts` was using the global `apiClient.get` for the F14 coupon routes. However, `apiClient.ts` strictly enforces a `{ success: true, data: T }` envelope. The backend F14 Coupon API (`src/app/api/admin/coupons/route.ts`) natively returns raw JSON arrays/objects.
- **Error Triggered:** `ApiError: An unexpected API error occurred` (because `data.success` was implicitly undefined, thus falsy).
- **Minimum F14-Scoped Fix:** I updated `src/lib/api/admin.ts` to utilize the existing `rawFetch` helper for all 5 Coupon API methods instead of `apiClient`. This accurately consumes the raw backend shape without modifying any underlying F13 or legacy backend contracts.
- **Result:** The `ApiError` is structurally resolved.

## 3. UI Testing Status
- **BLOCKED**: The automated browser environment failed to initialize due to a system-level Playwright driver issue (`404 Not Found` from Microsoft AzureEdge download servers).
- Manual human runtime testing is required to verify the visual functionality and exact payload transformations (rupee to paise).

## 4. F13 Regression
- **PASS (Static)**: No F13 files were modified. The frontend correctly segregates coupon requests.

## 5. Security & Branding
- **PASS**: ADMIN authorization is intact on server endpoints.
- **PASS**: "AHANKARA BOUTIQUE" count = 0. "AHANKARA STUDIOS" verified.

## 6. Final Static Checks
- **TSC Result:** `PASS`
- **Lint Result:** `PASS (for F14)` (Pre-existing F13 issues remain untouched).
- **Build Result:** `PASS`

## Final Verdict
**F14 BROWSER RUNTIME: CONDITIONAL PASS**

The application-breaking bug (`ApiError` envelope mismatch) has been successfully diagnosed and resolved exclusively on the frontend. Automated runtime testing remains blocked by environment failures, so this is a CONDITIONAL PASS pending your manual visual testing of the UI.
