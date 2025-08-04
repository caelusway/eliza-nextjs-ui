import { supabase } from '@/lib/supabase/client';

export interface Invite {
  id: string;
  code: string;
  created_by: string | null;
  email: string | null;
  status: 'pending' | 'email_sent' | 'accepted' | 'expired';
  used_by: string | null;
  expires_at: string;
  created_at: string;
  used_at: string | null;
  email_sent_to: string | null;
  email_sent_at: string | null;
  is_legacy: boolean;
  max_uses: number;
  current_uses: number;
}

export interface InviteValidationResult {
  valid: boolean;
  invite?: Invite;
  error?: string;
}

export interface UserInviteStats {
  invites: Invite[];
  remaining_codes: number;
  invited_users: Array<{
    username: string;
    email: string | null;
    joined_at: string;
  }>;
}

/**
 * Validate an invite code
 */
export async function validateInviteCode(code: string): Promise<InviteValidationResult> {
  try {
    console.log('🔍 [InviteService] Validating invite code:', code);

    // Use case-insensitive search and handle multiple results - force fresh data
    const { data: invites, error } = await supabase
      .from('invites')
      .select('*')
      .ilike('code', code)
      .order('created_at', { ascending: true });

    console.log('🔍 [InviteService] Supabase response:', { invites, error });

    if (error) {
      console.error('Supabase error:', error);
      return { valid: false, error: 'Invalid invite code' };
    }

    if (!invites || invites.length === 0) {
      return { valid: false, error: 'Invalid invite code' };
    }

    // Take the first valid invite if there are duplicates
    const invite = invites[0];

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return { valid: false, error: 'Invite code has expired' };
    }

    // Check if already used (unless it's legacy or has remaining uses)
    if (!invite.is_legacy && invite.current_uses >= invite.max_uses) {
      return { valid: false, error: 'Invite code has already been used' };
    }

    return { valid: true, invite };
  } catch (error) {
    console.error('Error validating invite code:', error);
    return { valid: false, error: 'Failed to validate invite code' };
  }
}

/**
 * Redeem an invite code (mark as used)
 */
export async function redeemInviteCode(code: string, userId: string): Promise<boolean> {
  try {
    console.log('🔄 [InviteService] redeemInviteCode called with:', { code, userId });

    const { data: invites, error: fetchError } = await supabase
      .from('invites')
      .select('*')
      .ilike('code', code)
      .order('created_at', { ascending: true });

    console.log('🔄 [InviteService] Invite fetch result:', { invites, fetchError });

    if (fetchError || !invites || invites.length === 0) {
      console.error('Error fetching invite for redemption:', fetchError);
      return false;
    }

    // Take the first invite if there are duplicates
    const invite = invites[0];

    // Get the user's internal UUID from the users table
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (userError || !userRecord) {
      console.error('Error finding user record:', userError);
      return false;
    }

    // Update invite usage
    const updates: any = {
      current_uses: invite.current_uses + 1,
      used_at: new Date().toISOString(),
    };

    // For non-legacy codes, mark as accepted if this is the first use
    if (!invite.is_legacy) {
      updates.status = 'accepted';
      updates.used_by = userRecord.id; // Use internal UUID, not Privy DID
    }

    const { error: updateError } = await supabase
      .from('invites')
      .update(updates)
      .eq('id', invite.id);

    if (updateError) {
      console.error('Error updating invite:', updateError);
      return false;
    }

    // Update user's invited_by field AND store the invite code used
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        invited_by: invite.created_by,
        used_invite_code: code, // Store the actual invite code used
        has_completed_invite_flow: true, // Mark as completed
      })
      .eq('id', userRecord.id); // Use internal UUID for the WHERE clause too

    if (userUpdateError) {
      console.error('Error updating user invited_by and used_invite_code:', userUpdateError);
      // Don't fail the whole operation for this
    } else {
      console.log('Successfully updated user with invite relationship:', {
        userId: userRecord.id,
        invitedBy: invite.created_by,
        usedCode: code,
      });
    }

    return true;
  } catch (error) {
    console.error('Error redeeming invite code:', error);
    return false;
  }
}

/**
 * Generate a random invite code
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Create invite codes for a user
 */
