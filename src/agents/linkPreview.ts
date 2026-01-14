/**
 * Link Preview Parser
 * Fetches URL and extracts Open Graph metadata
 *
 * SECURITY: Implements SSRF protection via:
 * - DNS resolution and IP validation before fetch
 * - Manual redirect following with validation at each hop
 * - Private/internal IP blocking
 * - Cloud metadata endpoint blocking
 */

import dns from "dns";
import { promisify } from "util";

const dnsLookup = promisify(dns.lookup);

export interface LinkPreview {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
}

// Private/internal IP ranges to block (SSRF protection)
const BLOCKED_IP_RANGES = [
  // IPv4 private ranges
  { start: parseIPv4("0.0.0.0"), end: parseIPv4("0.255.255.255") },       // 0.0.0.0/8
  { start: parseIPv4("10.0.0.0"), end: parseIPv4("10.255.255.255") },     // 10.0.0.0/8
  { start: parseIPv4("127.0.0.0"), end: parseIPv4("127.255.255.255") },   // 127.0.0.0/8 (localhost)
  { start: parseIPv4("169.254.0.0"), end: parseIPv4("169.254.255.255") }, // 169.254.0.0/16 (link-local, cloud metadata)
  { start: parseIPv4("172.16.0.0"), end: parseIPv4("172.31.255.255") },   // 172.16.0.0/12
  { start: parseIPv4("192.168.0.0"), end: parseIPv4("192.168.255.255") }, // 192.168.0.0/16
  { start: parseIPv4("224.0.0.0"), end: parseIPv4("239.255.255.255") },   // Multicast
  { start: parseIPv4("240.0.0.0"), end: parseIPv4("255.255.255.255") },   // Reserved
];

// Cloud provider metadata IPs to explicitly block
const BLOCKED_METADATA_HOSTS = [
  "169.254.169.254",  // AWS, GCP, Azure metadata
  "metadata.google.internal",
  "metadata.goog",
];

// Domains to skip (social media with auth walls, etc.)
const SKIP_DOMAINS = [
  'instagram.com',
  'facebook.com',
  'fb.com',
  'twitter.com',
  'x.com',
  'threads.net',
];

const FETCH_TIMEOUT_MS = 5000;
const MAX_CONTENT_LENGTH = 512 * 1024; // 512KB max
const MAX_REDIRECTS = 5;

/**
 * Parse IPv4 address to number for range comparison
 */
function parseIPv4(ip: string): number {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return -1;
  }
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}

/**
 * Check if an IPv4 address is in blocked ranges
 */
function isBlockedIPv4(ip: string): boolean {
  const ipNum = parseIPv4(ip);
  if (ipNum === -1) return false; // Not a valid IPv4, might be IPv6

  for (const range of BLOCKED_IP_RANGES) {
    // Handle unsigned comparison
    const ipUnsigned = ipNum >>> 0;
    const startUnsigned = range.start >>> 0;
    const endUnsigned = range.end >>> 0;
    if (ipUnsigned >= startUnsigned && ipUnsigned <= endUnsigned) {
      return true;
    }
  }
  return false;
}

/**
 * Check if an IPv6 address is private/internal
 */
function isBlockedIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  // ::1 - localhost
  if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;
  // fc00::/7 - unique local
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
  // fe80::/10 - link-local
  if (lower.startsWith('fe80:')) return true;
  // :: - unspecified
  if (lower === '::' || lower === '0:0:0:0:0:0:0:0') return true;
  return false;
}

/**
 * Resolve hostname to IP and check if it's safe
 */
async function resolveAndValidateHost(hostname: string): Promise<{ safe: boolean; ip?: string }> {
  // Check metadata hosts first
  if (BLOCKED_METADATA_HOSTS.includes(hostname.toLowerCase())) {
    console.log(`[LinkPreview] Blocked metadata host: ${hostname}`);
    return { safe: false };
  }

  // Check skip domains
  const lowerHost = hostname.toLowerCase();
  for (const domain of SKIP_DOMAINS) {
    if (lowerHost === domain || lowerHost.endsWith('.' + domain)) {
      console.log(`[LinkPreview] Skipped domain: ${hostname}`);
      return { safe: false };
    }
  }

  try {
    // Resolve hostname to IP
    const { address, family } = await dnsLookup(hostname);
    console.log(`[LinkPreview] Resolved ${hostname} to ${address} (IPv${family})`);

    // Check if resolved IP is blocked
    if (family === 4 && isBlockedIPv4(address)) {
      console.log(`[LinkPreview] Blocked private IPv4: ${address}`);
      return { safe: false };
    }
    if (family === 6 && isBlockedIPv6(address)) {
      console.log(`[LinkPreview] Blocked private IPv6: ${address}`);
      return { safe: false };
    }

    return { safe: true, ip: address };
  } catch (error) {
    console.log(`[LinkPreview] DNS resolution failed for ${hostname}`);
    return { safe: false };
  }
}

/**
 * Extract meta tag content from HTML
 */
