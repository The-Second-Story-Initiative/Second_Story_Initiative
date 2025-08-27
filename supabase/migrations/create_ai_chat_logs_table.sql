-- Create AI Chat Logs table for storing chat interactions
CREATE TABLE ai_chat_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'general',
  code_snippet TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  rated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_ai_chat_logs_user_id ON ai_chat_logs(user_id);
CREATE INDEX idx_ai_chat_logs_created_at ON ai_chat_logs(created_at);
CREATE INDEX idx_ai_chat_logs_rating ON ai_chat_logs(rating);

-- Enable Row Level Security
ALTER TABLE ai_chat_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own chat logs" ON ai_chat_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat logs" ON ai_chat_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat logs" ON ai_chat_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat logs" ON ai_chat_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT ALL PRIVILEGES ON ai_chat_logs TO authenticated;
GRANT SELECT ON ai_chat_logs TO anon;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_chat_logs_updated_at
    BEFORE UPDATE ON ai_chat_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();