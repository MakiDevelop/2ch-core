-- Migration: Add link preview support
-- Stores parsed URL metadata (title, description, image)

ALTER TABLE posts ADD COLUMN IF NOT EXISTS link_preview JSONB DEFAULT NULL;

-- Example structure:
-- {
--   "url": "https://example.com/article",
--   "title": "Article Title",
--   "description": "Article description...",
--   "image": "https://example.com/og-image.jpg",
--   "siteName": "Example Site"
-- }

COMMENT ON COLUMN posts.link_preview IS 'Parsed Open Graph metadata for the first URL in content';
