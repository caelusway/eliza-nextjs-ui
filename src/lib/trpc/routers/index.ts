import { createTRPCRouter } from '@/lib/trpc/server';
import { dashboardRouter } from './dashboard';
import { twitterRouter } from './twitter';

// Export the main app router
export const appRouter = createTRPCRouter({
  dashboard: dashboardRouter,
  twitter: twitterRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
