-- Enhanced Moderation and Engagement System Migration
-- Adds comprehensive moderation, engagement tracking, and content curation capabilities

-- 1. Moderation Actions Table
CREATE TABLE IF NOT EXISTS moderation_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action_type TEXT NOT NULL CHECK (action_type IN ('warn', 'mute', 'ban', 'delete_message', 'flag_content')),
    user_id TEXT NOT NULL,
    moderator_id TEXT,
    channel_id TEXT,
    message_ts TEXT,
    reason TEXT NOT NULL,
    severity INTEGER DEFAULT 1 CHECK (severity >= 1 AND severity <= 5),
    is_automated BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Banned Words Table
CREATE TABLE IF NOT EXISTS banned_words (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    word TEXT NOT NULL UNIQUE,
    severity INTEGER DEFAULT 1 CHECK (severity >= 1 AND severity <= 5),
    action_type TEXT DEFAULT 'warn' CHECK (action_type IN ('warn', 'delete', 'flag')),
    is_active BOOLEAN DEFAULT true,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User Reports Table
CREATE TABLE IF NOT EXISTS user_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id TEXT NOT NULL,
    reported_user_id TEXT NOT NULL,
    channel_id TEXT,
    message_ts TEXT,
    report_type TEXT NOT NULL CHECK (report_type IN ('spam', 'harassment', 'inappropriate', 'misinformation', 'other')),
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    reviewed_by TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Engagement Tracking Table
CREATE TABLE IF NOT EXISTS engagement_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('message', 'reaction_given', 'reaction_received', 'mention', 'thread_reply', 'file_share')),
    channel_id TEXT,
    points INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. User Achievements Table (enhanced)
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    achievement_type TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    description TEXT,
    points_awarded INTEGER DEFAULT 0,
    badge_emoji TEXT,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    announced_in_channel TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 6. Content Queue Table
CREATE TABLE IF NOT EXISTS content_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_type TEXT NOT NULL CHECK (content_type IN ('job_posting', 'learning_resource', 'tech_news', 'motivation', 'challenge')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_channel TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    posted_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'posted', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Channel Rules Table
CREATE TABLE IF NOT EXISTS channel_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_id TEXT NOT NULL,
    channel_name TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('no_links', 'no_images', 'topic_only', 'format_required', 'time_restricted')),
    rule_description TEXT NOT NULL,
    enforcement_action TEXT DEFAULT 'warn' CHECK (enforcement_action IN ('warn', 'delete', 'move_message')),
    is_active BOOLEAN DEFAULT true,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Mentorship Requests Table
CREATE TABLE IF NOT EXISTS mentorship_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentee_id TEXT NOT NULL,
    mentor_id TEXT,
    topic TEXT NOT NULL,
    description TEXT,
    urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'matched', 'completed', 'cancelled')),
    matched_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Daily Challenges Table
CREATE TABLE IF NOT EXISTS daily_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    challenge_text TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    category TEXT NOT NULL,
    points_reward INTEGER DEFAULT 10,
    participants TEXT[] DEFAULT '{}',
    completions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Onboarding Progress Table
CREATE TABLE IF NOT EXISTS onboarding_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    step_completed TEXT[] DEFAULT '{}',
    current_step TEXT DEFAULT 'welcome',
    completion_percentage INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add warnings_count to learner_profiles if it doesn't exist
ALTER TABLE learner_profiles 
ADD COLUMN IF NOT EXISTS warnings_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mute_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_moderation_actions_user_id ON moderation_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_created_at ON moderation_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_banned_words_word ON banned_words(word);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_engagement_tracking_user_id ON engagement_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_tracking_created_at ON engagement_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_content_queue_scheduled_for ON content_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_channel_rules_channel_id ON channel_rules(channel_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_status ON mentorship_requests(status);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(date);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id ON onboarding_progress(user_id);

-- Enable Row Level Security
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON moderation_actions TO anon, authenticated;
GRANT SELECT ON banned_words TO anon, authenticated;
GRANT SELECT ON user_reports TO anon, authenticated;
GRANT SELECT ON engagement_tracking TO anon, authenticated;
GRANT SELECT ON user_achievements TO anon, authenticated;
GRANT SELECT ON content_queue TO anon, authenticated;
GRANT SELECT ON channel_rules TO anon, authenticated;
GRANT SELECT ON mentorship_requests TO anon, authenticated;
GRANT SELECT ON daily_challenges TO anon, authenticated;
GRANT SELECT ON onboarding_progress TO anon, authenticated;

GRANT ALL PRIVILEGES ON moderation_actions TO authenticated;
GRANT ALL PRIVILEGES ON banned_words TO authenticated;
GRANT ALL PRIVILEGES ON user_reports TO authenticated;
GRANT ALL PRIVILEGES ON engagement_tracking TO authenticated;
GRANT ALL PRIVILEGES ON user_achievements TO authenticated;
GRANT ALL PRIVILEGES ON content_queue TO authenticated;
GRANT ALL PRIVILEGES ON channel_rules TO authenticated;
GRANT ALL PRIVILEGES ON mentorship_requests TO authenticated;
GRANT ALL PRIVILEGES ON daily_challenges TO authenticated;
GRANT ALL PRIVILEGES ON onboarding_progress TO authenticated;

-- Insert sample banned words
INSERT INTO banned_words (word, severity, action_type, created_by) VALUES
('spam', 2, 'delete', 'system'),
('scam', 3, 'delete', 'system'),
('fake', 2, 'flag', 'system')
ON CONFLICT (word) DO NOTHING;

-- Insert sample channel rules
INSERT INTO channel_rules (channel_id, channel_name, rule_type, rule_description, created_by) VALUES
('C07VCMW6P25', 'general', 'topic_only', 'Keep discussions relevant to learning and community', 'system'),
('C_JOBS_ID', 'job-board', 'format_required', 'Job posts must include title, company, and requirements', 'system'),
('C_CODEHELP_ID', 'code-help', 'topic_only', 'Only coding questions and technical discussions allowed', 'system')
ON CONFLICT DO NOTHING;

-- Insert sample achievements
INSERT INTO user_achievements (user_id, achievement_type, achievement_name, description, points_awarded, badge_emoji) VALUES
('system', 'template', 'First Steps', 'Complete your first onboarding step', 10, '👶'),
('system', 'template', 'Helper', 'Help 5 community members', 50, '🤝'),
('system', 'template', 'Streak Master', 'Maintain a 7-day activity streak', 100, '🔥'),
('system', 'template', 'Code Warrior', 'Complete 10 coding challenges', 200, '⚔️'),
('system', 'template', 'Mentor', 'Successfully mentor 3 learners', 300, '🎓')
ON CONFLICT DO NOTHING;