export async function createInviteCodesForUser(
  userId: string,
  count: number = 3
): Promise<Invite[]> {
  try {
    // Get user's row ID first
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, invite_codes_remaining')
      .eq('user_id', userId)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    if (user.invite_codes_remaining < count) {
      throw new Error('Insufficient invite codes remaining');
    }

    // Generate unique codes
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      let code = generateInviteCode();

      // Ensure uniqueness
      while (codes.includes(code)) {
        code = generateInviteCode();
      }

      // Check against database for uniqueness
      const { data: existing } = await supabase
        .from('invites')
        .select('id')
        .eq('code', code)
        .single();

      if (existing) {
        i--; // Retry this iteration
        continue;
      }

      codes.push(code);
    }

    // Create invites
    const inviteData = codes.map((code) => ({
      code,
      created_by: user.id,
      status: 'pending' as const,
      is_legacy: false,
      max_uses: 1,
      current_uses: 0,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    }));

    const { data: invites, error: createError } = await supabase
      .from('invites')
      .insert(inviteData)
      .select();

    if (createError) {
      throw createError;
    }

    // Update user's remaining quota
    const { error: quotaError } = await supabase
      .from('users')
      .update({ invite_codes_remaining: user.invite_codes_remaining - count })
      .eq('user_id', userId);

    if (quotaError) {
      console.error('Error updating user quota:', quotaError);
    }

    return invites as Invite[];
  } catch (error) {
    console.error('Error creating invite codes:', error);
    throw error;
  }
}

/**
 * Get user's invite codes and stats
 */
export async function getUserInviteStats(userId: string): Promise<UserInviteStats> {
  try {
    console.log('Getting invite stats for userId:', userId);

    // Get user's row ID first
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, invite_codes_remaining')
      .eq('user_id', userId)
      .single();

    console.log('User lookup result:', { user, userError });

    if (userError || !user) {
      throw new Error('User not found');
    }

    // Get user's invite codes
    const { data: invites, error: invitesError } = await supabase
      .from('invites')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    console.log('Invites lookup result:', { invites, invitesError });

    if (invitesError) {
      console.error('Error fetching invites:', invitesError);
      throw invitesError;
    }

    // Get users invited by this user
    const { data: invitedUsers, error: invitedError } = await supabase
      .from('users')
      .select('username, email, created_at')
      .eq('invited_by', user.id)
      .order('created_at', { ascending: false });

    if (invitedError) {
      console.error('Error fetching invited users:', invitedError);
    }

    // Calculate actual remaining codes based on unused invites
    const unusedInvites = (invites || []).filter(
      (invite) =>
        invite.status !== 'accepted' &&
        invite.current_uses < invite.max_uses &&
        new Date(invite.expires_at) > new Date()
    );

    return {
      invites: invites as Invite[],
      remaining_codes: unusedInvites.length,
      invited_users: (invitedUsers || []).map((u) => ({
        username: u.username,
        email: u.email,
        joined_at: u.created_at,
      })),
    };
  } catch (error) {
    console.error('Error getting user invite stats:', error);
    throw error;
  }
}

/**
 * Auto-generate initial invite codes for a new user (prevents duplicates)
 */
export async function generateInitialInviteCodes(userId: string): Promise<void> {
  try {
    console.log('generateInitialInviteCodes called with userId:', userId);

    // Get user's Supabase row ID and existing invite count
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, invite_codes_remaining')
      .eq('user_id', userId)
      .single();

    console.log('User lookup for invite generation:', { user, userError });

    if (userError || !user) {
      console.error('User not found for initial invite generation:', userError);
      throw new Error('User not found: ' + (userError?.message || 'Unknown error'));
    }

    // Check if user already has invite codes to prevent duplicates
    const { data: existingInvites, error: existingError } = await supabase
      .from('invites')
      .select('id')
      .eq('created_by', user.id);

    if (existingError) {
      console.error('Error checking existing invites:', existingError);
    }

    const existingCount = existingInvites?.length || 0;
    console.log('User already has', existingCount, 'invite codes');

    if (existingCount >= 3) {
      console.log('User already has sufficient invite codes, skipping generation');
      return; // User already has enough codes
    }

    // Generate only the needed number of invite codes
    const codesToGenerate = 3 - existingCount;
    console.log('Generating', codesToGenerate, 'new invite codes');

    const codes: string[] = [];
    for (let i = 0; i < codesToGenerate; i++) {
      let code = generateInviteCode();

      // Ensure uniqueness
      while (codes.includes(code)) {
        code = generateInviteCode();
      }

      codes.push(code);
    }

    console.log('Generated codes:', codes);

    // Create invites
    const inviteData = codes.map((code) => ({
      code,
      created_by: user.id,
      status: 'pending' as const,
      is_legacy: false,
      max_uses: 1,
      current_uses: 0,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    }));

    console.log('Invite data to insert:', inviteData);

    const { data: insertedInvites, error: createError } = await supabase
      .from('invites')
      .insert(inviteData)
      .select();

    console.log('Insert result:', { insertedInvites, createError });

    if (createError) {
      console.error('Error creating initial invite codes:', createError);
      throw createError;
    }

    console.log('Successfully created invite codes:', insertedInvites);
  } catch (error) {
    console.error('Error in generateInitialInviteCodes:', error);
    throw error;
  }
}

