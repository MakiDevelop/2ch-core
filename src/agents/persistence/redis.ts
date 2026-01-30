/**
 * Redis Client - Centralized Redis connection
 *
 * Used for:
 * - Distributed rate limiting (works across multiple instances)
 * - Caching hot data (boards, popular threads)
 * - Session/state management
 */

import Redis from "ioredis";
import env from "../../config/env";

// Lazy initialization - only connect when needed
let redisClient: Redis | null = null;
let connectionFailed = false;

/**
 * Get Redis client instance (singleton)
 * Returns null if Redis is not configured or connection failed
 */
export function getRedisClient(): Redis | null {
  if (connectionFailed) {
    return null;
  }

  if (redisClient) {
    return redisClient;
  }

  if (!env.REDIS_URL) {
    console.log("[Redis] REDIS_URL not configured, using in-memory fallback");
    return null;
  }

  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          console.error("[Redis] Max retries reached, giving up");
          connectionFailed = true;
          return null; // Stop retrying
        }
        const delay = Math.min(times * 200, 2000);
        return delay;
      },
      lazyConnect: true,
    });

    redisClient.on("error", (err) => {
      console.error("[Redis] Connection error:", err.message);
    });

    redisClient.on("connect", () => {
      console.log("[Redis] Connected successfully");
    });

    redisClient.on("close", () => {
      console.log("[Redis] Connection closed");
    });

    // Attempt to connect
    redisClient.connect().catch((err) => {
      console.error("[Redis] Failed to connect:", err.message);
      connectionFailed = true;
      redisClient = null;
    });

    return redisClient;
  } catch (err) {
    console.error("[Redis] Initialization error:", err);
    connectionFailed = true;
    return null;
  }
}

/**
 * Check if Redis is available and connected
 */
export async function isRedisAvailable(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

// Key prefixes for different use cases
export const REDIS_KEYS = {
  RATE_LIMIT: "rl:", // Rate limiting: rl:{type}:{ipHash}
  CACHE: "cache:", // Cache: cache:{type}:{id}
  CONTENT_HASH: "ch:", // Content hash for duplicate detection: ch:{ipHash}
} as const;
