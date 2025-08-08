import { NextResponse } from 'next/server';
import { etherscanService } from '@/services/etherscan-service';

export async function GET() {
  try {
    console.log('[Etherscan Test] Testing API connection...');
    
    // Check environment variables
    const envCheck = {
      ETHERSCAN_API_KEY: !!process.env.ETHERSCAN_API_KEY,
      ETHER_SCAN_API_KEY: !!process.env.ETHER_SCAN_API_KEY,
    };

    const apiKey = process.env.ETHERSCAN_API_KEY || process.env.ETHER_SCAN_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'No Etherscan API key found',
        environment: envCheck
      }, { status: 500 });
    }

    // Test basic API connection
    const isConnected = await etherscanService.testConnection();
    
    if (!isConnected) {
      throw new Error('API connection test failed');
    }

    // Test with different contracts on different chains
    const tests = [
      { chain: 1 as const, address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', name: 'USDT (Ethereum)' },
      { chain: 8453 as const, address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', name: 'USDC (Base)' }
    ];
    
    const testResults = [];
    
    for (const test of tests) {
      try {
        const tokenInfo = await etherscanService.getTokenInfo(test.address, test.chain);
        testResults.push({
          chain: test.chain,
          name: test.name,
          success: true,
          tokenInfo
        });
      } catch (error) {
        testResults.push({
          chain: test.chain,
          name: test.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Test multi-chain balance
    let multiChainTest = null;
    try {
      const testAddress = '0xb5d85cbf7cb3ee0d56b3bb207d5fc4b82f43f511';
      const balances = await etherscanService.getMultiChainBalances(testAddress, [42161, 8453]);
      multiChainTest = { success: true, balances };
    } catch (error) {
      multiChainTest = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
    
    return NextResponse.json({
      success: true,
      message: 'Etherscan multi-chain API test successful',
      data: {
        environment: envCheck,
        apiKeyLength: apiKey.length,
        connectionTest: isConnected,
        tokenTests: testResults,
        multiChainTest
      }
    });

  } catch (error) {
    console.error('[Etherscan Test] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Etherscan API test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}