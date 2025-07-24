'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserManager } from '@/lib/user-manager';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewChatButtonProps {
  onNewChat?: () => void;
  isCollapsed?: boolean;
}

export function NewChatButton({ onNewChat, isCollapsed = false }: NewChatButtonProps) {
  const router = useRouter();
  const { getUserId } = useUserManager();
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = getUserId();

  const handleCreateNewSession = useCallback(async () => {
    if (!userId) return;

    try {
      setIsCreatingSession(true);
      setError(null);

      const response = await fetch('/api/chat-session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          initialMessage: 'Hello! I would like to chat with you.',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create chat session');
      }

      // Call the onNewChat callback if provided
      onNewChat?.();

      // Redirect to the new session - tracking happens there
      router.push(`/chat/${data.data.sessionId}`);
    } catch (err) {
      console.error('[NewChatButton] Error creating session:', err);
      setError(err instanceof Error ? err.message : 'Failed to create chat session');
    } finally {
      setIsCreatingSession(false);
    }
  }, [userId, router, onNewChat]);

  return (
    <div>
      <button
        onClick={handleCreateNewSession}
        disabled={isCreatingSession}
        className={cn(
          "flex items-center rounded-lg transition-colors",
          "bg-[#FF6E71] hover:bg-[#FF6E71]/90 text-white",
          "border border-dashed border-white/20 hover:border-white/40",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isCollapsed 
            ? "w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 justify-center" 
            : "w-full gap-3 p-3"
        )}
        title={isCollapsed ? (isCreatingSession ? 'Creating...' : 'New Chat') : undefined}
      >
        <Plus className={cn(
          "flex-shrink-0",
          isCollapsed ? "w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6" : "w-4 h-4"
        )} />
        {!isCollapsed && (
          <span className="text-sm font-medium">
            {isCreatingSession ? 'Creating...' : 'New Chat'}
          </span>
        )}
      </button>
      {error && (
        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
} 