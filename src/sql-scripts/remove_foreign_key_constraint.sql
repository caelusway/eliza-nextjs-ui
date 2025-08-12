-- Remove foreign key constraint from shared_chat_sessions to fix sharing error
-- This allows sharing to work without requiring users to exist in a users table

-- Drop the foreign key constraint that's causing the error
ALTER TABLE shared_chat_sessions DROP CONSTRAINT IF EXISTS shared_chat_sessions_owner_id_fkey;

-- The owner_id column will still store the UUID, but won't enforce referential integrity
-- This matches the pattern used by response_votes when no users table exists