/**
 * Guard for POST /posts
 * Very first, minimal protection layer
 */

import crypto from "crypto";

const MAX_CONTENT_LENGTH = 10000;
// simple in-memory rate limit (per process)
const POST_INTERVAL_MS = 3_000;
// duplicate content detection window (30 seconds)
const DUPLICATE_WINDOW_MS = 30_000;

const lastPostAtByIpHash: Record<string, number> = {};
// Track recent content hashes per IP to prevent duplicates
const recentContentByIpHash: Record<string, { hash: string; timestamp: number }[]> = {};

export type PostGuardResult =
  | { ok: true; content: string }
  | { ok: false; status: number; error: string };

/**
 * Validate URL for <iu> and <yt> tags
 * Returns true if URL is safe, false otherwise
 */
function isValidEmbedUrl(url: string): boolean {
  const trimmed = url.trim();

  // Must start with https://
  if (!trimmed.startsWith('https://')) {
    return false;
  }

  // Must not contain dangerous characters that could break out of attributes
  // These chars should not appear in a properly encoded URL
  const dangerousChars = /[<>"'`\s\\]/;
  if (dangerousChars.test(trimmed)) {
    return false;
  }

  // Try to parse as URL to ensure it's valid
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize content by validating <iu> and <yt> tags
 * Invalid URLs are escaped to prevent XSS
 */
function sanitizeEmbedTags(content: string): string {
  let result = content;

  // Sanitize <iu> tags
  result = result.replace(/<iu>([\s\S]*?)<\/iu>/gi, (match, url) => {
    if (isValidEmbedUrl(url)) {
      return match; // Keep valid URLs as-is
    }
    // Escape invalid URLs - convert to plain text
    return `[無效圖片連結]`;
  });

  // Sanitize <yt> tags
  result = result.replace(/<yt>([\s\S]*?)<\/yt>/gi, (match, url) => {
    if (isValidEmbedUrl(url)) {
      return match; // Keep valid URLs as-is
    }
    // Escape invalid URLs - convert to plain text
    return `[無效影片連結]`;
  });

  return result;
}

export function checkCreatePost(input: {
  content: unknown;
  ipHash: string;
}): PostGuardResult {
  const { content, ipHash } = input;

  if (typeof content !== "string") {
    return { ok: false, status: 400, error: "content must be a string" };
  }

  const normalized = content.trim();

  if (normalized.length === 0) {
    return { ok: false, status: 400, error: "content is empty" };
  }

  if (normalized.length > MAX_CONTENT_LENGTH) {
    return {
      ok: false,
      status: 400,
      error: `content too long (max ${MAX_CONTENT_LENGTH})`,
    };
  }

  const now = Date.now();
  const lastAt = lastPostAtByIpHash[ipHash];

  if (lastAt && now - lastAt < POST_INTERVAL_MS) {
    return {
      ok: false,
      status: 429,
      error: "too many requests",
    };
  }

  // Check for duplicate content within the time window
  const contentHash = crypto.createHash("md5").update(normalized).digest("hex");

  // Clean up old entries and check for duplicates
  if (!recentContentByIpHash[ipHash]) {
    recentContentByIpHash[ipHash] = [];
  }

  // Remove expired entries
  recentContentByIpHash[ipHash] = recentContentByIpHash[ipHash].filter(
    (entry) => now - entry.timestamp < DUPLICATE_WINDOW_MS
  );

  // Check if this content was already posted
  const isDuplicate = recentContentByIpHash[ipHash].some(
    (entry) => entry.hash === contentHash
  );

  if (isDuplicate) {
    return {
      ok: false,
      status: 429,
      error: "重複發文，請稍後再試",
    };
  }

  // Record this content
  recentContentByIpHash[ipHash].push({ hash: contentHash, timestamp: now });

  lastPostAtByIpHash[ipHash] = now;

  // Sanitize embed tags to prevent XSS
  const sanitized = sanitizeEmbedTags(normalized);

  return { ok: true, content: sanitized };
}
