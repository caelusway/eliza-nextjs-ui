import { NextRequest, NextResponse } from 'next/server';
import { withAuth, getSecurityHeaders, type AuthenticatedUser } from '@/lib/auth-middleware';

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
const AGENT_ID = process.env.NEXT_PUBLIC_AGENT_ID;

interface RouteParams {
  params: Promise<{
    sessionId: string;
  }>;
}

async function getChatSessionHandler(
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: RouteParams
) {
  try {
    const { sessionId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Validate user can only access their own sessions
    if (userId !== user.userId) {
      return NextResponse.json(
        { error: 'Unauthorized - cannot access session for different user' },
        { status: 403, headers: getSecurityHeaders() }
      );
    }

    if (!AGENT_ID) {
      return NextResponse.json({ error: 'Agent ID not configured' }, { status: 500 });
    }

    console.log(`[API] Fetching session: ${sessionId} for user: ${userId}`);

    // Get all channels from the correct ElizaOS API endpoint
    const channelsResponse = await fetch(
      `${API_BASE_URL}/api/messaging/central-servers/00000000-0000-0000-0000-000000000000/channels`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!channelsResponse.ok) {
      const errorText = await channelsResponse.text();
      console.error(`[API] Failed to fetch channels:`, errorText);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const channelsData = await channelsResponse.json();
    const channels = channelsData.data?.channels || channelsData.channels || [];

    // Find the channel with matching sessionId AND verify user ownership
    const sessionChannel = channels.find((channel: any) => {
      const metadata = channel.metadata || {};

      // Check if this is the correct session
      const isCorrectSession = channel.id === sessionId || metadata.sessionId === sessionId;

      if (!isCorrectSession) {
        return false;
      }

      console.log('Debugging...', metadata.channelType, metadata.user1, metadata.user2);

      // Verify that the user is authorized to access this session
      // For DM channels, check if the user is one of the participants
      const isUserParticipant = metadata.user1 === userId || metadata.user2 === userId;

      if (!isUserParticipant) {
        console.warn(
          `[API] Unauthorized access attempt: User ${userId} tried to access session ${sessionId}`
        );
        return false;
      }

      return true;
    });

    if (!sessionChannel) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    // Fetch messages for this session using the correct API endpoint
    let messages: any[] = [];
    let messageCount = 0;

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

    try {
      const messagesResponse = await fetch(
        `${API_BASE_URL}/api/messaging/central-channels/${sessionChannel.id}/messages?limit=100`,
        {
          method: 'GET',
          headers: elizaHeaders,
        }
      );

      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        messages = messagesData.data?.messages || messagesData.messages || [];
        messageCount = messages.length;
      }
    } catch (error) {
      console.error(`[API] Error fetching messages for session ${sessionId}:`, error);
    }

    // Find the first user message to use as session title
    const firstUserMessage = messages
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .find((msg: any) => msg.authorId === userId || msg.rawMessage?.senderId === userId);

    const lastMessage = messages[messages.length - 1];

    const sessionData = {
      id: sessionId,
      channelId: sessionChannel.id,
      title: sessionChannel.name || 'New Chat', // Use the channel name (timestamp-based)
      messageCount,
      lastActivity: lastMessage?.createdAt || sessionChannel.updatedAt || sessionChannel.createdAt,
      preview: lastMessage?.content?.substring(0, 100) || '',
      isFromAgent: lastMessage?.authorId === AGENT_ID,
      createdAt: sessionChannel.createdAt,
      userId,
      agentId: AGENT_ID,
      metadata: sessionChannel.metadata,
    };

    return NextResponse.json(
      {
        success: true,
        data: sessionData,
      },
      { headers: getSecurityHeaders() }
    );
  } catch (error) {
    console.error(`[API] Error fetching session:`, error);
    return NextResponse.json(
      {
        error: 'Failed to fetch session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

export const GET = withAuth(getChatSessionHandler);
