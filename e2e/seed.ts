import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: 'postgresql://postgres:1618@localhost:5432/ahankara_boutique', password: '1618' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding E2E test data...');

  // 1. Ensure E2E user exists
  const email = 'e2e-customer@ahankarastudios.test';

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: 'E2E Customer',
        emailVerified: true,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });

    // Better Auth 'accounts' for password (hashed password - usually better-auth handles this,
    // but we can just use the Better Auth API to create the user, or we can manually insert the password)
    // Actually, Better Auth stores passwords in `accounts` table.
    // Let's create an account with a dummy hashed password if we can't use the API easily,
    // BUT we can also just create a manual Session directly!

    const sessionToken = 'e2e-deterministic-session-token-12345';

    await prisma.session.create({
      data: {
        token: sessionToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
      }
    });
  } else {
    // Ensure session exists
    const sessionToken = 'e2e-deterministic-session-token-12345';
    const existingSession = await prisma.session.findUnique({ where: { token: sessionToken } });
    if (!existingSession) {
      await prisma.session.create({
        data: {
          token: sessionToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
        }
      });
    }
  }

  // 2. Ensure test product exists
  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({
      data: { name: 'E2E Category', slug: 'e2e-category' }
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
      }
    });

    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: 'E2E-TEST-SKU-1',
        size: 'M',
        isActive: true,
      }
    });

    await prisma.inventory.create({
      data: {
        variantId: variant.id,
        quantity: 100,
        lowStockThreshold: 10
      }
    });
  }

  console.log('E2E seed complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
