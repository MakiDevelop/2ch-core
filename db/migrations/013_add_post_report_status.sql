-- Add status column to post_reports table
-- Default 'pending', can be set to 'resolved'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'post_reports' AND column_name = 'status'
    ) THEN
        ALTER TABLE post_reports ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending';
        CREATE INDEX idx_post_reports_status ON post_reports (status);
    END IF;
END $$;
