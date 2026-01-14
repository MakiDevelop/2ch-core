import { Request, Response } from "express";
import { getSitemapData } from "../persistence/postgres";

// Use SITE_URL from environment, fallback to production domain
const SITE_URL = process.env.SITE_URL || "https://2ch.tw";
const IS_DEV = process.env.NODE_ENV === "development";

/**
 * Generate sitemap.xml for SEO
 * Returns XML sitemap with all boards and threads
 */
export async function sitemapHandler(_req: Request, res: Response) {
  try {
    const data = await getSitemapData();

    // Format date for sitemap (W3C Datetime format)
    const formatDate = (date: Date) => {
      return new Date(date).toISOString().split("T")[0];
    };

    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

    // Add boards
    for (const board of data.boards) {
      xml += `  <url>
    <loc>${SITE_URL}/boards/${board.slug}/threads</loc>
    <lastmod>${formatDate(board.updatedAt)}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    // Add threads
    for (const thread of data.threads) {
      xml += `  <url>
    <loc>${SITE_URL}/posts/${thread.id}</loc>
    <lastmod>${formatDate(thread.updatedAt)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>
`;
    }

    xml += `</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    res.send(xml);
  } catch (error) {
    console.error("[SITEMAP] Error generating sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
}

/**
 * Generate robots.txt
 * Dev environment blocks all crawlers to prevent indexing
 */
export function robotsHandler(_req: Request, res: Response) {
  // Block all crawlers in development environment
  if (IS_DEV) {
    const robots = `# Development environment - do not index
User-agent: *
Disallow: /
`;
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(robots);
    return;
  }

  // Production: allow crawlers
  const robots = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${SITE_URL}/sitemap.xml

# Disallow admin routes
Disallow: /admin/

# Disallow API endpoints (use HTML pages instead)
Disallow: /boards$
Disallow: /posts$
`;

  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 1 day
  res.send(robots);
}
