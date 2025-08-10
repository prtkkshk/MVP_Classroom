-- Fix notifications table type to support admin_message
-- This migration safely handles the type conversion for existing notifications table

-- First, create the notification_type enum if it doesn't exist
DO $$
BEGIN
    -- Check if the enum type exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'notification_type'
    ) THEN
        -- Create the enum type with all values
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

-- Now handle the notifications table type conversion safely
DO $$
BEGIN
    -- Check if the notifications table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'notifications'
    ) THEN
        -- Check if the type column exists and what type it currently is
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'notifications' 
            AND column_name = 'type'
        ) THEN
            -- Check if the column is already using the enum type
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'notifications' 
                AND column_name = 'type' 
                AND data_type = 'USER-DEFINED'
            ) THEN
                -- Column is already using enum, just add admin_message if it doesn't exist
                IF NOT EXISTS (
                    SELECT 1 FROM pg_enum 
                    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')
                    AND enumlabel = 'admin_message'
                ) THEN
                    ALTER TYPE notification_type ADD VALUE 'admin_message';
                END IF;
            ELSE
                -- Column is using text, convert it safely using a different approach
                -- First, ensure all existing values are valid
                UPDATE notifications 
                SET type = 'system' 
                WHERE type NOT IN ('enrollment', 'announcement', 'assignment', 'live_session', 'doubt', 'poll', 'system');
                
                -- Create a temporary column with the new type
                ALTER TABLE notifications ADD COLUMN type_new notification_type;
                
                -- Copy data with explicit casting
                UPDATE notifications SET type_new = 
                    CASE type
                        WHEN 'enrollment' THEN 'enrollment'::notification_type
                        WHEN 'announcement' THEN 'announcement'::notification_type
                        WHEN 'assignment' THEN 'assignment'::notification_type
                        WHEN 'live_session' THEN 'live_session'::notification_type
                        WHEN 'doubt' THEN 'doubt'::notification_type
                        WHEN 'poll' THEN 'poll'::notification_type
                        WHEN 'system' THEN 'system'::notification_type
                        ELSE 'system'::notification_type
                    END;
                
                -- Drop the old column and rename the new one
                ALTER TABLE notifications DROP COLUMN type;
                ALTER TABLE notifications RENAME COLUMN type_new TO type;
                
                -- Set NOT NULL constraint
                ALTER TABLE notifications ALTER COLUMN type SET NOT NULL;
            END IF;
        END IF;
    ELSE
        -- Table doesn't exist, create it with the enum type
        CREATE TABLE notifications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type notification_type NOT NULL DEFAULT 'system',
            is_read BOOLEAN DEFAULT FALSE,
            related_id UUID,
            related_type TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_notifications_user_id ON notifications(user_id);
        CREATE INDEX idx_notifications_type ON notifications(type);
        CREATE INDEX idx_notifications_is_read ON notifications(is_read);
        CREATE INDEX idx_notifications_created_at ON notifications(created_at);
        
        -- Add RLS
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
        
        -- Add policies
        CREATE POLICY "Users can view their own notifications" ON notifications
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own notifications" ON notifications
            FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "System can insert notifications" ON notifications
            FOR INSERT WITH CHECK (true);
        
        CREATE POLICY "Users can delete their own notifications" ON notifications
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Ensure the check constraint is correct
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
