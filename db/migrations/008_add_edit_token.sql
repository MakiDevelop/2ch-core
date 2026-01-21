-- Migration 008: Add edit token for anonymous post editing
-- Allows users to edit their posts within 10 minutes using a token

-- Add edit token hash column (SHA-256 hash of the edit token)
ALTER TABLE posts ADD COLUMN edit_token_hash VARCHAR(64);

-- Add edited_at timestamp to track when a post was last edited
ALTER TABLE posts ADD COLUMN edited_at TIMESTAMP;

-- Index for efficient token verification queries
CREATE INDEX idx_posts_edit_token ON posts(id, edit_token_hash) WHERE edit_token_hash IS NOT NULL;
