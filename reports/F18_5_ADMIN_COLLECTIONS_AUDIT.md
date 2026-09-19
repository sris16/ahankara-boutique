# AHANKARA STUDIOS
## F18.5 — ADMIN COLLECTIONS AUDIT

### 1. Executive Summary
Phase F18.5 targets the Admin Collections module. The read-only audit revealed that Collections UI functionality (Listing, Creation, Editing, Deletion, and Scheduling) is already fully built across the frontend UI, API routes, and backend services. The primary defect identified is the Next.js header serialization crash caused by Server Components proxying HTTP requests to internal APIs (`adminApi`), identical to F18.1–F18.4. The proposed plan focuses entirely on refactoring the Server Component architecture and applying explicit authorization.

### 2. Repository Structure
- `src/app/(admin)/admin/collections/page.tsx`
- `src/components/admin/collections/CollectionManager.tsx`
- `src/components/admin/collections/CollectionForm.tsx`
- `src/app/api/admin/collections/route.ts`
- `src/app/api/admin/collections/[collectionId]/route.ts`
- `src/server/services/collection.service.ts`
- `src/server/validators/collection.validator.ts`

### 3. Route Inventory
| Route | File | Server/Client | API/Service Dependency | Auth | Status |
| ----- | ---- | ------------- | ---------------------- | ---- | ------ |
| `/admin/collections` | `page.tsx` | Server | `adminApi.getCollections` | Incomplete (Proxy) | 🔴 BROKEN |

### 4. Component Inventory
- `CollectionManager.tsx`: Client Component. Renders collections in a table, handles deletion.
- `CollectionForm.tsx`: Client Component. Handles create/update form (Name, Slug, Schedule, Status).

### 5. API Endpoint Inventory
| Method | Endpoint | Handler | Auth | Validator | Service | Status |
| ------ | -------- | ------- | ---- | --------- | ------- | ------ |
| `GET` | `/api/admin/collections` | `route.ts` | `ADMIN` | None | `getCollections` | ✅ COMPLETE |
| `POST` | `/api/admin/collections` | `route.ts` | `ADMIN` | `createCollectionSchema` | `createCollection` | ✅ COMPLETE |
| `GET` | `/api/admin/collections/[id]` | `[id]/route.ts` | `ADMIN` | None | `getCollectionById`| ✅ COMPLETE |
| `PATCH` | `/api/admin/collections/[id]` | `[id]/route.ts` | `ADMIN` | `updateCollectionSchema` | `updateCollection` | ✅ COMPLETE |
| `DELETE` | `/api/admin/collections/[id]`| `[id]/route.ts` | `ADMIN` | None | `deleteCollection` | ✅ COMPLETE |

### 6. Backend Service Map
`CollectionService`:
- `getCollections(activeOnly, includeFeatured)`
- `getCollectionById(id, activeOnly)`
- `getCollectionBySlug(slug, activeOnly)`
- `createCollection(data)`
- `updateCollection(id, data)` (Validates date logic)
- `deleteCollection(id)`

### 7. Validator Map
- `createCollectionSchema`
- `updateCollectionSchema`

### 8. Prisma Relationship Map
- Collections have a many-to-many relationship with Products via the `ProductCollection` join model (with `sortOrder`).
- Deletion cascades correctly.

### 9. Server/Client Boundary Audit
- **DEFECT:** `src/app/(admin)/admin/collections/page.tsx` passes `reqHeaders` into `adminApi.getCollections()`, leading to Next.js Proxy/Iterator header serialization crashes.

### 10. Authentication Audit
- Backend API endpoints are protected using `AuthService.requireRole(req.headers, 'ADMIN')`.

### 11. Authorization Audit
- Server Component lacks explicit `AuthService.requireRole` execution prior to data loading, relying on the HTTP proxy failing instead.

### 12. IDOR/Security Audit
- Mutations correctly require the `ADMIN` role. No privilege escalation issues observed.

### 13. DTO/Type Audit
- `AdminCollection` returns Prisma `Date` fields (`startsAt`, `endsAt`, `createdAt`, `updatedAt`) which will need to be safely stringified when sent across the React Server Component boundary.

### 14. Collection Functionality Audit
- **Listing:** ✅
- **Creation:** ✅
- **Editing:** ✅
- **Deletion:** ✅
- **Visibility:** ✅ (Supports `isActive`, `startsAt`, `endsAt`).

### 15. Product Assignment Audit
- Product assignment, removal, and ordering are handled by the **Product module** (`ProductForm.tsx` and `ProductService`), not the Collection module. This is correct per the current system boundaries.

### 16. Media/Cloudinary Audit
- Collections schema supports `imageUrl`, but no UI exists yet for image management. This appears intentional for this phase.

### 17. Runtime/Error Audit
- Existing error: `Cannot convert object to primitive value` (Serialization failure identical to previous modules).

### 18. Dependency Graph
`CollectionManager` -> `adminApi` -> API Routes -> `CollectionService` -> Prisma.

### 19. F18.5 Gap Matrix
| Module                 | Status | Priority | Required Action |
| ---------------------- | ------ | -------- | --------------- |
| Collection Listing     | ✅     | Low      | None            |
| Collection Creation    | ✅     | Low      | None            |
| Collection Editing     | ✅     | Low      | None            |
| Collection Deletion    | ✅     | Low      | None            |
| Collection Visibility  | ✅     | Low      | None            |
| Product Assignment     | ✅     | Low      | None (via Prod) |
| API Contracts          | ✅     | Low      | None            |
| Authorization          | 🔴     | High     | Add to page.tsx |
| Serialization          | 🔴     | High     | Add to page.tsx |
| Server/Client Boundary | 🔴     | High     | Use Service dir |

### 20. Backend Dependency Assessment
**NO BACKEND CHANGES REQUIRED**

### 21. Database Dependency Assessment
**NO DATABASE CHANGES REQUIRED**

### 22. Exact Files Proposed for Modification
- `src/app/(admin)/admin/collections/page.tsx`

### 23. Files Explicitly Not To Modify
- Customer storefront
- `src/components/admin/collections/*`
- `src/app/api/admin/collections/*`
- `src/server/services/collection.service.ts`
- Database schema

### 24. Stage B Implementation Plan
Refactor `page.tsx` to directly call `CategoryService.getCollections()`, enforce Admin authorization explicitly, and serialize data.

### 25. Testing Plan
- TypeScript check (`tsc`)
- ESLint check (`lint`)
- Production build (`build`)

### 26. Security Testing Plan
- Test Unauthenticated/Customer access to ensure denial.

### 27. Regression Testing Plan
- Verify Dashboard, Inventory, Products, and Categories.

### 28. Risks
Minimal. Resolving the identical architectural defect found in F18.1–F18.4.

### 29. F18.5 Stage A Conclusion
Stage A is COMPLETE. Collections require only an isolated Server Component refactor.
