import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1618@localhost:5432/ahankara_boutique', password: '1618' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'e2e-admin@ahankarastudios.test';
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: 'E2E Admin',
        emailVerified: true,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
  }

  const sessionToken = 'e2e-admin-session-token-999';
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await prisma.session.upsert({
    where: { token: sessionToken },
    update: { expiresAt },
    create: {
      token: sessionToken,
      userId: user.id,
      expiresAt,
    }
  });

  console.log('E2E admin session created. Token:', sessionToken);
}

main().catch(console.error).finally(() => prisma.$disconnect());
