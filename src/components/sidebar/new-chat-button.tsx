'use client';

import React, { useCallback } from 'react';
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

  const handleNewChat = useCallback(() => {
    if (!userId) return;

    // Call the onNewChat callback if provided, otherwise redirect to /chat
    if (onNewChat) {
      onNewChat();
    } else {
      router.push('/chat');
    }
  }, [userId, router, onNewChat]);

  return (
    <div>
      <button
        onClick={handleNewChat}
        disabled={false}
        className={cn(
          'flex items-center rounded-lg transition-colors',
          'text-white border border-dashed border-white/20 hover:border-white/40',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isCollapsed ? 'w-10 h-10 justify-center' : 'w-full gap-3 p-3'
        )}
        style={{
          backgroundColor: '#141414',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = getDarkerShade('#141414');
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#141414';
        }}
        title={isCollapsed ? sidebarConfig.newChatText : undefined}
      >
        <Plus className={cn('flex-shrink-0', isCollapsed ? 'w-5 h-5' : 'w-4 h-4')} />
        {!isCollapsed && <span className="text-sm font-medium">{sidebarConfig.newChatText}</span>}
      </button>
    </div>
  );
}
