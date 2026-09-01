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
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
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
