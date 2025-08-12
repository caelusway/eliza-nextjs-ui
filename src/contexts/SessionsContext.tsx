'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
  useCallback,
} from 'react';
import { useAuthenticatedFetch } from '@/lib/authenticated-fetch';
import { cachedAuthenticatedFetch } from '@/lib/request-cache';

interface ChatSession {
  id: string;
  title: string;
  messageCount: number;
  lastActivity: string;
  preview: string;
  isFromAgent: boolean;
  channelId?: string;
  metadata?: {
    initialMessage?: string;
  };
}

interface SessionsContextType {
  sessions: ChatSession[];
  loading: boolean;
  error: string | null;
  currentSession: ChatSession | null;
  setCurrentSession: (session: ChatSession | null) => void;
  refreshSessions: () => void;
  getSessionById: (id: string) => ChatSession | undefined;
  addNewSession: (session: ChatSession) => void;
}

const SessionsContext = createContext<SessionsContextType | undefined>(undefined);

interface SessionsProviderProps {
  children: ReactNode;
  userId: string | null;
}

export const SessionsProvider = ({ children, userId }: SessionsProviderProps) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const authenticatedFetch = useAuthenticatedFetch();

  // Request deduplication and rate limiting
  const MIN_FETCH_INTERVAL = 2000; // 2 seconds minimum between requests
  const RATE_LIMIT_RETRY_DELAY = 5000; // 5 seconds delay after rate limit

  const fetchSessions = useCallback(
    async (force = false) => {
      if (!userId) return;

      // Prevent duplicate requests
      if (isRefreshing && !force) {
        console.log('[SessionsProvider] Skipping duplicate request');
        return;
      }

      // Rate limiting - don't fetch too frequently
      const now = Date.now();
      if (!force && now - lastFetchTime < MIN_FETCH_INTERVAL) {
        console.log('[SessionsProvider] Skipping request due to rate limiting');
        return;
      }

      setIsRefreshing(true);
      setLoading(true);
      setError(null);

      try {
        const url = `/api/chat-sessions?userId=${encodeURIComponent(userId)}`;

        // Use cached authenticated fetch for proper token handling and caching
        const data = await cachedAuthenticatedFetch(url, authenticatedFetch, {
          ttl: force ? 0 : 60000, // Skip cache if forced, otherwise 60s TTL
          skipCache: force,
        });

        const sessionsList = data.data?.sessions || [];
        console.log(`[SessionsProvider] Loaded ${sessionsList.length} sessions for user ${userId}`);

        setSessions(sessionsList);
        setLastFetchTime(now);
        setError(null);
      } catch (err) {
        console.error('[SessionsProvider] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chat sessions');
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [userId, isRefreshing, lastFetchTime]
  );

  const getSessionById = useCallback(
    (id: string): ChatSession | undefined => {
      const session = sessions.find((session) => session.id === id);
      console.log(
        `[SessionsProvider] Looking for session ${id}: ${session ? 'found' : 'not found'} (${sessions.length} total sessions)`
      );
      return session;
    },
    [sessions]
  );

  const refreshSessions = useCallback(() => {
    // Only refresh if not already refreshing and enough time has passed
    if (!isRefreshing && Date.now() - lastFetchTime >= MIN_FETCH_INTERVAL) {
      fetchSessions(true); // Force refresh when explicitly requested
    } else {
      console.log('[SessionsProvider] Refresh skipped - too frequent or already refreshing');
    }
  }, [fetchSessions, isRefreshing, lastFetchTime]);

  const addNewSession = useCallback((session: ChatSession) => {
    setSessions((prev) => [session, ...prev]);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [userId]);

  const value: SessionsContextType = useMemo(
    () => ({
      sessions,
      loading,
      error,
      currentSession,
      setCurrentSession,
      refreshSessions,
      getSessionById,
      addNewSession,
    }),
    [sessions, loading, error, currentSession, refreshSessions, getSessionById, addNewSession]
  );

  return <SessionsContext.Provider value={value}>{children}</SessionsContext.Provider>;
};

export const useSessions = () => {
  const context = useContext(SessionsContext);
  if (context === undefined) {
    throw new Error('useSessions must be used within a SessionsProvider');
  }
  return context;
};
