-- Second Story Initiative Database Schema
-- Supabase SQL Schema for the Slack ecosystem

-- Enable Row Level Security (RLS)
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA PUBLIC GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

-- Create tables for the Second Story Slack ecosystem

-- 1. Learner Profiles Table
CREATE TABLE IF NOT EXISTS learner_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    slack_user_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    track TEXT,
    current_week INTEGER DEFAULT 1,
    skills TEXT[] DEFAULT '{}',
    goals TEXT[] DEFAULT '{}',
    mentor_id UUID REFERENCES learner_profiles(id),
    timezone TEXT,
    github_username TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_rate INTEGER DEFAULT 0,
    challenges_completed INTEGER DEFAULT 0,
    challenges_failed INTEGER DEFAULT 0,
    mentor_sessions_attended INTEGER DEFAULT 0,
    mentor_sessions_missed INTEGER DEFAULT 0,
    days_inactive INTEGER DEFAULT 0,
    achievement_badges TEXT[] DEFAULT '{}',
    preferences JSONB DEFAULT '{
        "notification_frequency": "daily",
        "preferred_learning_style": "mixed",
        "availability": [],
        "interests": []
    }'::jsonb
);

-- 2. Progress Entries Table
CREATE TABLE IF NOT EXISTS progress_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    learner_id UUID NOT NULL REFERENCES learner_profiles(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activity_type TEXT NOT NULL CHECK (activity_type IN ('challenge', 'mentor_session', 'pair_programming', 'standup', 'achievement')),
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('completed', 'in_progress', 'failed', 'skipped')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Challenges Table
CREATE TABLE IF NOT EXISTS challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    track TEXT NOT NULL,
    week_number INTEGER NOT NULL,
    skills_required TEXT[] DEFAULT '{}',
    skills_learned TEXT[] DEFAULT '{}',
    github_template TEXT,
    instructions TEXT NOT NULL,
    success_criteria TEXT[] DEFAULT '{}',
    resources JSONB DEFAULT '[]'::jsonb,
    estimated_hours INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- 4. Mentor Profiles Table
CREATE TABLE IF NOT EXISTS mentor_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    slack_user_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    specialties TEXT[] DEFAULT '{}',
    experience_years INTEGER DEFAULT 0,
    availability JSONB DEFAULT '{
        "timezone": "EST",
        "schedule": []
    }'::jsonb,
    max_mentees INTEGER DEFAULT 3,
    current_mentees TEXT[] DEFAULT '{}',
    bio TEXT,
    linkedin_url TEXT,
    github_username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 5. Standup Entries Table
CREATE TABLE IF NOT EXISTS standups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    learner_id UUID NOT NULL REFERENCES learner_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    yesterday_progress TEXT NOT NULL,
    today_goals TEXT NOT NULL,
    blockers TEXT,
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(learner_id, date)
);

-- 6. Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    learner_id UUID NOT NULL REFERENCES learner_profiles(id) ON DELETE CASCADE,
    badge_name TEXT NOT NULL,
    badge_description TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    slack_channel TEXT,
    slack_message_ts TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 7. Pair Programming Sessions Table
CREATE TABLE IF NOT EXISTS pair_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    learner1_id UUID NOT NULL REFERENCES learner_profiles(id) ON DELETE CASCADE,
    learner2_id UUID NOT NULL REFERENCES learner_profiles(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    topic TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 8. Job Postings Table (for curated job sharing)
CREATE TABLE IF NOT EXISTS job_postings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    remote_ok BOOLEAN DEFAULT false,
    salary_min INTEGER,
    salary_max INTEGER,
    description TEXT,
    requirements TEXT[],
    technologies TEXT[],
    source_url TEXT,
    posted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    difficulty TEXT CHECK (difficulty IN ('entry_level', 'junior', 'mid_level', 'senior')),
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    shared_in_slack BOOLEAN DEFAULT false,
    slack_message_ts TEXT
);

-- 9. Learning Resources Table
CREATE TABLE IF NOT EXISTS learning_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    resource_type TEXT CHECK (resource_type IN ('video', 'article', 'tutorial', 'course', 'documentation', 'book')),
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    topics TEXT[],
    estimated_time_minutes INTEGER,
    source TEXT,
    rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_featured BOOLEAN DEFAULT false,
    shared_in_slack BOOLEAN DEFAULT false,
    slack_message_ts TEXT
);

