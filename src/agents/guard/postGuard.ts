/**
 * Guard for POST /posts
 * Very first, minimal protection layer
 */

import crypto from "crypto";
import { checkRateLimit, checkDuplicateContent } from "../../utils/rateLimiter";

const MAX_CONTENT_LENGTH = 10000;
// Post interval (3 seconds between posts)
const POST_INTERVAL_MS = 3_000;
// Duplicate content detection window (30 seconds)
const DUPLICATE_WINDOW_MS = 30_000;

// ============================================================
// Anti-spam: Noise/Gibberish Detection (2ch-style, user-invisible)
// ============================================================

// Minimum content length (CJK vs ASCII)
const MIN_CJK_CHARS_THREAD = 2;    // 發文：至少 2 個中日文字
const MIN_CJK_CHARS_REPLY = 1;     // 回覆：允許「草」「乙」
const MIN_ASCII_CHARS_THREAD = 8;  // 發文：純 ASCII 至少 8 字元
const MIN_ASCII_CHARS_REPLY = 5;   // 回覆：純 ASCII 至少 5 字元

// Noise detection threshold
const NOISE_SCORE_THRESHOLD = 4;

// QWERTY keyboard adjacency map (for keyboard walk detection)
const KEYBOARD_NEIGHBORS: Record<string, string> = {
  q: "wa", w: "qase", e: "wsdr", r: "edft", t: "rfgy", y: "tghu", u: "yhji", i: "ujko", o: "iklp", p: "ol",
  a: "qwsz", s: "awedxz", d: "esrfcx", f: "drtgvc", g: "ftyhbv", h: "gyujnb", j: "huikmn", k: "jiolm", l: "kop",
  z: "asx", x: "zsdc", c: "xdfv", v: "cfgb", b: "vghn", n: "bhjm", m: "njk",
  "1": "2q", "2": "13qw", "3": "24we", "4": "35er", "5": "46rt", "6": "57ty", "7": "68yu", "8": "79ui", "9": "80io", "0": "9op",
};

// Common English words whitelist (to avoid false positives)
// These are words that might have high keyboard adjacency but are legitimate
const COMMON_ENGLISH_WORDS = new Set([
  // Common words with adjacent keys
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her", "was", "one", "our", "out",
  "were", "we", "as", "be", "been", "have", "in", "is", "it", "of", "on", "or", "that", "this", "to", "with",
  "they", "at", "by", "from", "has", "he", "his", "how", "if", "me", "my", "no", "so", "up", "what", "when",
  // Tech/internet terms
  "test", "user", "data", "file", "code", "http", "https", "www", "html", "css", "api", "url", "web",
  "post", "get", "set", "new", "add", "edit", "save", "load", "send", "read", "write", "true", "false",
  // Words that might trigger adjacency detection
  "assert", "western", "easter", "faster", "master", "after", "water", "later", "better", "letter",
  "server", "never", "ever", "over", "under", "other", "where", "there", "here", "were", "tree", "free",
  "great", "create", "update", "delete", "select", "insert", "query", "search", "filter", "order",
]);

type NoiseResult = { ok: true } | { ok: false; error: string };

/**
 * Calculate keyboard adjacency ratio (for keyboard walk detection)
 * Returns the ratio of adjacent key pairs in the text
 */
function calcKeyboardAdjacencyRatio(text: string): number {
  const letters = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (letters.length < 2) return 0;

  let adjacentPairs = 0;
  for (let i = 0; i < letters.length - 1; i++) {
    const char1 = letters[i];
    const char2 = letters[i + 1];
    const neighbors = KEYBOARD_NEIGHBORS[char1];
    if (neighbors && neighbors.includes(char2)) {
      adjacentPairs++;
    }
  }
  return adjacentPairs / (letters.length - 1);
}

/**
 * Check if text contains any common English word (3+ chars)
 */
function containsCommonEnglishWord(text: string): boolean {
  const words = text.toLowerCase().split(/[^a-z]+/).filter(w => w.length >= 3);
  return words.some(word => COMMON_ENGLISH_WORDS.has(word));
}

/**
 * Count CJK (Chinese/Japanese/Korean) characters
 */
function countCjkChars(text: string): number {
  // CJK Unified Ideographs, Hiragana, Katakana, Hangul
  const cjkMatch = text.match(/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g);
  return cjkMatch ? cjkMatch.length : 0;
}

