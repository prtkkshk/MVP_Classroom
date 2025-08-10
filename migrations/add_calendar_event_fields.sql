-- Add priority field to calendar_events table
ALTER TABLE calendar_events 
ADD COLUMN priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- Add location field to calendar_events table
ALTER TABLE calendar_events 
ADD COLUMN location TEXT;

-- Add attendees field to calendar_events table (JSON array of user IDs)
ALTER TABLE calendar_events 
ADD COLUMN attendees JSONB;

-- Add recurring_pattern field to calendar_events table
ALTER TABLE calendar_events 
ADD COLUMN recurring_pattern TEXT;

-- Add reminder_settings field to calendar_events table (JSON object)
ALTER TABLE calendar_events 
ADD COLUMN reminder_settings JSONB;

-- Add color field to calendar_events table
ALTER TABLE calendar_events 
ADD COLUMN color VARCHAR(7);

-- Add is_private field to calendar_events table
ALTER TABLE calendar_events 
ADD COLUMN is_private BOOLEAN DEFAULT false;

-- Add tags field to calendar_events table (JSON array of tags)
ALTER TABLE calendar_events 
ADD COLUMN tags JSONB;

-- Add external_id field for integration with external calendar systems
ALTER TABLE calendar_events 
ADD COLUMN external_id VARCHAR(255);

-- Add external_source field to track the source of external events
ALTER TABLE calendar_events 
ADD COLUMN external_source VARCHAR(50);

-- Create index on priority for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_priority ON calendar_events(priority);

-- Create index on start_date for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);

-- Create index on event_type for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);

-- Create index on created_by for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);

-- Create index on course_id for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_course_id ON calendar_events(course_id);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_course_date ON calendar_events(course_id, start_date);

-- Create composite index for user events
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date ON calendar_events(created_by, start_date);

-- Add RLS policies for calendar_events table
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own events
CREATE POLICY "Users can view their own calendar events" ON calendar_events
    FOR SELECT USING (auth.uid() = created_by);

-- Policy for users to view course events they're enrolled in
CREATE POLICY "Users can view course calendar events" ON calendar_events
    FOR SELECT USING (
        course_id IS NOT NULL AND
        course_id IN (
            SELECT course_id FROM course_enrollments 
            WHERE student_id = auth.uid() AND status = 'approved'
        )
    );

-- Policy for professors to view events in their courses
CREATE POLICY "Professors can view course calendar events" ON calendar_events
    FOR SELECT USING (
        course_id IS NOT NULL AND
        course_id IN (
            SELECT id FROM courses WHERE professor_id = auth.uid()
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
        course_id IS NOT NULL AND
        course_id IN (
            SELECT id FROM courses WHERE professor_id = auth.uid()
        )
    );

-- Policy for users to delete their own events
CREATE POLICY "Users can delete their own calendar events" ON calendar_events
    FOR DELETE USING (auth.uid() = created_by);

-- Policy for professors to delete events in their courses
CREATE POLICY "Professors can delete course calendar events" ON calendar_events
    FOR DELETE USING (
        course_id IS NOT NULL AND
        course_id IN (
            SELECT id FROM courses WHERE professor_id = auth.uid()
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
