import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/lib/trpc/server';
import twitterService from '@/lib/twitter-service';

// Input validation schemas
const TweetsInput = z.object({
  username: z.string().default('AUBRAI_'),
  count: z.number().min(1).max(20).default(10),
}).optional().default({
  username: 'AUBRAI_',
  count: 10
});

// Twitter router
export const twitterRouter = createTRPCRouter({
  // Get user tweets
  getTweets: publicProcedure
    .input(TweetsInput)
    .query(async ({ input }) => {
      try {
        console.log(`[tRPC Twitter] Fetching ${input.count} tweets for @${input.username}`);

        const tweets = await twitterService.getUserTweets(input.username, input.count);
        const cacheStatus = twitterService.getCacheStatus(input.username);

        return {
          success: true,
          data: tweets,
          metadata: {
            username: input.username,
            count: tweets.length,
            cache: cacheStatus,
            fetched_at: new Date().toISOString(),
          },
        };
      } catch (error) {
        console.error('[tRPC Twitter] Error fetching tweets:', error);
        throw new Error('Failed to fetch tweets');
      }
    }),

  // Get cache status for a user
  getCacheStatus: publicProcedure
    .input(z.object({ username: z.string().default('AUBRAI_') }).optional().default({ username: 'AUBRAI_' }))
    .query(async ({ input }) => {
      try {
        const cacheStatus = twitterService.getCacheStatus(input.username);
        
        return {
          success: true,
          data: {
            username: input.username,
            cache: cacheStatus,
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error) {
        console.error('[tRPC Twitter] Error getting cache status:', error);
        throw new Error('Failed to get cache status');
      }
    }),
});
