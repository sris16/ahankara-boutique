import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma';
import { auth } from '../src/lib/auth';
import { AuthService } from '../src/server/services/auth.service';

export default async function globalSetup() {
  console.log('Seeding E2E test data and generating auth state...');

  // 1. Ensure Admin user exists
  await AuthService.seedAdminUser({
    name: 'E2E Proper Admin',
    email: 'admin2@ahankarastudios.test',
    password: 'Password123!',
  });

  // 2. Ensure Customer user exists
  const custEmail = 'cust2@ahankarastudios.test';
  const custPassword = 'Password123!';
  const existingCust = await prisma.user.findUnique({ where: { email: custEmail } });
  if (!existingCust) {
    await AuthService.registerCustomer({
      name: 'E2E Proper Customer',
      email: custEmail,
      password: custPassword,
    });
  }

  // Ensure emailVerified for test accounts
  await prisma.user.updateMany({
    where: { email: { in: ['admin2@ahankarastudios.test', custEmail] } },
    data: { emailVerified: true },
  });

  // 3. Generate authenticated customer storage state using real Better Auth sign-in
  const authResponse = await auth.api.signInEmail({
    body: {
      email: custEmail,
      password: custPassword,
    },
    asResponse: true,
  });

  const setCookie = authResponse.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error('Failed to obtain set-cookie from Better Auth signInEmail');
  }

  const match = setCookie.match(/better-auth\.session_token=([^;]+)/);
  if (!match) {
    throw new Error('better-auth.session_token cookie not found in response');
  }

  const tokenValue = match[1];

  const authDir = path.resolve(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const customerAuth = {
    cookies: [
      {
        name: 'better-auth.session_token',
        value: tokenValue,
        domain: 'localhost',
        path: '/',
        expires: Math.floor((Date.now() + 1000 * 60 * 60 * 24 * 7) / 1000),
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ],
    origins: [],
  };

  fs.writeFileSync(path.join(authDir, 'customer.json'), JSON.stringify(customerAuth, null, 2));
  console.log('Customer storage state written to e2e/.auth/customer.json');

  // 4. Ensure test product exists
  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({
      data: { name: 'E2E Category', slug: 'e2e-category' },
    });
  }

  const productSlug = 'e2e-test-product';
  let product = await prisma.product.findUnique({ where: { slug: productSlug } });

  if (!product) {
    product = await prisma.product.create({
      data: {
        name: 'E2E Test Product',
        slug: productSlug,
        basePrice: 500000, // 5000 INR
        categoryId: category.id,
        status: 'PUBLISHED',
      },
    });
  }

  let variant = await prisma.productVariant.findFirst({ where: { productId: product.id } });
  if (!variant) {
    variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: 'E2E-TEST-SKU-1',
        size: 'M',
        isActive: true,
      },
    });
  }

  const inventory = await prisma.inventory.findUnique({ where: { variantId: variant.id } });
  if (!inventory) {
    await prisma.inventory.create({
      data: {
        variantId: variant.id,
        quantity: 100,
        lowStockThreshold: 10,
      },
    });
  } else if (inventory.quantity <= 0) {
    await prisma.inventory.update({
      where: { variantId: variant.id },
      data: { quantity: 100 },
    });
  }

  console.log('E2E seed complete.');
  await prisma.$disconnect();
}

// Run immediately if executed directly via tsx
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  globalSetup().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