-- 10. System Health Log Table
CREATE TABLE IF NOT EXISTS system_health_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    check_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    github_status BOOLEAN NOT NULL,
    claude_status BOOLEAN NOT NULL,
    supabase_status BOOLEAN NOT NULL,
    slack_status BOOLEAN NOT NULL,
    overall_status TEXT NOT NULL CHECK (overall_status IN ('healthy', 'degraded', 'down')),
    response_time_ms INTEGER,
    error_details JSONB DEFAULT '{}'::jsonb
);

-- 11. Admin Alerts Table
CREATE TABLE IF NOT EXISTS admin_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by TEXT,
    is_resolved BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_learner_profiles_slack_user_id ON learner_profiles(slack_user_id);
CREATE INDEX IF NOT EXISTS idx_learner_profiles_track ON learner_profiles(track);
CREATE INDEX IF NOT EXISTS idx_learner_profiles_mentor_id ON learner_profiles(mentor_id);
CREATE INDEX IF NOT EXISTS idx_learner_profiles_last_active ON learner_profiles(last_active);

CREATE INDEX IF NOT EXISTS idx_progress_entries_learner_id ON progress_entries(learner_id);
CREATE INDEX IF NOT EXISTS idx_progress_entries_date ON progress_entries(date);
CREATE INDEX IF NOT EXISTS idx_progress_entries_activity_type ON progress_entries(activity_type);

CREATE INDEX IF NOT EXISTS idx_challenges_track ON challenges(track);
CREATE INDEX IF NOT EXISTS idx_challenges_week_number ON challenges(week_number);
CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON challenges(difficulty);

