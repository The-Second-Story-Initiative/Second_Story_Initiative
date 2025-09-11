-- Enhanced Production Database Schema for Second Story Slack Bot
-- Comprehensive moderation, engagement, and content curation system

-- Core learner profiles table (enhanced)
CREATE TABLE IF NOT EXISTS learner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  slack_username TEXT,
  email TEXT,
  full_name TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  skill_level TEXT DEFAULT 'beginner',
  interests TEXT[],
  goals TEXT[],
  preferred_learning_style TEXT,
  github_username TEXT,
  linkedin_url TEXT,
  is_mentor BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_admin BOOLEAN DEFAULT false,
  is_moderator BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_messages INTEGER DEFAULT 0,
  helpful_reactions INTEGER DEFAULT 0,
  warnings_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced moderation system tables
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL CHECK (action_type IN ('warning', 'mute', 'ban', 'delete_message', 'flag', 'timeout')),
  user_id TEXT NOT NULL,
  moderator_id TEXT,
  channel_id TEXT,
  message_ts TEXT,
  reason TEXT NOT NULL,
  duration_minutes INTEGER,
  severity INTEGER DEFAULT 1 CHECK (severity >= 1 AND severity <= 5),
  is_automated BOOLEAN DEFAULT false,
  resolved BOOLEAN DEFAULT false,
  resolved_by TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS banned_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT UNIQUE NOT NULL,
  category TEXT DEFAULT 'inappropriate' CHECK (category IN ('spam', 'offensive', 'harassment', 'misinformation', 'inappropriate')),
  severity INTEGER DEFAULT 1 CHECK (severity >= 1 AND severity <= 5),
  action TEXT DEFAULT 'flag' CHECK (action IN ('flag', 'delete', 'warn', 'mute', 'ban')),
  created_by TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS channel_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT UNIQUE NOT NULL,
  channel_name TEXT,
  auto_moderate BOOLEAN DEFAULT true,
  allowed_topics TEXT[],
  banned_topics TEXT[],
  post_approval_required BOOLEAN DEFAULT false,
  max_messages_per_hour INTEGER DEFAULT 20,
  link_posting_allowed BOOLEAN DEFAULT true,
  file_sharing_allowed BOOLEAN DEFAULT true,
  moderation_level TEXT DEFAULT 'standard' CHECK (moderation_level IN ('lenient', 'standard', 'strict')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id TEXT NOT NULL,
  reported_user_id TEXT,
  channel_id TEXT,
  message_ts TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('spam', 'harassment', 'inappropriate', 'misinformation', 'violation', 'other')),
  description TEXT,
  screenshot_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed', 'escalated')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced engagement tracking tables
CREATE TABLE IF NOT EXISTS engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  messages_sent INTEGER DEFAULT 0,
  reactions_given INTEGER DEFAULT 0,
  reactions_received INTEGER DEFAULT 0,
  threads_started INTEGER DEFAULT 0,
  threads_participated INTEGER DEFAULT 0,
  commands_used INTEGER DEFAULT 0,
  helpful_responses INTEGER DEFAULT 0,
  time_active_minutes INTEGER DEFAULT 0,
  engagement_score DECIMAL DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  achievements_earned TEXT[],
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS community_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_type TEXT NOT NULL CHECK (prompt_type IN ('icebreaker', 'discussion', 'poll', 'challenge', 'motivational', 'educational')),
  content TEXT NOT NULL,
  channel_id TEXT,
  target_audience TEXT[] DEFAULT '{}',
  frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'one-time')),
  last_posted TIMESTAMP WITH TIME ZONE,
  next_scheduled TIMESTAMP WITH TIME ZONE,
  responses_count INTEGER DEFAULT 0,
  engagement_score DECIMAL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content curation tables
