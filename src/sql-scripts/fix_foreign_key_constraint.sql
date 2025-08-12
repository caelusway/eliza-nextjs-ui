-- Fix foreign key constraint issue for shared_chat_sessions
-- This removes the hard foreign key constraint and makes it conditional like the voting system

-- Drop the existing foreign key constraint
ALTER TABLE shared_chat_sessions DROP CONSTRAINT IF EXISTS shared_chat_sessions_owner_id_fkey;

-- Add conditional foreign key constraint (only if users table exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'shared_chat_sessions_owner_id_fkey'
        AND table_name = 'shared_chat_sessions'
    ) THEN
        ALTER TABLE shared_chat_sessions 
        ADD CONSTRAINT shared_chat_sessions_owner_id_fkey 
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;