-- Slack Ecosystem Tables Migration
-- Creates only the missing tables needed for Slack functionality

-- Enable Row Level Security (RLS)
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA PUBLIC GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

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

-- 3. Slack Challenges Table (different from existing challenges)
CREATE TABLE IF NOT EXISTS slack_challenges (
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

-- 8. Job Postings Table
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
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_learner_profiles_slack_user_id ON learner_profiles(slack_user_id);
CREATE INDEX IF NOT EXISTS idx_progress_entries_learner_id ON progress_entries(learner_id);
CREATE INDEX IF NOT EXISTS idx_progress_entries_date ON progress_entries(date);
CREATE INDEX IF NOT EXISTS idx_standups_learner_date ON standups(learner_id, date);
CREATE INDEX IF NOT EXISTS idx_achievements_learner_id ON achievements(learner_id);
CREATE INDEX IF NOT EXISTS idx_pair_sessions_learners ON pair_sessions(learner1_id, learner2_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON job_postings(created_at);
CREATE INDEX IF NOT EXISTS idx_learning_resources_topics ON learning_resources USING GIN(topics);

-- Enable Row Level Security on all tables
ALTER TABLE learner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE standups ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pair_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY;

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON learner_profiles TO anon, authenticated;
GRANT SELECT ON progress_entries TO anon, authenticated;
GRANT SELECT ON slack_challenges TO anon, authenticated;
GRANT SELECT ON mentor_profiles TO anon, authenticated;
GRANT SELECT ON standups TO anon, authenticated;
GRANT SELECT ON achievements TO anon, authenticated;
GRANT SELECT ON pair_sessions TO anon, authenticated;
GRANT SELECT ON job_postings TO anon, authenticated;
GRANT SELECT ON learning_resources TO anon, authenticated;
GRANT SELECT ON system_health_log TO anon, authenticated;
GRANT SELECT ON admin_alerts TO anon, authenticated;

-- Grant full access to authenticated users
GRANT ALL PRIVILEGES ON learner_profiles TO authenticated;
GRANT ALL PRIVILEGES ON progress_entries TO authenticated;
GRANT ALL PRIVILEGES ON slack_challenges TO authenticated;
GRANT ALL PRIVILEGES ON mentor_profiles TO authenticated;
GRANT ALL PRIVILEGES ON standups TO authenticated;
GRANT ALL PRIVILEGES ON achievements TO authenticated;
GRANT ALL PRIVILEGES ON pair_sessions TO authenticated;
GRANT ALL PRIVILEGES ON job_postings TO authenticated;
GRANT ALL PRIVILEGES ON learning_resources TO authenticated;
GRANT ALL PRIVILEGES ON system_health_log TO authenticated;
GRANT ALL PRIVILEGES ON admin_alerts TO authenticated;

-- Insert sample data
INSERT INTO slack_challenges (title, description, difficulty, track, week_number, skills_required, skills_learned, instructions, success_criteria, created_by) VALUES
('HTML Basics', 'Create your first HTML page with proper structure', 'beginner', 'web_development', 1, '{}', '{"HTML", "basic_structure"}', 'Create an HTML file with head, body, and basic tags', '{"Valid HTML structure", "Includes head and body", "Has at least 3 different HTML tags"}', 'system'),
('CSS Styling', 'Add styles to your HTML page', 'beginner', 'web_development', 2, '{"HTML"}', '{"CSS", "styling", "selectors"}', 'Create a CSS file and style your HTML page', '{"External CSS file", "At least 5 CSS rules", "Responsive design principles"}', 'system'),
('JavaScript Basics', 'Add interactivity to your webpage', 'beginner', 'web_development', 3, '{"HTML", "CSS"}', '{"JavaScript", "DOM_manipulation", "events"}', 'Add JavaScript functionality to your webpage', '{"Interactive elements", "Event listeners", "DOM manipulation"}', 'system');

INSERT INTO job_postings (title, company, location, remote_ok, description, requirements, technologies, source_url, posted_at, difficulty) VALUES
('Junior Frontend Developer', 'TechStart Inc', 'Remote', true, 'Entry-level position for frontend development', '{"HTML", "CSS", "JavaScript"}', '{"React", "Git", "REST APIs"}', 'https://example.com/job1', NOW() - INTERVAL '2 days', 'entry_level'),
('Python Developer Internship', 'DataCorp', 'New York, NY', false, 'Internship opportunity for Python development', '{"Python basics", "Problem solving"}', '{"Python", "SQL", "Git"}', 'https://example.com/job2', NOW() - INTERVAL '1 day', 'entry_level');

INSERT INTO learning_resources (title, description, url, resource_type, difficulty, topics, estimated_time_minutes, source) VALUES
('HTML & CSS Crash Course', 'Complete beginner guide to HTML and CSS', 'https://example.com/html-css-course', 'video', 'beginner', '{"HTML", "CSS", "web_development"}', 120, 'YouTube'),
('JavaScript for Beginners', 'Learn JavaScript from scratch', 'https://example.com/js-course', 'course', 'beginner', '{"JavaScript", "programming_basics"}', 480, 'FreeCodeCamp'),
('Git Version Control Tutorial', 'Master Git and GitHub', 'https://example.com/git-tutorial', 'tutorial', 'beginner', '{"Git", "version_control", "GitHub"}', 90, 'Documentation');