'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSessions } from '@/contexts/SessionsContext';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Chat } from '@/components/chat/chat-simple';

interface ChatPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default function ChatPage({ params }: ChatPageProps) {
  const {
    currentSession,
    getSessionById,
    setCurrentSession,
    loading: sessionsLoading,
  } = useSessions();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [paramsResolved, setParamsResolved] = useState(false);

  // Resolve params once
  useEffect(() => {
    params.then(({ sessionId }) => {
      setSessionId(sessionId);
      setParamsResolved(true);
    });
  }, [params]);

  // Memoize session lookup to avoid repeated calls
  const session = useMemo(() => {
    if (!sessionId) return null;
    return getSessionById(sessionId);
  }, [sessionId, getSessionById]);

  // Update current session only when necessary
  useEffect(() => {
    if (sessionId && session && (!currentSession || currentSession.id !== sessionId)) {
      setCurrentSession(session);
    }
  }, [sessionId, session, currentSession, setCurrentSession]);

  if (!paramsResolved || !sessionId) {
    return <LoadingScreen message="Loading chat..." fullScreen={false} />;
  }

  // Show loading while sessions are being fetched, unless we already have the specific session
  if (sessionsLoading && !session) {
    return <LoadingScreen message="Loading sessions..." fullScreen={false} />;
  }

  return <Chat sessionId={sessionId} sessionData={session || undefined} />;
}
