import { NextResponse } from 'next/server';
import { dashboardDataService } from '@/services/dashboard-data-service';

export async function GET() {
  try {
    console.log('[Token Stats API] Fetching token statistics via dashboard data service...');

    const result = await dashboardDataService.getTokenStats();
    
    return NextResponse.json(
      result,
      { 
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=14400'
        }
      }
    );
  } catch (error) {
    console.error('[Token Stats API] Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch token statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: {
          volume24h: '$0',
          marketCap: '$0',
          price: '0',
          holders: '0',
          totalSupply: '0'
        },
        source: 'error-fallback',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 