import { useState, useEffect } from 'react';
import { Tweet } from '@/lib/twitter-service';

interface UseTweetsOptions {
  username?: string;
  count?: number;
  refreshInterval?: number; // in milliseconds
}

interface UseTweetsReturn {
  tweets: Tweet[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  lastFetched: Date | null;
}

export function useTweets({
  username = 'SamKnowsScience',
  count = 10,
  refreshInterval = 2 * 60 * 60 * 1000 // 2 hours
}: UseTweetsOptions = {}): UseTweetsReturn {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchTweets = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/twitter/tweets?username=${encodeURIComponent(username)}&count=${count}`,
        {
          cache: 'force-cache',
          next: { revalidate: 3600 } // Revalidate every hour
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch tweets: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch tweets');
      }

      setTweets(data.data);
      setLastFetched(new Date());
      console.log(`[useTweets] Fetched ${data.data.length} tweets for @${username}`);

    } catch (err) {
      console.error('[useTweets] Error fetching tweets:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Don't clear existing tweets on error, keep showing cached data
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchTweets();
  };

  useEffect(() => {
    fetchTweets();

    // Set up automatic refresh interval
    const interval = setInterval(() => {
      console.log(`[useTweets] Auto-refreshing tweets for @${username}`);
      fetchTweets();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [username, count, refreshInterval]);

  return {
    tweets,
    loading,
    error,
    refresh,
    lastFetched
  };
}