import { NextRequest, NextResponse } from 'next/server';
import { etherscanService } from '@/services/etherscan-service';

const TOKEN_ADDRESS = '0x226a2fa2556c48245e57cd1cba4c6c9e67077dd2';

export async function GET(request: NextRequest) {
  try {
    // Test API connection
    const connectionTest = await etherscanService.testConnection();
    
    // Get token info
    const tokenInfo = await etherscanService.getTokenInfo(TOKEN_ADDRESS);
    
    // Get token stats
    const tokenStats = await etherscanService.getTokenStats(TOKEN_ADDRESS);

    return NextResponse.json({
      success: true,
      connectionTest,
      tokenInfo,
      tokenStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 