import { NextRequest, NextResponse } from 'next/server';
import { sendInviteEmail } from '@/services/invite-service';

export async function POST(request: NextRequest) {
  try {
    const { code, email, senderName } = await request.json();

    if (!code || !email) {
      return NextResponse.json({ error: 'Code and email are required' }, { status: 400 });
    }

    console.log('Sending invite email:', { code, email, senderName });

    const result = await sendInviteEmail({
      code,
      email,
      senderName: senderName || 'Someone',
    });

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Invite sent successfully' });
    } else {
      return NextResponse.json({ error: result.error || 'Failed to send invite' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error sending invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
