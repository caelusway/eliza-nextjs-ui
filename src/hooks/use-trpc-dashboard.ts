'use client';

import { trpc } from '@/lib/trpc/client';

// Enhanced dashboard stats hook using tRPC
export function useTRPCDashboardStats() {
  // Always use public stats for dashboard - no auth needed
  const publicStats = trpc.dashboard.getPublicStats.useQuery(
    { includeTokenData: true, includeResearchData: true },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    }
  );

  // Token stats as backup/additional data source
  const tokenStats = trpc.dashboard.getTokenStats.useQuery(
    {},
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  );

  // Always use public query
  const activeQuery = publicStats;

  return {
    // Data
    stats: activeQuery.data?.data,
    tokenStats: activeQuery.data?.data?.tokenStats || tokenStats.data?.data,
    
    // Loading states
    loading: activeQuery.isLoading || tokenStats.isLoading,
    loadingStats: activeQuery.isLoading,
    loadingTokenStats: tokenStats.isLoading,
    
    // Error states
    error: activeQuery.error || tokenStats.error,
    errorStats: activeQuery.error,
    errorTokenStats: tokenStats.error,
    
    // Status
    isTokenDataAvailable: activeQuery.data?.data?.tokenStats || tokenStats.data?.data ? true : false,
    isResearchDataAvailable: activeQuery.data?.data?.researchStats ? true : false,
    
    // Refetch functions
    refetch: activeQuery.refetch,
    refetchTokenStats: tokenStats.refetch,
    
    // Helper getters
    tokenStatsData: activeQuery.data?.data?.tokenStats || tokenStats.data?.data,
    researchStatsData: activeQuery.data?.data?.researchStats,
    meta: activeQuery.data?.data?.meta,
  };
}


