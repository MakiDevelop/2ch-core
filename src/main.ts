import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import {
  createPostHandler,
  listPostsHandler,
  getThreadHandler,
  getRepliesHandler,
  createReplyHandler,
  listBoardsHandler,
  getBoardThreadsHandler,
  createBoardThreadHandler,
  deletePostHandler,
  lockPostHandler,
  unlockPostHandler,
  moderateByIpHandler,
  systemStatusHandler,
  sitemapHandler,
  robotsHandler,
} from "./agents/api";

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

// health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// admin API (管理员功能)
app.get("/admin/system-status", systemStatusHandler);
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
app.get("/posts/:id", getThreadHandler);

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
