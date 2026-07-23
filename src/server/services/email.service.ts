import { Resend } from 'resend';
import { env } from '@/utils/env';
import { logger } from '@/utils/logger';

let resendClient: Resend | null = null;

if (env.RESEND_API_KEY && !env.RESEND_API_KEY.startsWith('re_dev_key')) {
  resendClient = new Resend(env.RESEND_API_KEY);
}

export interface SendVerificationOtpOptions {
  email: string;
  otp: string;
  type: 'sign-in' | 'email-verification' | 'forget-password' | 'change-email';
}

export class EmailService {
  /**
   * Send a branded authentication OTP email via Resend (or log gracefully in development).
   */
  static async sendVerificationOtp({ email, otp, type }: SendVerificationOtpOptions): Promise<boolean> {
    const subject = `Your Ahankara Boutique Verification Code: ${otp}`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; borderRadius: 8px;">
        <h2 style="color: #1a1a1a; margin-top: 0;">Ahankara Boutique</h2>
        <p style="color: #4a4a4a; font-size: 15px;">Your verification code for <strong>${type}</strong> is:</p>
        <div style="background-color: #f4f4f5; padding: 16px; text-align: center; border-radius: 6px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #111827;">${otp}</span>
        </div>
        <p style="color: #71717a; font-size: 13px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `;

    logger.info(`Sending OTP email to ${email}`, { type });

    if (!resendClient) {
      logger.info(`[DEV EMAIL MOCK] Verification email delivery unavailable in development for ${email}.`);
      return true;
    }

    try {
      const { error } = await resendClient.emails.send({
        from: env.AUTH_EMAIL_FROM,
        to: [email],
        subject,
        html,
      });

      if (error) {
        logger.error(`Failed to send email via Resend: ${error.message}`);
        return false;
      }

      return true;
    } catch (err) {
      logger.error('Error executing Resend email send', { error: err });
      return false;
    }
  }
}
