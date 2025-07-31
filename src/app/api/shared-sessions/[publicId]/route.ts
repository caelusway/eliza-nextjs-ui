import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { withAuth } from '@/lib/auth-middleware';

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

    // Note: View count is now handled by the analytics endpoint only
    // This prevents double-counting when both endpoints are called

    return NextResponse.json({
      success: true,
      data: sharedSession,
    });
  } catch (error) {
    console.error('Error in GET /api/shared-sessions/[publicId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function patchSharedSessionHandler(request: NextRequest, user: any, { params }: RouteParams) {
  try {
    const { publicId } = await params;
    const body = await request.json();
    const { title, description, expiresAt, isActive, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // User authorization - only allow updating own sessions
    if (userId !== user.userId) {
      return NextResponse.json({ error: 'Unauthorized to update this session' }, { status: 403 });
    }

    // Update shared session
    const { data, error } = await supabase
      .from('shared_chat_sessions')
      .update({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(expiresAt !== undefined && { expires_at: expiresAt }),
        ...(isActive !== undefined && { is_active: isActive }),
      })
      .eq('public_id', publicId)
      .eq('owner_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating shared session:', error);
      return NextResponse.json({ error: 'Failed to update shared session' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Shared session not found or you do not have permission to update it' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error in PATCH /api/shared-sessions/[publicId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function deleteSharedSessionHandler(
  request: NextRequest,
  user: any,
  { params }: RouteParams
) {
  try {
    const { publicId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // User authorization - only allow deleting own sessions
    if (userId !== user.userId) {
      return NextResponse.json({ error: 'Unauthorized to delete this session' }, { status: 403 });
    }

    // Delete (deactivate) shared session
    const { data, error } = await supabase
      .from('shared_chat_sessions')
      .update({ is_active: false })
      .eq('public_id', publicId)
      .eq('owner_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error deleting shared session:', error);
      return NextResponse.json({ error: 'Failed to delete shared session' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Shared session not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Shared session deactivated successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/shared-sessions/[publicId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const PATCH = withAuth(patchSharedSessionHandler);
export const DELETE = withAuth(deleteSharedSessionHandler);
