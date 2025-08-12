'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserManager } from '@/lib/user-manager';
import { NewChatWelcome } from '@/components/chat';
import { useUIConfigSection } from '@/hooks/use-ui-config';
import { useAgent } from '@/contexts/AgentContext';

export default function ChatPage() {
  return <ChatPageContent />;
}

function ChatPageContent() {
  const router = useRouter();
  const { getUserId, isUserAuthenticated, isReady } = useUserManager();
  const { serverStatus, agentStatus, connectionStatus, isAgentReady } = useAgent();

  const statusConfig = useUIConfigSection('status');
  const brandingConfig = useUIConfigSection('branding');

  const userId = getUserId();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isReady && !isUserAuthenticated()) {
      router.push('/login');
    }
  }, [isReady, isUserAuthenticated, router]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 mb-4"
            style={{ borderColor: brandingConfig.primaryColor }}
          ></div>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">{statusConfig.loadingText}</p>
        </div>
      </div>
    );
  }

  if (!isUserAuthenticated()) {
    return null;
  }

  // Agent initialization happens silently in background
  // No loading UI shown on welcome page

  return <NewChatWelcome userId={userId} />;
}
