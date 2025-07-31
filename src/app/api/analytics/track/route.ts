import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sharedSessionId, visitorId, userAgent, referrer } = body;

    if (!sharedSessionId || !visitorId) {
      return NextResponse.json(
        { error: 'Shared session ID and visitor ID are required' },
        { status: 400 }
      );
    }

    // Verify shared session exists and is active (no ownership check needed for public tracking)
    const { data: sharedSession, error: sessionError } = await supabase
      .from('shared_chat_sessions')
      .select('id, is_active')
      .eq('id', sharedSessionId)
      .eq('is_active', true)
      .single();

    if (sessionError || !sharedSession) {
      return NextResponse.json({ error: 'Shared session not found or inactive' }, { status: 404 });
    }

    // Check if this visitor has already viewed this session in the last 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: existingView } = await supabase
      .from('shared_chat_analytics')
      .select('id')
      .eq('shared_session_id', sharedSessionId)
      .eq('visitor_id', visitorId)
      .gte('visited_at', twentyFourHoursAgo.toISOString())
      .limit(1);

    // If visitor has already viewed this session in the last 24 hours, don't count as new view
    if (existingView && existingView.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'View already tracked for this visitor within 24 hours',
      });
    }

    // Get IP address from headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwarded?.split(',')[0] || realIp || null;

    // For demo purposes, we'll use a simple country detection based on IP
    // In production, you'd use a service like ipapi.co or MaxMind GeoIP
    let country = null;
    let city = null;

    // Very basic country detection (you should replace this with a real service)
    if (
      ipAddress &&
      ipAddress !== 'unknown' &&
      !ipAddress.startsWith('127.') &&
      !ipAddress.startsWith('192.168.')
    ) {
      // This is a placeholder - in production use a real GeoIP service
      country = 'Unknown';
      city = 'Unknown';
    }

    // Insert analytics record
    const { error: insertError } = await supabase.from('shared_chat_analytics').insert({
      shared_session_id: sharedSessionId,
      visitor_id: visitorId,
      ip_address: ipAddress,
      user_agent: userAgent,
      referrer: referrer || null,
      country,
      city,
    });

    if (insertError) {
      console.error('Error inserting analytics:', insertError);
      return NextResponse.json({ error: 'Failed to track analytics' }, { status: 500 });
    }

    // Only increment view count for unique visitors within 24 hours
    // First get the current view count
    const { data: sessionData } = await supabase
      .from('shared_chat_sessions')
      .select('view_count')
      .eq('id', sharedSessionId)
      .single();

    const currentViewCount = sessionData?.view_count || 0;

    const { error: updateError } = await supabase
      .from('shared_chat_sessions')
      .update({
        view_count: currentViewCount + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sharedSessionId);

    if (updateError) {
      console.error('Error updating view count:', updateError);
      // Don't fail the request if view count update fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/analytics/track:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { sharedSessionId, visitorId, sessionDuration } = body;

    if (!sharedSessionId || !visitorId || sessionDuration === undefined) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Verify shared session exists and is active (no ownership check needed for public tracking)
    const { data: sharedSession, error: sessionError } = await supabase
      .from('shared_chat_sessions')
      .select('id, is_active')
      .eq('id', sharedSessionId)
      .eq('is_active', true)
      .single();

    if (sessionError || !sharedSession) {
      return NextResponse.json({ error: 'Shared session not found or inactive' }, { status: 404 });
    }

    // Update session duration for the most recent visit
    const { error } = await supabase
      .from('shared_chat_analytics')
      .update({ session_duration: sessionDuration })
      .eq('shared_session_id', sharedSessionId)
      .eq('visitor_id', visitorId)
      .order('visited_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error updating session duration:', error);
      return NextResponse.json({ error: 'Failed to update session duration' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/analytics/track:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
