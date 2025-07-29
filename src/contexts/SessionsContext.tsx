'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuthenticatedFetch } from '@/lib/authenticated-fetch';

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

  const fetchSessions = async (force = false) => {
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
      const response = await authenticatedFetch(
        `/api/chat-sessions?userId=${encodeURIComponent(userId)}`
      );
      const data = await response.json();

      if (!response.ok) {
        // Handle rate limiting specifically
        if (response.status === 429) {
          console.log('[SessionsProvider] Rate limited, will retry in 5 seconds');
          setError('Too many requests. Retrying in a moment...');

          // Retry after delay
          setTimeout(() => {
            fetchSessions(true);
          }, RATE_LIMIT_RETRY_DELAY);
          return;
        }
        throw new Error(data.error || 'Failed to fetch chat sessions');
      }

      setSessions(data.data?.sessions || []);
      setLastFetchTime(now);
      setError(null);
    } catch (err) {
      console.error('[SessionsProvider] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chat sessions');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const getSessionById = (id: string): ChatSession | undefined => {
    return sessions.find((session) => session.id === id);
  };

  const refreshSessions = () => {
    // Only refresh if not already refreshing and enough time has passed
    if (!isRefreshing && Date.now() - lastFetchTime >= MIN_FETCH_INTERVAL) {
      fetchSessions();
    } else {
      console.log('[SessionsProvider] Refresh skipped - too frequent or already refreshing');
    }
  };

  const addNewSession = (session: ChatSession) => {
    setSessions((prev) => [session, ...prev]);
  };

  useEffect(() => {
    fetchSessions();
  }, [userId]);

  const value: SessionsContextType = {
    sessions,
    loading,
    error,
    currentSession,
    setCurrentSession,
    refreshSessions,
    getSessionById,
    addNewSession,
  };

  return <SessionsContext.Provider value={value}>{children}</SessionsContext.Provider>;
};

export const useSessions = () => {
  const context = useContext(SessionsContext);
  if (context === undefined) {
    throw new Error('useSessions must be used within a SessionsProvider');
  }
  return context;
};
