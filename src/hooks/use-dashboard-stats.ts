"use client";

import { useState, useEffect } from 'react';
import type { DashboardStats } from '@/services/dashboard-data-service';

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('[useDashboardStats] Fetching complete dashboard data...');
        const response = await fetch('/api/dashboard-stats');
        const result = await response.json();
        
        if (mounted) {
          if (result.success) {
            setStats(result.data);
            console.log('[useDashboardStats] Dashboard data loaded successfully');
          } else {
            setError(result.error || 'Failed to fetch dashboard data');
            console.error('[useDashboardStats] API error:', result.error);
          }
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
          console.error('[useDashboardStats] Fetch error:', err);
          setError(errorMessage);
          
          // Set minimal fallback data on error
          setStats({
            tokenStats: {
              price: '0',
              volume24h: '$0',
              marketCap: '$0',
              totalSupply: '0',
              holders: '0',
              lastUpdated: new Date().toISOString()
            },
            researchStats: {
              paperCount: 0,
              hypothesisCount: 0,
            },
            meta: {
              tokenConfig: {
                contractAddress: process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS || '',
                chainId: parseInt(process.env.NEXT_PUBLIC_TOKEN_CHAIN_ID || '8453'),
                name: process.env.NEXT_PUBLIC_TOKEN_NAME || 'Token',
                symbol: process.env.NEXT_PUBLIC_TOKEN_SYMBOL || 'TOKEN'
              },
              dataStatus: {
                tokenData: 'error',
                researchData: 'error'
              },
              lastUpdated: new Date().toISOString()
            }
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    // Set up polling every 2 hours for token data (research data updates more frequently)
    const interval = setInterval(fetchStats, 2 * 60 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { 
    stats, 
    loading, 
    error,
    // Helper getters for convenience
    tokenStats: stats?.tokenStats,
    researchStats: stats?.researchStats,
    isTokenDataAvailable: stats?.meta.dataStatus.tokenData === 'success',
    isResearchDataAvailable: stats?.meta.dataStatus.researchData === 'success'
  };
}