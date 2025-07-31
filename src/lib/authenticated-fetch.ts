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
      // Enhanced token retrieval with retry mechanism
      let token: string | undefined;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount <= maxRetries) {
        try {
          // Check if user is authenticated before trying to get token
          if (!ready) {
            if (retryCount < maxRetries) {
              console.warn(`[AuthenticatedFetch] Privy not ready yet, retry ${retryCount + 1}/${maxRetries + 1}`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              retryCount++;
              continue;
            } else {
              throw new Error('Authentication service not ready after retries');
            }
          }

          if (!authenticated) {
            if (retryCount < maxRetries) {
              console.warn(`[AuthenticatedFetch] User not authenticated, retry ${retryCount + 1}/${maxRetries + 1}`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              retryCount++;
              continue;
            } else {
              throw new Error('User not authenticated after retries');
            }
          }

          // Always get a fresh token to ensure it's not expired
          token = await getAccessToken();

          if (!token) {
            if (retryCount < maxRetries) {
              console.warn(`[AuthenticatedFetch] No access token available, retry ${retryCount + 1}/${maxRetries + 1}`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              retryCount++;
              continue;
            } else {
              throw new Error('No access token available after retries');
            }
          }

          console.log('[AuthenticatedFetch] Successfully obtained fresh token for:', url);
          break; // Success, exit retry loop
        } catch (error) {
          if (retryCount < maxRetries) {
            console.warn(`[AuthenticatedFetch] Token retrieval failed, retry ${retryCount + 1}/${maxRetries + 1}:`, error);
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 1500));
          } else {
            console.error('[AuthenticatedFetch] Token retrieval failed after all retries:', error);
            throw error;
          }
        }
      }

      const headers: Record<string, string> = {
        ...((options.headers as Record<string, string>) || {}),
      };

      // Only set Content-Type to application/json if not already set and not FormData
      if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

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
        ok: response.ok,
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
              Authorization: `Bearer ${newToken}`,
            };

            const retryResponse = await fetch(url, {
              ...options,
              headers: retryHeaders,
            });

            console.log('[AuthenticatedFetch] Retry response:', {
              url,
              status: retryResponse.status,
              ok: retryResponse.ok,
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
