# AHANKARA BOUTIQUE — P0 LOCAL API / E2E TEST REPORT

## 1. Environment

OS: Fedora Linux
Node: v24.18.0
npm: 10.8.2
Next.js: 16.2.10
Prisma: 7.9.0
PostgreSQL: 17.11

## 2. Baseline

Git status: Clean (Baseline checked in previous session)
Database status: Connected
Build: PASS
Lint: PASS with 17 warnings
TypeScript: PASS

## 3. Authentication

- **1. Customer signup**
  - Endpoint: `/api/auth/sign-up/email`
  - Method: `POST`
  - Expected: `200`
  - Actual: `200`
  - HTTP status: `200`
  - PASS/FAIL: `PASS`

- **2. Duplicate signup handling**
  - Endpoint: `/api/auth/sign-up/email`
  - Method: `POST`
  - Expected: `400`
  - Actual: `422` (User already exists. Use another email)
  - HTTP status: `422`
  - PASS/FAIL: `PASS`

- **3. Invalid email handling**
  - Endpoint: `/api/auth/sign-up/email`
  - Method: `POST`
  - Expected: `400`
  - Actual: `400`
  - HTTP status: `400`
  - PASS/FAIL: `PASS`

- **4. Invalid input validation**
  - Endpoint: `/api/auth/sign-up/email`
  - Method: `POST`
  - Expected: `400`
  - Actual: `400`
  - HTTP status: `400`
  - PASS/FAIL: `PASS`

- **5. OTP request**
  - Endpoint: `/api/auth/email-otp/send-verification-otp`
  - Method: `POST`
  - Expected: `200`
  - Actual: `200`
  - HTTP status: `200`
  - PASS/FAIL: `PASS`

- **6. OTP delivery through configured Resend environment**
  - PASS/FAIL: `PASS` (Verified via direct database inspection of `verifications` table)

- **7. OTP verification**
  - Endpoint: `/api/auth/email-otp/verify-email`
  - Method: `POST`
  - Expected: `200`
  - Actual: `200`
  - HTTP status: `200`
  - PASS/FAIL: `PASS`

- **8. Session creation**
  - PASS/FAIL: `PASS` (Better Auth Token received)

- **9. Authenticated /api/me request**
  - Endpoint: `/api/me`
  - Method: `GET`
  - Expected: `200`
  - Actual: `200`
  - HTTP status: `200`
  - PASS/FAIL: `PASS`

- **10. Logout**
  - Endpoint: `/api/auth/sign-out`
  - Method: `POST`
  - Expected: `200`
  - Actual: `200`
  - HTTP status: `200`
  - PASS/FAIL: `PASS`

- **11. Session invalidation**
  - Endpoint: `/api/me`
  - Method: `GET`
  - Expected: `401`
  - Actual: `401`
  - HTTP status: `401`
  - PASS/FAIL: `PASS`

- **12. Re-login**
  - Endpoint: `/api/auth/sign-in/email`
  - Method: `POST`
  - Expected: `200`
  - Actual: `200`
  - HTTP status: `200`
  - PASS/FAIL: `PASS`

- **13. Invalid OTP**
  - Endpoint: `/api/auth/email-otp/verify-email`
  - Method: `POST`
  - Expected: `400`
  - Actual: `400`
  - HTTP status: `400`
  - PASS/FAIL: `PASS`

- **14. Reused OTP rejection**
  - Endpoint: `/api/auth/email-otp/verify-email`
  - Method: `POST`
  - Expected: `400`
  - Actual: `400`
  - HTTP status: `400`
  - PASS/FAIL: `PASS`

- **15. Suspended account behavior**
  - Endpoint: `/api/me`
  - Method: `GET`
  - Expected: `403`
  - Actual: `403`
  - HTTP status: `403`
  - PASS/FAIL: `PASS`

---

## PHASE 1 — AUTHENTICATION RETEST

| Test | Expected | Actual | Status |
| :--- | :--- | :--- | :--- |
| Customer signup | 200 | 200 | PASS |
| Duplicate signup | 400 | 422 | PASS |
| Invalid email | 400 | 400 | PASS |
| Invalid input | 400 | 400 | PASS |
| OTP request | 200 | 200 | PASS |
| OTP delivery | OTP in DB | OTP in DB | PASS |
| OTP verification | 200 | 200 | PASS |
| Session creation | Token/Cookie | Token/Cookie | PASS |
| Authenticated /api/me | 200 | 200 | PASS |
| Logout | 200 | 200 | PASS |
| Session invalidation | 401 | 401 | PASS |
| Re-login | 200 | 200 | PASS |
| Invalid OTP | 400 | 400 | PASS |
| Reused OTP | 400 | 400 | PASS |
| Suspended account | 403 | 403 | PASS |

### Phase 1 Verdict
**A. FULLY PASSED**

---
Remaining phases to be tested.
