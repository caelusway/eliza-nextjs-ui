'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserManager } from '@/lib/user-manager';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIConfigSection } from '@/hooks/use-ui-config';

interface NewChatButtonProps {
  onNewChat?: () => void;
  isCollapsed?: boolean;
}

export function NewChatButton({ onNewChat, isCollapsed = false }: NewChatButtonProps) {
  const router = useRouter();
  const { getUserId } = useUserManager();
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sidebarConfig = useUIConfigSection('sidebar');
  const brandingConfig = useUIConfigSection('branding');

  const userId = getUserId();

  // Helper function to get darker shade for hover states
  const getDarkerShade = (color: string) => {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const num = parseInt(hex, 16);
      const r = Math.max(0, (num >> 16) - 20);
      const g = Math.max(0, ((num >> 8) & 0x00ff) - 20);
      const b = Math.max(0, (num & 0x0000ff) - 20);
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
    return color;
  };

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
          initialMessage: `I'm ${brandingConfig.appName}, here to help with longevity research and biological aging interventions. What research question can I explore for you today?`,
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
          'flex items-center rounded-lg transition-colors',
          'text-white border border-dashed border-white/20 hover:border-white/40',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isCollapsed
            ? 'w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 justify-center'
            : 'w-full gap-3 p-3'
        )}
        style={{
          backgroundColor: brandingConfig.primaryColor,
        }}
        onMouseEnter={(e) => {
          if (!isCreatingSession) {
            e.currentTarget.style.backgroundColor = getDarkerShade(brandingConfig.primaryColor);
          }
        }}
        onMouseLeave={(e) => {
          if (!isCreatingSession) {
            e.currentTarget.style.backgroundColor = brandingConfig.primaryColor;
          }
        }}
        title={
          isCollapsed
            ? isCreatingSession
              ? sidebarConfig.creatingText
              : sidebarConfig.newChatText
            : undefined
        }
      >
        <Plus
          className={cn(
            'flex-shrink-0',
            isCollapsed ? 'w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6' : 'w-4 h-4'
          )}
        />
        {!isCollapsed && (
          <span className="text-sm font-medium">
            {isCreatingSession ? sidebarConfig.creatingText : sidebarConfig.newChatText}
          </span>
        )}
      </button>
      {error && <div className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</div>}
    </div>
  );
}
