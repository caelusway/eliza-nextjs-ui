import { useState, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/lib/authenticated-fetch';
import { useUserManager } from '@/lib/user-manager';

interface SharedSession {
  id: string;
  session_id: string;
  owner_id: string;
  public_id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  view_count: number;
  publicUrl: string;
}

interface CreateSharedSessionData {
  sessionId: string;
  title: string;
  description?: string;
  expiresAt?: string;
}

interface UpdateSharedSessionData {
  title?: string;
  description?: string;
  expiresAt?: string;
  isActive?: boolean;
}

export const useSharedSessions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedSessions, setCachedSessions] = useState<SharedSession[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const authenticatedFetch = useAuthenticatedFetch();
  const { getUserId } = useUserManager();

  const CACHE_DURATION = 30000; // 30 seconds cache

  const createSharedSession = useCallback(
    async (data: CreateSharedSessionData): Promise<SharedSession | null> => {
      const userId = getUserId();
      if (!userId) {
        setError('User not authenticated');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch('/api/shared-sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            userId,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create shared session');
        }

        // Invalidate cache after creating a new session
        setLastFetchTime(0);

        return result.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create shared session';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch, getUserId]
  );

  const getSharedSessions = useCallback(
    async (forceRefresh = false): Promise<SharedSession[]> => {
      const userId = getUserId();
      if (!userId) {
        setError('User not authenticated');
        return [];
      }

      const now = Date.now();

      // Return cached data if it's still fresh and not forcing refresh
      if (!forceRefresh && cachedSessions.length > 0 && now - lastFetchTime < CACHE_DURATION) {
        return cachedSessions;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch(
          `/api/shared-sessions?userId=${encodeURIComponent(userId)}`
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch shared sessions');
        }

        const sessions = result.data || [];
        setCachedSessions(sessions);
        setLastFetchTime(now);
        return sessions;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch shared sessions';
        setError(errorMessage);
        return cachedSessions; // Return cached data on error
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch, getUserId, cachedSessions, lastFetchTime, CACHE_DURATION]
  );

  const getSharedSessionBySessionId = useCallback(
    async (sessionId: string): Promise<SharedSession | null> => {
      const sessions = await getSharedSessions();
      return (
        sessions.find((session) => session.session_id === sessionId && session.is_active) || null
      );
    },
    [getSharedSessions]
  );

  const updateSharedSession = useCallback(
    async (publicId: string, data: UpdateSharedSessionData): Promise<SharedSession | null> => {
      const userId = getUserId();
      if (!userId) {
        setError('User not authenticated');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch(`/api/shared-sessions/${publicId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            userId,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to update shared session');
        }

        // Invalidate cache after updating
        setLastFetchTime(0);

        return result.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update shared session';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch, getUserId]
  );

  const deleteSharedSession = useCallback(
    async (publicId: string): Promise<boolean> => {
      const userId = getUserId();
      if (!userId) {
        setError('User not authenticated');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch(
          `/api/shared-sessions/${publicId}?userId=${encodeURIComponent(userId)}`,
          {
            method: 'DELETE',
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to delete shared session');
        }

        // Invalidate cache after deleting
        setLastFetchTime(0);

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete shared session';
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch, getUserId]
  );

  return {
    loading,
    error,
    createSharedSession,
    getSharedSessions,
    getSharedSessionBySessionId,
    updateSharedSession,
    deleteSharedSession,
  };
};
