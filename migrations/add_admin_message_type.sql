-- Add admin_message type to notifications table
-- This migration creates the notification_type enum and adds the 'admin_message' type

-- First, create the notification_type enum if it doesn't exist
DO $$
BEGIN
    -- Check if the enum type exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'notification_type'
    ) THEN
        -- Create the enum type with all existing values
        CREATE TYPE notification_type AS ENUM (
            'enrollment',
            'announcement', 
            'assignment',
            'live_session',
            'doubt',
            'poll',
            'system',
            'admin_message'
        );
    END IF;
END $$;

-- Now add admin_message to the enum if it doesn't already exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'notification_type'
    ) THEN
        -- Add admin_message to the enum if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')
            AND enumlabel = 'admin_message'
        ) THEN
            ALTER TYPE notification_type ADD VALUE 'admin_message';
        END IF;
    END IF;
END $$;

-- Update the notifications table to use the enum type if it's not already using it
DO $$
BEGIN
    -- Check if the notifications table exists and what type the 'type' column currently uses
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'notifications'
    ) THEN
        -- If the type column is not using the enum, update it
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'notifications' 
            AND column_name = 'type' 
            AND data_type != 'USER-DEFINED'
        ) THEN
            -- Convert the column to use the enum type
            ALTER TABLE notifications ALTER COLUMN type TYPE notification_type USING type::notification_type;
        END IF;
    END IF;
END $$;

-- Add a check constraint to ensure only valid types are allowed
DO $$
BEGIN
    -- Drop existing check constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_type_check' 
        AND table_name = 'notifications'
    ) THEN
        ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
    END IF;
    
    -- Add new check constraint
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('enrollment', 'announcement', 'assignment', 'live_session', 'doubt', 'poll', 'system', 'admin_message'));
END $$;
