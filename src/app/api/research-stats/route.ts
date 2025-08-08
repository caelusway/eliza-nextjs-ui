import { NextResponse } from 'next/server';
import { dashboardDataService } from '@/services/dashboard-data-service';

export async function GET() {
  try {
    console.log('[Research Stats API] Fetching research statistics...');
    
    const result = await dashboardDataService.getResearchOnlyStats();
    
    console.log(`[Research Stats API] Research data status: ${result.success ? 'success' : 'error'}`);
    console.log(`[Research Stats API] Papers: ${result.data.paperCount}, Hypotheses: ${result.data.hypothesisCount}`);
    
    return NextResponse.json(
      result,
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Longer cache for research data
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('[Research Stats API] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch research statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: {
          paperCount: 0,
          hypothesisCount: 0
        },
        source: 'error-fallback',
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}