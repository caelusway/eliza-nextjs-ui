import { supabase } from '@/lib/supabase/client';
import {
  VoteValue,
  CastVoteResponse,
  VoteStats,
  GetUserVoteResponse,
  RemoveVoteResponse,
} from '@/lib/supabase/types';

/**
 * Cast or update a vote for a response
 */
export async function castVote(
  voterId: string,
  responseId: string,
  value: VoteValue,
  comment?: string
): Promise<CastVoteResponse> {
  try {
    const { data, error } = await supabase.rpc('cast_vote', {
      _voter_id: voterId,
      _response_id: responseId,
      _value: value,
      _comment: comment ?? null,
    });

    if (error) {
      console.error('[VoteService] Cast vote error:', error);
      throw error;
    }

    return data as unknown as CastVoteResponse;
  } catch (err) {
    console.error('[VoteService] Cast vote failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get vote statistics for a response
 */
export async function getVoteStats(responseId: string): Promise<VoteStats | null> {
  try {
    const { data, error } = await supabase.rpc('get_vote_stats', {
      _response_id: responseId,
    });

    if (error) {
      console.error('[VoteService] Get vote stats error:', error);
      throw error;
    }

    return data as unknown as VoteStats;
  } catch (err) {
    console.error('[VoteService] Get vote stats failed:', err);
    return null;
  }
}

/**
 * Get a specific user's vote for a response
 */
export async function getUserVote(
  voterId: string,
  responseId: string
): Promise<GetUserVoteResponse | null> {
  try {
    const { data, error } = await supabase.rpc('get_user_vote', {
      _voter_id: voterId,
      _response_id: responseId,
    });

    if (error) {
      console.error('[VoteService] Get user vote error:', error);
      throw error;
    }

    return data as unknown as GetUserVoteResponse;
  } catch (err) {
    console.error('[VoteService] Get user vote failed:', err);
    return null;
  }
}

/**
 * Remove a user's vote for a response
 */
export async function removeVote(voterId: string, responseId: string): Promise<RemoveVoteResponse> {
  try {
    const { data, error } = await supabase.rpc('remove_vote', {
      _voter_id: voterId,
      _response_id: responseId,
    });

    if (error) {
      console.error('[VoteService] Remove vote error:', error);
      throw error;
    }

    return data as unknown as RemoveVoteResponse;
  } catch (err) {
    console.error('[VoteService] Remove vote failed:', err);
    return {
      success: false,
      deleted: false,
      stats: { upvotes: 0, downvotes: 0, total: 0 },
    };
  }
}

/**
 * Toggle vote - if same vote exists, remove it; otherwise cast new vote
 */
export async function toggleVote(
  voterId: string,
  responseId: string,
  value: VoteValue,
  comment?: string
): Promise<CastVoteResponse> {
  try {
    // First check if user has existing vote
    const existingVote = await getUserVote(voterId, responseId);

    if (existingVote?.exists && existingVote.vote?.value === value) {
      // Same vote exists, remove it
      const removeResult = await removeVote(voterId, responseId);
      return {
        success: removeResult.success,
        stats: removeResult.stats,
      };
    } else {
      // Cast new vote (will update if different vote exists)
      return await castVote(voterId, responseId, value, comment);
    }
  } catch (err) {
    console.error('[VoteService] Toggle vote failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * Batch get vote stats for multiple responses
 */
export async function getBatchVoteStats(responseIds: string[]): Promise<Map<string, VoteStats>> {
  const results = new Map<string, VoteStats>();

  // Execute requests in parallel
  const promises = responseIds.map(async (responseId) => {
    const stats = await getVoteStats(responseId);
    if (stats) {
      results.set(responseId, stats);
    }
  });

  await Promise.all(promises);
  return results;
}

/**
 * Batch get user votes for multiple responses
 */
export async function getBatchUserVotes(
  voterId: string,
  responseIds: string[]
): Promise<Map<string, GetUserVoteResponse>> {
  const results = new Map<string, GetUserVoteResponse>();

  // Execute requests in parallel
  const promises = responseIds.map(async (responseId) => {
    const userVote = await getUserVote(voterId, responseId);
    if (userVote) {
      results.set(responseId, userVote);
    }
  });

  await Promise.all(promises);
  return results;
}
