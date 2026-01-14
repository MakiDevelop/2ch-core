import type { Request, Response } from "express";
import { getThreadById } from "../persistence/postgres";
import fs from "fs";
import path from "path";

// 讀取 thread.html 模板（啟動時載入一次）
const templatePath = path.join(process.cwd(), "public", "thread.html");
let templateHtml = "";

try {
  templateHtml = fs.readFileSync(templatePath, "utf-8");
} catch (err) {
  console.error("[ThreadPage] Failed to load thread.html template:", err);
}

// 截斷文字並加上省略號
function truncate(text: string, maxLength: number): string {
  if (!text) return "";
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength) + "...";
}

// 跳脫 HTML 特殊字元
function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * GET /posts/:id (Accept: text/html)
 * Server-side render thread page with correct OG meta tags
 */
export async function threadPageHandler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    // 驗證 ID
    if (!Number.isInteger(id) || id <= 0) {
      // 讓 static middleware 處理（會顯示 404 或預設頁面）
      return null;
    }

    const thread = await getThreadById(id);

    if (!thread) {
      // 找不到，返回 null 讓下一個 middleware 處理
      return null;
    }

    // 準備 OG 資料
    const siteUrl = process.env.SITE_URL || "https://2ch.tw";
    const ogImage = `${siteUrl}/og-image.jpg`;
    const ogUrl = `${siteUrl}/posts/${id}`;
    const ogTitle = escapeHtml(thread.title || `討論串 #${id}`) + " - 2ch.tw";
    const ogDescription = escapeHtml(truncate(thread.content || "", 150));
    const publishedTime = thread.createdAt
      ? new Date(thread.createdAt).toISOString()
      : "";

    // 替換 meta tags
    let html = templateHtml
      // Page title
      .replace(
        /<title[^>]*>.*?<\/title>/i,
        `<title>${ogTitle}</title>`
      )
      // Meta description
      .replace(
        /<meta[^>]*id="meta-description"[^>]*>/i,
        `<meta name="description" id="meta-description" content="${ogDescription}">`
      )
      // Canonical URL
      .replace(
        /<link[^>]*id="canonical-url"[^>]*>/i,
        `<link rel="canonical" id="canonical-url" href="${ogUrl}">`
      )
      // OG tags
      .replace(
        /<meta[^>]*id="og-title"[^>]*>/i,
        `<meta property="og:title" id="og-title" content="${ogTitle}">`
      )
      .replace(
        /<meta[^>]*id="og-description"[^>]*>/i,
        `<meta property="og:description" id="og-description" content="${ogDescription}">`
      )
      .replace(
        /<meta[^>]*id="og-url"[^>]*>/i,
        `<meta property="og:url" id="og-url" content="${ogUrl}">`
      )
      .replace(
        /<meta[^>]*id="og-image"[^>]*>/i,
        `<meta property="og:image" id="og-image" content="${ogImage}">`
      )
      .replace(
        /<meta[^>]*id="og-published"[^>]*>/i,
        `<meta property="article:published_time" id="og-published" content="${publishedTime}">`
      )
      // Twitter tags
      .replace(
        /<meta[^>]*id="twitter-title"[^>]*>/i,
        `<meta name="twitter:title" id="twitter-title" content="${ogTitle}">`
      )
      .replace(
        /<meta[^>]*id="twitter-description"[^>]*>/i,
        `<meta name="twitter:description" id="twitter-description" content="${ogDescription}">`
      )
      .replace(
        /<meta[^>]*id="twitter-image"[^>]*>/i,
        `<meta name="twitter:image" id="twitter-image" content="${ogImage}">`
      );

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
    return true;
  } catch (err) {
    console.error("[ThreadPage] Error:", err);
    return null;
  }
}

/**
 * Middleware: 偵測瀏覽器請求 /posts/:id，返回帶正確 OG 的 HTML
 */
export function threadPageMiddleware(
  req: Request,
  res: Response,
  next: () => void
) {
  // 只處理 GET /posts/:id 路徑
  const match = req.path.match(/^\/posts\/(\d+)$/);
  if (!match || req.method !== "GET") {
    return next();
  }

  // 檢查是否為瀏覽器請求（Accept 包含 text/html）
  const accept = req.headers.accept || "";
  const isHtmlRequest = accept.includes("text/html");

  // API 請求（fetch/XHR）通常用 application/json
  const isApiRequest =
    accept.includes("application/json") ||
    req.xhr ||
    req.headers["x-requested-with"] === "XMLHttpRequest";

  // 如果是 API 請求，跳過讓 API handler 處理
  if (isApiRequest && !isHtmlRequest) {
    return next();
  }

  // 如果是瀏覽器請求，處理 SSR
  if (isHtmlRequest) {
    req.params = { id: match[1] };
    threadPageHandler(req, res).then((handled) => {
      if (!handled) {
        next();
      }
    });
    return;
  }

  next();
}
