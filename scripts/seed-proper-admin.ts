import { AuthService } from '../src/server/services/auth.service';
import { prisma } from '../src/lib/prisma';

async function main() {
  const result = await AuthService.seedAdminUser({
    name: 'E2E Proper Admin',
    email: 'admin2@ahankarastudios.test',
    password: 'Password123!'
  });
  console.log('Proper E2E Admin seeded:', result);

  const custResult = await AuthService.registerCustomer({
    name: 'E2E Proper Customer',
    email: 'cust2@ahankarastudios.test',
    password: 'Password123!'
  });
  console.log('Proper E2E Cust seeded:', custResult);
}

main().catch(console.error).finally(() => prisma.$disconnect());
