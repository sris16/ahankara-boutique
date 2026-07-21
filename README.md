# Ahankara Boutique E-Commerce Platform — Backend Version 1

## Project Overview
This repository contains the V1 backend foundation for the Ahankara Boutique E-Commerce Platform. This version establishes the core infrastructure, Next.js architecture, and PostgreSQL + Prisma database integration, preparing for full domain implementation in subsequent versions.

## Technology Stack
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Runtime**: Node.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **Styling**: Tailwind CSS (Foundation only)

## Prerequisites
- Node.js (v18.17.0 or higher)
- PostgreSQL (v14 or higher) running locally or accessible remotely
- npm (v9 or higher)

## Environment Setup
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Update the `DATABASE_URL` in `.env` with your actual PostgreSQL connection string. Ensure the database is accessible.

## Installation
Run the following command to install all project dependencies:
```bash
npm install
```

## Database Configuration & Prisma Setup
This project uses Prisma ORM to interact with PostgreSQL.

1. **Generate Prisma Client:**
   ```bash
   npm run db:generate
   ```
2. **Run Migrations:**
   To apply the initial schema to your database:
   ```bash
   npm run db:migrate
   ```
3. **Open Prisma Studio:** (Optional)
   To view and interact with your database using Prisma's GUI:
   ```bash
   npm run db:studio
   ```

## Development Commands
- Start the development server: `npm run dev`
- Build for production: `npm run build`
- Start production server: `npm run start`
- Run linter: `npm run lint`

## Health Endpoint
You can verify that the application is running and successfully connected to the database by accessing:
`GET /api/health`

**Expected Successful Response:**
```json
{
  "success": true,
  "status": "healthy",
  "database": "connected",
  "timestamp": "2023-10-25T12:00:00Z"
}
```

## Current Version 1 Scope
- Next.js + TypeScript project initialization with App Router.
- PostgreSQL + Prisma integration.
- Standardized API response utilities.
- Centralized error handling and validation (Zod) foundation.
- System health-check API endpoint.
- Fundamental backend folder architecture (`src/utils`, `src/lib`, etc.).

## Features Intentionally Deferred
- Customer registration and authentication (Auth.js)
- Product and variant management
- Cart, checkout, and order systems
- Razorpay payment processing
- External API integrations (Shiprocket, Cloudinary, Resend)
- Any actual frontend/UI development (Customer facing and Admin Dashboard)

## Version 2 Scope
- Created User model with `UUID` id, `role`, `status`, and verification timestamps.
- Created Address model supporting Indian formats (6-digit PIN validation).
- Implemented `AddressType` enum (HOME, WORK, OTHER).
- Created safe backend service logic (`UserService`, `AddressService`) with proper user isolation.
- Built development REST APIs for managing addresses (`/api/users/:userId/addresses`).
- Added Prisma transactions to handle switching `isDefaultShipping` and `isDefaultBilling`.
- **Note:** Authentication is NOT implemented yet. These APIs currently use the URL parameter as identity solely for Version 2 domain testing.
