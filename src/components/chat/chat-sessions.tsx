'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSessions } from '@/contexts/SessionsContext';

// Simple spinner component
const LoadingSpinner = () => (
  <svg
    className="animate-spin h-4 w-4 text-zinc-600 dark:text-zinc-400"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

interface ChatSession {
  id: string;
  title: string;
  messageCount: number;
  lastActivity: string;
  preview: string;
  isFromAgent: boolean;
  channelId?: string;
}

interface ChatSessionsProps {
  userId: string | null;
  currentSessionId?: string;
  showSwitcher?: boolean;
  showSidebar?: boolean;
  onMobileMenuClose?: () => void;
}

export const ChatSessions = ({
  userId,
  currentSessionId,
  showSwitcher = false,
  showSidebar = false,
  onMobileMenuClose,
}: ChatSessionsProps) => {
  const { sessions, loading, error, setCurrentSession } = useSessions();
  const router = useRouter();

  // Group sessions by time periods like the old UI
  const groupedSessions = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const groups: { [key: string]: any[] } = {
      'Today': [],
      'Yesterday': [],
      'Previous 7 days': [],
      'Older': []
    };
    
    const filteredSessions = showSwitcher
      ? sessions.filter((s) => s.id !== currentSessionId)
      : sessions;
    
    filteredSessions.forEach(session => {
      const sessionDate = new Date(session.lastActivity);
      if (sessionDate >= today) {
        groups['Today'].push(session);
      } else if (sessionDate >= yesterday) {
        groups['Yesterday'].push(session);
      } else if (sessionDate >= lastWeek) {
        groups['Previous 7 days'].push(session);
      } else {
        groups['Older'].push(session);
      }
    });
    
    return groups;
  }, [sessions, currentSessionId, showSwitcher]);

  const handleSessionClick = (session: any) => {
    // Set current session in context
    setCurrentSession(session);
    
    // Navigate to the chat session page
    router.push(`/chat/${session.id}`);
    
    // Close mobile menu if provided
    onMobileMenuClose?.();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Render grouped sessions like the old UI
  const renderConversationGroups = () => {
    return Object.entries(groupedSessions).map(([group, groupSessions]) => {
      const sessions = groupSessions as ChatSession[];
      if (sessions.length === 0) return null;
      
      return (
        <div key={group} className="mb-4">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 px-1 py-1 font-medium">
            {group}
          </div>
          <div className="space-y-1">
            {sessions.map(session => (
              <div
                key={session.id}
                className={cn(
                  "group flex items-center rounded-lg transition-colors duration-200 cursor-pointer",
                  currentSessionId === session.id
                    ? "bg-zinc-200 dark:bg-zinc-800"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
                onClick={() => handleSessionClick(session)}
              >
                <div className="flex-1 flex items-center px-3 py-2 text-sm text-zinc-900 dark:text-white text-left min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-normal">
                      {session.title || 'New conversation'}
                    </div>
                    
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    });
  };

  if (!userId) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2">
          <LoadingSpinner />
          <span className="text-zinc-600 dark:text-zinc-400">Loading chat sessions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-300 text-sm">
          Failed to load chat sessions: {error}
        </p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className={`${showSidebar ? 'py-4' : 'py-8'} text-center`}>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          {showSwitcher
            ? 'No other chat sessions found'
            : showSidebar
              ? 'No conversations yet'
              : 'No previous chat sessions'}
        </p>
        {showSidebar && (
          <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-2">
            Start a new conversation to see it here
          </p>
        )}
      </div>
    );
  }

  // For non-sidebar views, use the old card-based layout
  if (!showSidebar) {
    const filteredSessions = showSwitcher
      ? sessions.filter((s) => s.id !== currentSessionId)
      : sessions;

    if (showSwitcher && filteredSessions.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">No other chat sessions found</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {showSwitcher && (
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
            Switch to another conversation:
          </h3>
        )}

        {!showSwitcher && (
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            Previous Conversations
          </h3>
        )}

        <div className="space-y-2">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleSessionClick(session)}
              className="group cursor-pointer bg-white dark:bg-zinc-950 border border-zinc-950/10 dark:border-white/10 rounded-lg p-4 hover:bg-zinc-950/[2.5%] dark:hover:bg-white/[2.5%] transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-zinc-900 dark:text-white text-sm group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors line-clamp-1">
                    {session.title || 'New conversation'}
                  </h4>
                  {session.preview && (
                    <p className="text-zinc-600 dark:text-zinc-400 text-xs mt-1 line-clamp-2">
                      {session.isFromAgent ? '🤖 ' : ''}
                      {session.preview}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>
                      {session.messageCount} message
                      {session.messageCount !== 1 ? 's' : ''}
                    </span>
                    <span>•</span>
                    <span>{formatTimeAgo(session.lastActivity)}</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // For sidebar view, use the grouped layout like the old UI
  return (
    <div className="space-y-1">
      {renderConversationGroups()}
    </div>
  );
};

export default ChatSessions;
