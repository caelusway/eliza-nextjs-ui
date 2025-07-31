-- Update RLS policies for analytics tables
-- Run this script to fix the RLS policy violation errors

-- Enable RLS (safe to run multiple times)
ALTER TABLE shared_chat_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies for shared_chat_analytics
DROP POLICY IF EXISTS "Session owners can read their analytics" ON shared_chat_analytics;
DROP POLICY IF EXISTS "Allow analytics data insertion" ON shared_chat_analytics;

-- Drop existing restrictive policies for daily_analytics  
DROP POLICY IF EXISTS "Session owners can read their daily analytics" ON daily_analytics;
DROP POLICY IF EXISTS "Allow daily analytics upsert" ON daily_analytics;

-- Create permissive policies for shared_chat_analytics
CREATE POLICY "Enable read access for all users" ON shared_chat_analytics
    FOR SELECT USING (true);

CREATE POLICY "Users can insert analytics data" ON shared_chat_analytics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update analytics data" ON shared_chat_analytics
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete analytics data" ON shared_chat_analytics
    FOR DELETE USING (true);

-- Create permissive policies for daily_analytics
CREATE POLICY "Enable read access for all users" ON daily_analytics
    FOR SELECT USING (true);

CREATE POLICY "Users can insert daily analytics" ON daily_analytics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update daily analytics" ON daily_analytics
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete daily analytics" ON daily_analytics
    FOR DELETE USING (true);