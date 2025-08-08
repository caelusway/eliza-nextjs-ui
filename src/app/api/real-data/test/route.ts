import { NextResponse } from 'next/server';
import { tokenDataService } from '@/services/token-data-service';
import { ChainId } from '@/services/etherscan-service';

const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS || '0x226a2fa2556c48245e57cd1cba4c6c9e67077dd2';
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_TOKEN_CHAIN_ID || '8453') as ChainId;

export async function GET() {
  try {
    console.log(`[Real Data Test] Testing all real data sources...`);

    const startTime = Date.now();
    
    // Get comprehensive real data
    const realData = await tokenDataService.getRealTokenData(TOKEN_ADDRESS, CHAIN_ID);
    
    const endTime = Date.now();
    const fetchTime = endTime - startTime;

    // Test individual market data sources
    const marketDataTests = [];
    
    // Test DEXScreener
    try {
      const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${TOKEN_ADDRESS}`);
      const dexData = await dexResponse.json();
      marketDataTests.push({
        source: 'DEXScreener',
        success: dexResponse.ok,
        hasData: dexData.pairs && dexData.pairs.length > 0,
        pairCount: dexData.pairs ? dexData.pairs.length : 0,
        data: dexData.pairs ? dexData.pairs[0] : null
      });
    } catch (error) {
      marketDataTests.push({
        source: 'DEXScreener',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test CoinGecko
    try {
      const cgResponse = await fetch(`https://api.coingecko.com/api/v3/coins/base/contract/${TOKEN_ADDRESS.toLowerCase()}`);
      const cgData = await cgResponse.json();
      marketDataTests.push({
        source: 'CoinGecko',
        success: cgResponse.ok,
        hasData: cgData.market_data !== undefined,
        data: cgData.market_data
      });
    } catch (error) {
      marketDataTests.push({
        source: 'CoinGecko',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Real data comprehensive test',
      data: {
        contract: TOKEN_ADDRESS,
        chain: `Chain (${CHAIN_ID})`,
        fetchTimeMs: fetchTime,
        
        // Final assembled real data
        realTokenData: realData,
        
        // Individual source tests
        marketDataSources: marketDataTests,
        
        // Data quality assessment
        dataQuality: {
          hasRealPrice: parseFloat(realData.price) > 0,
          hasRealVolume: parseFloat(realData.volume24h.replace(/[$,]/g, '')) > 0,
          hasRealHolders: parseInt(realData.holders) > 0,
          hasRealSupply: parseFloat(realData.totalSupply.replace(/[A-Za-z,$]/g, '')) > 0,
          hasMarketCap: parseFloat(realData.marketCap.replace(/[$,]/g, '')) > 0
        },
        
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Real Data Test] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Real data test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      data: {
        contract: TOKEN_ADDRESS,
        chain: `Chain (${CHAIN_ID})`
      }
    }, { status: 500 });
  }
}