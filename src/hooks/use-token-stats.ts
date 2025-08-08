"use client";

import { useState, useEffect } from 'react';
// Enhanced interface for comprehensive token stats
interface EnhancedTokenStats {
  volume24h: string;
  marketCap: string;
  price: string;
  holders: string;
  totalSupply: string;
  
  // Additional real metrics
  transfers24h?: string;
  liquidity?: string;
  fdv?: string;
  
  // Meta information
  tokenName?: string;
  symbol?: string;
  decimals?: number;
  chain?: string;
  lastUpdated?: string;
}

export function useTokenStats() {
  const [stats, setStats] = useState<EnhancedTokenStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/token-stats');
        const result = await response.json();
        
        if (mounted) {
          if (result.success) {
            setStats(result.data);
          } else {
            setError(result.error || 'Failed to fetch token data');
            // Use fallback data from API
            setStats(result.data);
          }
        }
      } catch (err) {
        if (mounted) {
          console.error('Failed to fetch token stats:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch token data');
          
          // Set fallback data on error
          setStats({
            volume24h: '$0',
            marketCap: '$0',
            price: '0',
            holders: '0',
            totalSupply: '0',
            transfers24h: '0',
            liquidity: '$0',
            fdv: '$0',
            tokenName: 'BIO Token',
            symbol: 'BIO',
            chain: 'Base'
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    // Set up polling every 2 minutes for real-time data
    const interval = setInterval(fetchStats, 2 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { stats, loading, error };
} 