-- Migration 010: Add post_reports table for user reporting
-- Purpose: Allow users to report inappropriate content

CREATE TABLE IF NOT EXISTS post_reports (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    reporter_ip_hash VARCHAR(64) NOT NULL,
    reason_category VARCHAR(50) NOT NULL,
    reason_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for looking up reports by post
CREATE INDEX IF NOT EXISTS idx_post_reports_post_id ON post_reports (post_id);

-- Index for recent reports
CREATE INDEX IF NOT EXISTS idx_post_reports_created_at ON post_reports (created_at DESC);

-- Prevent same IP from reporting the same post multiple times
CREATE UNIQUE INDEX IF NOT EXISTS idx_post_reports_unique
ON post_reports (post_id, reporter_ip_hash);

COMMENT ON TABLE post_reports IS 'User reports for posts';
COMMENT ON COLUMN post_reports.reason_category IS 'Report category: hate_speech/spam/nsfw/personal_attack/illegal/other';
COMMENT ON COLUMN post_reports.reason_text IS 'Optional additional explanation from reporter';
