'use client';

import React from 'react';
import { Globe, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIConfigSection } from '@/hooks/use-ui-config';

interface ChatOptionsProps {
  currentChannel: string | null;
  userId: string | null;
  isConnected: boolean;
  onPublicChat: () => void;
  onPrivateChat: () => void;
}

export function ChatOptions({
  currentChannel,
  userId,
  isConnected,
  onPublicChat,
  onPrivateChat,
}: ChatOptionsProps) {
  const sidebarConfig = useUIConfigSection('sidebar');

  return (
    <div className="px-4 py-1 space-y-1">
      {/* Public Chat */}
      {false && (
        <button
          onClick={onPublicChat}
          className={cn(
            'w-full flex items-center gap-3 p-2 rounded-lg transition-colors',
            currentChannel === 'public-chat'
              ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white'
              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
          )}
        >
          <div className="flex-shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium">{sidebarConfig.publicChatTitle}</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              {sidebarConfig.publicChatDescription}
            </div>
          </div>
          <div className="flex-shrink-0">
            <div
              className={cn('w-2 h-2 rounded-full', isConnected ? 'bg-green-500' : 'bg-yellow-500')}
            />
          </div>
        </button>
      )}

      {/* Private Chat */}
      <button
        onClick={onPrivateChat}
        className={cn(
          'w-full flex items-center gap-3 p-2 rounded-lg transition-colors',
          currentChannel === `private-${userId}`
            ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white'
            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
        )}
      >
        <div className="flex-shrink-0">
          <Lock className="w-4 h-4" />
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-medium">{sidebarConfig.privateChatTitle}</div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            {sidebarConfig.privateChatDescription}
          </div>
        </div>
        <div className="flex-shrink-0">
          <div
            className={cn('w-2 h-2 rounded-full', isConnected ? 'bg-blue-500' : 'bg-gray-500')}
          />
        </div>
      </button>
    </div>
  );
}
