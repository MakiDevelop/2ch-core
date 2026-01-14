-- Migration: Remove real_ip column for security
-- Date: 2026-01-14
-- Purpose: Remove plaintext IP storage to comply with GDPR and security best practices
-- Reference: Security Audit - High Risk Issue #1

-- SECURITY: This migration removes the real_ip column which stores plaintext IP addresses
-- Only ip_hash (HMAC-SHA256) will be retained for rate limiting purposes

-- Drop the real_ip column
ALTER TABLE posts DROP COLUMN IF EXISTS real_ip;

-- Add comment to ip_hash column to clarify its purpose
COMMENT ON COLUMN posts.ip_hash IS 'HMAC-SHA256 hash of user IP for rate limiting (not reversible)';

-- Log migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 007: real_ip column removed for security compliance';
END $$;
