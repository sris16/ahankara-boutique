import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/utils/rate-limit';
import { TooManyRequestsError } from '@/utils/errors';

const handler = toNextJsHandler(auth);

export const { GET } = handler;

export const POST = async (req: NextRequest) => {
  const url = new URL(req.url);
  const path = url.pathname;

  // Sensitive authentication endpoints that require rate limiting against brute force
  if (
    path === '/api/auth/sign-in/email' ||
    path === '/api/auth/sign-up/email' ||
    path === '/api/auth/email-otp/send-verification-otp' ||
    path === '/api/auth/email-otp/verify-email' ||
    path === '/api/auth/forget-password' ||
    path === '/api/auth/reset-password'
  ) {
    try {
      // 5 requests per minute
      checkRateLimit(req, { max: 5, windowMs: 60 * 1000 });
    } catch (error: unknown) {
      if (error instanceof TooManyRequestsError) {
        // Extract wait time from message or default to 60s
        const match = error.message.match(/wait (\d+) seconds/);
        const retryAfter = match ? match[1] : '60';
        
        return NextResponse.json(
          { success: false, message: error.message, error: { code: 'TOO_MANY_REQUESTS' } },
          { status: 429, headers: { 'Retry-After': retryAfter } }
        );
      }
      return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
  }

  return handler.POST(req);
};
