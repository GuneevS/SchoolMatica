/**
 * Redis client singleton for distributed caching and rate limiting
 *
 * Falls back to in-memory storage if Redis is not available (development mode)
 */

import Redis from "ioredis";

let redisClient: Redis | null = null;
let isRedisAvailable = false;

/**
 * Get or create Redis client instance
 */
export function getRedisClient(): Redis | null {
  // Return existing client if already initialized
  if (redisClient !== null) {
    return isRedisAvailable ? redisClient : null;
  }

  // Only initialize Redis if REDIS_URL is configured
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn("[Redis] REDIS_URL not configured, using in-memory fallback");
    return null;
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    // Connect and handle errors
    redisClient.connect().then(() => {
      isRedisAvailable = true;
      console.log("[Redis] Connected successfully");
    }).catch((err) => {
      console.error("[Redis] Connection failed:", err);
      isRedisAvailable = false;
      redisClient = null;
    });

    // Handle connection errors
    redisClient.on("error", (err) => {
      console.error("[Redis] Client error:", err);
      isRedisAvailable = false;
    });

    // Handle reconnection
    redisClient.on("connect", () => {
      isRedisAvailable = true;
      console.log("[Redis] Reconnected");
    });

    return redisClient;
  } catch (error) {
    console.error("[Redis] Failed to create client:", error);
    redisClient = null;
    return null;
  }
}

/**
 * Check if Redis is available and connected
 */
export function isRedisConnected(): boolean {
  return isRedisAvailable && redisClient !== null;
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isRedisAvailable = false;
  }
}
