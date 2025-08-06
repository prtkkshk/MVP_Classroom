-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'professor', 'student')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create courses table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    professor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    semester VARCHAR(50) NOT NULL,
    max_students INTEGER DEFAULT 60,
    schedule VARCHAR(100),
    classroom VARCHAR(100),
    is_live BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course_enrollments table
CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, student_id)
);

-- Create course_materials table
CREATE TABLE course_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create doubts table
CREATE TABLE doubts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    anonymous BOOLEAN DEFAULT FALSE,
    upvotes INTEGER DEFAULT 0,
    answered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create doubt_upvotes table
CREATE TABLE doubt_upvotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doubt_id UUID NOT NULL REFERENCES doubts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(doubt_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_courses_professor_id ON courses(professor_id);
CREATE INDEX idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX idx_course_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX idx_course_materials_course_id ON course_materials(course_id);
CREATE INDEX idx_doubts_course_id ON doubts(course_id);
CREATE INDEX idx_doubts_student_id ON doubts(student_id);
CREATE INDEX idx_doubt_upvotes_doubt_id ON doubt_upvotes(doubt_id);
CREATE INDEX idx_doubt_upvotes_user_id ON doubt_upvotes(user_id);

-- Create functions for upvote management
CREATE OR REPLACE FUNCTION increase_doubt_upvotes(doubt_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE doubts SET upvotes = upvotes + 1 WHERE id = doubt_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrease_doubt_upvotes(doubt_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE doubts SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = doubt_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubts ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubt_upvotes ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Super admins can view all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Courses policies
CREATE POLICY "Anyone can view courses" ON courses
    FOR SELECT USING (true);

CREATE POLICY "Professors can manage own courses" ON courses
    FOR ALL USING (professor_id = auth.uid());

CREATE POLICY "Super admins can manage all courses" ON courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Course enrollments policies
CREATE POLICY "Students can view own enrollments" ON course_enrollments
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Professors can view course enrollments" ON course_enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses WHERE id = course_id AND professor_id = auth.uid()
        )
    );

CREATE POLICY "Students can create enrollments" ON course_enrollments
    FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Professors can update enrollments" ON course_enrollments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM courses WHERE id = course_id AND professor_id = auth.uid()
        )
    );

CREATE POLICY "Super admins can manage all enrollments" ON course_enrollments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Course materials policies
CREATE POLICY "Anyone can view course materials" ON course_materials
    FOR SELECT USING (true);

CREATE POLICY "Professors can manage course materials" ON course_materials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses WHERE id = course_id AND professor_id = auth.uid()
        )
    );

CREATE POLICY "Super admins can manage all materials" ON course_materials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Doubts policies
CREATE POLICY "Anyone can view doubts" ON doubts
    FOR SELECT USING (true);

CREATE POLICY "Students can create doubts" ON doubts
    FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own doubts" ON doubts
    FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "Professors can update doubts in their courses" ON doubts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM courses WHERE id = course_id AND professor_id = auth.uid()
        )
    );

CREATE POLICY "Super admins can manage all doubts" ON doubts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Doubt upvotes policies
CREATE POLICY "Anyone can view doubt upvotes" ON doubt_upvotes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own upvotes" ON doubt_upvotes
    FOR ALL USING (user_id = auth.uid());

-- Insert default super admin user
INSERT INTO users (id, email, username, name, role) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@infralearn.com',
    'pepper_admin',
    'System Administrator',
    'super_admin'
);

-- Insert sample professor
INSERT INTO users (id, email, username, name, role) VALUES (
    '00000000-0000-0000-0000-000000000002',
    'prof.smith@university.edu',
    'prof_smith',
    'Dr. John Smith',
    'professor'
);

-- Insert sample student
INSERT INTO users (id, email, username, name, role) VALUES (
    '00000000-0000-0000-0000-000000000003',
    'jane.doe@kgpian.iitkgp.ac.in',
    'student_jane',
    'Jane Doe',
    'student'
);

-- Insert sample courses
INSERT INTO courses (id, title, code, description, professor_id, semester, max_students, schedule, classroom, is_live) VALUES (
    '00000000-0000-0000-0000-000000000004',
    'Advanced Data Structures',
    'CS301AB',
    'In-depth study of advanced data structures and algorithms including trees, graphs, and dynamic programming techniques.',
    '00000000-0000-0000-0000-000000000002',
    'Fall 2024',
    60,
    'MWF 10:00-11:00',
    'Room 205',
    false
);

INSERT INTO courses (id, title, code, description, professor_id, semester, max_students, schedule, classroom, is_live) VALUES (
    '00000000-0000-0000-0000-000000000005',
    'Machine Learning Fundamentals',
    'ML101XY',
    'Introduction to machine learning concepts, algorithms, and practical applications in modern computing.',
    '00000000-0000-0000-0000-000000000002',
    'Fall 2024',
    50,
    'TTh 2:00-3:30',
    'Room 301',
    true
);

-- Insert sample enrollments
INSERT INTO course_enrollments (course_id, student_id, status) VALUES (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000003',
    'approved'
);

-- Insert sample doubts
INSERT INTO doubts (course_id, student_id, text, anonymous, upvotes, answered) VALUES (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000003',
    'Can you explain the time complexity of binary search trees?',
    true,
    5,
    false
);

INSERT INTO doubts (course_id, student_id, text, anonymous, upvotes, answered) VALUES (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000003',
    'What is the difference between DFS and BFS traversal?',
    false,
    3,
    true
); 