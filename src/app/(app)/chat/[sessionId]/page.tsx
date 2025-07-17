'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSessions } from '@/contexts/SessionsContext';
import { Chat } from '@/components/chat/chat-simple';

interface ChatPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default function ChatPage({ params }: ChatPageProps) {
  const { currentSession, getSessionById, setCurrentSession } = useSessions();
  
  useEffect(() => {
    // Get sessionId from params
    params.then(({ sessionId }) => {
      // If we don't have a current session or it's different, try to find it
      if (!currentSession || currentSession.id !== sessionId) {
        const session = getSessionById(sessionId);
        if (session) {
          setCurrentSession(session);
        }
      }
    });
  }, [params, currentSession, getSessionById, setCurrentSession]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatPageContent params={params} />
    </Suspense>
  );
}

function ChatPageContent({ params }: ChatPageProps) {
  const { currentSession } = useSessions();
  
  // Wait for params to resolve
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  useEffect(() => {
    params.then(({ sessionId }) => {
      setSessionId(sessionId);
    });
  }, [params]);
  
  if (!sessionId) {
    return <div>Loading...</div>;
  }

  return (
    <Chat 
      sessionId={sessionId} 
      sessionData={currentSession || undefined} 
    />
  );
}
