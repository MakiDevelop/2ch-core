// API handlers
export {
  createPostHandler,
  listPostsHandler,
  getThreadHandler,
  getRepliesHandler,
  createReplyHandler,
  searchHandler,
  editPostHandler,
  reportPostHandler,
} from "./posts";

export {
  listBoardsHandler,
  getBoardThreadsHandler,
  createBoardThreadHandler,
} from "./boards";

export {
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
} from "./admin";

export {
  sitemapHandler,
  robotsHandler,
} from "./sitemap";

export { threadPageMiddleware } from "./threadPage";
export { boardPageMiddleware } from "./boardPage";