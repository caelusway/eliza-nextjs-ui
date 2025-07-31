-- Update existing analytics tables with new RLS policies
-- (Tables and indexes already exist, so we only update policies)

-- RLS policies (permissive like response_votes)
ALTER TABLE shared_chat_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Session owners can read their analytics" ON shared_chat_analytics;
DROP POLICY IF EXISTS "Session owners can read their daily analytics" ON daily_analytics;
DROP POLICY IF EXISTS "Allow analytics data insertion" ON shared_chat_analytics;
DROP POLICY IF EXISTS "Allow daily analytics upsert" ON daily_analytics;

-- Permissive policies similar to response_votes
CREATE POLICY "Enable read access for all users" ON shared_chat_analytics
    FOR SELECT USING (true);

CREATE POLICY "Users can insert analytics data" ON shared_chat_analytics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update analytics data" ON shared_chat_analytics
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete analytics data" ON shared_chat_analytics
    FOR DELETE USING (true);

-- Daily analytics policies
CREATE POLICY "Enable read access for all users" ON daily_analytics
    FOR SELECT USING (true);

CREATE POLICY "Users can insert daily analytics" ON daily_analytics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update daily analytics" ON daily_analytics
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete daily analytics" ON daily_analytics
    FOR DELETE USING (true);

-- Functions already exist, skipping recreation to avoid conflicts