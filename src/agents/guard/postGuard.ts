/**
 * Guard for POST /posts
 * Very first, minimal protection layer
 */

const MAX_CONTENT_LENGTH = 1000;
// simple in-memory rate limit (per process)
const POST_INTERVAL_MS = 10_000;

const lastPostAtByIpHash: Record<string, number> = {};

export type PostGuardResult =
  | { ok: true; content: string }
  | { ok: false; status: number; error: string };

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

  lastPostAtByIpHash[ipHash] = now;

  return { ok: true, content: normalized };
}
