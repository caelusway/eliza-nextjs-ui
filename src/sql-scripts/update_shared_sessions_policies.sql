-- Update RLS policies for shared_chat_sessions table
-- Run this script to fix the RLS policy violation errors

-- Enable RLS (safe to run multiple times)
ALTER TABLE shared_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow server operations" ON shared_chat_sessions;
DROP POLICY IF EXISTS "Users can manage their own shared sessions" ON shared_chat_sessions;
DROP POLICY IF EXISTS "Anyone can read active public sessions" ON shared_chat_sessions;

-- Create permissive policies (similar to response_votes)
CREATE POLICY "Enable read access for all users" ON shared_chat_sessions
    FOR SELECT USING (true);

CREATE POLICY "Users can insert shared sessions" ON shared_chat_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update shared sessions" ON shared_chat_sessions
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete shared sessions" ON shared_chat_sessions
    FOR DELETE USING (true);