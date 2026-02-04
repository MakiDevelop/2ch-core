-- Add status column to error_reports table
-- Default 'pending', can be set to 'resolved'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'error_reports') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'error_reports' AND column_name = 'status'
        ) THEN
            ALTER TABLE error_reports ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending';
            CREATE INDEX idx_error_reports_status ON error_reports (status);
        END IF;
    END IF;
END $$;
