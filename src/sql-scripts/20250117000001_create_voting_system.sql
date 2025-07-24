-- Create response_votes table for voting on agent responses
CREATE TABLE IF NOT EXISTS response_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    voter_id UUID NOT NULL,
    response_id TEXT NOT NULL,
    value INTEGER NOT NULL CHECK (value IN (-1, 1)),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure one vote per user per response
    UNIQUE(voter_id, response_id)
);

-- Add foreign key constraint if users table exists and constraint doesn't already exist
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'response_votes_voter_id_fkey'
        AND table_name = 'response_votes'
    ) THEN
        ALTER TABLE response_votes 
        ADD CONSTRAINT response_votes_voter_id_fkey 
        FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_response_votes_response_id ON response_votes(response_id);
CREATE INDEX IF NOT EXISTS idx_response_votes_voter_id ON response_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_response_votes_updated_at ON response_votes(updated_at DESC);

-- Enable RLS
ALTER TABLE response_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON response_votes;
DROP POLICY IF EXISTS "Users can insert their own votes" ON response_votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON response_votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON response_votes;

-- RLS Policies - aligned with existing patterns
CREATE POLICY "Enable read access for all users" ON response_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own votes" ON response_votes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own votes" ON response_votes
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own votes" ON response_votes
    FOR DELETE USING (true);

-- Drop any existing conflicting functions first
DROP FUNCTION IF EXISTS cast_vote(UUID, TEXT, INTEGER, TEXT);
DROP FUNCTION IF EXISTS cast_vote(UUID, UUID, SMALLINT, TEXT);
DROP FUNCTION IF EXISTS cast_vote(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS cast_vote(UUID, UUID, SMALLINT);

-- RPC Function: cast_vote - handles voting with upsert logic
CREATE OR REPLACE FUNCTION cast_vote(
    _voter_id UUID,
    _response_id TEXT,
    _value INTEGER,
    _comment TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    result_vote response_votes%ROWTYPE;
    vote_stats JSON;
BEGIN
    -- Validate inputs
    IF _voter_id IS NULL OR _response_id IS NULL OR _value IS NULL THEN
        RAISE EXCEPTION 'Missing required parameters';
    END IF;
    
    IF _value NOT IN (-1, 1) THEN
        RAISE EXCEPTION 'Vote value must be -1 or 1';
    END IF;

    -- Upsert the vote
    INSERT INTO response_votes (voter_id, response_id, value, comment, updated_at)
    VALUES (_voter_id, _response_id, _value, _comment, timezone('utc'::text, now()))
    ON CONFLICT (voter_id, response_id) 
    DO UPDATE SET 
        value = EXCLUDED.value,
        comment = EXCLUDED.comment,
        updated_at = EXCLUDED.updated_at
    RETURNING * INTO result_vote;

    -- Get updated vote statistics
    SELECT json_build_object(
        'upvotes', COALESCE(SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END), 0),
        'downvotes', COALESCE(SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END), 0),
        'total', COALESCE(COUNT(*), 0)
    ) INTO vote_stats
    FROM response_votes 
    WHERE response_id = _response_id;

    -- Return success with vote data and stats
    RETURN json_build_object(
        'success', true,
        'vote', json_build_object(
            'id', result_vote.id,
            'voter_id', result_vote.voter_id,
            'response_id', result_vote.response_id,
            'value', result_vote.value,
            'comment', result_vote.comment,
            'created_at', result_vote.created_at,
            'updated_at', result_vote.updated_at
        ),
        'stats', vote_stats
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- Drop any existing conflicting functions first
DROP FUNCTION IF EXISTS get_vote_stats(TEXT);
DROP FUNCTION IF EXISTS get_vote_stats(UUID);

-- RPC Function: get_vote_stats - returns vote statistics for a response
CREATE OR REPLACE FUNCTION get_vote_stats(_response_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    vote_stats JSON;
BEGIN
    SELECT json_build_object(
        'response_id', _response_id,
        'upvotes', COALESCE(SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END), 0),
        'downvotes', COALESCE(SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END), 0),
        'total', COALESCE(COUNT(*), 0),
        'last_updated', COALESCE(MAX(updated_at), null)
    ) INTO vote_stats
    FROM response_votes 
    WHERE response_id = _response_id;
    
    RETURN vote_stats;
END;
$$;

-- Drop any existing conflicting functions first
DROP FUNCTION IF EXISTS get_user_vote(UUID, TEXT);
DROP FUNCTION IF EXISTS get_user_vote(UUID, UUID);

-- RPC Function: get_user_vote - returns a specific user's vote for a response
CREATE OR REPLACE FUNCTION get_user_vote(
    _voter_id UUID,
    _response_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    user_vote response_votes%ROWTYPE;
BEGIN
    SELECT * INTO user_vote
    FROM response_votes 
    WHERE voter_id = _voter_id AND response_id = _response_id
    LIMIT 1;
    
    IF user_vote.id IS NULL THEN
        RETURN json_build_object(
            'exists', false,
            'vote', null
        );
    ELSE
        RETURN json_build_object(
            'exists', true,
            'vote', json_build_object(
                'id', user_vote.id,
                'voter_id', user_vote.voter_id,
                'response_id', user_vote.response_id,
                'value', user_vote.value,
                'comment', user_vote.comment,
                'created_at', user_vote.created_at,
                'updated_at', user_vote.updated_at
            )
        );
    END IF;
END;
$$;

-- Drop any existing conflicting functions first
DROP FUNCTION IF EXISTS remove_vote(UUID, TEXT);
DROP FUNCTION IF EXISTS remove_vote(UUID, UUID);

-- RPC Function: remove_vote - removes a user's vote for a response
CREATE OR REPLACE FUNCTION remove_vote(
    _voter_id UUID,
    _response_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
    vote_stats JSON;
BEGIN
    -- Delete the vote
    DELETE FROM response_votes 
    WHERE voter_id = _voter_id AND response_id = _response_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Get updated vote statistics
    SELECT json_build_object(
        'upvotes', COALESCE(SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END), 0),
        'downvotes', COALESCE(SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END), 0),
        'total', COALESCE(COUNT(*), 0)
    ) INTO vote_stats
    FROM response_votes 
    WHERE response_id = _response_id;

    RETURN json_build_object(
        'success', true,
        'deleted', deleted_count > 0,
        'stats', vote_stats
    );
END;
$$;

-- Create trigger to automatically update updated_at using existing function
DROP TRIGGER IF EXISTS update_response_votes_updated_at ON response_votes;
CREATE TRIGGER update_response_votes_updated_at
    BEFORE UPDATE ON response_votes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 