function extractMeta(html: string, property: string): string | null {
  // Try og: property first
  const ogMatch = html.match(
    new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')
  ) || html.match(
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i')
  );

  if (ogMatch) {
    return decodeHtmlEntities(ogMatch[1].trim());
  }

  return null;
}

/**
 * Extract title from HTML
 */
function extractTitle(html: string): string | null {
  // Try og:title first
  const ogTitle = extractMeta(html, 'og:title');
  if (ogTitle) return ogTitle;

  // Fall back to <title> tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    return decodeHtmlEntities(titleMatch[1].trim());
  }

  return null;
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

/**
 * Extract first URL from text content
 */
export function extractFirstUrl(content: string): string | null {
  const urlMatch = content.match(/https?:\/\/[^\s<>"']+/i);
  const result = urlMatch ? urlMatch[0] : null;
  console.log('[LinkPreview] extractFirstUrl:', result);
  return result;
}

/**
 * Fetch URL with manual redirect handling for SSRF protection
 */
async function safeFetch(
  url: string,
  controller: AbortController,
  redirectCount = 0
): Promise<Response | null> {
  if (redirectCount > MAX_REDIRECTS) {
    console.log('[LinkPreview] Too many redirects');
    return null;
  }

  const parsedUrl = new URL(url);

  // Only allow http/https
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    console.log('[LinkPreview] Invalid protocol:', parsedUrl.protocol);
    return null;
  }

  // Resolve and validate hostname
  const validation = await resolveAndValidateHost(parsedUrl.hostname);
  if (!validation.safe) {
    return null;
  }

  // Fetch with manual redirect handling
  const response = await fetch(url, {
    signal: controller.signal,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
    },
    redirect: 'manual', // Don't auto-follow redirects
  });

  // Handle redirects manually
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (!location) {
      console.log('[LinkPreview] Redirect without location header');
      return null;
    }

    // Resolve relative redirect URL
    const redirectUrl = new URL(location, url).href;
    console.log(`[LinkPreview] Following redirect to: ${redirectUrl}`);

    // Recursively fetch with validation
    return safeFetch(redirectUrl, controller, redirectCount + 1);
  }

  return response;
}

/**
 * Fetch and parse link preview for a URL
 * Returns null if parsing fails or times out
 */
export async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  console.log('[LinkPreview] fetchLinkPreview called with:', url);
  try {
    // Parse and validate URL first
    const parsedUrl = new URL(url);
    console.log('[LinkPreview] Parsed URL, hostname:', parsedUrl.hostname);

    // Only allow http/https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      console.log('[LinkPreview] Invalid protocol:', parsedUrl.protocol);
      return null;
    }

    // Fetch with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await safeFetch(url, controller);
    clearTimeout(timeout);

    if (!response) {
      console.log('[LinkPreview] Safe fetch returned null');
      return null;
    }

    console.log('[LinkPreview] Fetch completed, status:', response.status);

    // Check response
    if (!response.ok) {
      console.log('[LinkPreview] Response not OK:', response.status);
      return null;
    }

    // Check content type
    const contentType = response.headers.get('content-type') || '';
    console.log('[LinkPreview] Content-Type:', contentType);
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      console.log('[LinkPreview] Invalid content type');
      return null;
    }

    // Check content length
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_CONTENT_LENGTH) {
      console.log('[LinkPreview] Content too large');
      return null;
    }

    // Read HTML (limit to max size)
    const html = await response.text();
    console.log('[LinkPreview] HTML length:', html.length);
    if (html.length > MAX_CONTENT_LENGTH) {
      console.log('[LinkPreview] HTML too large');
      return null;
    }

    // Extract metadata
    const title = extractTitle(html);
    const description = extractMeta(html, 'og:description') || extractMeta(html, 'description');
    const image = extractMeta(html, 'og:image');
    const siteName = extractMeta(html, 'og:site_name');
    console.log('[LinkPreview] Extracted - title:', title, 'description:', description?.substring(0, 50));

    // Must have at least a title
    if (!title) {
      console.log('[LinkPreview] No title found');
      return null;
    }

    // Resolve relative image URL (but don't fetch - just construct URL)
    let resolvedImage = image;
    if (image && !image.startsWith('http')) {
      try {
        resolvedImage = new URL(image, url).href;
      } catch {
        resolvedImage = null;
      }
    }

    // Validate image URL hostname too (don't let internal images leak)
    if (resolvedImage) {
      try {
        const imageUrl = new URL(resolvedImage);
        const imageValidation = await resolveAndValidateHost(imageUrl.hostname);
        if (!imageValidation.safe) {
          console.log('[LinkPreview] Blocked internal image URL');
          resolvedImage = null;
        }
      } catch {
        resolvedImage = null;
      }
    }

    return {
      url,
      title: title.substring(0, 200), // Limit title length
      description: description ? description.substring(0, 500) : null, // Limit description
      image: resolvedImage,
      siteName: siteName ? siteName.substring(0, 100) : null,
    };

  } catch (error) {
    // Timeout, network error, or parsing error
    if (error instanceof Error) {
      console.log(`[LinkPreview] Error fetching ${url}: ${error.message}`);
    }
    return null;
  }
}
