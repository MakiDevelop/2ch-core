-- Migration 009: Add moderation fields to posts table
-- Purpose: Support content moderation with batch scanning and review queue

-- Extend posts table with moderation fields
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'unscanned',
ADD COLUMN IF NOT EXISTS moderation_score REAL,
ADD COLUMN IF NOT EXISTS flagged_categories TEXT[],
ADD COLUMN IF NOT EXISTS flagged_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ;

-- moderation_status values:
--   'unscanned'      - Not yet scanned (default for new posts)
--   'clean'          - Passed scan, no issues found
--   'pending_review' - Flagged, waiting for manual review
--   'approved'       - Manually approved by admin
--   'rejected'       - Manually rejected by admin (will also set status=2)

-- Index for moderation queue queries
CREATE INDEX IF NOT EXISTS idx_posts_moderation_queue
ON posts (moderation_status, flagged_at DESC)
WHERE moderation_status = 'pending_review';

-- Index for batch scanning (find unscanned posts)
CREATE INDEX IF NOT EXISTS idx_posts_unscanned
ON posts (created_at DESC)
WHERE moderation_status = 'unscanned';

-- Index for stats queries
CREATE INDEX IF NOT EXISTS idx_posts_moderation_status
ON posts (moderation_status);

COMMENT ON COLUMN posts.moderation_status IS 'Moderation status: unscanned/clean/pending_review/approved/rejected';
COMMENT ON COLUMN posts.moderation_score IS 'Malicious content score 0.0-1.0';
COMMENT ON COLUMN posts.flagged_categories IS 'Flagged categories array: hate_speech/spam/nsfw/personal_attack/illegal';
COMMENT ON COLUMN posts.flagged_by IS 'Flag source: system_scan/user_report';
COMMENT ON COLUMN posts.flagged_at IS 'Timestamp when flagged';
