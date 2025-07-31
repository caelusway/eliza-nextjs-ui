-- Check if the foreign key constraint still exists and remove it completely
-- Run this to verify and remove the constraint that's causing the error

-- First, let's check what constraints exist on the table
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    confrelid::regclass as referenced_table
FROM pg_constraint 
WHERE conrelid = 'shared_chat_sessions'::regclass
  AND contype = 'f'; -- foreign key constraints only

-- Drop ALL foreign key constraints on the owner_id column
ALTER TABLE shared_chat_sessions DROP CONSTRAINT IF EXISTS shared_chat_sessions_owner_id_fkey;
ALTER TABLE shared_chat_sessions DROP CONSTRAINT IF EXISTS shared_chat_sessions_owner_id_fkey1;
ALTER TABLE shared_chat_sessions DROP CONSTRAINT IF EXISTS shared_chat_sessions_owner_id_fkey2;

-- Also try dropping with the full table name prefix in case it was created differently
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find and drop any foreign key constraints on owner_id
    FOR constraint_name IN 
        SELECT conname
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attnum = ANY(c.conkey)
        WHERE c.conrelid = 'shared_chat_sessions'::regclass
          AND a.attname = 'owner_id'
          AND c.contype = 'f'
    LOOP
        EXECUTE 'ALTER TABLE shared_chat_sessions DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Verify the constraint is gone by checking again
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    confrelid::regclass as referenced_table
FROM pg_constraint 
WHERE conrelid = 'shared_chat_sessions'::regclass
  AND contype = 'f';