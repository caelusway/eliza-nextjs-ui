'use client';

import React from 'react';
import { ChatSessions } from '@/components/chat';

interface ChatSessionsListProps {
  userId: string | null;
  onMobileMenuClose?: () => void;
}

export function ChatSessionsList({ userId, onMobileMenuClose }: ChatSessionsListProps) {
  if (!userId) return null;

  return (
    <div className="px-4 pb-4">
      <div className="mb-3">
      </div>
      <div className="max-h-[40vh] overflow-y-auto">
        <ChatSessions 
          userId={userId} 
          showSidebar={true} 
          onMobileMenuClose={onMobileMenuClose}
        />
      </div>
    </div>
  );
} 