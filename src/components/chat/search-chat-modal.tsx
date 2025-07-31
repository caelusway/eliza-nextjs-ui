'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Search, MessageCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSessions } from '@/contexts/SessionsContext';

interface SearchChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMobileMenuClose?: () => void;
}

interface ChatSession {
  id: string;
  title: string;
  messageCount: number;
  lastActivity: string;
  preview: string;
  isFromAgent: boolean;
  channelId?: string;
}

export const SearchChatModal = ({ isOpen, onClose, onMobileMenuClose }: SearchChatModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [clickedSessionId, setClickedSessionId] = useState<string | null>(null);
  const { sessions, loading, setCurrentSession } = useSessions();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Group sessions by time periods
  const groupedSessions = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups: { [key: string]: ChatSession[] } = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: [],
    };

    // Filter sessions based on search query
    const filteredSessions = sessions.filter((session) => {
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      return (
        session.title?.toLowerCase().includes(query) ||
        session.preview?.toLowerCase().includes(query)
      );
    });

    filteredSessions.forEach((session) => {
      const sessionDate = new Date(session.lastActivity);
      if (sessionDate >= today) {
        groups['Today'].push(session);
      } else if (sessionDate >= yesterday) {
        groups['Yesterday'].push(session);
      } else if (sessionDate >= lastWeek) {
        groups['Previous 7 Days'].push(session);
      } else {
        groups['Older'].push(session);
      }
    });

    return groups;
  }, [sessions, searchQuery]);

  // Flatten groups for keyboard navigation
  const flatSessions = useMemo(() => {
    const flat: ChatSession[] = [];
    Object.values(groupedSessions).forEach((groupSessions) => {
      flat.push(...groupSessions);
    });
    return flat;
  }, [groupedSessions]);

  // Reset selected index when search query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Reset navigation state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsNavigating(false);
      setClickedSessionId(null);
    }
  }, [isOpen]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, flatSessions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (flatSessions[selectedIndex]) {
            handleSessionSelect(flatSessions[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, selectedIndex, flatSessions, onClose]);

  // Handle session selection
  const handleSessionSelect = (session: ChatSession) => {
    if (isNavigating || clickedSessionId === session.id) return;
    
    // Show immediate visual feedback
    setClickedSessionId(session.id);
    setIsNavigating(true);
    setCurrentSession(session);
    
    // Small delay to show the visual feedback, then navigate
    setTimeout(() => {
      try {
        router.push(`/chat/${session.id}`);
        onClose();
        onMobileMenuClose?.();
      } catch (error) {
        console.error('Navigation error:', error);
        // Reset states on error
        setIsNavigating(false);
        setClickedSessionId(null);
      }
    }, 100);
  };

  // Format time ago
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

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalSessions = flatSessions.length;
  const hasNoResults = searchQuery.trim() && totalSessions === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-3xl mx-auto bg-white dark:bg-[#1f1f1f] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700/50">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-lg placeholder-gray-400 dark:placeholder-gray-500 outline-none text-gray-900 dark:text-white"
          />
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[500px] overflow-y-auto relative">
          {isNavigating && !clickedSessionId && (
            <div className="absolute inset-0 bg-white/80 dark:bg-[#1f1f1f]/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-600 dark:border-t-zinc-400 rounded-full animate-spin" />
                <span className="text-zinc-600 dark:text-zinc-400">Opening chat...</span>
              </div>
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-400 rounded-full" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading chats...</span>
            </div>
          ) : hasNoResults ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No chats found for "{searchQuery}"</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Try a different search term
              </p>
            </div>
          ) : totalSessions === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No chat sessions yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Start a conversation to see it here
              </p>
            </div>
          ) : (
            <>
              {/* New Chat Option */}
              {!searchQuery.trim() && (
                <div className="border-b border-gray-100 dark:border-gray-700/50">
                  <button
                    onClick={() => {
                      if (isNavigating) return;
                      setIsNavigating(true);
                      setTimeout(() => {
                        try {
                          router.push('/chat');
                          onClose();
                          onMobileMenuClose?.();
                        } catch (error) {
                          console.error('Navigation error:', error);
                          setIsNavigating(false);
                        }
                      }, 100);
                    }}
                    disabled={false}
                    className={cn(
                      'w-full flex items-center gap-3 p-4 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-all duration-200 ease-in-out',
                      selectedIndex === -1 && 'bg-zinc-100 dark:bg-zinc-700/60'
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <span className="font-medium text-zinc-900 dark:text-white">New chat</span>
                  </button>
                </div>
              )}

              {/* Session Groups */}
              {Object.entries(groupedSessions).map(([groupName, groupSessions]) => {
                if (groupSessions.length === 0) return null;

                return (
                  <div key={groupName}>
                    <div className="px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/30">
                      {groupName}
                    </div>
                    <div>
                      {groupSessions.map((session) => {
                        const globalIndex = flatSessions.indexOf(session);
                        const isSelected = globalIndex === selectedIndex;
                        const isClicked = clickedSessionId === session.id;

                        return (
                          <button
                            key={session.id}
                            onClick={() => handleSessionSelect(session)}
                            disabled={isClicked}
                            className={cn(
                              'w-full flex items-start gap-3 p-4 text-left transition-all duration-200 ease-in-out',
                              isSelected && !isClicked
                                ? 'bg-zinc-150 dark:bg-zinc-700/70 border-r-2 border-zinc-400 dark:border-zinc-500'
                                : 'hover:bg-zinc-100/90 dark:hover:bg-zinc-700/50',
                              isClicked
                                ? 'bg-zinc-200 dark:bg-zinc-600/80 scale-[0.98] shadow-inner cursor-not-allowed'
                                : '',
                              isNavigating && !isClicked && 'opacity-75'
                            )}
                          >
                            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                              {isClicked ? (
                                <div className="w-4 h-4 border-2 border-zinc-400 dark:border-zinc-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <MessageCircle className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-medium truncate text-zinc-900 dark:text-white">
                                  {session.title || 'New conversation'}
                                </h3>
                                <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 ml-2 flex-shrink-0">
                                  <Clock className="w-3 h-3" />
                                  {formatTimeAgo(session.lastActivity)}
                                </div>
                              </div>
                              {session.preview && (
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                                  {session.preview}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                                <span>
                                  {session.messageCount} message
                                  {session.messageCount !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && !hasNoResults && totalSessions > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/30">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Use ↑↓ to navigate, Enter to select</span>
              <span>
                {totalSessions} chat{totalSessions !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
