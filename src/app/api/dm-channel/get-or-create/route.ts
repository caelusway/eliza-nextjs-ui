import { NextRequest, NextResponse } from 'next/server';
import {
  withAuth,
  validateUserOwnership,
  sanitizeInput,
  checkRateLimit,
  getSecurityHeaders,
  validateOrigin,
  type AuthenticatedUser,
} from '@/lib/auth-middleware';

const ELIZA_SERVER_URL =
  process.env.ELIZA_SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';

interface GetOrCreateDMChannelRequest {
  userId: string;
  agentId: string;
  sessionId?: string; // Optional session ID for deterministic channel creation
  initialMessage?: string; // Optional initial message for new sessions
}

interface DMChannelMetadata {
  isDm: true;
  user1: string;
  user2: string;
  forAgent: string;
  createdAt: string;
  sessionId?: string;
  initialMessage?: string;
}

// Simple title generation from the old UI
function generateTitle(content: string): string {
  if (!content) return `Chat - ${new Date().toLocaleString()}`;

  const cleaned = content.replace(/\s+/g, ' ').trim();
  return cleaned.length > 50 ? cleaned.substring(0, 47) + '...' : cleaned;
}

async function createDMChannelHandler(request: NextRequest, user: AuthenticatedUser) {
  try {
    // Validate CSRF protection
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { error: 'Invalid origin', code: 'INVALID_ORIGIN' },
        { status: 403, headers: getSecurityHeaders() }
      );
    }

    // Check rate limiting
    const rateLimitResult = checkRateLimit(user.userId, 20, 60 * 1000); // 20 requests per minute
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          resetTime: rateLimitResult.resetTime,
        },
        {
          status: 429,
          headers: {
            ...getSecurityHeaders(),
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': rateLimitResult.remainingRequests.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    const body: GetOrCreateDMChannelRequest = await request.json();
    const { userId, agentId, sessionId, initialMessage } = body;

    if (!userId || !agentId) {
      return NextResponse.json(
        { error: 'userId and agentId are required', code: 'MISSING_PARAMS' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Validate user ownership - user can only create channels for themselves
    if (!validateUserOwnership(userId, user.userId)) {
      return NextResponse.json(
        {
          error: 'Unauthorized - cannot create channel for different user',
          code: 'UNAUTHORIZED_USER',
        },
        { status: 403, headers: getSecurityHeaders() }
      );
    }

    // Sanitize inputs
    const sanitizedMessage = initialMessage ? sanitizeInput(initialMessage) : undefined;

    // Build headers for ElizaOS server including Privy JWT
    const elizaHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-User-ID': user.userId,
      'X-User-Email': user.email,
    };

    // Forward the original Authorization header (Privy JWT) to ElizaOS
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      elizaHeaders['Authorization'] = authHeader;
    }

    // First, try to find an existing DM channel for this session if sessionId is provided
    if (sessionId) {
      try {
        const channelsResponse = await fetch(`${ELIZA_SERVER_URL}/api/messaging/central-channels`, {
          method: 'GET',
          headers: elizaHeaders,
        });

        if (channelsResponse.ok) {
          const allChannels = await channelsResponse.json();

          // Look for existing channel with this EXACT session ID only
          const existingChannel = allChannels.find((channel: any) => {
            const metadata = channel.metadata || {};
            return channel.id === sessionId || metadata.sessionId === sessionId;
          });

          if (existingChannel) {
            console.log('[DM Channel API] Found existing channel for session:', sessionId);
            return NextResponse.json({
              success: true,
              channel: existingChannel,
              isNew: false,
            });
          }
        }
      } catch (error) {
        console.warn('[DM Channel API] Error checking for existing channels:', error);
        // Continue to create new channel
      }
    }

    // Create new DM channel
    const finalChannelId = sessionId || `dm-${userId}-${agentId}-${Date.now()}`;
    const channelName = generateTitle(initialMessage || '');

    // Create DM channel metadata following official client pattern
    const metadata: DMChannelMetadata = {
      isDm: true,
      user1: userId,
      user2: agentId,
      forAgent: agentId,
      createdAt: new Date().toISOString(),
    };

    if (sessionId) {
      metadata.sessionId = sessionId;
    }

    if (sanitizedMessage) {
      metadata.initialMessage = sanitizedMessage;
    }

    // Try to create the DM channel via ElizaOS API, with fallback for production
    let channelData;
    try {
      console.log(`[DM Channel API] Attempting to create channel via ElizaOS: ${ELIZA_SERVER_URL}`);
      const createChannelResponse = await fetch(
        `${ELIZA_SERVER_URL}/api/messaging/central-channels`,
        {
          method: 'POST',
          headers: elizaHeaders,
          body: JSON.stringify({
            id: finalChannelId,
            name: channelName,
            server_id: '00000000-0000-0000-0000-000000000000', // Required server ID
            participantCentralUserIds: [userId, agentId],
            type: 'DM', // Channel type
            metadata: metadata,
          }),
        }
      );

      if (!createChannelResponse.ok) {
        const errorText = await createChannelResponse.text();
        console.error(
          '[DM Channel API] ❌ ElizaOS channel creation failed:',
          createChannelResponse.status,
          errorText
        );
        console.error('[DM Channel API] Request headers:', elizaHeaders);
        console.error(
          '[DM Channel API] Request body:',
          JSON.stringify(
            {
              id: finalChannelId,
              name: channelName,
              server_id: '00000000-0000-0000-0000-000000000000',
              participantCentralUserIds: [userId, agentId],
              type: 'DM',
              metadata: metadata,
            },
            null,
            2
          )
        );
        throw new Error(`ElizaOS API failed: ${createChannelResponse.status} - ${errorText}`);
      }

      channelData = await createChannelResponse.json();
      console.log('[DM Channel API] ✅ Channel created via ElizaOS successfully:', channelData);

      // Use the actual channel ID returned from ElizaOS (it might be different from finalChannelId)
      const actualChannelId = channelData.id || channelData.data?.id || finalChannelId;
      console.log(`[DM Channel API] Using channel ID for agent addition: ${actualChannelId}`);

      // Add a brief delay to ensure the channel is fully created before adding the agent
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error('[DM Channel API] ❌ ElizaOS channel creation completely failed:', error);

      // Instead of using fallback, return an error to the user
      // This prevents creating "phantom" channels that don't exist on ElizaOS
      return NextResponse.json(
        {
          error: 'Failed to create channel on ElizaOS server',
          code: 'ELIZA_CHANNEL_CREATION_FAILED',
          details: error instanceof Error ? error.message : 'Unknown error',
          suggestion: 'Please check if ElizaOS server is accessible and properly configured',
        },
        { status: 503, headers: getSecurityHeaders() }
      );
    }

    // Add agent to the channel as a participant
    try {
      const actualChannelId = channelData.id || channelData.data?.id || finalChannelId;
      console.log(`[DM Channel API] Adding agent ${agentId} to channel ${actualChannelId}`);
      const addAgentResponse = await fetch(
        `${ELIZA_SERVER_URL}/api/messaging/central-channels/${actualChannelId}/agents`,
        {
          method: 'POST',
          headers: elizaHeaders,
          body: JSON.stringify({
            agentId: agentId,
          }),
        }
      );

      if (!addAgentResponse.ok) {
        const errorText = await addAgentResponse.text();
        console.error(
          '[DM Channel API] ❌ Failed to add agent to channel:',
          addAgentResponse.status,
          errorText
        );
        // This is critical - if agent can't join, channel is useless
        return NextResponse.json(
          {
            error: 'Failed to add agent to channel',
            code: 'AGENT_ADD_FAILED',
            details: `${addAgentResponse.status} - ${errorText}`,
            suggestion: 'Channel created but agent could not join. Please try again.',
          },
          { status: 503, headers: getSecurityHeaders() }
        );
      } else {
        console.log('[DM Channel API] ✅ Agent successfully added to channel');
      }
    } catch (error) {
      console.error('[DM Channel API] ❌ Error adding agent to channel:', error);
      return NextResponse.json(
        {
          error: 'Failed to add agent to channel',
          code: 'AGENT_ADD_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error',
          suggestion: 'Channel created but agent could not join. Please try again.',
        },
        { status: 503, headers: getSecurityHeaders() }
      );
    }

    // Give the agent a moment to register the new channel and for ElizaOS to propagate
    await new Promise((resolve) => setTimeout(resolve, 500));

    const actualChannelId = channelData.id || channelData.data?.id || finalChannelId;
    return NextResponse.json(
      {
        success: true,
        channel: {
          id: actualChannelId,
          name: channelName,
          type: 'DM',
          metadata: metadata,
          participants: [userId, agentId],
          ...channelData,
        },
        isNew: true,
      },
      { headers: getSecurityHeaders() }
    );
  } catch (error) {
    console.error('[DM Channel API] Error in get-or-create DM channel:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

// Apply authentication middleware
export const POST = withAuth(createDMChannelHandler);
