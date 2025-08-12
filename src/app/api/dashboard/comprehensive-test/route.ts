import { NextResponse } from 'next/server';
import { dashboardDataService } from '@/services/dashboard-data-service';
import { researchDataService } from '@/services/research-data-service';
import { tokenDataService } from '@/services/token-data-service';

export async function GET() {
  try {
    console.log('[Comprehensive Dashboard Test] Starting complete system test...');
    
    const startTime = Date.now();
    
    // Test all services individually
    const tests = [];
    
    // 1. Test research data service
    try {
      const researchStart = Date.now();
      const researchData = await researchDataService.getResearchStats();
      const researchEnd = Date.now();
      
      tests.push({
        service: 'Research Data Service',
        success: true,
        data: researchData,
        responseTime: researchEnd - researchStart,
        endpoint: process.env.NEXT_PUBLIC_SPARQL_ENDPOINT_URL,
        metrics: researchData.latestHypothesis ? 
          researchDataService.extractHypothesisMetrics(researchData.latestHypothesis.statement) : null
      });
    } catch (error) {
      tests.push({
        service: 'Research Data Service',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: 0
      });
    }
    
    // 2. Test token data service
    try {
      const tokenStart = Date.now();
      const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS || '0x226a2fa2556c48245e57cd1cba4c6c9e67077dd2';
      const chainId = parseInt(process.env.NEXT_PUBLIC_TOKEN_CHAIN_ID || '8453');
      const tokenData = await tokenDataService.getRealTokenData(tokenAddress, chainId as any);
      const tokenEnd = Date.now();
      
      tests.push({
        service: 'Token Data Service',
        success: true,
        data: tokenData,
        responseTime: tokenEnd - tokenStart,
        config: {
          contractAddress: tokenAddress,
          chainId: chainId,
          name: process.env.NEXT_PUBLIC_TOKEN_NAME,
          symbol: process.env.NEXT_PUBLIC_TOKEN_SYMBOL
        }
      });
    } catch (error) {
      tests.push({
        service: 'Token Data Service',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: 0
      });
    }
    
    // 3. Test complete dashboard data service
    try {
      const dashboardStart = Date.now();
      const dashboardData = await dashboardDataService.getCompleteDashboardData();
      const dashboardEnd = Date.now();
      
      tests.push({
        service: 'Complete Dashboard Data Service',
        success: true,
        data: dashboardData,
        responseTime: dashboardEnd - dashboardStart,
        dataStatus: dashboardData.meta.dataStatus
      });
    } catch (error) {
      tests.push({
        service: 'Complete Dashboard Data Service',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: 0
      });
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Analyze results
    const successfulTests = tests.filter(t => t.success).length;
    const failedTests = tests.filter(t => !t.success).length;
    
    const analysis = {
      totalTests: tests.length,
      successful: successfulTests,
      failed: failedTests,
      successRate: (successfulTests / tests.length) * 100,
      avgResponseTime: tests.reduce((sum, t) => sum + t.responseTime, 0) / tests.length,
      totalExecutionTime: totalTime
    };
    
    console.log(`[Comprehensive Dashboard Test] Completed in ${totalTime}ms - Success rate: ${analysis.successRate}%`);
    
    return NextResponse.json({
      success: successfulTests > 0,
      message: `Dashboard system test completed - ${successfulTests}/${tests.length} services operational`,
      data: {
        tests,
        analysis,
        configuration: {
          sparqlEndpoint: process.env.NEXT_PUBLIC_SPARQL_ENDPOINT_URL,
          researchApiEnabled: process.env.NEXT_PUBLIC_RESEARCH_API_ENABLED === 'true',
          tokenConfig: {
            contractAddress: process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS,
            chainId: process.env.NEXT_PUBLIC_TOKEN_CHAIN_ID,
            name: process.env.NEXT_PUBLIC_TOKEN_NAME,
            symbol: process.env.NEXT_PUBLIC_TOKEN_SYMBOL
          }
        },
        systemHealth: {
          tokenDataStatus: tests.find(t => t.service === 'Token Data Service')?.success ? 'healthy' : 'degraded',
          researchDataStatus: tests.find(t => t.service === 'Research Data Service')?.success ? 'healthy' : 'degraded',
          dashboardServiceStatus: tests.find(t => t.service === 'Complete Dashboard Data Service')?.success ? 'healthy' : 'degraded'
        },
        recommendations: analysis.successRate < 100 ? [
          'Check environment variables for missing configuration',
          'Verify SPARQL endpoint accessibility',
          'Ensure token contract address and chain ID are correct',
          'Review API rate limits and network connectivity'
        ] : ['All systems operational'],
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[Comprehensive Dashboard Test] Critical error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Dashboard system test failed',
      message: error instanceof Error ? error.message : 'Unknown critical error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}