CREATE TABLE IF NOT EXISTS curated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'video', 'tutorial', 'job', 'event', 'tool', 'course', 'podcast')),
  title TEXT NOT NULL,
  url TEXT,
  description TEXT,
  tags TEXT[],
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  estimated_time_minutes INTEGER,
  source TEXT,
  author TEXT,
  published_date DATE,
  relevance_score DECIMAL DEFAULT 0,
  engagement_count INTEGER DEFAULT 0,
  shared_count INTEGER DEFAULT 0,
  last_shared TIMESTAMP WITH TIME ZONE,
  is_approved BOOLEAN DEFAULT true,
  approved_by TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES curated_content(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_posted BOOLEAN DEFAULT false,
  posted_at TIMESTAMP WITH TIME ZONE,
  posted_by TEXT,
  engagement_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progress tracking tables
CREATE TABLE IF NOT EXISTS learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  skill_category TEXT NOT NULL,
  current_level INTEGER DEFAULT 1 CHECK (current_level >= 1 AND current_level <= 100),
  experience_points INTEGER DEFAULT 0,
  completed_challenges INTEGER DEFAULT 0,
  completed_projects INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  achievements TEXT[],
  milestones JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, skill_category)
);

CREATE TABLE IF NOT EXISTS daily_standups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  yesterday_progress TEXT,
  today_plan TEXT,
  tomorrow_goals TEXT,
  blockers TEXT,
  wins TEXT,
  mood_emoji TEXT,
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  is_present BOOLEAN DEFAULT true,
  late_submission BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  category TEXT NOT NULL,
  skills_required TEXT[],
  estimated_time_hours INTEGER,
  solution_hints TEXT[],
  test_cases JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  solution_code TEXT,
  solution_url TEXT,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'needs_review', 'approved')),
  completion_time_hours DECIMAL,
  feedback TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mentorship system tables
CREATE TABLE IF NOT EXISTS mentor_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentee_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  description TEXT,
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
  preferred_mentor_id TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'matched', 'in_session', 'completed', 'cancelled')),
  matched_mentor_id TEXT,
  session_notes TEXT,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mentor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id TEXT NOT NULL,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System monitoring tables
CREATE TABLE IF NOT EXISTS system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down', 'maintenance')),
  response_time_ms INTEGER,
  error_rate DECIMAL,
  cpu_usage DECIMAL,
  memory_usage DECIMAL,
  last_error TEXT,
  error_count INTEGER DEFAULT 0,
  uptime_hours DECIMAL,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bot_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('command', 'mention', 'dm', 'reaction', 'button_click', 'modal_submit')),
  command TEXT,
  channel_id TEXT,
  input_text TEXT,
  response_text TEXT,
  response_time_ms INTEGER,
  was_helpful BOOLEAN,
  error_occurred BOOLEAN DEFAULT false,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  channel_id TEXT,
  thread_ts TEXT,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  model_used TEXT DEFAULT 'claude-3-5-sonnet',
  tokens_used INTEGER,
  response_time_ms INTEGER,
  context_length INTEGER,
  sentiment TEXT,
  topics TEXT[],
  was_helpful BOOLEAN,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics tables
CREATE TABLE IF NOT EXISTS daily_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  commands_used INTEGER DEFAULT 0,
  ai_interactions INTEGER DEFAULT 0,
  moderation_actions INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,
  mentor_sessions INTEGER DEFAULT 0,
  engagement_score DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_learner_profiles_user_id ON learner_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_learner_profiles_active ON learner_profiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_moderation_actions_user_id ON moderation_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_created_at ON moderation_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_automated ON moderation_actions(is_automated);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_user_date ON engagement_metrics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_date ON engagement_metrics(date);
