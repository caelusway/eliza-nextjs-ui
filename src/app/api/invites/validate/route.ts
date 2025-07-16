import { NextRequest, NextResponse } from 'next/server';
import { validateInviteCode } from '@/services/invite-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      );
    }

    console.log('Validating invite code:', code);
    const result = await validateInviteCode(code);
    
    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: result.error },
        { status: 400 }
      );
    }

    // Add cache-busting headers to ensure fresh validation
    const response = NextResponse.json({
      valid: true,
      invite: {
        id: result.invite!.id,
        code: result.invite!.code,
        is_legacy: result.invite!.is_legacy,
        expires_at: result.invite!.expires_at,
      }
    });
    
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error in invite validation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 