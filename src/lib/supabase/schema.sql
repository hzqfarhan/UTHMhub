-- ==========================================
-- UTHMhub - Supabase SQL Schema v2
-- Includes: Auth, GPA, Calendar, Study Timer,
--           Leaderboard, Pomodoro, Notifications
-- ==========================================

-- ==========================================
-- 1. USERS (extends Supabase Auth)
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  avatar_url TEXT,                -- profile picture URL (Supabase Storage)
  faculty TEXT,
  theme TEXT DEFAULT 'purple',
  auth_provider TEXT,             -- 'google' | 'apple' | 'email'
  is_online BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create user row on sign-up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, auth_provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==========================================
-- 2. GPA DATA
-- ==========================================

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

-- ==========================================
-- 3. CALENDAR
-- ==========================================

-- Academic Events (Admin-managed)
CREATE TABLE IF NOT EXISTS academic_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  category TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Events (Personal calendar)
CREATE TABLE IF NOT EXISTS user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'other',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. STUDY SESSIONS (Leaderboard Source)
-- ==========================================

CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL DEFAULT 'General',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast leaderboard queries
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date
  ON study_sessions (user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_study_sessions_date
  ON study_sessions (started_at DESC);

-- ==========================================
-- 5. DAILY STUDY SUMMARY (Materialized)
-- ==========================================

-- Aggregated daily totals per user (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_study_totals AS
SELECT
  user_id,
  DATE(started_at AT TIME ZONE 'Asia/Kuala_Lumpur') AS study_date,
  SUM(duration_seconds) AS total_seconds,
  COUNT(*) AS session_count,
  json_agg(DISTINCT subject) AS subjects_studied
FROM study_sessions
WHERE ended_at IS NOT NULL
GROUP BY user_id, DATE(started_at AT TIME ZONE 'Asia/Kuala_Lumpur');

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_study_totals
  ON daily_study_totals (user_id, study_date);

-- ==========================================
-- 6. LEADERBOARD VIEW (Today + This Week)
-- ==========================================

-- Today's leaderboard (real-time view, not materialized)
CREATE OR REPLACE VIEW leaderboard_today AS
SELECT
  u.id AS user_id,
  u.name AS nickname,
  u.avatar_url,
  u.is_online,
  COALESCE(SUM(s.duration_seconds), 0) AS today_seconds,
  COUNT(s.id) AS today_sessions
FROM users u
LEFT JOIN study_sessions s
  ON s.user_id = u.id
  AND DATE(s.started_at AT TIME ZONE 'Asia/Kuala_Lumpur') = CURRENT_DATE
  AND s.ended_at IS NOT NULL
GROUP BY u.id, u.name, u.avatar_url, u.is_online
ORDER BY today_seconds DESC;

-- Weekly leaderboard
CREATE OR REPLACE VIEW leaderboard_weekly AS
SELECT
  u.id AS user_id,
  u.name AS nickname,
  u.avatar_url,
  u.is_online,
  COALESCE(SUM(s.duration_seconds), 0) AS week_seconds,
  COUNT(s.id) AS week_sessions
FROM users u
LEFT JOIN study_sessions s
  ON s.user_id = u.id
  AND s.started_at >= (CURRENT_DATE - INTERVAL '7 days')
  AND s.ended_at IS NOT NULL
GROUP BY u.id, u.name, u.avatar_url, u.is_online
ORDER BY week_seconds DESC;

-- ==========================================
-- 7. STUDY STREAKS
-- ==========================================

-- Function to calculate a user's current streak
CREATE OR REPLACE FUNCTION get_study_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  streak INTEGER := 0;
  check_date DATE := CURRENT_DATE;
  has_session BOOLEAN;
BEGIN
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM study_sessions
      WHERE user_id = p_user_id
        AND DATE(started_at AT TIME ZONE 'Asia/Kuala_Lumpur') = check_date
        AND duration_seconds >= 60
    ) INTO has_session;

    IF has_session THEN
      streak := streak + 1;
      check_date := check_date - 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  RETURN streak;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==========================================
-- 8. POMODORO STATS
-- ==========================================

CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'work',     -- 'work' | 'short_break' | 'long_break'
  duration_seconds INTEGER NOT NULL,
  completed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 9. QUICK LINKS
-- ==========================================

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
-- 10. ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- Users: own profile (read/write), all nicknames (read for leaderboard)
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
-- Leaderboard: anyone can see nickname + avatar + online status
CREATE POLICY "Anyone can read leaderboard fields" ON users
  FOR SELECT TO authenticated
  USING (true);

-- Semesters: own data only
CREATE POLICY "Own semesters" ON semesters
  FOR ALL USING (auth.uid() = user_id);

-- Subjects: own data only
CREATE POLICY "Own subjects" ON subjects
  FOR ALL USING (auth.uid() = user_id);

-- User Events: own data only
CREATE POLICY "Own events" ON user_events
  FOR ALL USING (auth.uid() = user_id);

-- Study Sessions: own write, all read (for leaderboard)
CREATE POLICY "Users can insert own sessions" ON study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON study_sessions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON study_sessions
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can read sessions for leaderboard" ON study_sessions
  FOR SELECT TO authenticated
  USING (true);

-- Pomodoro: own data only
CREATE POLICY "Own pomodoro sessions" ON pomodoro_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Academic Events & Quick Links: public read
ALTER TABLE academic_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view academic events" ON academic_events
  FOR SELECT TO authenticated USING (true);

ALTER TABLE quick_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view quick links" ON quick_links
  FOR SELECT TO authenticated USING (true);

-- ==========================================
-- 11. REALTIME (Online Status)
-- ==========================================

-- Enable realtime for leaderboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE study_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- Function to update online status
CREATE OR REPLACE FUNCTION update_user_online(p_user_id UUID, p_online BOOLEAN)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET is_online = p_online,
      last_seen_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 12. REFRESH MATERIALIZED VIEW (Cron Job)
-- ==========================================

-- Run via Supabase pg_cron or Edge Function:
-- SELECT cron.schedule('refresh-daily-totals', '*/15 * * * *',
--   'REFRESH MATERIALIZED VIEW CONCURRENTLY daily_study_totals');

-- ==========================================
-- 13. SEED DATA: Grading Scale
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
(0, 34, 'F', 0.00)
ON CONFLICT DO NOTHING;
