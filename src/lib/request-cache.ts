'use client';

// Global request cache and deduplication system
// Provides intelligent caching and request deduplication for API calls
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private defaultTTL = 30000; // 30 seconds default TTL

  // Generate cache key from URL and options
  private getCacheKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body || '';
    return `${method}:${url}:${typeof body === 'string' ? body : JSON.stringify(body)}`;
  }

  // Check if cache entry is valid
  private isValidCacheEntry<T>(entry: CacheEntry<T>): boolean {
    return Date.now() < entry.expiry;
  }

  // Clean expired entries
  private cleanExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiry) {
        this.cache.delete(key);
      }
    }
    // Clean expired pending requests (older than 30 seconds)
    for (const [key, pending] of this.pendingRequests.entries()) {
      if (now - pending.timestamp > 30000) {
        this.pendingRequests.delete(key);
      }
    }
  }

  // Get cached data if available and valid
  get<T>(url: string, options?: RequestInit): T | null {
    this.cleanExpiredEntries();
    const key = this.getCacheKey(url, options);
    const entry = this.cache.get(key);

    if (entry && this.isValidCacheEntry(entry)) {
      console.log('[RequestCache] Cache hit for:', key);
      return entry.data;
    }

    return null;
  }

  // Set cache data with TTL
  set<T>(url: string, options: RequestInit | undefined, data: T, ttl?: number): void {
    const key = this.getCacheKey(url, options);
    const expiry = Date.now() + (ttl || this.defaultTTL);

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry,
    });

    console.log('[RequestCache] Cached data for:', key, 'TTL:', ttl || this.defaultTTL);
  }

  // Get or create a pending request (deduplication)
  async getOrCreateRequest<T>(
    url: string,
    options: RequestInit | undefined,
    requestFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(url, options);
    if (cached !== null) {
      return cached;
    }

    const key = this.getCacheKey(url, options);

    // Check if request is already pending
    const pending = this.pendingRequests.get(key);
    if (pending) {
      console.log('[RequestCache] Deduplicating request for:', key);
      return pending.promise;
    }

    // Create new request
    console.log('[RequestCache] Creating new request for:', key);
    const promise = requestFn().then(
      (result) => {
        // Cache successful result
        this.set(url, options, result, ttl);
        this.pendingRequests.delete(key);
        return result;
      },
      (error) => {
        // Remove pending request on error
        this.pendingRequests.delete(key);
        throw error;
      }
    );

    // Store pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  // Clear specific cache entry
  invalidate(url: string, options?: RequestInit): void {
    const key = this.getCacheKey(url, options);
    this.cache.delete(key);
    this.pendingRequests.delete(key);
    console.log('[RequestCache] Invalidated cache for:', key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    console.log('[RequestCache] Cleared all cache');
  }

  // Get cache stats
  getStats() {
    this.cleanExpiredEntries();
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Global instance
export const requestCache = new RequestCache();

// Enhanced fetch wrapper with caching and deduplication
export async function cachedFetch<T = any>(
  url: string,
  options?: RequestInit & { ttl?: number; skipCache?: boolean }
): Promise<T> {
  const { ttl, skipCache, ...fetchOptions } = options || {};

  // Skip cache if requested
  if (skipCache) {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  return requestCache.getOrCreateRequest(
    url,
    fetchOptions,
    async () => {
      const response = await fetch(url, fetchOptions);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    ttl
  );
}

// Enhanced authenticated cached fetch for use with Privy tokens
export async function cachedAuthenticatedFetch<T = any>(
  url: string,
  authenticatedFetchFn: (url: string, options?: RequestInit) => Promise<Response>,
  options?: { ttl?: number; skipCache?: boolean; requestOptions?: RequestInit }
): Promise<T> {
  const { ttl, skipCache, requestOptions } = options || {};

  // Skip cache if requested
  if (skipCache) {
    const response = await authenticatedFetchFn(url, requestOptions);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  return requestCache.getOrCreateRequest(
    url,
    requestOptions,
    async () => {
      const response = await authenticatedFetchFn(url, requestOptions);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    ttl
  );
}
