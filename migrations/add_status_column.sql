-- Add status column to users table
-- This migration adds a status column to track user account status

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' NOT NULL;

-- Add a check constraint to ensure status is either 'active' or 'inactive'
ALTER TABLE users 
ADD CONSTRAINT check_status_values 
CHECK (status IN ('active', 'inactive'));

-- Update existing users to have 'active' status if they don't have one
UPDATE users 
SET status = 'active' 
WHERE status IS NULL;
