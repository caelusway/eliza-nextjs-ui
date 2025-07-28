# Voting System Setup

This directory contains the SQL migration scripts for the thumbs up/down voting system on Aubrai responses.

## 📁 Files

- **`20250117000001_create_voting_system.sql`** - Main migration script that creates all necessary database components

## 🚀 Quick Setup

1. **Run the migration in your Supabase SQL Editor:**

   ```sql
   -- Copy and paste the contents of 20250117000001_create_voting_system.sql
   -- into your Supabase SQL Editor and execute
   ```

2. **Verify the setup:**

   ```sql
   -- Check if table was created
   SELECT * FROM response_votes LIMIT 5;

   -- Test the voting function
   SELECT cast_vote(
     'your-user-id'::uuid,
     'test-response-id',
     1,
     'This is helpful!'
   );
   ```

## 📊 Database Schema

### Tables

#### `response_votes`

Stores all user votes for responses.

| Column        | Type        | Description                                     |
| ------------- | ----------- | ----------------------------------------------- |
| `id`          | UUID        | Primary key                                     |
| `voter_id`    | UUID        | References `users.id`                           |
| `response_id` | TEXT        | ID of the response being voted on               |
| `value`       | INTEGER     | Vote value: `1` (thumbs up), `-1` (thumbs down) |
| `comment`     | TEXT        | Optional feedback text (nullable)               |
| `created_at`  | TIMESTAMPTZ | When vote was created                           |
| `updated_at`  | TIMESTAMPTZ | When vote was last updated                      |

**Constraints:**

- `UNIQUE(voter_id, response_id)` - One vote per user per response
- `CHECK (value IN (-1, 1))` - Only allow valid vote values

### RPC Functions

#### `cast_vote(voter_id, response_id, value, comment?)`

**Purpose:** Creates or updates a user's vote for a response.

**Parameters:**

- `_voter_id` (UUID) - User ID from the `users` table
- `_response_id` (TEXT) - Response identifier
- `_value` (INTEGER) - Vote value: `1` or `-1`
- `_comment` (TEXT, optional) - Feedback text

**Returns:** JSON with vote data and updated statistics

```json
{
  "success": true,
  "vote": { ... },
  "stats": {
    "upvotes": 5,
    "downvotes": 2,
    "total": 7
  }
}
```

#### `get_vote_stats(response_id)`

**Purpose:** Get aggregated vote statistics for a response.

**Returns:**

```json
{
  "response_id": "abc123",
  "upvotes": 15,
  "downvotes": 3,
  "total": 18,
  "last_updated": "2024-01-15T10:30:00Z"
}
```

#### `get_user_vote(voter_id, response_id)`

**Purpose:** Check if a user has voted on a specific response.

**Returns:**

```json
{
  "exists": true,
  "vote": {
    "id": "...",
    "voter_id": "...",
    "response_id": "...",
    "value": 1,
    "comment": "Very helpful!",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

#### `remove_vote(voter_id, response_id)`

**Purpose:** Remove a user's vote for a response.

**Returns:**

```json
{
  "success": true,
  "deleted": true,
  "stats": {
    "upvotes": 4,
    "downvotes": 2,
    "total": 6
  }
}
```

## 🔐 Security (RLS Policies)

Row Level Security is enabled with these policies:

- **SELECT**: Anyone can view votes (for statistics)
- **INSERT**: Users can only insert their own votes
- **UPDATE**: Users can only update their own votes
- **DELETE**: Users can only delete their own votes

## 🎛️ Usage in Code

### Frontend (React)

```typescript
import { castVote, getVoteStats, getUserVote } from '@/services/vote-service';

// Cast a vote
const result = await castVote(userId, responseId, 1, 'Great answer!');

// Get vote statistics
const stats = await getVoteStats(responseId);

// Check user's existing vote
const userVote = await getUserVote(userId, responseId);
```

### Service Layer

The voting system includes these utility functions:

- `toggleVote()` - Smart toggle (removes if same vote, updates if different)
- `getBatchVoteStats()` - Get stats for multiple responses
- `getBatchUserVotes()` - Get user votes for multiple responses

## 📈 Performance

The system includes optimized indexes:

- `idx_response_votes_response_id` - Fast response lookups
- `idx_response_votes_voter_id` - Fast user lookups
- `idx_response_votes_created_at` - Chronological ordering

## 🧪 Testing

Test the system with these SQL commands:

```sql
-- Test vote creation
SELECT cast_vote(
  (SELECT id FROM users LIMIT 1),
  'test-response-123',
  1,
  'This helps a lot!'
);

-- Test vote statistics
SELECT get_vote_stats('test-response-123');

-- Test user vote lookup
SELECT get_user_vote(
  (SELECT id FROM users LIMIT 1),
  'test-response-123'
);

-- Test vote removal
SELECT remove_vote(
  (SELECT id FROM users LIMIT 1),
  'test-response-123'
);
```

## 🐛 Troubleshooting

### Common Issues

1. **"User not found" error**

   - Ensure the `voter_id` exists in the `users` table
   - Check that your user authentication is working properly

2. **"Permission denied" error**

   - Verify RLS policies are set up correctly
   - Ensure the user is authenticated with Supabase

3. **"Function does not exist" error**
   - Re-run the migration script
   - Check that the functions were created successfully:
     ```sql
     SELECT routine_name
     FROM information_schema.routines
     WHERE routine_name LIKE '%vote%';
     ```

### Debugging

Enable debug logging in the vote service:

```typescript
// In vote-service.ts, all functions include console.error logging
// Check browser console for detailed error messages
```

## 🔄 Migration Notes

- **Safe to re-run**: Uses `CREATE OR REPLACE` and `IF NOT EXISTS`
- **Backwards compatible**: Existing data is preserved
- **Indexes**: Created with `IF NOT EXISTS` for safety
- **Permissions**: Automatically grants to `authenticated` role

---

🎉 **You're all set!** The voting system should now be fully functional in your application.
