import { NextRequest, NextResponse } from 'next/server';
import twitterService from '@/lib/twitter-service';

export async function GET(request: NextRequest) {
  try {
    // Test environment variables
    const envCheck = {
      TWITTER_API_KEY: !!process.env.TWITTER_API_KEY,
      TWITTER_API_SECRET_KEY: !!process.env.TWITTER_API_SECRET_KEY,
      TWITTER_ACCESS_TOKEN: !!process.env.TWITTER_ACCESS_TOKEN,
      TWITTER_ACCESS_TOKEN_SECRET: !!process.env.TWITTER_ACCESS_TOKEN_SECRET,
    };

    const missingEnvVars = Object.entries(envCheck)
      .filter(([_, exists]) => !exists)
      .map(([key]) => key);

    if (missingEnvVars.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        missing: missingEnvVars,
        allEnvVars: envCheck
      }, { status: 500 });
    }

    // Test basic API call
    const testTweets = await twitterService.getUserTweets('SamKnowsScience', 5);
    const cacheStatus = twitterService.getCacheStatus('SamKnowsScience');

    return NextResponse.json({
      success: true,
      message: 'Twitter integration test successful',
      data: {
        environment: envCheck,
        tweets: testTweets.length,
        cache: cacheStatus,
        sampleTweet: testTweets.length > 0 ? {
          id: testTweets[0].id,
          text: testTweets[0].text.substring(0, 100) + '...',
          author: testTweets[0].author.username,
          created_at: testTweets[0].created_at
        } : null
      }
    });

  } catch (error) {
    console.error('[API] Twitter test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Twitter API test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    }, { status: 500 });
  }
}