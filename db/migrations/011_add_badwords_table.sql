-- Migration 011: Add badwords table for dynamic keyword management
-- Purpose: Allow admins to manage badwords without code deployment

-- Categories table
CREATE TABLE IF NOT EXISTS badword_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    weight REAL NOT NULL DEFAULT 0.5,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Badwords table
CREATE TABLE IF NOT EXISTS badwords (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES badword_categories(id) ON DELETE CASCADE,
    term VARCHAR(100),           -- Exact match term (NULL if using pattern)
    pattern VARCHAR(500),        -- Regex pattern (NULL if using term)
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(64),      -- Admin IP hash who created this
    CONSTRAINT badwords_term_or_pattern CHECK (
        (term IS NOT NULL AND pattern IS NULL) OR
        (term IS NULL AND pattern IS NOT NULL)
    )
);

-- Homophone mappings table
CREATE TABLE IF NOT EXISTS badword_homophones (
    id SERIAL PRIMARY KEY,
    canonical CHAR(1) NOT NULL,  -- The standard character
    variant VARCHAR(10) NOT NULL, -- The variant/homophone
    UNIQUE(canonical, variant)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_badwords_category ON badwords (category_id);
CREATE INDEX IF NOT EXISTS idx_badwords_active ON badwords (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_badword_homophones_canonical ON badword_homophones (canonical);

-- Insert default categories
INSERT INTO badword_categories (name, description, weight) VALUES
    ('hate_speech', '仇恨言論、歧視用語', 0.9),
    ('spam', '廣告、詐騙連結', 0.7),
    ('nsfw', '成人內容（非 nsfw 板）', 0.6),
    ('personal_attack', '人身攻擊、霸凌', 0.5),
    ('illegal', '違法內容', 0.95)
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE badword_categories IS 'Badword categories with default weights';
COMMENT ON TABLE badwords IS 'Badword terms and patterns for content filtering';
COMMENT ON TABLE badword_homophones IS 'Homophone mappings for text normalization';
