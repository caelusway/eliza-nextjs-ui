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
  
  // Extract the actual data from the tRPC response
  const publicStatsData = activeQuery.data?.data;
  const tokenStatsData = tokenStats.data?.data;

  return {
    // Data
    stats: publicStatsData,
    tokenStats: publicStatsData?.tokenStats || tokenStatsData,
    
    // Loading states
    loading: activeQuery.isLoading || tokenStats.isLoading,
    loadingStats: activeQuery.isLoading,
    loadingTokenStats: tokenStats.isLoading,
    
    // Error states
    error: activeQuery.error || tokenStats.error,
    errorStats: activeQuery.error,
    errorTokenStats: tokenStats.error,
    
    // Status
    isTokenDataAvailable: !!(publicStatsData?.tokenStats || tokenStatsData),
    isResearchDataAvailable: !!publicStatsData?.researchStats,
    
    // Refetch functions
    refetch: activeQuery.refetch,
    refetchTokenStats: tokenStats.refetch,
    
    // Helper getters
    tokenStatsData: publicStatsData?.tokenStats || tokenStatsData,
    researchStatsData: publicStatsData?.researchStats,
    meta: publicStatsData?.meta,
  };
}


