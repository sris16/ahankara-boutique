import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { emailOTP } from 'better-auth/plugins/email-otp';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/server/services/email.service';
import { env } from '@/utils/env';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    ...(env.BETTER_AUTH_URL ? [env.BETTER_AUTH_URL] : []),
  ],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url, token }, request) => {
      await EmailService.sendPasswordResetEmail({
        email: user.email,
        url: url,
      });
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'CUSTOMER',
        required: false,
        input: false,
      },
      status: {
        type: 'string',
        defaultValue: 'ACTIVE',
        required: false,
        input: false,
      },
      phone: {
        type: 'string',
        required: false,
      },
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID || "",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await EmailService.sendVerificationOtp({ email, otp, type });
      },
      otpLength: 6,
      expiresIn: 600, // 10 minutes
    }),
  ],
});
