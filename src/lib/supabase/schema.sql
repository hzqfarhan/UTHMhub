-- ==========================================
-- UTHMhub - Supabase SQL Schema
-- ==========================================

-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  faculty TEXT,
  theme TEXT DEFAULT 'purple',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Semesters
CREATE TABLE IF NOT EXISTS semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  gpa NUMERIC(4,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  credit_hour INTEGER NOT NULL DEFAULT 3,
  grade TEXT,
  marks_percentage NUMERIC(5,2),
  point_value NUMERIC(4,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grading Scale
CREATE TABLE IF NOT EXISTS grading_scale (
  id SERIAL PRIMARY KEY,
  min_mark NUMERIC(5,2) NOT NULL,
  max_mark NUMERIC(5,2) NOT NULL,
  grade TEXT NOT NULL,
  point_value NUMERIC(4,2) NOT NULL
);

-- Academic Events (Admin-managed calendar)
CREATE TABLE IF NOT EXISTS academic_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  category TEXT NOT NULL, -- 'registration','lecture','study-week','exam','holiday','online','break','revision'
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Events (Personal calendar entries)
CREATE TABLE IF NOT EXISTS user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'other', -- 'assignment','project','quiz','presentation','other'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quick Links
CREATE TABLE IF NOT EXISTS quick_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT DEFAULT 'link',
  description TEXT,
  category TEXT DEFAULT 'general',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- Row Level Security Policies
-- ==========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

-- Users: only access own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Semesters: only access own data
CREATE POLICY "Users can view own semesters" ON semesters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own semesters" ON semesters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own semesters" ON semesters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own semesters" ON semesters FOR DELETE USING (auth.uid() = user_id);

-- Subjects: only access own data
CREATE POLICY "Users can view own subjects" ON subjects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subjects" ON subjects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subjects" ON subjects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subjects" ON subjects FOR DELETE USING (auth.uid() = user_id);

-- User Events: only access own data
CREATE POLICY "Users can view own events" ON user_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own events" ON user_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events" ON user_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own events" ON user_events FOR DELETE USING (auth.uid() = user_id);

-- Academic Events & Quick Links: public read
ALTER TABLE academic_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view academic events" ON academic_events FOR SELECT TO authenticated USING (true);

ALTER TABLE quick_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view quick links" ON quick_links FOR SELECT TO authenticated USING (true);

-- ==========================================
-- Seed: Grading Scale
-- ==========================================

INSERT INTO grading_scale (min_mark, max_mark, grade, point_value) VALUES
(90, 100, 'A+', 4.00),
(85, 89, 'A', 4.00),
(80, 84, 'A-', 3.67),
(75, 79, 'B+', 3.33),
(70, 74, 'B', 3.00),
(65, 69, 'B-', 2.67),
(60, 64, 'C+', 2.33),
(55, 59, 'C', 2.00),
(50, 54, 'C-', 1.67),
(45, 49, 'D+', 1.33),
(40, 44, 'D', 1.00),
(35, 39, 'D-', 0.67),
(0, 34, 'F', 0.00);
