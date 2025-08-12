import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
const AGENT_ID = process.env.NEXT_PUBLIC_AGENT_ID;

interface RouteParams {
  params: Promise<{
    publicId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { publicId } = await params;

    // Get shared session
    const { data: sharedSession, error } = await supabase
      .from('shared_chat_sessions')
      .select('*')
      .eq('public_id', publicId)
      .eq('is_active', true)
      .single();

    if (error || !sharedSession) {
      return NextResponse.json(
        { error: 'Shared session not found or no longer active' },
        { status: 404 }
      );
    }

    // Check if expired
    if (sharedSession.expires_at && new Date(sharedSession.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Shared session has expired' }, { status: 410 });
    }

    if (!AGENT_ID) {
      return NextResponse.json({ error: 'Agent ID not configured' }, { status: 500 });
    }

    const sessionId = sharedSession.session_id;

    // Build headers for ElizaOS server - include auth if available but don't require it
    const elizaHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Forward auth header if available (for backend verification)
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      elizaHeaders['Authorization'] = authHeader;
    }

    // Get all channels from ElizaOS API
    const channelsResponse = await fetch(
      `${API_BASE_URL}/api/messaging/central-servers/00000000-0000-0000-0000-000000000000/channels`,
      {
        method: 'GET',
        headers: elizaHeaders,
      }
    );

    if (!channelsResponse.ok) {
      console.error('[API] Failed to fetch channels');
      return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
    }

    const channelsData = await channelsResponse.json();
    const channels = channelsData.data?.channels || channelsData.channels || [];

    // Find the channel with matching sessionId
    const sessionChannel = channels.find((channel: any) => {
      const metadata = channel.metadata || {};
      return channel.id === sessionId || metadata.sessionId === sessionId;
    });

    if (!sessionChannel) {
      return NextResponse.json({ error: 'Session channel not found' }, { status: 404 });
    }

    // Fetch messages for this session
    let messages: any[] = [];

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
        const rawMessages = messagesData.data?.messages || messagesData.messages || [];

        // Transform messages to match ChatMessage interface
        const transformedMessages = rawMessages.map((msg: any) => ({
          id: msg.id || msg.uuid || `${msg.createdAt}-${Math.random()}`,
          name:
            msg.senderName ||
            msg.authorName ||
            msg.name ||
            (msg.senderId === AGENT_ID ? 'Agent' : 'User'),
          text: msg.content || msg.text || msg.message || '',
          senderId: msg.senderId || msg.authorId || msg.userId || 'unknown',
          roomId: msg.roomId || msg.channelId || sessionChannel.id,
          createdAt: msg.createdAt ? new Date(msg.createdAt).getTime() : Date.now(),
          source: msg.source || 'eliza',
          isLoading: false,
          thought: msg.thought,
          actions: msg.actions,
          papers: msg.papers,
        }));

        // Deduplicate messages by ID and sort by createdAt
        const messageMap = new Map();
        transformedMessages.forEach((msg) => {
          if (!messageMap.has(msg.id) || messageMap.get(msg.id).createdAt < msg.createdAt) {
            messageMap.set(msg.id, msg);
          }
        });

        messages = Array.from(messageMap.values()).sort((a, b) => a.createdAt - b.createdAt);
      }
    } catch (error) {
      console.error(`[API] Error fetching messages for session ${sessionId}:`, error);
    }

    const sessionData = {
      id: sessionId,
      channelId: sessionChannel.id,
      title: sharedSession.title,
      messageCount: messages.length,
      lastActivity: messages[messages.length - 1]?.createdAt || sessionChannel.updatedAt,
      messages: messages,
    };

    return NextResponse.json({
      success: true,
      data: sessionData,
    });
  } catch (error) {
    console.error('Error in GET /api/shared-sessions/[publicId]/messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
