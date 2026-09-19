# AHANKARA STUDIOS
## F18.4 — ADMIN CATEGORIES AUDIT & IMPLEMENTATION PLAN

### 1. Executive Summary
Phase F18.4 targets the Admin Categories module. The read-only audit revealed that the functionality for Categories (Hierarchy, Creation, Editing, Deleting, Visibility) is already fully built across the frontend UI, API routes, and backend services. The only critical defect identified is the Next.js header serialization crash caused by Server Components proxying HTTP requests to internal APIs (identical to F18.1/F18.2/F18.3). The proposed implementation plan focuses entirely on refactoring the Server Component architecture and explicitly applying authorization.

### 2. Existing Category Architecture
The Categories module uses a self-referencing hierarchical structure. The UI displays categories as a tree, while allowing creation/editing via a client-side form.
- **Frontend:** Server Component loads data, passes it to a Client Component (`CategoryManager`), which manages state and renders `CategoryForm` for mutations.
- **Backend:** API routes proxy to `CategoryService`, which handles deep validation including circular dependency checks (`checkIsDescendant`).

### 3. Route Inventory
- `src/app/(admin)/admin/categories/page.tsx` (Server Component)

### 4. Component Inventory
- `src/components/admin/categories/CategoryManager.tsx` (Client Component - Renders tree and handles delete)
- `src/components/admin/categories/CategoryForm.tsx` (Client Component - Handles create/update form)

### 5. API Contract Map
- `GET /api/admin/categories?tree=true`: Returns nested tree structure (`AdminCategoryTree[]`).
- `GET /api/admin/categories`: Returns flat array (`AdminCategory[]`).
- `POST /api/admin/categories`: Creates a new category.
- `GET /api/admin/categories/[categoryId]`: Fetches single category.
- `PATCH /api/admin/categories/[categoryId]`: Updates category (supports partial updates).
- `DELETE /api/admin/categories/[categoryId]`: Deletes category (fails if children exist).

### 6. Validator Map
- `createCategorySchema`: Validates name, slug, description, parentId, isActive, sortOrder.
- `updateCategorySchema`: Partial wrapper over `createCategorySchema`.

### 7. CategoryService Map
- `getCategories(activeOnly)`
- `getCategoryTree(activeOnly)`
- `getCategoryById(id, activeOnly)`
- `createCategory(data)`
- `updateCategory(id, data)` (Enforces cycle detection)
- `deleteCategory(id)` (Enforces leaf-only deletion)

### 8. Prisma Category Relationship Map
- Self-referencing: `parentId` points to another Category.
- Associated with Products via `categoryId`.

### 9. Authentication/Authorization Audit
- API Routes explicitly enforce `AuthService.requireRole(req.headers, 'ADMIN')`.
- **DEFECT:** Server Component (`src/app/(admin)/admin/categories/page.tsx`) currently bypasses explicit service-layer authorization and relies on the HTTP proxy failing. This must be fixed to directly call `AuthService.requireRole`.

### 10. Server/Client Boundary Audit
- **DEFECT:** `src/app/(admin)/admin/categories/page.tsx` passes `reqHeaders` into `adminApi.getCategoryTree`, causing Next.js Proxy serialization crashes at runtime.

### 11. Existing Functionality
- ✅ Tree visualization.
- ✅ Category creation.
- ✅ Category editing (Name, Slug, Description, Status, Sort Order, Parent).
- ✅ Category deletion (Safe deletion).
- ✅ Validation (Zod & Service-level).
- ✅ Slug auto-generation (Fallback in API).

### 12. Missing Functionality
- None. The feature set matches the required business logic.

### 13. Broken Functionality
- Server Component Data Fetching (Serialization crash).

### 14. Data Integrity Risks
- Circular dependencies: Handled gracefully by `CategoryService.checkIsDescendant`.
- Orphaned children: Handled gracefully by `CategoryService.deleteCategory` which refuses deletion if children exist.

### 15. Proposed Changes
- Refactor `src/app/(admin)/admin/categories/page.tsx`:
  - Remove `adminApi` fetch calls.
  - Implement explicit `await AuthService.requireRole(reqHeaders, UserRole.ADMIN)`.
  - Fetch data via `CategoryService.getCategoryTree()` and `CategoryService.getCategories()`.
  - Serialize data across the Server/Client boundary using `JSON.parse(JSON.stringify(...))`.

### 16. Files To Modify
- `src/app/(admin)/admin/categories/page.tsx`

### 17. Files Explicitly Not To Modify
- `src/components/admin/categories/CategoryManager.tsx`
- `src/components/admin/categories/CategoryForm.tsx`
- `src/app/api/admin/categories/*`
- `src/server/services/category.service.ts`
- Database schema / Customer Storefront.

### 18. Testing Plan
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`

### 19. Security Testing Plan
- Simulate Customer/Unauthenticated access to `/admin/categories` to confirm rejection.
- Confirm Admin access works.
- Verify mutation security.

### 20. Regression Testing Plan
- Confirm Dashboard (F18.1), Inventory (F18.2), and Products (F18.3) are unaffected.

### 21. Risks
- None, as the changes are strictly isolated to fixing the proxy serialization bug in a single Server Component.

### 22. Final Recommendation
Proceed with the isolated architectural refactor of `src/app/(admin)/admin/categories/page.tsx` to directly invoke services, explicit authorization, and DTO serialization.
