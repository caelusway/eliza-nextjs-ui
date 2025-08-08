import { NextRequest, NextResponse } from 'next/server';
import twitterService from '@/lib/twitter-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username') || 'SamKnowsScience';
    const count = parseInt(searchParams.get('count') || '10');

    // Validate parameters
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    if (count < 1 || count > 20) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 20' },
        { status: 400 }
      );
    }

    console.log(`[API] Fetching ${count} tweets for @${username}`);

    const tweets = await twitterService.getUserTweets(username, count);
    const cacheStatus = twitterService.getCacheStatus(username);

    return NextResponse.json(
      {
        success: true,
        data: tweets,
        metadata: {
          username,
          count: tweets.length,
          cache: cacheStatus,
          fetched_at: new Date().toISOString()
        }
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200', // Cache for 1 hour, allow stale for 2 hours
        }
      }
    );

  } catch (error) {
    console.error('[API] Error in tweets endpoint:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tweets',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Optional: Add POST method to clear cache
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, username } = body;

    if (action === 'clear-cache') {
      if (username) {
        twitterService.clearCache(username);
        return NextResponse.json({
          success: true,
          message: `Cache cleared for @${username}`
        });
      } else {
        twitterService.clearAllCache();
        return NextResponse.json({
          success: true,
          message: 'All cache cleared'
        });
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('[API] Error in tweets POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}