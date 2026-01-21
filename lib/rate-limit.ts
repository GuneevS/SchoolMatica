/**
 * Production-grade rate limiting with Redis support
 *
 * Features:
 * - Redis-backed for distributed environments (multiple server instances)
 * - Automatic fallback to in-memory storage when Redis unavailable
 * - Sliding window algorithm for accurate rate limiting
 */

import { getRedisClient, isRedisConnected } from "./redis";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory fallback storage when Redis is unavailable
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 10 minutes (only for in-memory fallback)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the time window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Optional identifier (defaults to IP address) */
  identifier?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when the limit resets
}

/**
 * Check rate limit using Redis (distributed) or in-memory (fallback)
 *
 * @param identifier - Unique identifier for the client (IP address, user ID, etc.)
 * @param config - Rate limiting configuration
 * @returns RateLimitResult with success status and metadata
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // Use Redis if available, otherwise fall back to in-memory
  if (isRedisConnected()) {
    return checkRateLimitRedis(identifier, config);
  } else {
    return checkRateLimitMemory(identifier, config);
  }
}

/**
 * Redis-based rate limiting (production-ready, distributed)
 */
async function checkRateLimitRedis(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  if (!redis) {
    // Fallback if Redis connection failed
    return checkRateLimitMemory(identifier, config);
  }

  const now = Date.now();
  const key = `ratelimit:${identifier}:${config.windowMs}`;
  const windowStart = now - config.windowMs;

  try {
    // Use sorted set with timestamp scores for sliding window
    const pipeline = redis.pipeline();

    // Remove old entries outside the window
    pipeline.zremrangebyscore(key, 0, windowStart);

    // Add current request
    pipeline.zadd(key, now, `${now}`);

    // Count requests in the current window
    pipeline.zcard(key);

    // Set expiry on the key
    pipeline.expire(key, Math.ceil(config.windowMs / 1000));

    const results = await pipeline.exec();

    // Extract count from results (3rd command is zcard)
    const count = (results?.[2]?.[1] as number) || 0;

    const remaining = Math.max(0, config.maxRequests - count);
    const success = count <= config.maxRequests;
    const resetTime = now + config.windowMs;

    return {
      success,
      limit: config.maxRequests,
      remaining,
      reset: Math.floor(resetTime / 1000),
    };
  } catch (error) {
    console.error("[RateLimit] Redis error, falling back to memory:", error);
    return checkRateLimitMemory(identifier, config);
  }
}

/**
 * In-memory rate limiting (fallback for development/single instance)
 */
function checkRateLimitMemory(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = `${identifier}:${config.windowMs}`;

  let entry = rateLimitStore.get(key);

  // Create new entry if doesn't exist or expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  // Increment request count
  entry.count++;

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const success = entry.count <= config.maxRequests;

  return {
    success,
    limit: config.maxRequests,
    remaining,
    reset: Math.floor(entry.resetTime / 1000),
  };
}

/**
 * Get client identifier from request (IP address)
 *
 * Checks various headers in order of preference:
 * 1. X-Forwarded-For (from load balancer)
 * 2. X-Real-IP (from reverse proxy)
 * 3. Falls back to "dev-localhost" in development only
 *
 * IMPORTANT: In production, proxy headers (X-Forwarded-For or X-Real-IP) are REQUIRED.
 * Configure your reverse proxy (nginx, Cloudflare, etc.) to set these headers.
 */
export function getClientIdentifier(request: Request): string {
  const headers = new Headers(request.headers);

  // Try X-Forwarded-For first (most common for load balancers)
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    // Take the first IP if multiple are present (client IP)
    const clientIp = forwarded.split(",")[0].trim();
    // Validate it's not empty
    if (clientIp && clientIp !== "") {
      return clientIp;
    }
  }

  // Try X-Real-IP (used by some reverse proxies)
  const realIp = headers.get("x-real-ip");
  if (realIp && realIp !== "") {
    return realIp;
  }

  // In production, missing proxy headers is a configuration error
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[RateLimit] CRITICAL: No proxy headers (X-Forwarded-For, X-Real-IP) found in production. " +
      "This is a misconfiguration - all requests will share the same rate limit bucket. " +
      "Configure your reverse proxy to set these headers."
    );
    // Return a restrictive fallback that will trigger rate limits quickly
    // This prevents abuse while alerting to the configuration issue
    return "missing-proxy-headers-CONFIGURE-REVERSE-PROXY";
  }

  // Development fallback: allow local testing without proxy
  return "dev-localhost";
}

/**
 * Predefined rate limit configurations for common use cases
 */
export const RATE_LIMITS = {
  /** Very strict: 3 requests per 15 minutes (login attempts) */
  AUTH_LOGIN: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  /** Strict: 3 requests per hour (password reset) */
  AUTH_PASSWORD_RESET: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  /** Moderate: 5 requests per hour (registration) */
  AUTH_REGISTER: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  /** Standard: 100 requests per minute (general API) */
  API_STANDARD: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;