/**
 * Detect gibberish/noise content using score-based approach
 * Returns ok:false only when score >= threshold (avoid false positives)
 */
function detectNoise(raw: string, isReply: boolean): NoiseResult {
  // Remove >>N references and trim
  const text = raw.replace(/>>(\d+)/g, "").trim();

  if (text.length === 0) {
    return { ok: false, error: "內容不能為空" };
  }

  // Count CJK characters
  const cjkCount = countCjkChars(text);
  const hasCjk = cjkCount > 0;

  // Minimum length check (different for thread vs reply)
  if (hasCjk) {
    const minCjk = isReply ? MIN_CJK_CHARS_REPLY : MIN_CJK_CHARS_THREAD;
    if (cjkCount < minCjk) {
      return { ok: false, error: `內容過短（至少需要 ${minCjk} 個中日文字）` };
    }
    // CJK content passes - skip noise detection for natural language
    return { ok: true };
  }

  // === Whitelist: Common internet slang (passes without further checks) ===
  const lowerText = text.toLowerCase();
  const whitelist = ["www", "lol", "wtf", "omg", "gg", "xd", "ok", "hi", "yo", "thx", "ty", "np"];
  if (whitelist.includes(lowerText)) {
    return { ok: true };
  }

  // For ASCII-only content, apply stricter checks
  const minAscii = isReply ? MIN_ASCII_CHARS_REPLY : MIN_ASCII_CHARS_THREAD;
  if (text.length < minAscii) {
    return { ok: false, error: `內容過短（至少需要 ${minAscii} 個字元）` };
  }

  // === Score-based noise detection for ASCII-only content ===
  let score = 0;

  // eslint-disable-next-line no-control-regex
  const ascii = text.replace(/[^\x00-\x7F]/g, "");
  const letters = ascii.replace(/[^a-z]/gi, "");
  const vowelCount = (letters.match(/[aeiou]/gi) || []).length;
  const vowelRatio = letters.length > 0 ? vowelCount / letters.length : 0;
  const uniqueChars = new Set(text).size;
  const uniqueRatio = uniqueChars / Math.max(text.length, 1);
  const tokens = text.split(/\s+/).filter(t => t.length >= 2);

  // Signal 1: Very short ASCII with few vowels (dfasdf pattern)
  if (text.length < 10 && ascii.length === text.length && vowelRatio < 0.2) {
    score += 2;
  }

  // Signal 2: Keyboard mash patterns (higher score if it's the entire content)
  const keyboardMashPattern = /(asdf|qwer|zxcv|dfasd|jkl;|uiop)/i;
  const keyboardMash = keyboardMashPattern.test(text);
  if (keyboardMash) {
    // If keyboard mash is > 50% of the content, it's definitely spam
    const mashMatch = text.match(keyboardMashPattern);
    if (mashMatch && mashMatch[0].length * 2 >= text.length) {
      score += 3;
    } else {
      score += 2;
    }
  }

  // Signal 3: Character repetition (dddddd)
  const hasRepetition = /(.)\1{3,}/.test(text);
  if (hasRepetition) {
    score += 2;
  }

  // Signal 4: Abnormal unique character ratio
  // Too low (dddddd) or too high (random chars)
  if (uniqueRatio < 0.3 || (text.length < 10 && uniqueRatio > 0.9)) {
    score += 1;
  }

  // Signal 5: Too few meaningful tokens
  if (tokens.length < 2 && text.length > 5) {
    score += 1;
  }

  // Signal 6: No vowels in pure letters (not a real word)
  if (letters.length >= 4 && vowelRatio === 0) {
    score += 2;
  }

  // Signal 7: High keyboard adjacency ratio (keyboard walk pattern)
  // Only trigger if: pure ASCII, length > 6, high adjacency, no common English words
  if (letters.length > 6) {
    const adjacencyRatio = calcKeyboardAdjacencyRatio(text);
    const hasCommonWord = containsCommonEnglishWord(text);

    // High adjacency and no recognizable English words = likely keyboard mash
    // Very high (>60%) = +3, high (>50%) = +2
    if (!hasCommonWord) {
      if (adjacencyRatio > 0.6) {
        score += 3;
      } else if (adjacencyRatio > 0.5) {
        score += 2;
      }
    }
  }

  if (score >= NOISE_SCORE_THRESHOLD) {
    return { ok: false, error: "內容疑似亂碼，請輸入有意義的文字" };
  }

  return { ok: true };
}

