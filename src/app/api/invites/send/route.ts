import { NextRequest, NextResponse } from 'next/server';
import { sendInviteEmail } from '@/services/invite-service';
import {
  withAuth,
  checkRateLimit,
  sanitizeInput,
  validateOrigin,
  getSecurityHeaders,
} from '@/lib/auth-middleware';

async function sendInviteHandler(request: NextRequest, user: any) {
  try {
    // CSRF Protection
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
    }

    // Rate limiting - 5 email invites per 24 hours per user to prevent spam
    const rateLimitResult = checkRateLimit(`send-invite:${user.userId}`, 5, 24 * 60 * 60 * 1000);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many invite emails sent. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': rateLimitResult.remainingRequests.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString(),
          },
        }
      );
    }

    const body = await request.json();
    const { code, email, senderName } = body;

    if (!code || !email) {
      return NextResponse.json({ error: 'Code and email are required' }, { status: 400 });
    }

    // Input validation and sanitization
    const sanitizedCode = sanitizeInput(code);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedSenderName = senderName ? sanitizeInput(senderName) : null;

    // Validate invite code format
    if (!/^[A-Z0-9]{6,12}$/i.test(sanitizedCode)) {
      return NextResponse.json({ error: 'Invalid invite code format' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate sender name if provided
    if (
      sanitizedSenderName &&
      (sanitizedSenderName.length < 1 || sanitizedSenderName.length > 50)
    ) {
      return NextResponse.json(
        { error: 'Sender name must be between 1 and 50 characters' },
        { status: 400 }
      );
    }

    // Verify the invite code belongs to the authenticated user
    const { supabase } = await import('@/lib/supabase/client');

    // Get user's internal Supabase ID first
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('user_id', user.userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Simplified approach to avoid TypeScript type depth issues
    let inviteCode: any = null;
    let codeError: any = null;

    try {
      const result = await supabase
        .from('invites')
        .select('created_by, status, current_uses, max_uses')
        .eq('code', sanitizedCode)
        .eq('created_by', userData.id)
        .single();

      inviteCode = result.data;
      codeError = result.error;
    } catch (error) {
      codeError = error;
    }

    if (codeError || !inviteCode) {
      return NextResponse.json(
        { error: 'Invite code not found or access denied' },
        { status: 404 }
      );
    }

    if (inviteCode.status !== 'pending' || inviteCode.current_uses >= inviteCode.max_uses) {
      return NextResponse.json(
        { error: 'Invite code is inactive or has no remaining uses' },
        { status: 400 }
      );
    }

    console.log('Sending invite email:', {
      code: sanitizedCode,
      email: sanitizedEmail,
      senderName: sanitizedSenderName,
    });

    const result = await sendInviteEmail({
      code: sanitizedCode,
      email: sanitizedEmail,
      senderName: sanitizedSenderName || 'Someone',
    });

    if (result.success) {
      // Apply security headers to response
      const response = NextResponse.json({
        success: true,
        message: 'Invite sent successfully',
        remainingUses: inviteCode.uses_remaining - 1,
      });

      // Add security headers
      const securityHeaders = getSecurityHeaders();
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } else {
      return NextResponse.json({ error: result.error || 'Failed to send invite' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error sending invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withAuth(sendInviteHandler);
