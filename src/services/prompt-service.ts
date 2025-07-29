import { supabase } from '@/lib/supabase/client';

export interface LogPromptResponse {
  success: boolean;
  promptId?: string;
  error?: string;
}

export interface UserPrompt {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

interface LogPromptRpcResponse {
  success: boolean;
  prompt?: {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
  };
  error?: string;
}

/**
 * Log a user prompt to the database
 */
export async function logUserPrompt(
  userId: string,
  content: string
): Promise<LogPromptResponse> {
  try {
    // Validate inputs
    if (!userId || !content || typeof content !== 'string' || content.trim() === '') {
      return {
        success: false,
        error: 'Missing required fields: userId and content',
      };
    }

    // Log the user ID being used for debugging
    console.log('[PromptService] Attempting to log prompt for user ID:', userId);
    console.log('[PromptService] User ID type:', typeof userId);
    console.log('[PromptService] User ID length:', userId.length);
    console.log('[PromptService] Content preview:', content.substring(0, 50) + '...');

    const { data, error } = await supabase.rpc('log_user_prompt', {
      _user_id: userId,
      _content: content.trim(),
    });

    if (error) {
      console.error('[PromptService] Log prompt error:', error);
      throw error;
    }

    const rpcResponse = data as unknown as LogPromptRpcResponse;

    // Check if the RPC function returned success
    if (!rpcResponse?.success) {
      console.error('[PromptService] RPC function returned error:', rpcResponse?.error);
      return {
        success: false,
        error: rpcResponse?.error || 'Failed to log user prompt',
      };
    }

    console.log('[PromptService] User prompt logged successfully:', rpcResponse.prompt?.id);

    return {
      success: true,
      promptId: rpcResponse.prompt?.id,
    };
  } catch (err) {
    console.error('[PromptService] Log prompt failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * Batch log multiple user prompts
 */
export async function logMultiplePrompts(
  userId: string,
  prompts: string[]
): Promise<LogPromptResponse[]> {
  // Execute requests in parallel
  const promises = prompts.map(async (content) => {
    return await logUserPrompt(userId, content);
  });

  return await Promise.all(promises);
}
