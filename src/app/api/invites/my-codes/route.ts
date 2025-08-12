import { NextRequest, NextResponse } from 'next/server';
import { getUserInviteStats } from '@/services/invite-service';
import { withAuth } from '@/lib/auth-middleware';

async function myCodesHandler(request: NextRequest, user: any) {
  try {
    // Get user ID from request body instead of headers
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // User validation - only allow access to own invite codes
    if (userId !== user.userId) {
      return NextResponse.json({ error: 'Unauthorized access to invite codes' }, { status: 403 });
    }

    console.log('Fetching invite stats for user:', userId);
    const stats = await getUserInviteStats(userId);
    console.log('Invite stats result:', stats);

    // Add cache-busting headers to ensure fresh data
    const response = NextResponse.json(stats);
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Error fetching user invite codes:', error);
    return NextResponse.json({ error: 'Failed to fetch invite codes' }, { status: 500 });
  }
}

export const POST = withAuth(myCodesHandler);
