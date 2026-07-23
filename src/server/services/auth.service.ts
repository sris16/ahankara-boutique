import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, UserStatus } from '@prisma/client';
import { ForbiddenError, UnauthorizedError, ValidationError, ConflictError } from '@/utils/errors';
import { emailSchema } from '../validators/user.validator';
import { serializeUser } from './user.service';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: Date;
}

export class AuthService {
  /**
   * Retrieve active Better Auth session & user for given HTTP headers.
   */
  static async getSession(headers: Headers) {
    return auth.api.getSession({
      headers,
    });
  }

  /**
   * Verify request has a valid authenticated session AND user account is ACTIVE.
   * Throws UnauthorizedError if not logged in, or ForbiddenError if account is SUSPENDED/DEACTIVATED.
   */
  static async requireAuth(headers: Headers): Promise<AuthenticatedUser> {
    const sessionData = await this.getSession(headers);

    if (!sessionData || !sessionData.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: sessionData.user.id },
    });

    if (!dbUser) {
      throw new UnauthorizedError('User account not found');
    }

    if (dbUser.status === UserStatus.SUSPENDED) {
      throw new ForbiddenError('Your account has been suspended. Please contact support.');
    }

    if (dbUser.status === UserStatus.DEACTIVATED) {
      throw new ForbiddenError('Your account has been deactivated.');
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      phone: dbUser.phone,
      role: dbUser.role,
      status: dbUser.status,
      emailVerified: dbUser.emailVerified,
      createdAt: dbUser.createdAt,
    };
  }

  /**
   * Enforce role-based access control (e.g. require UserRole.ADMIN or UserRole.CUSTOMER).
   */
  static async requireRole(headers: Headers, requiredRole: UserRole): Promise<AuthenticatedUser> {
    const user = await this.requireAuth(headers);

    if (user.role !== requiredRole) {
      throw new ForbiddenError(`Access denied. ${requiredRole} role required.`);
    }

    return user;
  }

  /**
   * Secure customer registration service.
   * STRICT SECURITY: Public signups ALWAYS default to CUSTOMER role and ACTIVE status.
   * Client-provided role or status parameters are strictly ignored.
   */
  static async registerCustomer(data: { name?: string; email: string; password?: string; phone?: string }) {
    const normalizedEmail = emailSchema.parse(data.email);

    if (!data.password || data.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictError('An account with this email address already exists');
    }

    // Call Better Auth to create the user & credential account safely
    const response = await auth.api.signUpEmail({
      body: {
        email: normalizedEmail,
        password: data.password,
        name: data.name ?? 'Customer',
      },
    });

    // Update custom fields on the user record if phone or defaults need sync
    if (response?.user?.id) {
      await prisma.user.update({
        where: { id: response.user.id },
        data: {
          role: UserRole.CUSTOMER,
          status: UserStatus.ACTIVE,
          phone: data.phone ?? null,
        },
      });
    }

    const freshUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    return freshUser ? serializeUser(freshUser) : response.user;
  }

  /**
   * Controlled admin account provisioning mechanism for local/dev setup.
   * Cannot be triggered through public signups.
   */
  static async seedAdminUser(data: { name: string; email: string; password: string; phone?: string }) {
    const normalizedEmail = emailSchema.parse(data.email);

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      await prisma.user.update({
        where: { email: normalizedEmail },
        data: { role: UserRole.ADMIN, status: UserStatus.ACTIVE },
      });
      return serializeUser((await prisma.user.findUnique({ where: { email: normalizedEmail } }))!);
    }

    const response = await auth.api.signUpEmail({
      body: {
        email: normalizedEmail,
        password: data.password,
        name: data.name,
      },
    });

    if (response?.user?.id) {
      await prisma.user.update({
        where: { id: response.user.id },
        data: {
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          phone: data.phone ?? null,
        },
      });
    }

    const adminUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    return adminUser ? serializeUser(adminUser) : response.user;
  }
}
