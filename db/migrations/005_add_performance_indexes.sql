-- Migration: Add performance indexes for board threads query
-- 解決 /boards/:slug/threads API 緩慢問題

-- 1. 複合索引：加速「取得板塊的討論串列表」查詢
-- 用於 WHERE board_id = ? AND parent_id IS NULL ORDER BY created_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_board_threads
ON posts(board_id, created_at DESC)
WHERE parent_id IS NULL;

-- 2. 複合索引：加速計算回覆數和最後回覆時間
-- 用於 LEFT JOIN posts r ON r.parent_id = p.id 的子查詢
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_replies
ON posts(parent_id, created_at DESC)
WHERE parent_id IS NOT NULL;

-- 3. 覆蓋索引：讓查詢可以只讀索引，不用回表
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_board_threads_covering
ON posts(board_id, created_at DESC, id, title, author_name, content, status)
WHERE parent_id IS NULL;
