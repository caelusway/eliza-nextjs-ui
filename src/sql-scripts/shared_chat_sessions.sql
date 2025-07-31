-- Update existing shared_chat_sessions table with new RLS policies
-- (Table and indexes already exist, so we only update policies)

-- RLS policies (permissive like response_votes)
ALTER TABLE shared_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow server operations" ON shared_chat_sessions;
DROP POLICY IF EXISTS "Users can manage their own shared sessions" ON shared_chat_sessions;
DROP POLICY IF EXISTS "Anyone can read active public sessions" ON shared_chat_sessions;

-- Permissive policies similar to response_votes
CREATE POLICY "Enable read access for all users" ON shared_chat_sessions
    FOR SELECT USING (true);

CREATE POLICY "Users can insert shared sessions" ON shared_chat_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update shared sessions" ON shared_chat_sessions
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete shared sessions" ON shared_chat_sessions
    FOR DELETE USING (true);