CREATE INDEX IF NOT EXISTS idx_mentor_profiles_slack_user_id ON mentor_profiles(slack_user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_specialties ON mentor_profiles USING GIN(specialties);

CREATE INDEX IF NOT EXISTS idx_standups_learner_id ON standups(learner_id);
CREATE INDEX IF NOT EXISTS idx_standups_date ON standups(date);

CREATE INDEX IF NOT EXISTS idx_achievements_learner_id ON achievements(learner_id);
CREATE INDEX IF NOT EXISTS idx_achievements_earned_at ON achievements(earned_at);

CREATE INDEX IF NOT EXISTS idx_job_postings_technologies ON job_postings USING GIN(technologies);
CREATE INDEX IF NOT EXISTS idx_job_postings_posted_at ON job_postings(posted_at);
CREATE INDEX IF NOT EXISTS idx_job_postings_remote_ok ON job_postings(remote_ok);

CREATE INDEX IF NOT EXISTS idx_learning_resources_topics ON learning_resources USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_learning_resources_difficulty ON learning_resources(difficulty);

CREATE INDEX IF NOT EXISTS idx_system_health_log_check_time ON system_health_log(check_time);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_created_at ON admin_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_is_resolved ON admin_alerts(is_resolved);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_learner_profiles_updated_at BEFORE UPDATE ON learner_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mentor_profiles_updated_at BEFORE UPDATE ON mentor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_standups_updated_at BEFORE UPDATE ON standups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate learner streak
CREATE OR REPLACE FUNCTION calculate_learner_streak(learner_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    streak_count INTEGER := 0;
    current_date DATE := CURRENT_DATE;
    check_date DATE;
BEGIN
    -- Start from today and go backwards
    check_date := current_date;
    
    LOOP
        -- Check if learner has any activity on this date
        IF EXISTS (
            SELECT 1 FROM progress_entries 
            WHERE learner_id = learner_uuid 
            AND DATE(created_at) = check_date
        ) THEN
            streak_count := streak_count + 1;
            check_date := check_date - INTERVAL '1 day';
        ELSE
            EXIT; -- Break the loop if no activity found
        END IF;
    END LOOP;
    
    RETURN streak_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get learner dashboard data
CREATE OR REPLACE FUNCTION get_learner_dashboard(learner_slack_id TEXT)
RETURNS JSONB AS $$
DECLARE
    learner_data RECORD;
    progress_data JSONB;
    recent_achievements JSONB;
    current_streak INTEGER;
    result JSONB;
BEGIN
    -- Get learner profile
    SELECT * INTO learner_data 
    FROM learner_profiles 
    WHERE slack_user_id = learner_slack_id;
    
    IF NOT FOUND THEN
        RETURN '{"error": "Learner not found"}'::jsonb;
    END IF;
    
    -- Get recent progress (last 7 days)
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', date,
            'activity_type', activity_type,
            'description', description,
            'status', status
        ) ORDER BY date DESC
    ) INTO progress_data
    FROM progress_entries 
    WHERE learner_id = learner_data.id 
    AND date >= NOW() - INTERVAL '7 days';
    
    -- Get recent achievements (last 30 days)
    SELECT jsonb_agg(
        jsonb_build_object(
            'badge_name', badge_name,
            'badge_description', badge_description,
            'earned_at', earned_at
        ) ORDER BY earned_at DESC
    ) INTO recent_achievements
    FROM achievements 
    WHERE learner_id = learner_data.id 
    AND earned_at >= NOW() - INTERVAL '30 days';
    
    -- Calculate current streak
    SELECT calculate_learner_streak(learner_data.id) INTO current_streak;
    
    -- Build result
    result := jsonb_build_object(
        'profile', to_jsonb(learner_data),
        'recent_progress', COALESCE(progress_data, '[]'::jsonb),
        'recent_achievements', COALESCE(recent_achievements, '[]'::jsonb),
        'current_streak', current_streak
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get admin metrics
CREATE OR REPLACE FUNCTION get_admin_metrics()
RETURNS JSONB AS $$
DECLARE
    total_learners INTEGER;
    active_learners INTEGER;
    challenges_this_week INTEGER;
    avg_completion_rate DECIMAL;
    result JSONB;
BEGIN
    -- Total learners
    SELECT COUNT(*) INTO total_learners FROM learner_profiles;
    
    -- Active learners (active in last 7 days)
    SELECT COUNT(*) INTO active_learners 
    FROM learner_profiles 
    WHERE last_active >= NOW() - INTERVAL '7 days';
    
    -- Challenges completed this week
    SELECT COUNT(*) INTO challenges_this_week
    FROM progress_entries 
    WHERE activity_type = 'challenge' 
    AND status = 'completed'
    AND created_at >= DATE_TRUNC('week', NOW());
    
    -- Average completion rate
    SELECT AVG(completion_rate) INTO avg_completion_rate 
    FROM learner_profiles 
    WHERE completion_rate > 0;
    
    result := jsonb_build_object(
        'total_learners', total_learners,
        'active_learners', active_learners,
        'challenges_completed_this_week', challenges_this_week,
        'average_completion_rate', ROUND(COALESCE(avg_completion_rate, 0), 2)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security on all tables
ALTER TABLE learner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE standups ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pair_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for service role (allows all operations)
CREATE POLICY "Service role can manage all data" ON learner_profiles FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage all data" ON progress_entries FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage all data" ON challenges FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage all data" ON mentor_profiles FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage all data" ON standups FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage all data" ON achievements FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage all data" ON pair_sessions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage all data" ON job_postings FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage all data" ON learning_resources FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage all data" ON system_health_log FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage all data" ON admin_alerts FOR ALL TO service_role USING (true);

-- Insert some sample data for testing
INSERT INTO challenges (title, description, difficulty, track, week_number, skills_required, skills_learned, instructions, success_criteria, created_by) VALUES
('HTML Basics', 'Create your first HTML page with proper structure', 'beginner', 'web_development', 1, '{}', '{"HTML", "basic_structure"}', 'Create an HTML file with head, body, and basic tags', '{"Valid HTML structure", "Includes head and body", "Has at least 3 different HTML tags"}', 'system'),
('CSS Styling', 'Add styles to your HTML page', 'beginner', 'web_development', 2, '{"HTML"}', '{"CSS", "styling", "selectors"}', 'Create a CSS file and style your HTML page', '{"External CSS file", "At least 5 CSS rules", "Responsive design principles"}', 'system'),
('JavaScript Basics', 'Add interactivity to your webpage', 'beginner', 'web_development', 3, '{"HTML", "CSS"}', '{"JavaScript", "DOM_manipulation", "events"}', 'Add JavaScript functionality to your webpage', '{"Interactive elements", "Event listeners", "DOM manipulation"}', 'system'),
('Python Hello World', 'Your first Python program', 'beginner', 'python', 1, '{}', '{"Python", "print_statements", "variables"}', 'Create a Python script that prints Hello World and uses variables', '{"Prints Hello World", "Uses variables", "Follows Python syntax"}', 'system'),
('React Component', 'Build your first React component', 'intermediate', 'web_development', 8, '{"HTML", "CSS", "JavaScript"}', '{"React", "components", "JSX"}', 'Create a functional React component', '{"Functional component", "Uses JSX", "Renders properly"}', 'system');

INSERT INTO job_postings (title, company, location, remote_ok, description, requirements, technologies, source_url, posted_at, difficulty) VALUES
('Junior Frontend Developer', 'TechStart Inc', 'Remote', true, 'Entry-level position for frontend development', '{"HTML", "CSS", "JavaScript"}', '{"React", "Git", "REST APIs"}', 'https://example.com/job1', NOW() - INTERVAL '2 days', 'entry_level'),
('Python Developer Internship', 'DataCorp', 'New York, NY', false, 'Internship opportunity for Python development', '{"Python basics", "Problem solving"}', '{"Python", "SQL", "Git"}', 'https://example.com/job2', NOW() - INTERVAL '1 day', 'entry_level'),
('Full Stack Developer', 'RemoteFirst Co', 'Remote', true, 'Junior full stack position', '{"JavaScript", "Basic backend knowledge"}', '{"Node.js", "React", "MongoDB"}', 'https://example.com/job3', NOW(), 'junior');

INSERT INTO learning_resources (title, description, url, resource_type, difficulty, topics, estimated_time_minutes, source) VALUES
('HTML & CSS Crash Course', 'Complete beginner guide to HTML and CSS', 'https://example.com/html-css-course', 'video', 'beginner', '{"HTML", "CSS", "web_development"}', 120, 'YouTube'),
('JavaScript for Beginners', 'Learn JavaScript from scratch', 'https://example.com/js-course', 'course', 'beginner', '{"JavaScript", "programming_basics"}', 480, 'FreeCodeCamp'),
('Git Version Control Tutorial', 'Master Git and GitHub', 'https://example.com/git-tutorial', 'tutorial', 'beginner', '{"Git", "version_control", "GitHub"}', 90, 'Documentation'),
('React Official Tutorial', 'Official React tutorial from the React team', 'https://react.dev/tutorial', 'tutorial', 'intermediate', '{"React", "components", "state"}', 180, 'React Docs'),
('Python Crash Course Book', 'Comprehensive Python programming book', 'https://example.com/python-book', 'book', 'beginner', '{"Python", "programming_fundamentals"}', 1200, 'No Starch Press');

-- Create a view for learner progress summary
CREATE OR REPLACE VIEW learner_progress_summary AS
SELECT 
    lp.id,
    lp.slack_user_id,
    lp.name,
    lp.track,
    lp.current_week,
    lp.completion_rate,
    lp.challenges_completed,
    lp.challenges_failed,
    COUNT(pe.id) as total_activities,
    COUNT(CASE WHEN pe.activity_type = 'standup' THEN 1 END) as standups_count,
    COUNT(CASE WHEN pe.activity_type = 'mentor_session' THEN 1 END) as mentor_sessions_count,
    MAX(pe.created_at) as last_activity_date
FROM learner_profiles lp
LEFT JOIN progress_entries pe ON lp.id = pe.learner_id
GROUP BY lp.id, lp.slack_user_id, lp.name, lp.track, lp.current_week, lp.completion_rate, lp.challenges_completed, lp.challenges_failed;

COMMENT ON TABLE learner_profiles IS 'Stores learner profile information and progress metrics';
COMMENT ON TABLE progress_entries IS 'Tracks all learner activities and progress';
COMMENT ON TABLE challenges IS 'Stores coding challenges for different tracks and weeks';
COMMENT ON TABLE mentor_profiles IS 'Stores mentor information and availability';
COMMENT ON TABLE standups IS 'Daily standup entries from learners';
COMMENT ON TABLE achievements IS 'Tracks earned badges and achievements';
COMMENT ON TABLE pair_sessions IS 'Manages pair programming sessions';
COMMENT ON TABLE job_postings IS 'Curated job opportunities for learners';
COMMENT ON TABLE learning_resources IS 'Curated learning materials and resources';
COMMENT ON TABLE system_health_log IS 'System health monitoring data';
COMMENT ON TABLE admin_alerts IS 'Administrative alerts and notifications';