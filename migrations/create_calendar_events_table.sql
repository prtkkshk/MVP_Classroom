-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL DEFAULT 'other',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    all_day BOOLEAN DEFAULT false,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional fields from the enhanced schema
    priority TEXT DEFAULT 'normal',
    location TEXT,
    attendees JSONB DEFAULT '[]',
    recurring_pattern JSONB,
    reminder_settings JSONB DEFAULT '{}',
    color TEXT,
    is_private BOOLEAN DEFAULT false,
    tags JSONB DEFAULT '[]',
    external_id TEXT,
    external_source TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_calendar_events_course_id ON calendar_events(course_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_priority ON calendar_events(priority);
CREATE INDEX IF NOT EXISTS idx_calendar_events_course_date ON calendar_events(course_id, start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date ON calendar_events(created_by, start_date);

-- Enable Row Level Security
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for users to view their own events
CREATE POLICY "Users can view their own calendar events" ON calendar_events
    FOR SELECT USING (auth.uid() = created_by);

-- Policy for users to view course events they're enrolled in
CREATE POLICY "Users can view course calendar events" ON calendar_events
    FOR SELECT USING (
        course_id IN (
            SELECT course_id FROM enrollments 
            WHERE user_id = auth.uid()
        )
    );

-- Policy for professors to view events in their courses
CREATE POLICY "Professors can view course calendar events" ON calendar_events
    FOR SELECT USING (
        course_id IN (
            SELECT id FROM courses 
            WHERE professor_id = auth.uid()
        )
    );

-- Policy for super admins to view all events
CREATE POLICY "Super admins can view all calendar events" ON calendar_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Policy for users to create their own events
CREATE POLICY "Users can create their own calendar events" ON calendar_events
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policy for users to update their own events
CREATE POLICY "Users can update their own calendar events" ON calendar_events
    FOR UPDATE USING (auth.uid() = created_by);

-- Policy for professors to update events in their courses
CREATE POLICY "Professors can update course calendar events" ON calendar_events
    FOR UPDATE USING (
        course_id IN (
            SELECT id FROM courses 
            WHERE professor_id = auth.uid()
        )
    );

-- Policy for users to delete their own events
CREATE POLICY "Users can delete their own calendar events" ON calendar_events
    FOR DELETE USING (auth.uid() = created_by);

-- Policy for professors to delete events in their courses
CREATE POLICY "Professors can delete course calendar events" ON calendar_events
    FOR DELETE USING (
        course_id IN (
            SELECT id FROM courses 
            WHERE professor_id = auth.uid()
        )
    );

-- Policy for super admins to manage all events
CREATE POLICY "Super admins can manage all calendar events" ON calendar_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_calendar_events_updated_at 
    BEFORE UPDATE ON calendar_events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
