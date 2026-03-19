-- Add experience_times column to jobs table
-- This stores the available time slots for 1-hour job experience
-- Skip if column already exists

-- ALTER TABLE jobs ADD COLUMN experience_times TEXT;

-- Update existing jobs with default experience times
-- UPDATE jobs SET experience_times = '["09:00-12:00","12:00-15:00","15:00-18:00","18:00-22:00"]' WHERE experience_times IS NULL;
