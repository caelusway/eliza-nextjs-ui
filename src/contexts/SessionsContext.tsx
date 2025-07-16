'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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

  const fetchSessions = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/chat-sessions?userId=${encodeURIComponent(userId)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch chat sessions');
      }

      setSessions(data.data?.sessions || []);
    } catch (err) {
      console.error('[SessionsProvider] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chat sessions');
    } finally {
      setLoading(false);
    }
  };

  const getSessionById = (id: string): ChatSession | undefined => {
    return sessions.find(session => session.id === id);
  };

  const refreshSessions = () => {
    fetchSessions();
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