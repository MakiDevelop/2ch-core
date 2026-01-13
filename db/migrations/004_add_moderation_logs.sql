-- Migration: Add moderation_logs table for audit trail
-- Date: 2026-01-13
-- Purpose: Track all moderation actions for compliance and accountability

CREATE TABLE IF NOT EXISTS moderation_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(50) NOT NULL,        -- delete/lock/unlock/ban_ip/permanent_delete
  target_type VARCHAR(20) NOT NULL,   -- post/thread/ip_hash
  target_id VARCHAR(100) NOT NULL,    -- post_id or ip_hash
  admin_ip_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of admin IP
  reason TEXT,                        -- Optional reason for the action
  metadata JSONB,                     -- Additional information (e.g., affected count)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX idx_mod_logs_admin ON moderation_logs(admin_ip_hash);
CREATE INDEX idx_mod_logs_target ON moderation_logs(target_type, target_id);
CREATE INDEX idx_mod_logs_created ON moderation_logs(created_at DESC);
CREATE INDEX idx_mod_logs_action ON moderation_logs(action);

-- Comment
COMMENT ON TABLE moderation_logs IS 'Audit log for all moderation actions';
COMMENT ON COLUMN moderation_logs.action IS 'Type of moderation action performed';
COMMENT ON COLUMN moderation_logs.target_type IS 'Type of target (post/thread/ip_hash)';
COMMENT ON COLUMN moderation_logs.target_id IS 'ID of the target being moderated';
COMMENT ON COLUMN moderation_logs.admin_ip_hash IS 'SHA-256 hash of moderator IP for accountability';
COMMENT ON COLUMN moderation_logs.metadata IS 'JSON field for additional context (e.g., {affected_count: 5})';
