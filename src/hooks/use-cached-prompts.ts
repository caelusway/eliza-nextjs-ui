'use client';

import { useState, useEffect, useCallback } from 'react';

interface CachedPromptsData {
  prompts: string[];
  generatedAt: string;
  cacheKey: string;
}

interface UseCachedPromptsResult {
  prompts: string[];
  isLoading: boolean;
  error: string | null;
  refreshPrompts: () => Promise<void>;
}

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

export function useCachedPrompts(userId: string, userContext?: string): UseCachedPromptsResult {
  const [prompts, setPrompts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCacheKey = useCallback((userId: string) => {
    return `suggested_prompts_${userId}`;
  }, []);

  const getFromCache = useCallback((cacheKey: string): CachedPromptsData | null => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const data: CachedPromptsData = JSON.parse(cached);
      const generatedTime = new Date(data.generatedAt).getTime();
      const now = Date.now();

      // Check if cache is still valid (within 15 minutes)
      if (now - generatedTime < CACHE_DURATION) {
        return data;
      }

      // Cache expired, remove it
      localStorage.removeItem(cacheKey);
      return null;
    } catch (err) {
      console.error('[useCachedPrompts] Error reading from cache:', err);
      return null;
    }
  }, []);

  const saveToCache = useCallback((cacheKey: string, data: CachedPromptsData) => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (err) {
      console.error('[useCachedPrompts] Error saving to cache:', err);
    }
  }, []);

  const fetchFreshPrompts = useCallback(
    async (userId: string, userContext?: string): Promise<string[]> => {
      const response = await fetch('/api/suggested-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          userContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suggested prompts');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate prompts');
      }

      // Save to cache
      const cacheData: CachedPromptsData = {
        prompts: data.prompts,
        generatedAt: data.generatedAt,
        cacheKey: data.cacheKey,
      };

      saveToCache(getCacheKey(userId), cacheData);

      return data.prompts;
    },
    [saveToCache, getCacheKey]
  );

  const loadPrompts = useCallback(
    async (forceRefresh: boolean = false) => {
      if (!userId) return;

      setIsLoading(true);
      setError(null);

      try {
        const cacheKey = getCacheKey(userId);

        // Try to get from cache first (unless force refresh)
        if (!forceRefresh) {
          const cachedData = getFromCache(cacheKey);
          if (cachedData && cachedData.prompts.length > 0) {
            setPrompts(cachedData.prompts);
            setIsLoading(false);
            return;
          }
        }

        // Cache miss or force refresh - fetch fresh prompts
        const freshPrompts = await fetchFreshPrompts(userId, userContext);
        setPrompts(freshPrompts);
      } catch (err) {
        console.error('[useCachedPrompts] Error loading prompts:', err);
        setError(err instanceof Error ? err.message : 'Failed to load prompts');

        // Fall back to any cached data, even if expired
        const cacheKey = getCacheKey(userId);
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const data: CachedPromptsData = JSON.parse(cached);
            if (data.prompts.length > 0) {
              setPrompts(data.prompts);
            }
          }
        } catch (cacheErr) {
          console.error('[useCachedPrompts] Error reading fallback cache:', cacheErr);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [userId, userContext, getCacheKey, getFromCache, fetchFreshPrompts]
  );

  const refreshPrompts = useCallback(async () => {
    await loadPrompts(true);
  }, [loadPrompts]);

  // Load prompts on mount and when userId changes
  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  return {
    prompts,
    isLoading,
    error,
    refreshPrompts,
  };
}
