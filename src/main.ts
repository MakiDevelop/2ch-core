import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import { createPostHandler, listPostsHandler } from "./agents/api";

const app = express();

// middleware: parse json body
app.use(bodyParser.json());

// health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// posts API
app.get("/posts", listPostsHandler);
app.post("/posts", createPostHandler);

// start server
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