/**
 * Validate title (for new threads)
 */
function validateTitle(title: string | undefined): NoiseResult {
  if (!title) {
    return { ok: true }; // title is optional for replies
  }

  const trimmed = title.trim();

  // Check CJK content
  const cjkCount = countCjkChars(trimmed);
  if (cjkCount >= 2) {
    return { ok: true }; // Valid CJK title
  }

  // For ASCII-only titles, apply noise check
  if (cjkCount === 0 && trimmed.length < 3) {
    return { ok: false, error: "標題過短" };
  }

  // Quick keyboard mash check for title
  const keyboardMash = /(asdf|qwer|zxcv|dfasd)/i.test(trimmed);
  const hasRepetition = /(.)\1{3,}/.test(trimmed);

  if (keyboardMash || hasRepetition) {
    return { ok: false, error: "標題疑似亂碼" };
  }

  // Check keyboard adjacency for ASCII-only titles
  if (cjkCount === 0 && trimmed.length > 4) {
    const adjacencyRatio = calcKeyboardAdjacencyRatio(trimmed);
    const hasCommonWord = containsCommonEnglishWord(trimmed);

    if (adjacencyRatio > 0.6 && !hasCommonWord) {
      return { ok: false, error: "標題疑似亂碼" };
    }
  }

  return { ok: true };
}

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

export async function checkCreatePost(input: {
  content: unknown;
  ipHash: string;
  isReply?: boolean;
  title?: string;
}): Promise<PostGuardResult> {
  const { content, ipHash, isReply = false, title } = input;

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

  // === Anti-spam: Title validation (for new threads) ===
  if (!isReply && title) {
    const titleResult = validateTitle(title);
    if (titleResult.ok === false) {
      return { ok: false, status: 400, error: titleResult.error };
    }
  }

  // === Anti-spam: Noise/gibberish detection ===
  const noiseResult = detectNoise(normalized, isReply);
  if (noiseResult.ok === false) {
    return { ok: false, status: 400, error: noiseResult.error };
  }

  // Rate limiting (Redis-backed with in-memory fallback)
  const rateLimit = await checkRateLimit("post", ipHash, POST_INTERVAL_MS);
  if (!rateLimit.allowed) {
    return {
      ok: false,
      status: 429,
      error: "too many requests",
    };
  }

  // Check for duplicate content within the time window
  const contentHash = crypto.createHash("md5").update(normalized).digest("hex");
  const isDuplicate = await checkDuplicateContent(ipHash, contentHash, DUPLICATE_WINDOW_MS);

  if (isDuplicate) {
    return {
      ok: false,
      status: 429,
      error: "重複發文，請稍後再試",
    };
  }

  // Sanitize embed tags to prevent XSS
  const sanitized = sanitizeEmbedTags(normalized);

  return { ok: true, content: sanitized };
}

/**
 * Validate >>N reply references in content
 * Prevents spam with invalid or excessive references
 */
export type ReplyRefResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateReplyReferences(
  content: string,
  maxFloor: number
): ReplyRefResult {
  // 1. Extract all >>N references
  const refs = content.match(/>>(\d+)/g) || [];

  // No references = no validation needed
  if (refs.length === 0) {
    return { ok: true };
  }

  // 2. Check reference count (max 10)
  if (refs.length > 10) {
    return { ok: false, error: "引用數量過多（最多 10 個）" };
  }

  // 3. Parse reference numbers
  const numbers = refs.map(r => parseInt(r.slice(2), 10));

  // 4. Check reference validity (must exist)
  for (const num of numbers) {
    if (num < 1 || num > maxFloor) {
      return { ok: false, error: `引用的樓層 >>${num} 不存在` };
    }
  }

  // 5. Check for duplicate references (same number max 2 times)
  const countMap = new Map<number, number>();
  for (const num of numbers) {
    const count = (countMap.get(num) || 0) + 1;
    if (count > 2) {
      return { ok: false, error: "重複引用過多" };
    }
    countMap.set(num, count);
  }

  // 6. Check for substantial content (at least 2 chars after removing refs)
  const withoutRefs = content.replace(/>>(\d+)/g, '').trim();
  if (withoutRefs.length < 2) {
    return { ok: false, error: "請輸入實質內容" };
  }

  return { ok: true };
}
