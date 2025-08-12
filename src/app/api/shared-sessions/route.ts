import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { customAlphabet } from 'nanoid';
import { withAuth } from '@/lib/auth-middleware';

async function createSharedSessionHandler(request: NextRequest, user: any) {
  try {
    const body = await request.json();
    const { sessionId, title, description, expiresAt, userId } = body;

    if (!sessionId || !title || !userId) {
      return NextResponse.json(
        { error: 'Session ID, title, and user ID are required' },
        { status: 400 }
      );
    }

    // User validation - only allow creating sessions for own user ID
    if (userId !== user.userId) {
      return NextResponse.json(
        { error: 'Unauthorized to create session for another user' },
        { status: 403 }
      );
    }

    // Check if session is already shared
    const { data: existing } = await supabase
      .from('shared_chat_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('owner_id', userId)
      .eq('is_active', true)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Session is already shared' }, { status: 409 });
    }

    // Generate unique public ID (alphanumeric only, 8 characters)
    const nanoid = customAlphabet(
      '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
      8
    );
    const publicId = nanoid();

    // Create shared session
    const { data, error } = await supabase
      .from('shared_chat_sessions')
      .insert({
        session_id: sessionId,
        owner_id: userId,
        public_id: publicId,
        title,
        description: description || null,
        expires_at: expiresAt || null,
        is_active: true,
        view_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating shared session:', error);
      return NextResponse.json({ error: 'Failed to create shared session' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        publicUrl: `${process.env.NEXT_PUBLIC_APP_URL}/chats/${publicId}`,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/shared-sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getSharedSessionsHandler(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // User validation - only allow fetching own sessions
    if (userId !== user.userId) {
      return NextResponse.json(
        { error: "Unauthorized to access another user's sessions" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from('shared_chat_sessions')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shared sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch shared sessions' }, { status: 500 });
    }

    const sessionsWithUrls = data.map((session) => ({
      ...session,
      publicUrl: `${process.env.NEXT_PUBLIC_APP_URL}/chats/${session.public_id}`,
    }));

    return NextResponse.json({
      success: true,
      data: sessionsWithUrls,
    });
  } catch (error) {
    console.error('Error in GET /api/shared-sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withAuth(createSharedSessionHandler);
export const GET = withAuth(getSharedSessionsHandler);
