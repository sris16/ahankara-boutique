# F18.12 — ADMIN CUSTOMERS AUDIT

### 1. Executive Summary
The Stage A Audit of F18.12 confirms that this phase represents **Admin Customers / Customer Management**. The audit reveals that while the core foundational data structures (`User`, `Address`, `Order` Prisma models) and basic backend services (`UserService`) are robust and functional for the storefront, the Admin side of Customer Management is **entirely missing**. There are no Admin routes, no Admin UI components, and no Admin APIs dedicated to customer management.

### 2. Exact F18.12 Scope
- **Module Name:** Customers / Customer Management
- **Required Functionality:** Admin capability to list customers, view detailed customer profiles (including addresses and related order history), and manage customer status.
- **Current Status:** UI (NOT IMPLEMENTED), Admin API (NOT IMPLEMENTED), Backend DB (COMPLETE), Backend Service (PARTIAL).

### 3. Repository Structure
- `src/app/(admin)/admin/customers` (MISSING)
- `src/components/admin/customers` (MISSING)
- `src/app/api/admin/customers` (MISSING)
- `src/server/services/user.service.ts` (PARTIAL - Lacks Admin-specific listing methods)
- `prisma/schema.prisma` (COMPLETE)

### 4. Route Inventory
There are currently **zero** Admin routes for Customer Management.

### 5. Component Inventory
There are currently **zero** Admin Customer Management components.

### 6. API Endpoint Inventory
There are currently **zero** Admin Customer API endpoints.

### 7. Backend Service Map
- `UserService.findById`: COMPLETE (but returns sanitized data tailored for the storefront).
- `UserService.findByEmail`: COMPLETE.
- `UserService.create`: COMPLETE.
- `UserService.updateProfile`: COMPLETE.
- **Missing:** There is no `findMany` or paginated listing method for Admin use. However, following the F18 architecture, this can be bypassed by performing a direct Prisma query inside the Server Component.

### 8. Validator Map
No Admin-specific validators exist for updating customer status.

### 9. Prisma/Data Model Map
The `User` model is fully featured and contains relations for `addresses`, `orders`, `couponRedemptions`, `returnRequests`, and `exchangeRequests`. The model also includes `role` and `status` enums. No schema changes are required.

### 10. Authentication Audit
Admin APIs and Server Components do not exist for this module yet, but when created, they must enforce authentication via Better Auth.

### 11. Authorization Audit
When created, the Server Components and API routes must explicitly invoke `await AuthService.requireRole(requestHeaders, UserRole.ADMIN)`.

### 12. IDOR/Security Audit
Since the functionality does not yet exist, there are no immediate IDOR vulnerabilities in the Admin module. However, the future `[customerId]` routes must strictly enforce Admin roles to prevent non-admins from viewing other users' data.

### 13. Functionality Audit
- List Customers: **NOT IMPLEMENTED**
- View Customer Details: **NOT IMPLEMENTED**
- Manage Customer Status: **NOT IMPLEMENTED**
- View Customer Orders: **NOT IMPLEMENTED** (Can be inferred via the Orders module, but missing from the Customer view).

### 14. Server/Client Boundary Audit
Not applicable as no files exist yet. New files must adhere to the direct-service-invocation rule and avoid `adminApi` internal HTTP requests.

### 15. Serialization Audit
Not applicable yet. New Server Components must use `JSON.parse(JSON.stringify(data))` when passing Prisma user/order records to Client Components.

### 16. Existing vs Missing Functionality
- **Existing:** Database models, Storefront user services.
- **Missing:** Admin UI, Admin API, Admin Server Components.

### 17. Gap Matrix
| Capability | UI | API | Service | DB | Auth | Status | Required Action |
| ---------- | -- | --- | ------- | -- | ---- | ------ | --------------- |
| Customer Listing | ⚪ | N/A | ⚪ | ✅ | N/A | **NOT IMPLEMENTED** | Create Server Component + UI |
| Customer Details | ⚪ | N/A | ✅ | ✅ | N/A | **NOT IMPLEMENTED** | Create Server Component + UI |
| Manage Status | ⚪ | ⚪ | ⚪ | ✅ | N/A | **NOT IMPLEMENTED** | Create Admin API + UI |

### 18. Exact Root Causes
The F18.12 module was intentionally deferred on the roadmap and has not yet been started.

### 19. Exact Files Proposed for Modification
- `src/components/admin/layout/AdminSidebar.tsx` (to add navigation link)

### 20. Files Explicitly Protected
- All completed modules from F18.1–F18.11.
- `prisma/schema.prisma`
- `src/server/services/user.service.ts` (Existing logic must remain intact).

### 21. Backend Dependency Assessment
Direct Prisma access inside Server Components will satisfy the data-fetching requirements without needing to alter `UserService`.

### 22. Database Dependency Assessment
No changes needed. `User`, `UserRole`, and `UserStatus` exist.

### 23. Security Risk Assessment
Implementing new Admin endpoints introduces the risk of data exposure if `AuthService.requireRole` is forgotten.

### 24. Data Integrity Risk Assessment
No database schema changes are required, minimizing data integrity risks.

### 25. Stage B Implementation Plan
See `F18_12_IMPLEMENTATION_PLAN.md`.

### 26. Testing Plan
Execute `npm run build` after implementation.

### 27. Security Testing Plan
Verify `AuthService` guards all new routes and API endpoints.

### 28. Regression Testing Plan
Ensure no existing `/admin/*` routes are affected.

### 29. Risks
None if implemented minimally.

### 30. Stage A Conclusion
**F18.12 Stage A is COMPLETE.** The module is entirely missing from the Admin layer and must be built using the established F18 direct-invocation Server Component architecture.
