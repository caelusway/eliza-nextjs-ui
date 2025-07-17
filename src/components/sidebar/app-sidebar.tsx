'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserManager } from '@/lib/user-manager';
import { usePrivy } from '@privy-io/react-auth';
import { cn } from '@/lib/utils';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { SidebarHeader } from './sidebar-header';
import { NewChatButton } from './new-chat-button';
import { ChatOptions } from './chat-options';
import { NavigationMenu } from './navigation-menu';
import { ChatSessionsList } from './chat-sessions-list';
import { UserProfile } from './user-profile';
import { CompactInviteFriendsDialog } from '@/components/dialogs';

interface AppSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isConnected: boolean;
  isMobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
}

export function AppSidebar({
  isCollapsed,
  onToggleCollapse,
  isConnected,
  isMobileMenuOpen = false,
  onMobileMenuToggle
}: AppSidebarProps) {
  const router = useRouter();
  const { getUserId, getUserName, isUserAuthenticated } = useUserManager();
  const { logout } = usePrivy();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<string | null>(null);

  const userId = getUserId();

  const handleLogout = useCallback(() => {
    logout();
    router.push('/login');
  }, [logout, router]);

  const handleNewPrivateChat = useCallback(() => {
    setCurrentChannel(`private-${userId}`);
    router.push('/chat');
    // Close mobile menu when navigating
    if (onMobileMenuToggle) {
      onMobileMenuToggle();
    }
  }, [userId, router, onMobileMenuToggle]);

  const handlePublicChat = useCallback(() => {
    setCurrentChannel('public-chat');
    router.push('/chat');
    // Close mobile menu when navigating
    if (onMobileMenuToggle) {
      onMobileMenuToggle();
    }
  }, [router, onMobileMenuToggle]);

  if (!isUserAuthenticated()) {
    return null;
  }

  return (
    <>
      <div className={cn(
        "flex flex-col h-full bg-zinc-50 dark:bg-zinc-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300",
        // Mobile: always full width, Desktop: respect collapsed state
        "w-72 sm:w-72 md:w-72",
        isCollapsed ? "lg:w-16 xl:w-20" : "lg:w-72 xl:w-80"
      )}>
        {/* Header */}
        <SidebarHeader
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
          isConnected={isConnected}
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuToggle={onMobileMenuToggle}
        />

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          {/* Desktop Collapsed Mode - Icon-only layout */}
          {isCollapsed && (
            <div className="hidden lg:flex lg:flex-col lg:items-center lg:justify-start lg:space-y-3 lg:px-2 lg:py-4 xl:space-y-4 xl:px-3">
              {/* New Chat Button */}
              <NewChatButton onNewChat={handleNewPrivateChat} isCollapsed={isCollapsed} />

              {/* Account Icon */}
              <button
                onClick={() => router.push('/account')}
                className="w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors group"
                title="Account"
              >
                <svg className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>

              {/* Invite Icon */}
              <button
                onClick={() => setShowInviteDialog(true)}
                className="w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors group"
                title="Invite Friends"
              >
                <svg className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          )}

          {/* Mobile & Desktop Expanded Mode - Full menu items */}
          {!isCollapsed && (
            <div className="block lg:block">
              {/* New Chat Button */}
              <div className="p-4">
                <NewChatButton onNewChat={handleNewPrivateChat} isCollapsed={false} />
              </div>

              {/* Chat Options and Menu Section */}
              <div className="mb-1">

                <ChatOptions
                  currentChannel={currentChannel}
                  userId={userId}
                  isConnected={isConnected}
                  onPublicChat={handlePublicChat}
                  onPrivateChat={handleNewPrivateChat}
                />
                {/* Divider */}
                <div className="mx-4 border-t border-gray-200 dark:border-gray-800" />
                <NavigationMenu
                  onShowInviteDialog={() => setShowInviteDialog(true)}
                  onMobileMenuClose={onMobileMenuToggle}
                />
              </div>
              {/* Divider */}
              <div className="mx-4 border-t border-gray-200 dark:border-gray-800" />

              {/* Chat Sessions Section */}
              <div className="mb-4">
                <div className="px-4 pb-2 pt-4">
                  <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                    Recent Chats
                  </h3>
                </div>
                <ChatSessionsList
                  userId={userId}
                  onMobileMenuClose={onMobileMenuToggle}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <UserProfile
          isCollapsed={isCollapsed}
          userName={getUserName()}
          userId={userId}
          onLogout={handleLogout}
        />
      </div>

      {/* Invite Dialog */}
      <CompactInviteFriendsDialog
        isOpen={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
      />
    </>
  );
} 