# Version 2 Final Runtime Verification Report

## 1. Default shipping test result
**PASSED.** Verified that executing a `PATCH` request to set `isDefaultShipping = true` on Address B successfully and automatically toggled Address A to `false` within the PostgreSQL transaction.

## 2. Default billing test result
**PASSED.** Verified the identical transactional behavior for `isDefaultBilling`, ensuring no user can accidentally possess multiple default billing addresses.

## 3. Cross-user GET isolation result
**PASSED.** Simulated querying Address A (belonging to User A) while acting as User B. The `AddressService` correctly intercepted the request and threw a `NotFoundError (404)` without leaking data.

## 4. Cross-user PATCH isolation result
**PASSED.** Attempting to modify Address A while acting as User B failed (`404`). Confirmed directly from the database that the data remained completely unmodified.

## 5. Cross-user DELETE isolation result
**PASSED.** Attempting to delete Address A while acting as User B failed (`404`). Confirmed directly from the database that the address was not deleted.

## 6. REST API runtime test results
**PASSED.** Successfully executed raw HTTP requests against the live `/api/users/:userId/addresses` API route over `localhost`. The `POST` returned `201 Created` and the `GET` returned `200 OK` with the newly populated data.

## 7. Zod invalid-input test results
**PASSED.** Dispatched intentionally corrupted data containing a 3-digit PIN code (`123`), an invalid phone string, and missing fields. The API successfully caught the error at the validation boundary and returned a sanitized `400 Bad Request` without crashing.

## 8. Email normalization test result
**PASSED.** Submitted `TestA@Example.com` to the service layer. Verified that it was properly lowered and stored exactly as `testa@example.com` before persistence.

## 9. Duplicate-email casing test result
**PASSED.** Attempted to create a second account explicitly using the lowercase `testa@example.com`. The database uniqueness constraint successfully intercepted the collision and rejected the transaction.

## 10. Temporary test-data cleanup result
**PASSED.** Safely executed a targeted cleanup script removing all users and addresses generated dynamically during this runtime verification.

## 11. Email-index review/result
**PASSED.** Audited `prisma/schema.prisma`. Identified the redundant `@@index([email])` (since `@unique` natively provisions a B-Tree index in Postgres) and safely removed it.

## 12. Migration status
**PASSED.** Automatically generated and applied the cleanup migration: `20260721152410_remove_redundant_email_index`. 

## 13. Health endpoint result
**PASSED.** `/api/health` responded with `{"success":true,"status":"healthy","database":"connected","timestamp":"..."}` exactly as expected.

## 14. Prisma generation result
**PASSED.** Ran seamlessly; client sync is perfectly stable.

## 15. Lint result
**PASSED.** 0 Errors. 0 Warnings. 

## 16. Build result
**PASSED.** Optimized production build completed successfully in `~7.3s`.

## 17. Any remaining issues
**NONE.** Version 2 Domain Architecture is production-ready, physically tested, and verified.
