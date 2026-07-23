import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';
import { emailSchema } from '../validators/user.validator';

// Safe user serialization to prevent leaking future sensitive fields
export function serializeUser(user: User) {
  const isVerified = user.emailVerified || !!user.emailVerifiedAt;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    status: user.status,
    emailVerified: isVerified,
    emailVerifiedAt: isVerified ? (user.emailVerifiedAt ?? user.updatedAt) : null,
    createdAt: user.createdAt,
  };
}

export class UserService {
  static normalizeEmail(email: string) {
    return emailSchema.parse(email);
  }

  static async findById(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? serializeUser(user) : null;
  }

  static async findByEmail(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    return user ? serializeUser(user) : null;
  }

  // Development use / internal use only. Real signup is in V3.
  static async create(data: { email: string; name?: string; phone?: string; role?: 'CUSTOMER' | 'ADMIN' }) {
    const normalizedEmail = this.normalizeEmail(data.email);
    
    const user = await prisma.user.create({
      data: {
        ...data,
        email: normalizedEmail,
      },
    });
    
    return serializeUser(user);
  }
}
