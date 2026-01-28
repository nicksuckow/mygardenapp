/**
 * Simple in-memory rate limiter for API routes.
 * For production at scale, consider using Redis-based rate limiting.
 */

type RateLimitRecord = {
  count: number;
  resetTime: number;
};

// In-memory store - resets on server restart
const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

type RateLimitConfig = {
  maxRequests: number; // Maximum requests allowed
  windowMs: number; // Time window in milliseconds
};

// Default configurations for different endpoint types
export const RATE_LIMITS = {
  // Auth endpoints - strict limits to prevent brute force
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 minutes

  // Password reset - very strict
  passwordReset: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour

  // Account deletion - very strict
  accountDelete: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour

  // External API calls (Verdantly, Trefle) - moderate
  externalApi: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 per minute

  // General API - relaxed
  general: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 per minute
} as const;

type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetIn: number; // seconds until reset
};

/**
 * Check and update rate limit for a given identifier
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param endpoint - Endpoint identifier for grouping
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${endpoint}:${identifier}`;
  const now = Date.now();

  let record = rateLimitStore.get(key);

  // If no record or window has passed, create new record
  if (!record || record.resetTime < now) {
    record = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, record);

    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetIn: Math.ceil(config.windowMs / 1000),
    };
  }

  // Increment count
  record.count++;

  const remaining = Math.max(0, config.maxRequests - record.count);
  const resetIn = Math.ceil((record.resetTime - now) / 1000);

  if (record.count > config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetIn,
    };
  }

  return {
    success: true,
    remaining,
    resetIn,
  };
}

/**
 * Get client identifier from request (IP address or forwarded IP)
 */
export function getClientIdentifier(req: Request): string {
  // Check for forwarded IP (common in proxied environments like Vercel)
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // Take the first IP in the list (original client)
    return forwarded.split(",")[0].trim();
  }

  // Check for real IP header
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to a default (shouldn't happen in production)
  return "unknown";
}

/**
 * Create rate limit error response
 */
export function rateLimitResponse(resetIn: number) {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
      retryAfter: resetIn,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(resetIn),
      },
    }
  );
}
