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
  reportPostHandler,
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
  // Content moderation
  moderationQueueHandler,
  moderationStatsHandler,
  triggerScanHandler,
  approvePostHandler,
  rejectPostHandler,
  // Badword management
  listBadwordCategoriesHandler,
  updateBadwordCategoryHandler,
  listBadwordsHandler,
  createBadwordHandler,
  updateBadwordHandler,
  deleteBadwordHandler,
  badwordStatsHandler,
  importBadwordsHandler,
  // Error reports
  createErrorReportHandler,
  listErrorReportsHandler,
  updateErrorReportHandler,
  // Post reports
  listPostReportsHandler,
  updatePostReportHandler,
  sitemapHandler,
  robotsHandler,
  threadPageMiddleware,
  boardPageMiddleware,
} from "./agents/api";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { csrfGuard } from "./middleware/csrfGuard";

export const app = express();

// SECURITY: Trust only the first proxy (nginx)
app.set("trust proxy", 1);

// middleware: set cache validation headers for dynamic content
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  next();
});

// middleware: parse json body
app.use(bodyParser.json());

// SECURITY: CSRF protection for state-changing requests
app.use(csrfGuard);

// SSR: pages with dynamic OG meta tags (for social sharing)
app.use(threadPageMiddleware);
app.use(boardPageMiddleware);

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

// content moderation API (內容審核)
app.get("/admin/moderation/queue", moderationQueueHandler);
app.get("/admin/moderation/stats", moderationStatsHandler);
app.post("/admin/moderation/scan", triggerScanHandler);
app.post("/admin/moderation/posts/:id/approve", approvePostHandler);
app.post("/admin/moderation/posts/:id/reject", rejectPostHandler);

// badword management API (關鍵字管理)
app.get("/admin/badwords/categories", listBadwordCategoriesHandler);
app.put("/admin/badwords/categories/:id", updateBadwordCategoryHandler);
app.get("/admin/badwords/stats", badwordStatsHandler);
app.get("/admin/badwords", listBadwordsHandler);
app.post("/admin/badwords", createBadwordHandler);
app.post("/admin/badwords/import", importBadwordsHandler);
app.put("/admin/badwords/:id", updateBadwordHandler);
app.delete("/admin/badwords/:id", deleteBadwordHandler);

// error reports API (錯誤回報)
app.get("/admin/error-reports", listErrorReportsHandler);
app.patch("/admin/error-reports/:id", updateErrorReportHandler);

// post reports API (貼文檢舉)
app.get("/admin/reports", listPostReportsHandler);
app.patch("/admin/reports/:id", updatePostReportHandler);

// boards API
app.get("/boards", listBoardsHandler);
app.get("/boards/:slug/threads", getBoardThreadsHandler);
app.post("/boards/:slug/threads", createBoardThreadHandler);

// posts API
app.get("/posts", listPostsHandler);
app.post("/posts", createPostHandler);
app.get("/posts/:id/replies", getRepliesHandler);
app.post("/posts/:id/replies", createReplyHandler);
app.post("/posts/:id/report", reportPostHandler);
app.patch("/posts/:id", editPostHandler);
app.get("/posts/:id", getThreadHandler);

// search API
app.get("/search", searchHandler);

// error reports API (公開)
app.post("/error-reports", createErrorReportHandler);

// SEO: sitemap and robots.txt
app.get("/sitemap.xml", sitemapHandler);
app.get("/robots.txt", robotsHandler);

// middleware: serve static files from public folder (AFTER API routes)
app.use(express.static('public'));

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be LAST middleware
app.use(errorHandler);
