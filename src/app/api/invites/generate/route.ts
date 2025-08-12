import { NextRequest, NextResponse } from 'next/server';
import { generateInitialInviteCodes } from '@/services/invite-service';
import { withAuth } from '@/lib/auth-middleware';

async function generateHandler(request: NextRequest, user: any) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // User validation - only allow generating codes for self
    if (userId !== user.userId) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    console.log('Generating invite codes for user:', userId);
    await generateInitialInviteCodes(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error generating invite codes:', error);
    return NextResponse.json({ error: 'Failed to generate invite codes' }, { status: 500 });
  }
}

export const POST = withAuth(generateHandler);
