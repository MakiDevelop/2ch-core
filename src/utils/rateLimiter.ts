/**
 * Rate Limiter - Redis-backed with in-memory fallback
 *
 * Provides distributed rate limiting when Redis is available,
 * falls back to in-memory Map when Redis is unavailable.
 */

import { getRedisClient, REDIS_KEYS } from "../agents/persistence/redis";

// In-memory fallback storage
const memoryStore = new Map<string, number>();

// Cleanup interval for memory store (5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

// Start cleanup interval
setInterval(() => {
  const now = Date.now();
  for (const [key, expireAt] of memoryStore) {
    if (now > expireAt) {
      memoryStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

export type RateLimitResult = {
  allowed: boolean;
  retryAfter?: number; // Seconds until allowed
};

/**
 * Check rate limit for an action
 *
 * @param type - Action type (e.g., "search", "report", "post")
 * @param identifier - Unique identifier (usually ipHash)
 * @param cooldownMs - Cooldown period in milliseconds
 * @returns Whether the action is allowed and retry time if not
 */
export async function checkRateLimit(
  type: string,
  identifier: string,
  cooldownMs: number
): Promise<RateLimitResult> {
  const key = `${REDIS_KEYS.RATE_LIMIT}${type}:${identifier}`;
  const now = Date.now();
  const redis = getRedisClient();

  if (redis) {
    try {
      // Use Redis for distributed rate limiting
      const lastTime = await redis.get(key);

      if (lastTime) {
        const elapsed = now - parseInt(lastTime, 10);
        if (elapsed < cooldownMs) {
          const retryAfter = Math.ceil((cooldownMs - elapsed) / 1000);
          return { allowed: false, retryAfter };
        }
      }

      // Action allowed - record timestamp with TTL
      const ttlSeconds = Math.ceil(cooldownMs / 1000) * 2; // Double the cooldown for safety
      await redis.setex(key, ttlSeconds, now.toString());

      return { allowed: true };
    } catch (err) {
      console.error("[RateLimiter] Redis error, falling back to memory:", err);
      // Fall through to memory fallback
    }
  }

  // In-memory fallback
  const memKey = key;
  const expireAt = memoryStore.get(memKey);

  if (expireAt && now < expireAt) {
    const retryAfter = Math.ceil((expireAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Action allowed - record expiration time
  memoryStore.set(memKey, now + cooldownMs);
  return { allowed: true };
}

/**
 * Record a rate limit hit without checking (for post-action recording)
 */
export async function recordRateLimit(
  type: string,
  identifier: string,
  cooldownMs: number
): Promise<void> {
  const key = `${REDIS_KEYS.RATE_LIMIT}${type}:${identifier}`;
  const now = Date.now();
  const redis = getRedisClient();

  if (redis) {
    try {
      const ttlSeconds = Math.ceil(cooldownMs / 1000) * 2;
      await redis.setex(key, ttlSeconds, now.toString());
      return;
    } catch (err) {
      console.error("[RateLimiter] Redis error:", err);
    }
  }

  // In-memory fallback
  memoryStore.set(key, now + cooldownMs);
}

/**
 * Check and record content hash for duplicate detection
 *
 * @param ipHash - User's IP hash
 * @param contentHash - Hash of the content
 * @param windowMs - Time window to check for duplicates
 * @returns true if duplicate found, false otherwise
 */
export async function checkDuplicateContent(
  ipHash: string,
  contentHash: string,
  windowMs: number
): Promise<boolean> {
  const key = `${REDIS_KEYS.CONTENT_HASH}${ipHash}`;
  const now = Date.now();
  const redis = getRedisClient();

  if (redis) {
    try {
      // Use Redis sorted set for time-windowed duplicate detection
      // Score = timestamp, Member = contentHash

      // Remove old entries outside the window
      await redis.zremrangebyscore(key, "-inf", now - windowMs);

      // Check if content hash exists in the window
      const score = await redis.zscore(key, contentHash);
      if (score !== null) {
        return true; // Duplicate found
      }

      // Add new content hash
      await redis.zadd(key, now, contentHash);

      // Set TTL on the key (2x window for safety)
      await redis.expire(key, Math.ceil((windowMs * 2) / 1000));

      return false;
    } catch (err) {
      console.error("[RateLimiter] Redis error in duplicate check:", err);
    }
  }

  // In-memory fallback - simplified version
  const memKey = `${key}:${contentHash}`;
  const expireAt = memoryStore.get(memKey);

  if (expireAt && now < expireAt) {
    return true; // Duplicate
  }

  memoryStore.set(memKey, now + windowMs);
  return false;
}

/**
 * Get last action timestamp
 */
export async function getLastActionTime(
  type: string,
  identifier: string
): Promise<number | null> {
  const key = `${REDIS_KEYS.RATE_LIMIT}${type}:${identifier}`;
  const redis = getRedisClient();

  if (redis) {
    try {
      const lastTime = await redis.get(key);
      return lastTime ? parseInt(lastTime, 10) : null;
    } catch (err) {
      console.error("[RateLimiter] Redis error:", err);
    }
  }

  // In-memory fallback
  const expireAt = memoryStore.get(key);
  // Can't accurately get original time from expiration, return null
  return expireAt ? Date.now() : null;
}
