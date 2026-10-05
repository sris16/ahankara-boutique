import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaClient: PrismaClient;

if (globalForPrisma.prisma) {
  prismaClient = globalForPrisma.prisma;
} else {
  // Parse password from URL to ensure it is a string (pg SCRAM auth fails if password is a number)
  const url = process.env.DATABASE_URL || '';
  let parsedPassword: string | undefined = undefined;
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsedPassword = decodeURIComponent(parsed.password);
    }
  } catch {
    const pwdMatch = url.match(/:([^:@]+)@/);
    if (pwdMatch) {
      parsedPassword = String(pwdMatch[1]);
    }
  }

  const pool = new Pool({ 
    connectionString: url,
    ...(parsedPassword !== undefined ? { password: parsedPassword } : {})
  });
  
  const adapter = new PrismaPg(pool);
  
  prismaClient = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaClient;
  }
}

export const prisma = prismaClient;
