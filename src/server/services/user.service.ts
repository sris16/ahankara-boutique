import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';
import { emailSchema, updateProfileSchema } from '../validators/user.validator';

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

  static async updateProfile(userId: string, data: unknown) {
    const validData = updateProfileSchema.parse(data);
    
    // Ensure we don't save empty strings if they are meant to be null/undefined for optional fields
    const updateData: Record<string, string | null> = {};
    if (validData.name !== undefined) updateData.name = validData.name || null;
    if (validData.phone !== undefined) updateData.phone = validData.phone || null;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
    
    return serializeUser(user);
  }
}
