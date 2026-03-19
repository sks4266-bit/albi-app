-- Add Toss Apps-in-Toss user key column for Toss login integration

ALTER TABLE users ADD COLUMN toss_user_key TEXT;

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_users_toss_user_key ON users(toss_user_key);
