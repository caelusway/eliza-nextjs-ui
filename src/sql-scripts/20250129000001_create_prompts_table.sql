-- Create prompts table for tracking user messages
CREATE TABLE IF NOT EXISTS prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add foreign key constraint if users table exists and constraint doesn't already exist
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'user_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'prompts_user_id_fkey'
        AND table_name = 'prompts'
    ) THEN
        ALTER TABLE prompts 
        ADD CONSTRAINT prompts_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_user_created ON prompts(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON prompts;
DROP POLICY IF EXISTS "Users can insert their own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can read their own prompts" ON prompts;

-- RLS Policies
CREATE POLICY "Enable read access for all users" ON prompts
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own prompts" ON prompts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read their own prompts" ON prompts
    FOR SELECT USING (true);

-- Drop existing function to avoid overloading conflicts
DROP FUNCTION IF EXISTS log_user_prompt(UUID, TEXT);
DROP FUNCTION IF EXISTS log_user_prompt(TEXT, TEXT);

-- RPC Function: log_user_prompt - logs a user message to the prompts table
CREATE OR REPLACE FUNCTION log_user_prompt(
    _user_id TEXT,
    _content TEXT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    result_prompt prompts%ROWTYPE;
BEGIN
    -- Validate inputs
    IF _user_id IS NULL OR _content IS NULL OR trim(_content) = '' THEN
        RAISE EXCEPTION 'Missing required parameters';
    END IF;

    -- Insert the prompt
    INSERT INTO prompts (user_id, content, created_at)
    VALUES (_user_id, trim(_content), timezone('utc'::text, now()))
    RETURNING * INTO result_prompt;

    -- Return success with prompt data
    RETURN json_build_object(
        'success', true,
        'prompt', json_build_object(
            'id', result_prompt.id,
            'user_id', result_prompt.user_id,
            'content', result_prompt.content,
            'created_at', result_prompt.created_at
        )
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

