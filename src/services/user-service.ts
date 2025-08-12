import { supabase } from '@/lib/supabase/client';
import { generateDeterministicUUID } from '@/utils/deterministic-uuid';

const adjectives = [
  'Quantum',
  'Galactic',
  'Cosmic',
  'Lunar',
  'Solar',
  'Nebula',
  'Stellar',
  'Atomic',
  'Digital',
  'Nano',
  'Fuzzy',
  'Electric',
  'Silent',
  'Swift',
  'Crimson',
  'Emerald',
  'Golden',
  'Hidden',
  'Lucky',
  'Mighty',
];

const nouns = [
  'Mouse',
  'Phoenix',
  'Tiger',
  'Falcon',
  'Otter',
  'Panda',
  'Dragon',
  'Hawk',
  'Wolf',
  'Lion',
  'Rhino',
  'Leopard',
  'Eagle',
  'Shark',
  'Dolphin',
  'Whale',
  'Koala',
  'Badger',
  'Bison',
  'Raven',
];

function generateRandomUsername() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}${noun}`;
}

export async function ensureSupabaseUser(privyUserId: string, email?: string | null) {
  console.log('[ensureSupabaseUser] Called with:', { privyUserId, email });

  if (!privyUserId) {
    console.log('[ensureSupabaseUser] No privyUserId provided, returning');
    return;
  }

  try {
    // 1. Check if user row exists
    console.log('[ensureSupabaseUser] Checking if user exists with user_id:', privyUserId);

    const { data: existing, error } = await supabase
      .from('users')
      .select('id, username, email')
      .eq('user_id', privyUserId)
      .maybeSingle();

    console.log('[ensureSupabaseUser] Query result:', { existing, error });

    if (error) {
      console.error('[ensureSupabaseUser] Error querying user:', error);

      // Check if it's a network/connection error
      if (
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('NetworkError') ||
        error.message?.includes('ECONNREFUSED') ||
        error.code === 'PGRST301'
      ) {
        // Supabase connection error
        throw new Error('API_UNAVAILABLE: Database service is not responding');
      }

      return;
    }

    if (existing) {
      console.log('[ensureSupabaseUser] User already exists:', existing);

      // Check if we need to update the email
      if (email && !existing.email) {
        console.log('[ensureSupabaseUser] Updating missing email for existing user');
        await supabase.from('users').update({ email }).eq('id', existing.id);
      }

      // Already has username
      if (existing.username) {
        console.log('[ensureSupabaseUser] User has username, returning:', existing.username);
        return existing.username;
      }
    }

    // 2. Need to create username (or fill missing)
    let username = generateRandomUsername();
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    while (attempts < MAX_ATTEMPTS) {
      // Ensure uniqueness
      const { data: dup } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (!dup) break; // Unique found
      username = generateRandomUsername();
      attempts++;
    }

    // Insert or update
    if (existing) {
      console.log('[ensureSupabaseUser] Updating existing user with username:', username);
      const updateResult = await supabase.from('users').update({ username }).eq('id', existing.id);
      console.log('[ensureSupabaseUser] Update result:', updateResult);
    } else {
      // Create new user with deterministic UUID for id, Privy ID for user_id
      const deterministicId = generateDeterministicUUID(privyUserId);
      console.log(
        '[ensureSupabaseUser] Creating new user with UUID:',
        deterministicId,
        'for Privy ID:',
        privyUserId
      );

      // Log if email is missing for debugging
      if (!email) {
        console.warn('[ensureSupabaseUser] Creating user without email:', privyUserId);
      }

      const insertData = {
        id: deterministicId, // UUID primary key
        user_id: privyUserId, // Privy ID - this is what we make unique
        username,
        email: email ?? null,
        invite_codes_remaining: 3,
        has_completed_invite_flow: false,
      };

      console.log('[ensureSupabaseUser] Insert data:', insertData);

      const insertResult = await supabase.from('users').insert(insertData);

      console.log('[ensureSupabaseUser] Insert result:', insertResult);

      if (insertResult.error) {
        console.error('[ensureSupabaseUser] Insert error:', insertResult.error);
        console.error('[ensureSupabaseUser] Error details:', {
          message: insertResult.error.message,
          code: insertResult.error.code,
          details: insertResult.error.details,
          hint: insertResult.error.hint,
        });
        throw new Error(
          `Database insert failed: ${insertResult.error.message} (code: ${insertResult.error.code})`
        );
      }

      // Note: Invite codes are generated during invite redemption process
      // This prevents duplicate generation
    }

    console.log('[ensureSupabaseUser] Successfully processed user, returning username:', username);
    return username;
  } catch (error) {
    console.error('[ensureSupabaseUser] Critical error:', error);
    throw error;
  }
}

export async function fetchUserStatsByPrivyId(privyUserId: string) {
  console.log('[fetchUserStatsByPrivyId] Called with:', privyUserId);

  if (!privyUserId) {
    console.log('[fetchUserStatsByPrivyId] No privyUserId provided');
    return null;
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(
        'id, username, email, points, created_at, invite_codes_remaining, has_completed_invite_flow'
      )
      .eq('user_id', privyUserId)
      .maybeSingle();

    if (error) {
      console.error('[fetchUserStatsByPrivyId] Error fetching user stats:', error);
      return null;
    }

    if (!user) {
      console.log('[fetchUserStatsByPrivyId] User not found');
      return null;
    }

    console.log('[fetchUserStatsByPrivyId] User stats found:', user);
    return user;
  } catch (error) {
    console.error('[fetchUserStatsByPrivyId] Critical error:', error);
    return null;
  }
}

export async function updateUserPoints(privyUserId: string, points: number) {
  console.log('[updateUserPoints] Called with:', { privyUserId, points });

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ points })
      .eq('user_id', privyUserId)
      .select();

    if (error) {
      console.error('[updateUserPoints] Error updating user points:', error);
      throw error;
    }

    console.log('[updateUserPoints] User points updated successfully:', data);
    return data;
  } catch (error) {
    console.error('[updateUserPoints] Failed to update user points:', error);
    throw error;
  }
}

export async function updateUserEmail(privyUserId: string, email: string) {
  console.log('[updateUserEmail] Called with:', { privyUserId, email });

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ email })
      .eq('user_id', privyUserId)
      .select();

    if (error) {
      console.error('[updateUserEmail] Error updating user email:', error);
      throw error;
    }

    console.log('[updateUserEmail] User email updated successfully:', data);
    return data;
  } catch (error) {
    console.error('[updateUserEmail] Failed to update user email:', error);
    throw error;
  }
}

export async function getUserRowIdByPrivyId(privyUserId: string): Promise<string | null> {
  console.log('[getUserRowIdByPrivyId] Called with privyUserId:', privyUserId);

  try {
    const query = supabase.from('users').select('id').eq('user_id', privyUserId);

    console.log('[getUserRowIdByPrivyId] Executing query for user_id:', privyUserId);

    const { data, error } = await query.maybeSingle();

    console.log('[getUserRowIdByPrivyId] Query result:', { data, error });

    if (error) {
      console.error('[getUserRowIdByPrivyId] Error querying user:', error);
      console.error('[getUserRowIdByPrivyId] Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });

      // Check if it's a network/connection error
      if (
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('NetworkError') ||
        error.message?.includes('ECONNREFUSED') ||
        error.code === 'PGRST301'
      ) {
        // Supabase connection error
        throw new Error('API_UNAVAILABLE: Database service is not responding');
      }

      return null;
    }

    const rowId = data?.id ?? null;
    console.log('[getUserRowIdByPrivyId] Returning rowId:', rowId);
    return rowId;
  } catch (error) {
    // Re-throw API_UNAVAILABLE errors to trigger error boundary
    if (error instanceof Error && error.message.includes('API_UNAVAILABLE')) {
      throw error;
    }

    console.error('[getUserRowIdByPrivyId] Unexpected error:', error);
    throw error;
  }
}
