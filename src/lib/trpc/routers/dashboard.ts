import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/lib/trpc/server';
import { dashboardDataService } from '@/services/dashboard-data-service';
import { tokenDataService } from '@/services/token-data-service';
import { ChainId } from '@/services/etherscan-service';

// Input validation schemas
const TokenStatsInput = z.object({
  contractAddress: z.string().optional(),
  chainId: z.number().optional(),
}).optional();

const DashboardStatsInput = z.object({
  includeTokenData: z.boolean().optional().default(true),
  includeResearchData: z.boolean().optional().default(true),
}).optional();


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
        
        // Handle optional input with defaults
        const includeTokenData = input?.includeTokenData ?? true;
        const includeResearchData = input?.includeResearchData ?? true;
        
        // Filter data based on input
        const filteredStats = {
          tokenStats: includeTokenData ? stats.tokenStats : null,
          researchStats: includeResearchData ? stats.researchStats : null,
          meta: {
            ...stats.meta,
            dataStatus: {
              tokenData: includeTokenData ? stats.meta.dataStatus.tokenData : 'skipped',
              researchData: includeResearchData ? stats.meta.dataStatus.researchData : 'skipped',
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
        const contractAddress = input?.contractAddress || process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS || '';
        const chainId = (input?.chainId || parseInt(process.env.NEXT_PUBLIC_TOKEN_CHAIN_ID || '8453')) as ChainId;

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
});
