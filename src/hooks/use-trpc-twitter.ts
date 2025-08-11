'use client';

import { trpc } from '@/lib/trpc/client';

// Enhanced Twitter hooks using tRPC
export function useTRPCTweets(options: {
  username?: string;
  count?: number;
  refreshInterval?: number;
} = {}) {
  const { username = 'AUBRAI_', count = 10, refreshInterval = 2 * 60 * 60 * 1000 } = options;

  const tweetsQuery = trpc.twitter.getTweets.useQuery(
    { username, count },
    {
      staleTime: 60 * 60 * 1000, // 1 hour
      gcTime: 2 * 60 * 60 * 1000, // 2 hours
      refetchInterval: refreshInterval,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    }
  );

  const cacheStatusQuery = trpc.twitter.getCacheStatus.useQuery(
    { username },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  return {
    // Data
    tweets: tweetsQuery.data?.data || [],
    metadata: tweetsQuery.data?.metadata,
    cacheStatus: cacheStatusQuery.data?.data?.cache,
    
    // Loading states
    loading: tweetsQuery.isLoading,
    loadingCacheStatus: cacheStatusQuery.isLoading,
    
    // Error states
    error: tweetsQuery.error,
    errorCacheStatus: cacheStatusQuery.error,
    
    // Status
    isSuccess: tweetsQuery.isSuccess,
    isError: tweetsQuery.isError,
    
    // Actions
    refetch: tweetsQuery.refetch,
    refetchCacheStatus: cacheStatusQuery.refetch,
    
    // Helper getters
    tweetCount: tweetsQuery.data?.data?.length || 0,
    lastFetched: tweetsQuery.dataUpdatedAt ? new Date(tweetsQuery.dataUpdatedAt) : null,
  };
}

