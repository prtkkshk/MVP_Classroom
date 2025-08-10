-- Create message_requests table for handling message approval system
-- This table stores message requests that need to be approved before users can chat

CREATE TABLE IF NOT EXISTS message_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(requester_id, recipient_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_requests_requester_id ON message_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_message_requests_recipient_id ON message_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_message_requests_status ON message_requests(status);
CREATE INDEX IF NOT EXISTS idx_message_requests_created_at ON message_requests(created_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_message_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_message_requests_updated_at'
    ) THEN
        CREATE TRIGGER update_message_requests_updated_at 
            BEFORE UPDATE ON message_requests 
            FOR EACH ROW 
            EXECUTE FUNCTION update_message_requests_updated_at();
    END IF;
END $$;

-- Add RLS (Row Level Security) policies
ALTER TABLE message_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view requests they sent or received
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'message_requests' 
        AND policyname = 'Users can view their message requests'
    ) THEN
        CREATE POLICY "Users can view their message requests" ON message_requests
            FOR SELECT USING (
                auth.uid() = requester_id OR auth.uid() = recipient_id
            );
    END IF;
END $$;

-- Policy: Users can create message requests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'message_requests' 
        AND policyname = 'Users can create message requests'
    ) THEN
        CREATE POLICY "Users can create message requests" ON message_requests
            FOR INSERT WITH CHECK (
                auth.uid() = requester_id
            );
    END IF;
END $$;

-- Policy: Recipients can update (approve/reject) message requests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'message_requests' 
        AND policyname = 'Recipients can update message requests'
    ) THEN
        CREATE POLICY "Recipients can update message requests" ON message_requests
            FOR UPDATE USING (
                auth.uid() = recipient_id
            );
    END IF;
END $$;

-- Policy: Users can delete their own message requests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'message_requests' 
        AND policyname = 'Users can delete their message requests'
    ) THEN
        CREATE POLICY "Users can delete their message requests" ON message_requests
            FOR DELETE USING (
                auth.uid() = requester_id OR auth.uid() = recipient_id
            );
    END IF;
END $$;
