/**
 * Utility for making authenticated fetch requests to internal API routes
 */

/**
 * Make an authenticated fetch request to internal API routes
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
  getAccessToken: () => Promise<string | undefined>
): Promise<Response> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Hook for authenticated fetch calls
 */
import { usePrivy } from '@privy-io/react-auth';
import { useCallback } from 'react';

export function useAuthenticatedFetch() {
  const { getAccessToken, authenticated, ready } = usePrivy();

  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      // Enhanced token retrieval with better error handling
      let token: string | undefined;
      
      try {
        // Check if user is authenticated before trying to get token
        if (!ready) {
          console.warn('[AuthenticatedFetch] Privy not ready yet');
          throw new Error('Authentication service not ready');
        }
        
        if (!authenticated) {
          console.warn('[AuthenticatedFetch] User not authenticated');
          throw new Error('User not authenticated');
        }
        
        token = await getAccessToken();
        
        if (!token) {
          console.warn('[AuthenticatedFetch] No access token available');
          throw new Error('No access token available');
        }
        
        console.log('[AuthenticatedFetch] Successfully obtained token for:', url);
      } catch (error) {
        console.error('[AuthenticatedFetch] Token retrieval failed:', error);
        // Continue without token - let the server respond with proper error
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('[AuthenticatedFetch] Adding Authorization header');
      } else {
        console.warn('[AuthenticatedFetch] No token available, making request without auth');
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      // Log response for debugging
      console.log('[AuthenticatedFetch] Response:', {
        url,
        status: response.status,
        hasAuth: !!token,
        ok: response.ok
      });
      
      return response;
    },
    [getAccessToken, authenticated, ready]
  );

  return authenticatedFetch;
}
