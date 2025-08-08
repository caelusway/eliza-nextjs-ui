import { NextResponse } from 'next/server';
import { dashboardDataService } from '@/services/dashboard-data-service';

export async function GET() {
  try {
    console.log('[Dashboard Stats API] Fetching complete dashboard statistics...');
    
    const startTime = Date.now();
    const dashboardData = await dashboardDataService.getCompleteDashboardData();
    const endTime = Date.now();
    
    const fetchTime = endTime - startTime;
    
    console.log(`[Dashboard Stats API] Complete data fetched in ${fetchTime}ms`);
    console.log(`[Dashboard Stats API] Status - Token: ${dashboardData.meta.dataStatus.tokenData}, Research: ${dashboardData.meta.dataStatus.researchData}`);
    
    return NextResponse.json(
      {
        success: true,
        data: dashboardData,
        meta: {
          fetchTimeMs: fetchTime,
          apiVersion: '1.0',
          endpoint: 'dashboard-stats'
        },
        timestamp: new Date().toISOString()
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=14400',
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('[Dashboard Stats API] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: null
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