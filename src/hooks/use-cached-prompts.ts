'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/lib/authenticated-fetch';

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

// Fallback prompts if API fails
function getFallbackPrompts(): string[] {
  return [
    'What drug combinations show synergistic effects for longevity?',
    'Analyze the latest research on NAD+ precursors',
    'Design a compound targeting cellular senescence',
    'Find clinical trials for age-related diseases',
  ];
}

export function useCachedPrompts(userId: string, userContext?: string): UseCachedPromptsResult {
  const [prompts, setPrompts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

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
      try {
        const response = await authenticatedFetch('/api/suggested-prompts', {
          method: 'POST',
          body: JSON.stringify({
            userId,
            userContext,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
          console.error('[useCachedPrompts] API error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorMessage,
          });
          throw new Error(`Failed to fetch suggested prompts: ${errorMessage}`);
        }

        const data = await response.json();

        if (!data.success) {
          console.error('[useCachedPrompts] API returned error:', data.error);
          throw new Error(data.error || 'Failed to generate prompts');
        }

        // Validate that we have prompts
        if (!data.prompts || !Array.isArray(data.prompts) || data.prompts.length === 0) {
          console.warn('[useCachedPrompts] API returned empty prompts, using fallback');
          return getFallbackPrompts();
        }

        // Save to cache
        const cacheData: CachedPromptsData = {
          prompts: data.prompts,
          generatedAt: data.generatedAt,
          cacheKey: data.cacheKey,
        };

        saveToCache(getCacheKey(userId), cacheData);
        console.log(`[useCachedPrompts] Successfully fetched ${data.prompts.length} prompts`);

        return data.prompts;
      } catch (error) {
        console.error('[useCachedPrompts] Error fetching prompts:', error);
        // Always return fallback prompts on error
        return getFallbackPrompts();
      }
    },
    [authenticatedFetch, saveToCache, getCacheKey]
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

        // Don't show error to user, just use fallback silently
        console.log('[useCachedPrompts] Using fallback prompts due to error');
        setError(null); // Clear any previous errors

        // Fall back to cached data first, then static fallback
        const cacheKey = getCacheKey(userId);
        let fallbackPrompts: string[] = [];

        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const data: CachedPromptsData = JSON.parse(cached);
            if (data.prompts.length > 0) {
              fallbackPrompts = data.prompts;
              console.log('[useCachedPrompts] Using cached fallback prompts');
            }
          }
        } catch (cacheErr) {
          console.error('[useCachedPrompts] Error reading fallback cache:', cacheErr);
        }

        // If no cached prompts, use static fallback
        if (fallbackPrompts.length === 0) {
          fallbackPrompts = getFallbackPrompts();
          console.log('[useCachedPrompts] Using static fallback prompts');
        }

        setPrompts(fallbackPrompts);
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
