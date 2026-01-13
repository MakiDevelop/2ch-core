-- Migration 003: Add post fields for 2ch-style discussion
-- 添加討論標題、作者暱稱、真實 IP、User-Agent、狀態、管理備註

-- Add new columns to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS title VARCHAR(80);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_name VARCHAR(50) DEFAULT '名無しさん';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS real_ip VARCHAR(45);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'normal';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);

-- Add index for real_ip (for internal queries only)
CREATE INDEX IF NOT EXISTS idx_posts_real_ip ON posts(real_ip);

-- Comment on columns (PostgreSQL supports comments)
COMMENT ON COLUMN posts.title IS '討論標題（僅主題串有值）';
COMMENT ON COLUMN posts.author_name IS '作者暱稱（預設：名無しさん）';
COMMENT ON COLUMN posts.real_ip IS '真實 IP（內部使用，不顯示於前台）';
COMMENT ON COLUMN posts.user_agent IS 'User-Agent（內部使用，不顯示於前台）';
COMMENT ON COLUMN posts.status IS '狀態: normal/deleted/hidden/locked';
COMMENT ON COLUMN posts.admin_note IS '管理員備註（內部使用）';
COMMENT ON COLUMN posts.ip_hash IS '保留用於未來臨時 ID 生成';
