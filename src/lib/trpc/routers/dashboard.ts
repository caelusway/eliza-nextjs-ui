import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/lib/trpc/server';
import { dashboardDataService } from '@/services/dashboard-data-service';
import { tokenDataService } from '@/services/token-data-service';
import { ChainId, etherscanService } from '@/services/etherscan-service';

// Input validation schemas
const TokenStatsInput = z.object({
  contractAddress: z.string().optional(),
  chainId: z.number().optional(),
}).optional().default({});

const DashboardStatsInput = z.object({
  includeTokenData: z.boolean().default(true),
  includeResearchData: z.boolean().default(true),
});

const TestRealDataInput = z.object({
  contractAddress: z.string().optional(),
  chainId: z.number().optional(),
  includeMarketTests: z.boolean().default(true),
});

// Dashboard router
export const dashboardRouter = createTRPCRouter({
  // Public endpoint - no authentication required
  getPublicStats: publicProcedure
    .input(DashboardStatsInput)
    .query(async ({ input }) => {
      try {
        console.log('[tRPC Dashboard] Fetching public stats...');
        
        const stats = await dashboardDataService.getCompleteDashboardData();
        
        console.log('[tRPC Dashboard] Raw stats received:', {
          tokenStats: stats.tokenStats ? 'present' : 'null',
          researchStats: stats.researchStats ? 'present' : 'null',
          researchDataStatus: stats.meta.dataStatus.researchData,
          researchPaperCount: stats.researchStats?.paperCount,
          researchHypothesisCount: stats.researchStats?.hypothesisCount,
        });
        
        // Filter data based on input
        const filteredStats = {
          tokenStats: input.includeTokenData ? stats.tokenStats : null,
          researchStats: input.includeResearchData ? stats.researchStats : null,
          meta: {
            ...stats.meta,
            dataStatus: {
              tokenData: input.includeTokenData ? stats.meta.dataStatus.tokenData : 'skipped',
              researchData: input.includeResearchData ? stats.meta.dataStatus.researchData : 'skipped',
            },
          },
        };

        return {
          success: true,
          data: filteredStats,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('[tRPC Dashboard] Error fetching public stats:', error);
        throw new Error('Failed to fetch dashboard statistics');
      }
    }),


  // Token statistics - public endpoint
  getTokenStats: publicProcedure
    .input(TokenStatsInput)
    .query(async ({ input }) => {
      try {
        const contractAddress = input.contractAddress || process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS || '';
        const chainId = (input.chainId || parseInt(process.env.NEXT_PUBLIC_TOKEN_CHAIN_ID || '8453')) as ChainId;

        console.log(`[tRPC Dashboard] Fetching token stats for ${contractAddress} on chain ${chainId}...`);

        const tokenStats = await tokenDataService.getRealTokenData(contractAddress, chainId);

        return {
          success: true,
          data: tokenStats,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('[tRPC Dashboard] Error fetching token stats:', error);
        throw new Error('Failed to fetch token statistics');
      }
    }),

  // Comprehensive real data test - includes API source testing
  testRealData: publicProcedure
    .input(TestRealDataInput)
    .query(async ({ input }) => {
      try {
        const contractAddress = input.contractAddress || process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS || '0x226a2fa2556c48245e57cd1cba4c6c9e67077dd2';
        const chainId = (input.chainId || parseInt(process.env.NEXT_PUBLIC_TOKEN_CHAIN_ID || '8453')) as ChainId;

        console.log(`[tRPC Dashboard] Testing all real data sources for ${contractAddress}...`);

        const startTime = Date.now();
        
        // Get comprehensive real data
        const realData = await tokenDataService.getRealTokenData(contractAddress, chainId);
        
        const endTime = Date.now();
        const fetchTime = endTime - startTime;

        // Test individual market data sources
        const marketDataTests = [];
        
        if (input.includeMarketTests) {
          // Test DEXScreener
          try {
            const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`);
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
            const cgResponse = await fetch(`https://api.coingecko.com/api/v3/coins/base/contract/${contractAddress.toLowerCase()}`);
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
        }

        return {
          success: true,
          data: {
            contract: contractAddress,
            chain: `Chain (${chainId})`,
            fetchTimeMs: fetchTime,
            
            // Final assembled real data
            realTokenData: realData,
            
            // Individual source tests
            marketDataSources: marketDataTests,
            
            // Data quality assessment
            dataQuality: {
              hasRealPrice: parseFloat(realData.price) > 0,
              hasRealVolume: parseFloat(realData.volume24h.replace(/[$,]/g, '')) > 0,
              hasRealHolders: parseInt(realData.holders.replace(/[+,]/g, '')) > 0,
              hasRealSupply: parseFloat(realData.totalSupply.replace(/[A-Za-z,$]/g, '')) > 0,
              hasMarketCap: parseFloat(realData.marketCap.replace(/[$,]/g, '')) > 0
            },
            
            timestamp: new Date().toISOString()
          }
        };

      } catch (error) {
        console.error('[tRPC Dashboard] Error testing real data:', error);
        throw new Error(`Real data test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Research statistics only
  getResearchStats: publicProcedure
    .query(async () => {
      try {
        console.log('[tRPC Dashboard] Fetching research statistics...');
        
        const result = await dashboardDataService.getResearchOnlyStats();
        
        console.log(`[tRPC Dashboard] Research data status: ${result.success ? 'success' : 'error'}`);
        console.log(`[tRPC Dashboard] Papers: ${result.data.paperCount}, Hypotheses: ${result.data.hypothesisCount}`);
        
        return result;
      } catch (error) {
        console.error('[tRPC Dashboard] Error fetching research stats:', error);
        throw new Error(`Failed to fetch research statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Etherscan API multi-chain test
  testEtherscanAPI: publicProcedure
    .query(async () => {
      try {
        console.log('[tRPC Dashboard] Testing Etherscan API connection...');
        
        // Check environment variables
        const envCheck = {
          ETHERSCAN_API_KEY: !!process.env.ETHERSCAN_API_KEY,
          ETHER_SCAN_API_KEY: !!process.env.ETHER_SCAN_API_KEY,
        };

        const apiKey = process.env.ETHER_SCAN_API_KEY || process.env.ETHERSCAN_API_KEY;
        
        if (!apiKey) {
          return {
            success: false,
            error: 'No Etherscan API key found',
            data: { environment: envCheck }
          };
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
        
        return {
          success: true,
          message: 'Etherscan multi-chain API test successful',
          data: {
            environment: envCheck,
            apiKeyLength: apiKey.length,
            connectionTest: isConnected,
            tokenTests: testResults,
            multiChainTest
          }
        };

      } catch (error) {
        console.error('[tRPC Dashboard] Error testing Etherscan API:', error);
        throw new Error(`Etherscan API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

});
