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
} from "./agents/api";

const app = express();

// middleware: disable ETag
app.set('etag', false);

// middleware: set no-cache headers for all dynamic content
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// middleware: parse json body
app.use(bodyParser.json());

// health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// admin API (管理员功能)
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

// start server
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
