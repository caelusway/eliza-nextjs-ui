import { NextRequest, NextResponse } from 'next/server';
import { redeemInviteCode, generateInitialInviteCodes } from '@/services/invite-service';
import { ensureSupabaseUser } from '@/services/user-service';

export async function POST(request: NextRequest) {
  try {
    console.log('Redeem API called');
    const body = await request.json();
    console.log('Raw request body:', body);
    const { code, userId, email } = body;
    console.log('Redeem request data:', { code, userId, email });

    if (!code || !userId) {
      console.log('Missing code or userId');
      return NextResponse.json(
        { error: 'Code and userId are required', received: { code: !!code, userId: !!userId } },
        { status: 400 }
      );
    }

    // Step 1: Ensure user exists in Supabase database FIRST
    console.log('Ensuring user exists in Supabase...');
    let username;
    try {
      username = await ensureSupabaseUser(userId, email);
      console.log('User creation result:', username);
    } catch (userError) {
      console.error('Error in ensureSupabaseUser:', userError);
      const errorDetails =
        userError instanceof Error
          ? { message: userError.message, stack: userError.stack }
          : { raw: JSON.stringify(userError) };

      return NextResponse.json(
        { error: 'Failed to create user record', details: errorDetails },
        { status: 500 }
      );
    }

    if (!username) {
      console.log('User creation failed - no username returned');
      return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 });
    }

    // Step 1.5: Check if user has already completed invite flow
    console.log('Checking if user has already completed invite flow...');
    const { supabase } = await import('@/lib/supabase/client');
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('used_invite_code, invited_by')
      .eq('user_id', userId)
      .single();

    if (userCheckError) {
      console.error('Error checking existing user:', userCheckError);
    } else if (existingUser?.used_invite_code) {
      console.log('User has already completed invite flow, skipping redemption:', {
        usedCode: existingUser.used_invite_code,
        invitedBy: existingUser.invited_by,
      });
      // User has already gone through invite flow - just return success
      return NextResponse.json({
        success: true,
        message: 'Welcome back! Redirecting to your account.',
        alreadyCompleted: true,
      });
    }

    // Step 2: Now redeem the invite code (user definitely exists)
    console.log('Calling redeemInviteCode...');
    let success;
    try {
      success = await redeemInviteCode(code, userId);
      console.log('Redeem result:', success);
    } catch (redeemError) {
      console.error('Error in redeemInviteCode:', redeemError);
      return NextResponse.json(
        { error: 'Failed to redeem invite code', details: redeemError?.toString() },
        { status: 500 }
      );
    }

    if (!success) {
      console.log('Redeem failed - returned false');
      return NextResponse.json(
        { error: 'Failed to redeem invite code - code may be invalid, expired, or already used' },
        { status: 400 }
      );
    }

    // Step 3: Generate initial invite codes for the new user (if they don't have any)
    console.log('Generating initial invite codes...');
    try {
      await generateInitialInviteCodes(userId);
    } catch (genError) {
      console.error('Error generating initial invite codes:', genError);
      // Don't fail the whole request if this fails
    }

    // Add cache-busting headers to ensure fresh data after redemption
    const response = NextResponse.json({
      success: true,
      message: 'Invite code redeemed successfully! Welcome to AUBRAI.',
      newUser: true,
    });
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Error redeeming invite code:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error?.constructor?.name,
      },
      { status: 500 }
    );
  }
}
