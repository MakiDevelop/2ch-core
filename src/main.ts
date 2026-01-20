import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import {
  createPostHandler,
  listPostsHandler,
  getThreadHandler,
  getRepliesHandler,
  createReplyHandler,
  searchHandler,
  editPostHandler,
  listBoardsHandler,
  getBoardThreadsHandler,
  createBoardThreadHandler,
  deletePostHandler,
  lockPostHandler,
  unlockPostHandler,
  moderateByIpHandler,
  systemStatusHandler,
  listThreadsHandler,
  listThreadsByLastReplyHandler,
  sitemapHandler,
  robotsHandler,
  threadPageMiddleware,
} from "./agents/api";

// SECURITY: Validate critical environment variables on startup
if (process.env.NODE_ENV === 'production') {
  if (!process.env.ADMIN_API_TOKEN || process.env.ADMIN_API_TOKEN.trim() === '') {
    console.error('❌ FATAL: ADMIN_API_TOKEN must be set in production environment');
    console.error('   Generate a secure token with: openssl rand -hex 32');
    process.exit(1);
  }
  console.log('✅ Security: ADMIN_API_TOKEN is configured');
}

const app = express();

// SECURITY: Trust only the first proxy (nginx)
// This ensures req.ip uses X-Forwarded-For set by nginx, not client-spoofed values
app.set("trust proxy", 1);

// middleware: set cache validation headers for dynamic content
// no-cache = browser can cache but must validate before use (allows 304 Not Modified)
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  next();
});

// middleware: parse json body
app.use(bodyParser.json());

// NOTE: Clear-Site-Data header removed - was causing 10+ second delays on some networks

// SSR: thread page with dynamic OG meta tags (for social sharing)
// Must be BEFORE API routes to intercept browser requests
app.use(threadPageMiddleware);

// health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// admin API (管理员功能)
app.get("/admin/system-status", systemStatusHandler);
app.get("/admin/threads", listThreadsHandler);
app.get("/admin/threads/by-last-reply", listThreadsByLastReplyHandler);
app.post("/admin/posts/:id/delete", deletePostHandler);
app.post("/admin/posts/:id/lock", lockPostHandler);
app.post("/admin/posts/:id/unlock", unlockPostHandler);
app.post("/admin/moderation/by-ip", moderateByIpHandler);

// boards API
app.get("/boards", listBoardsHandler);
app.get("/boards/:slug/threads", getBoardThreadsHandler);
app.post("/boards/:slug/threads", createBoardThreadHandler);

// posts API
app.get("/posts", listPostsHandler);
app.post("/posts", createPostHandler);
app.get("/posts/:id/replies", getRepliesHandler); // 必须在 /posts/:id 之前
app.post("/posts/:id/replies", createReplyHandler); // 回覆討論串
app.patch("/posts/:id", editPostHandler); // 編輯貼文（需要編輯密碼）
app.get("/posts/:id", getThreadHandler);

// search API
app.get("/search", searchHandler);

// SEO: sitemap and robots.txt
app.get("/sitemap.xml", sitemapHandler);
app.get("/robots.txt", robotsHandler);

// middleware: serve static files from public folder (AFTER API routes)
app.use(express.static('public'));

// start server
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
