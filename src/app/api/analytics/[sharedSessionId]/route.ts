import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { withAuth } from '@/lib/auth-middleware';

interface RouteParams {
  params: Promise<{
    sharedSessionId: string;
  }>;
}

async function getAnalyticsHandler(request: NextRequest, user: any, { params }: RouteParams) {
  try {
    const { sharedSessionId } = await params;
    // Verify the authenticated user owns this shared session
    const { data: sharedSession, error: sessionError } = await supabase
      .from('shared_chat_sessions')
      .select('id, owner_id')
      .eq('id', sharedSessionId)
      .eq('owner_id', user.userId)
      .single();

    if (sessionError || !sharedSession) {
      return NextResponse.json(
        { error: 'Shared session not found or access denied' },
        { status: 404 }
      );
    }

    // Get analytics data
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('shared_chat_analytics')
      .select('*')
      .eq('shared_session_id', sharedSessionId)
      .order('visited_at', { ascending: false });

    if (analyticsError) {
      console.error('Error fetching analytics:', analyticsError);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // Get daily analytics
    const { data: dailyData, error: dailyError } = await supabase
      .from('daily_analytics')
      .select('*')
      .eq('shared_session_id', sharedSessionId)
      .order('date', { ascending: false })
      .limit(30); // Last 30 days

    if (dailyError) {
      console.error('Error fetching daily analytics:', dailyError);
    }

    // Calculate summary statistics
    const uniqueVisitors = new Set(analyticsData?.map((record) => record.visitor_id)).size;
    const totalViews = analyticsData?.length || 0;

    const validDurations =
      analyticsData?.filter((record) => record.session_duration !== null) || [];
    const avgSessionDuration =
      validDurations.length > 0
        ? validDurations.reduce((sum, record) => sum + (record.session_duration || 0), 0) /
          validDurations.length
        : 0;

    // Get top referrers
    const referrerCounts = analyticsData?.reduce((acc: Record<string, number>, record) => {
      if (record.referrer && record.referrer.trim() !== '') {
        const domain = extractDomain(record.referrer);
        acc[domain] = (acc[domain] || 0) + 1;
      }
      return acc;
    }, {});

    const topReferrers = Object.entries(referrerCounts || {})
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([referrer, count]) => ({ referrer, count }));

    // Get top countries
    const countryCounts = analyticsData?.reduce((acc: Record<string, number>, record) => {
      if (record.country && record.country.trim() !== '' && record.country !== 'Unknown') {
        acc[record.country] = (acc[record.country] || 0) + 1;
      }
      return acc;
    }, {});

    const topCountries = Object.entries(countryCounts || {})
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }));

    // Get visits by hour (last 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentVisits =
      analyticsData?.filter((record) => new Date(record.visited_at) >= sevenDaysAgo) || [];

    const visitsByHour = Array.from({ length: 24 }, (_, hour) => {
      const count = recentVisits.filter((record) => {
        const visitHour = new Date(record.visited_at).getHours();
        return visitHour === hour;
      }).length;
      return { hour, count };
    });

    // Get visits by day (last 30 days)
    const visitsByDay = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      const dayVisits =
        analyticsData?.filter((record) => record.visited_at.startsWith(dateStr)) || [];

      const uniqueVisitorsCount = new Set(dayVisits.map((v) => v.visitor_id)).size;

      return {
        date: dateStr,
        visits: dayVisits.length,
        uniqueVisitors: uniqueVisitorsCount,
      };
    }).reverse();

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          uniqueVisitors,
          totalViews,
          avgSessionDuration: Math.round(avgSessionDuration),
        },
        topReferrers,
        topCountries,
        visitsByHour,
        visitsByDay,
        dailyData: dailyData || [],
        recentVisits: analyticsData?.slice(0, 10) || [], // Last 10 visits
      },
    });
  } catch (error) {
    console.error('Error in GET /api/analytics/[sharedSessionId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withAuth(getAnalyticsHandler);

function extractDomain(url: string): string {
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return url;
    }
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}
