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
        
        // Always get a fresh token to ensure it's not expired
        token = await getAccessToken();
        
        if (!token) {
          console.warn('[AuthenticatedFetch] No access token available');
          throw new Error('No access token available');
        }
        
        console.log('[AuthenticatedFetch] Successfully obtained fresh token for:', url);
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
      
      // If we get a 401 error, try refreshing the token once
      if (response.status === 401 && token) {
        console.log('[AuthenticatedFetch] Got 401, attempting token refresh');
        
        try {
          const newToken = await getAccessToken();
          
          if (newToken && newToken !== token) {
            console.log('[AuthenticatedFetch] Token refreshed, retrying request');
            
            const retryHeaders = {
              ...headers,
              'Authorization': `Bearer ${newToken}`,
            };
            
            const retryResponse = await fetch(url, {
              ...options,
              headers: retryHeaders,
            });
            
            console.log('[AuthenticatedFetch] Retry response:', {
              url,
              status: retryResponse.status,
              ok: retryResponse.ok
            });
            
            return retryResponse;
          }
        } catch (refreshError) {
          console.error('[AuthenticatedFetch] Token refresh failed:', refreshError);
        }
      }
      
      return response;
    },
    [getAccessToken, authenticated, ready]
  );

  return authenticatedFetch;
}
