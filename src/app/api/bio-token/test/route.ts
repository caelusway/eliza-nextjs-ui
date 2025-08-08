import { NextResponse } from 'next/server';
import { etherscanService } from '@/services/etherscan-service';

const BIO_TOKEN_ADDRESS = '0x226a2fa2556c48245e57cd1cba4c6c9e67077dd2';
const BASE_CHAIN_ID = 8453;

export async function GET() {
  try {
    console.log(`[BIO Token Test] Testing BIO token on Base chain...`);

    // Test token info
    const tokenInfo = await etherscanService.getTokenInfo(BIO_TOKEN_ADDRESS, BASE_CHAIN_ID);
    console.log(`[BIO Token Test] Token info:`, tokenInfo);

    // Test token stats
    const tokenStats = await etherscanService.getTokenStats(BIO_TOKEN_ADDRESS, BASE_CHAIN_ID);
    console.log(`[BIO Token Test] Token stats:`, tokenStats);

    // Test token supply directly
    let directSupply = null;
    try {
      const supply = await etherscanService['makeRequest']<string>('stats', 'tokensupply', {
        contractaddress: BIO_TOKEN_ADDRESS
      }, BASE_CHAIN_ID);
      directSupply = supply;
    } catch (error) {
      directSupply = `Error: ${error instanceof Error ? error.message : 'Unknown'}`;
    }

    return NextResponse.json({
      success: true,
      message: 'BIO token test on Base chain',
      data: {
        contract: BIO_TOKEN_ADDRESS,
        chain: 'Base (8453)',
        tokenInfo,
        tokenStats,
        directSupply,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[BIO Token Test] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'BIO token test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      data: {
        contract: BIO_TOKEN_ADDRESS,
        chain: 'Base (8453)'
      }
    }, { status: 500 });
  }
}