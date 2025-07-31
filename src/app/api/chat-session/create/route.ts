import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { PostHogTracking } from '@/lib/posthog';
import {
  withAuth,
  validateUserOwnership,
  sanitizeInput,
  checkRateLimit,
  getSecurityHeaders,
  validateOrigin,
  type AuthenticatedUser,
} from '@/lib/auth-middleware';

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
const AGENT_ID = process.env.NEXT_PUBLIC_AGENT_ID;

async function createChatSessionHandler(request: NextRequest, user: AuthenticatedUser) {
  try {
    // Validate CSRF protection
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { error: 'Invalid origin', code: 'INVALID_ORIGIN' },
        { status: 403, headers: getSecurityHeaders() }
      );
    }

    // Check rate limiting
    const rateLimitResult = checkRateLimit(user.userId, 100, 60 * 1000); // 10 requests per minute
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
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimitResult.remainingRequests.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    const { userId, initialMessage } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Validate user ownership - user can only create sessions for themselves
    if (!validateUserOwnership(userId, user.userId)) {
      return NextResponse.json(
        {
          error: 'Unauthorized - cannot create session for different user',
          code: 'UNAUTHORIZED_USER',
        },
        { status: 403, headers: getSecurityHeaders() }
      );
    }

    if (!AGENT_ID) {
      return NextResponse.json(
        { error: 'Agent ID not configured', code: 'MISSING_CONFIG' },
        { status: 500, headers: getSecurityHeaders() }
      );
    }

    // Sanitize inputs
    const sanitizedMessage = initialMessage ? sanitizeInput(initialMessage) : undefined;

    // Log environment configuration for debugging
    console.log(
      `[API] Environment check - API_BASE_URL: ${API_BASE_URL}, AGENT_ID: ${AGENT_ID?.substring(0, 8)}...`
    );

    // Generate a new session ID
    const sessionId = uuidv4();

    console.log(`[API] Creating new chat session: ${sessionId} for user: ${userId}`);

    try {
      // Create DM channel for this session using get-or-create with sessionId
      // Use relative URL for internal API calls in Vercel
      const dmChannelUrl = `/api/dm-channel/get-or-create`;
      console.log(`[API] Calling DM channel API internally: ${dmChannelUrl}`);

      // For Vercel, use the request host for internal calls
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const fullUrl = `${protocol}://${host}${dmChannelUrl}`;

      console.log(`[API] Full DM channel URL: ${fullUrl}`);
      const dmChannelResponse = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: request.headers.get('Authorization') || '', // Pass through the user's auth token
        },
        body: JSON.stringify({
          userId: userId,
          agentId: AGENT_ID,
          sessionId: sessionId, // This ensures it only finds channels with this exact sessionId
          initialMessage: sanitizedMessage, // Pass the sanitized initial message to be stored in metadata
        }),
      });

      if (!dmChannelResponse.ok) {
        const errorText = await dmChannelResponse.text();
        console.error(`[API] Failed to create DM channel:`, errorText);
        throw new Error(`Failed to create DM channel: ${errorText}`);
      }

      const dmChannelData = await dmChannelResponse.json();
      const channelId = dmChannelData.channel?.id;

      if (!channelId) {
        throw new Error('No channel ID returned from DM channel creation');
      }

      console.log(`[API] Created DM channel: ${channelId} for session: ${sessionId}`);

      return NextResponse.json(
        {
          success: true,
          data: {
            sessionId,
            channelId,
            userId,
            agentId: AGENT_ID,
            initialMessage: sanitizedMessage,
            createdAt: new Date().toISOString(),
          },
        },
        {
          headers: getSecurityHeaders(),
        }
      );
    } catch (error) {
      console.error('[API] Error creating DM channel:', error);
      throw error;
    }
  } catch (error) {
    console.error('[API] Error creating chat session:', error);

    // Track API error
    PostHogTracking.getInstance().apiError(
      '/api/chat-session/create',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );

    return NextResponse.json(
      {
        error: 'Failed to create chat session',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 500,
        headers: getSecurityHeaders(),
      }
    );
  }
}

// Apply authentication middleware
export const POST = withAuth(createChatSessionHandler);
