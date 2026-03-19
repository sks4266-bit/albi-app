-- Migration: Add points column to users table
-- Date: 2026-02-13
-- Description: Add points column for ALBI point system

-- Skip if column already exists
-- ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0;

-- Update existing users to have 0 points if null
-- UPDATE users SET points = 0 WHERE points IS NULL;
