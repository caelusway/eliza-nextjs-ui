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
  const { getAccessToken } = usePrivy();

  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const token = await getAccessToken().catch(() => undefined);

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
    },
    [getAccessToken]
  );

  return authenticatedFetch;
}
