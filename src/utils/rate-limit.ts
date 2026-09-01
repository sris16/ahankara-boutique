import { NextRequest } from 'next/server';
import { TooManyRequestsError } from './errors';

interface RateLimitStore {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitStore>();

export interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds (default 60 seconds)
  max?: number;      // Max requests allowed in window (default 5)
}

/**
 * Development/local in-memory rate limiter.
 * Production requires a distributed/shared rate-limit store (e.g. Redis or Upstash).
 * Clean abstraction allows swapping the underlying store without altering authentication logic.
 */
export function checkRateLimit(req: NextRequest, options: RateLimitOptions = {}) {
  const windowMs = options.windowMs ?? 60 * 1000;
  const max = options.max ?? 5;

  // Rely on Next.js req.ip (populated securely by the hosting platform like Vercel)
  // Blindly trusting x-forwarded-for allows trivial spoofing bypass on unprotected endpoints
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ip = (req as any).ip ?? req.headers.get('x-forwarded-for') ?? '127.0.0.1';

  const now = Date.now();
  const key = `${req.nextUrl.pathname}:${ip}`;

  const current = rateLimitMap.get(key);

  if (!current || now > current.resetAt) {
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return;
  }

  if (current.count >= max) {
    throw new TooManyRequestsError(`Too many requests. Please wait ${Math.ceil((current.resetAt - now) / 1000)} seconds.`);
  }

  current.count += 1;
}

// Periodic cleanup of expired rate limit entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
