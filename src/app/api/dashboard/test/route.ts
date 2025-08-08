import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log(`[Dashboard Test] Testing dashboard stats display integration...`);

    // Test the token stats endpoint that the dashboard uses
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000'}/api/token-stats`);
    const tokenStats = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Dashboard real data integration test',
      data: {
        // Stats that will be displayed in the dashboard header
        dashboardStats: {
          volume: tokenStats.data?.volume24h || '$0',
          price: tokenStats.data?.price ? `$${parseFloat(tokenStats.data.price).toFixed(4)}` : '$0',
          marketCap: tokenStats.data?.marketCap || '$0',
          supply: tokenStats.data?.totalSupply || '0'
        },
        
        // Additional real data available
        additionalMetrics: {
          transfers24h: tokenStats.data?.transfers24h || '0',
          liquidity: tokenStats.data?.liquidity || '$0',
          fdv: tokenStats.data?.fdv || '$0',
          holders: tokenStats.data?.holders || '0',
          tokenName: tokenStats.data?.tokenName || 'Unknown',
          symbol: tokenStats.data?.symbol || 'UNKNOWN',
          chain: tokenStats.data?.chain || 'Base',
          lastUpdated: tokenStats.data?.lastUpdated
        },
        
        // Data source info
        dataSource: tokenStats.source || 'unknown',
        apiResponse: tokenStats.success,
        
        // Token configuration from environment
        tokenConfig: {
          contractAddress: process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS || '0x226a2fa2556c48245e57cd1cba4c6c9e67077dd2',
          chainId: process.env.NEXT_PUBLIC_TOKEN_CHAIN_ID || '8453',
          name: process.env.NEXT_PUBLIC_TOKEN_NAME || 'BIO Token',
          symbol: process.env.NEXT_PUBLIC_TOKEN_SYMBOL || 'BIO'
        },
        
        // Expected display format
        expectedDisplay: {
          'vol': tokenStats.data?.volume24h || '$0',
          'price': tokenStats.data?.price ? `$${parseFloat(tokenStats.data.price).toFixed(4)}` : '$0',
          'mcap': tokenStats.data?.marketCap || '$0', 
          'supply': tokenStats.data?.totalSupply || '0'
        },
        
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Dashboard Test] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Dashboard test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}