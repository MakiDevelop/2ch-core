import type { Request, Response } from "express";
import { getBoardBySlug } from "../persistence/postgres";
import fs from "fs";
import path from "path";

// 讀取 board.html 模板（啟動時載入一次）
const templatePath = path.join(process.cwd(), "public", "board.html");
let templateHtml = "";

try {
  templateHtml = fs.readFileSync(templatePath, "utf-8");
} catch (err) {
  console.error("[BoardPage] Failed to load board.html template:", err);
}

// 板塊描述對照表
const boardDescriptions: Record<string, string> = {
  chat: "綜合閒聊 - 什麼都能聊的核心流量池",
  news: "時事與政治 - 鍵政、社會議題、新聞討論",
  tech: "科技與網路 - 科技趨勢、AI、工具討論",
  work: "職場與工作 - 職涯、職場文化、薪資討論",
  love: "感情與兩性 - 戀愛、婚姻、兩性議題",
  money: "投資與理財 - 投資、理財、省錢心得",
  acg: "ACG 與遊戲 - 動漫、遊戲、宅文化",
  life: "生活與心情 - 日常、抱怨、厭世發洩",
  gossip: "娛樂與八卦 - 明星、網紅、八卦討論",
  meta: "站務與建議 - 反饋、建議、站務公告",
};

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
 * GET /boards/:slug/threads (Accept: text/html)
 * Server-side render board page with correct OG meta tags
 */
export async function boardPageHandler(req: Request, res: Response) {
  try {
    const slug = req.params.slug;

    // 驗證 slug
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return null;
    }

    const board = await getBoardBySlug(slug);

    if (!board) {
      return null;
    }

    // 準備 OG 資料
    const siteUrl = process.env.SITE_URL || "https://2ch.tw";
    const ogImage = `${siteUrl}/og-image.jpg`;
    const ogUrl = `${siteUrl}/boards/${slug}/threads`;
    const ogTitle = escapeHtml(board.name) + " - 2ch.tw";
    const ogDescription = escapeHtml(
      boardDescriptions[slug] || board.description || `${board.name} - 2ch.tw 匿名討論版`
    );

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
      // Twitter tags
      .replace(
        /<meta[^>]*id="twitter-title"[^>]*>/i,
        `<meta name="twitter:title" id="twitter-title" content="${ogTitle}">`
      )
      .replace(
        /<meta[^>]*id="twitter-description"[^>]*>/i,
        `<meta name="twitter:description" id="twitter-description" content="${ogDescription}">`
      );

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
    return true;
  } catch (err) {
    console.error("[BoardPage] Error:", err);
    return null;
  }
}

/**
 * Middleware: 偵測瀏覽器請求 /boards/:slug/threads，返回帶正確 OG 的 HTML
 */
export function boardPageMiddleware(
  req: Request,
  res: Response,
  next: () => void
) {
  // 只處理 GET /boards/:slug/threads 路徑
  const match = req.path.match(/^\/boards\/([a-z0-9-]+)\/threads$/);
  if (!match || req.method !== "GET") {
    return next();
  }

  // API 請求（fetch/XHR）明確要求 JSON
  const accept = req.headers.accept || "";
  const isApiRequest =
    accept.includes("application/json") ||
    req.xhr ||
    req.headers["x-requested-with"] === "XMLHttpRequest";

  // 如果是明確的 API 請求，跳過讓 API handler 處理
  if (isApiRequest) {
    return next();
  }

  // 其他所有請求（瀏覽器、爬蟲）都返回 SSR HTML
  req.params = { slug: match[1] };
  boardPageHandler(req, res).then((handled) => {
    if (!handled) {
      next();
    }
  });
}
