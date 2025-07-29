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

    // First, try to find an existing DM channel for this session if sessionId is provided
    if (sessionId) {
      try {
        const channelsResponse = await fetch(`${ELIZA_SERVER_URL}/api/messaging/central-channels`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
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
          headers: {
            'Content-Type': 'application/json',
          },
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
        console.warn(
          '[DM Channel API] ElizaOS channel creation failed, using fallback:',
          errorText
        );
        throw new Error(`ElizaOS API failed: ${errorText}`);
      }

      channelData = await createChannelResponse.json();
      console.log('[DM Channel API] ✅ Channel created via ElizaOS successfully');
    } catch (error) {
      console.warn('[DM Channel API] ElizaOS not accessible, using local fallback:', error);
      // Fallback: create a mock channel object for the frontend to use
      channelData = {
        id: finalChannelId,
        name: channelName,
        type: 'DM',
        server_id: '00000000-0000-0000-0000-000000000000',
        participantCentralUserIds: [userId, agentId],
        metadata: metadata,
        createdAt: new Date().toISOString(),
        fallback: true, // Indicate this was created as fallback
      };
    }

    // Add agent to the channel as a participant (only if not using fallback)
    if (!channelData.fallback) {
      try {
        const addAgentResponse = await fetch(
          `${ELIZA_SERVER_URL}/api/messaging/central-channels/${finalChannelId}/agents`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              agentId: agentId,
            }),
          }
        );

        if (!addAgentResponse.ok) {
          const errorText = await addAgentResponse.text();
          console.warn('[DM Channel API] Failed to add agent to channel:', errorText);
          // Continue anyway - agent might already be a participant
        } else {
          console.log('[DM Channel API] ✅ Agent successfully added to new channel');
        }
      } catch (error) {
        console.warn('[DM Channel API] Error adding agent to channel:', error);
        // Continue anyway
      }
    } else {
      console.log('[DM Channel API] Skipping agent addition for fallback channel');
    }

    // Give the agent a brief moment to register the new channel (reduced for serverless)
    if (!channelData.fallback) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return NextResponse.json(
      {
        success: true,
        channel: {
          id: finalChannelId,
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