/**
 * Send an invite email
 */
export async function sendInviteEmail({
  code,
  email,
  senderName = 'Someone',
}: {
  code: string;
  email: string;
  senderName?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔍 [InviteService] Sending invite email:', { code, email, senderName });

    // First validate the invite code
    const validation = await validateInviteCode(code);
    if (!validation.valid || !validation.invite) {
      return { success: false, error: 'Invalid invite code' };
    }

    // Check if already used
    if (validation.invite.status === 'accepted') {
      return { success: false, error: 'Invite code already used' };
    }

    // Check if this specific invite code has already been sent via email
    if (validation.invite.email_sent_to && validation.invite.email_sent_at) {
      console.log('This invite code has already been sent via email:', validation.invite);
      return { success: false, error: 'This invite code has already been sent via email' };
    }

    // Update invite status to email_sent
    const { error: updateError } = await supabase
      .from('invites')
      .update({
        email_sent_to: email,
        email_sent_at: new Date().toISOString(),
        status: 'email_sent',
      })
      .eq('id', validation.invite.id);

    if (updateError) {
      console.error('Error updating invite status:', updateError);
      return { success: false, error: 'Failed to update invite status' };
    }

    // Send email using Resend
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY not configured');
        return { success: false, error: 'Email service not configured' };
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aubr.ai';
      const inviteUrl = `${appUrl}/login?invite=${code}`;

      console.log('📧 [InviteService] Sending email via Resend to:', email);

      const emailResult = await resend.emails.send({
        from: 'AUBRAI <noreply@aubr.ai>',
        to: [email],
        subject: `${senderName} invited you to join AUBRAI`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>You're invited to AUBRAI</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">You're invited to AUBRAI!</h1>
              </div>
              
              <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
                <p style="font-size: 18px; margin: 0 0 15px 0;"><strong>${senderName}</strong> has invited you to join AUBRAI, your AI-powered longevity co-pilot.</p>
                <p style="margin: 0; color: #666;">AUBRAI helps you optimize your health, track biomarkers, and make informed decisions about your longevity journey.</p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <div style="background: #1a1a1a; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <p style="margin: 0 0 10px 0; font-size: 14px; color: #ccc;">Your invite code:</p>
                  <p style="font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 0; color: #FF6E71;">${code}</p>
                </div>
                
                <a href="${inviteUrl}" style="display: inline-block; background: #FF6E71; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px 0;">Join AUBRAI Now</a>
              </div>

              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
                <p style="margin: 0 0 10px 0;">Can't click the button? Copy and paste this link:</p>
                <p style="word-break: break-all; margin: 0;">${inviteUrl}</p>
              </div>

              <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #999;">
                <p style="margin: 0;">This invitation expires in 30 days. If you didn't expect this invitation, you can safely ignore this email.</p>
              </div>
            </body>
          </html>
        `,
        text: `
${senderName} invited you to join AUBRAI!

${senderName} has invited you to join AUBRAI, your AI-powered longevity co-pilot.

Your invite code: ${code}

Join now: ${inviteUrl}

If you can't click the link, copy and paste it into your browser.

This invitation expires in 30 days.
        `.trim(),
      });

      console.log('📧 [InviteService] Resend response:', emailResult);

      if (emailResult.error) {
        console.error('Resend email error:', emailResult.error);
        return { success: false, error: 'Failed to send email' };
      }

      console.log('✅ [InviteService] Email sent successfully, ID:', emailResult.data?.id);
      return { success: true };

    } catch (emailError) {
      console.error('Error sending email via Resend:', emailError);
      return { success: false, error: 'Failed to send invitation email' };
    }
  } catch (error) {
    console.error('Error sending invite email:', error);
    return { success: false, error: 'Failed to send invite email' };
  }
}