CREATE INDEX IF NOT EXISTS idx_curated_content_type ON curated_content(content_type);
CREATE INDEX IF NOT EXISTS idx_curated_content_approved ON curated_content(is_approved) WHERE is_approved = true;
CREATE INDEX IF NOT EXISTS idx_learning_progress_user ON learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_standups_date ON daily_standups(date);
CREATE INDEX IF NOT EXISTS idx_daily_standups_user ON daily_standups(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_interactions_user ON bot_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_interactions_created ON bot_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_user ON ai_chat_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_created ON ai_chat_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_mentor_requests_status ON mentor_requests(status);
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_user ON challenge_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_system_health_service ON system_health(service_name);

-- Create views for analytics and reporting
CREATE OR REPLACE VIEW user_engagement_summary AS
SELECT 
  lp.user_id,
  lp.slack_username,
  lp.skill_level,
  lp.is_mentor,
  lp.warnings_count,
  COUNT(DISTINCT ds.date) as standup_count,
  SUM(em.messages_sent) as total_messages,
  SUM(em.reactions_given + em.reactions_received) as total_reactions,
  AVG(em.engagement_score) as avg_engagement_score,
  MAX(em.date) as last_active_date,
  COUNT(DISTINCT cs.id) as challenges_completed,
  COUNT(DISTINCT bi.id) as bot_interactions
FROM learner_profiles lp
LEFT JOIN daily_standups ds ON lp.user_id = ds.user_id
LEFT JOIN engagement_metrics em ON lp.user_id = em.user_id
LEFT JOIN challenge_submissions cs ON lp.user_id = cs.user_id AND cs.status = 'completed'
LEFT JOIN bot_interactions bi ON lp.user_id = bi.user_id
WHERE lp.is_active = true
GROUP BY lp.user_id, lp.slack_username, lp.skill_level, lp.is_mentor, lp.warnings_count;

CREATE OR REPLACE VIEW moderation_summary AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_actions,
  COUNT(CASE WHEN action_type = 'warning' THEN 1 END) as warnings,
  COUNT(CASE WHEN action_type = 'delete_message' THEN 1 END) as deleted_messages,
  COUNT(CASE WHEN action_type = 'mute' THEN 1 END) as mutes,
  COUNT(CASE WHEN action_type = 'ban' THEN 1 END) as bans,
  COUNT(CASE WHEN is_automated THEN 1 END) as automated_actions,
  COUNT(CASE WHEN NOT is_automated THEN 1 END) as manual_actions,
  AVG(severity) as avg_severity
FROM moderation_actions
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

CREATE OR REPLACE VIEW weekly_community_health AS
SELECT 
  DATE_TRUNC('week', da.date) as week_start,
  AVG(da.active_users) as avg_daily_active_users,
  SUM(da.new_users) as new_users_this_week,
  SUM(da.total_messages) as total_messages,
  SUM(da.ai_interactions) as ai_interactions,
  SUM(da.moderation_actions) as moderation_actions,
  AVG(da.engagement_score) as avg_engagement_score
FROM daily_analytics da
GROUP BY DATE_TRUNC('week', da.date)
ORDER BY week_start DESC;

-- Set up Row Level Security (RLS)
ALTER TABLE learner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_interactions ENABLE ROW LEVEL SECURITY;

-- Create service role bypass policies
CREATE POLICY "Service role bypass learner_profiles" ON learner_profiles
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass moderation_actions" ON moderation_actions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass engagement_metrics" ON engagement_metrics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass user_reports" ON user_reports
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass ai_chat_logs" ON ai_chat_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass bot_interactions" ON bot_interactions
  FOR ALL USING (auth.role() = 'service_role');

-- Insert default banned words
INSERT INTO banned_words (word, category, severity, action, created_by) VALUES
('spam', 'spam', 2, 'warn', 'system'),
('scam', 'spam', 3, 'delete', 'system'),
('phishing', 'spam', 4, 'ban', 'system'),
('harassment', 'harassment', 4, 'mute', 'system'),
('bullying', 'harassment', 3, 'warn', 'system'),
('inappropriate', 'inappropriate', 2, 'flag', 'system'),
('offensive', 'offensive', 3, 'warn', 'system')
ON CONFLICT (word) DO NOTHING;

-- Insert default community prompts
INSERT INTO community_prompts (prompt_type, content, frequency, created_by) VALUES
('icebreaker', 'What''s one thing you learned this week that surprised you?', 'weekly', 'system'),
('discussion', 'Share your current coding project and what challenges you''re facing.', 'weekly', 'system'),
('motivational', 'Remember: Every expert was once a beginner. What''s your next small step forward?', 'daily', 'system'),
('poll', 'What''s your preferred learning style? React with 📚 for reading, 🎥 for videos, 🤝 for hands-on practice!', 'monthly', 'system'),
('challenge', 'Weekend challenge: Build something small but meaningful in your language of choice!', 'weekly', 'system')
ON CONFLICT DO NOTHING;

-- Insert default challenges
INSERT INTO challenges (title, description, difficulty_level, category, skills_required, estimated_time_hours) VALUES
('Hello World Plus', 'Create a "Hello World" program that also tells you the current time and date.', 'beginner', 'fundamentals', ARRAY['basic programming'], 1),
('Simple Calculator', 'Build a calculator that can perform basic arithmetic operations (+, -, *, /).', 'beginner', 'fundamentals', ARRAY['basic programming', 'functions'], 2),
('To-Do List', 'Create a simple to-do list application with add, remove, and mark complete functionality.', 'intermediate', 'web development', ARRAY['HTML', 'CSS', 'JavaScript'], 4),
('Weather API Client', 'Build an application that fetches and displays weather data from a public API.', 'intermediate', 'api integration', ARRAY['HTTP requests', 'JSON parsing'], 3),
('Personal Portfolio Site', 'Create a responsive portfolio website showcasing your projects and skills.', 'intermediate', 'web development', ARRAY['HTML', 'CSS', 'responsive design'], 8)
ON CONFLICT DO NOTHING;

-- Create functions for common operations
CREATE OR REPLACE FUNCTION update_engagement_score(user_id_param TEXT, score_increment DECIMAL DEFAULT 1.0)
RETURNS void AS $$
BEGIN
  INSERT INTO engagement_metrics (user_id, date, engagement_score)
  VALUES (user_id_param, CURRENT_DATE, score_increment)
  ON CONFLICT (user_id, date)
  DO UPDATE SET 
    engagement_score = engagement_metrics.engagement_score + score_increment,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_streak(user_id_param TEXT)
RETURNS INTEGER AS $$
DECLARE
  current_streak INTEGER := 0;
  check_date DATE := CURRENT_DATE;
BEGIN
  LOOP
    IF EXISTS (
      SELECT 1 FROM daily_standups 
      WHERE user_id = user_id_param AND date = check_date
    ) THEN
      current_streak := current_streak + 1;
      check_date := check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  RETURN current_streak;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic updates
CREATE OR REPLACE FUNCTION update_last_active_trigger()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE learner_profiles 
  SET last_active = NOW(), updated_at = NOW()
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_last_active_on_engagement
  AFTER INSERT ON engagement_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active_trigger();

CREATE TRIGGER update_last_active_on_interaction
  AFTER INSERT ON bot_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active_trigger();

-- Insert initial admin user (replace with actual admin user ID)
-- INSERT INTO learner_profiles (user_id, slack_username, is_admin, is_moderator, is_active)
-- VALUES ('ADMIN_USER_ID', 'admin', true, true, true)
-- ON CONFLICT (user_id) DO UPDATE SET is_admin = true, is_moderator = true;

COMMENT ON TABLE learner_profiles IS 'Core user profiles with role permissions and basic info';
COMMENT ON TABLE moderation_actions IS 'Log of all moderation actions taken by system or moderators';
COMMENT ON TABLE engagement_metrics IS 'Daily engagement tracking for each user';
COMMENT ON TABLE curated_content IS 'Educational content curated for the community';
COMMENT ON TABLE ai_chat_logs IS 'Logs of all AI assistant interactions for analysis';
COMMENT ON TABLE system_health IS 'System monitoring and health check data';
