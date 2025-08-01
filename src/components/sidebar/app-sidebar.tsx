'use client';

import React, { useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserManager } from '@/lib/user-manager';
import { usePrivy } from '@privy-io/react-auth';
import { cn } from '@/lib/utils';
import { PanelLeftClose, PanelLeft, UserPlus, Share2, Search } from 'lucide-react';
import { SidebarHeader } from './sidebar-header';
import { NewChatButton } from './new-chat-button';
import { NavigationMenu } from './navigation-menu';
import { ChatSessionsList } from './chat-sessions-list';
import { UserProfile } from './user-profile';
import { CollapsedUserMenu } from './collapsed-user-menu';
import { PostHogTracking } from '@/lib/posthog';
import { useUIConfigSection } from '@/hooks/use-ui-config';

interface AppSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isConnected: boolean;
  isMobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
  onSearchOpen?: () => void;
}

export function AppSidebar({
  isCollapsed,
  onToggleCollapse,
  isConnected,
  isMobileMenuOpen = false,
  onMobileMenuToggle,
  onSearchOpen,
}: AppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { getUserId, getUserName, isUserAuthenticated } = useUserManager();
  const { logout } = usePrivy();

  const sidebarConfig = useUIConfigSection('sidebar');
  const brandingConfig = useUIConfigSection('branding');

  const userId = getUserId();

  const handleLogout = useCallback(() => {
    // Track sign out event before logging out
    PostHogTracking.getInstance().userSignOut();
    logout();
    router.push('/login');
  }, [logout, router]);

  const handleNewPrivateChat = useCallback(() => {
    // Close mobile menu when navigating
    if (onMobileMenuToggle) {
      onMobileMenuToggle();
    }

    router.push('/chat');
  }, [router, onMobileMenuToggle]);

  const handleInvitesNavigation = useCallback(() => {
    router.push('/invites');
    // Close mobile menu when navigating
    if (onMobileMenuToggle) {
      onMobileMenuToggle();
    }
  }, [router, onMobileMenuToggle]);

  const handleSharedSessionsNavigation = useCallback(() => {
    router.push('/shared-sessions');
    // Close mobile menu when navigating
    if (onMobileMenuToggle) {
      onMobileMenuToggle();
    }
  }, [router, onMobileMenuToggle]);

  if (!isUserAuthenticated()) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-zinc-50 dark:bg-[#1f1f1f] border-r border-gray-200 dark:border-gray-700 transition-all duration-300',
        // Mobile: always full width, Desktop: respect collapsed state
        'w-72 sm:w-72 md:w-72',
        isCollapsed ? 'lg:w-16 xl:w-16' : 'lg:w-72 xl:w-80'
      )}
    >
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
          <div className="hidden lg:flex lg:flex-col lg:h-full">
            {/* Top section with New Chat and navigation icons */}
            <div className="flex flex-col items-center space-y-3 px-2 py-4">
              {/* New Chat Button */}
              <NewChatButton onNewChat={handleNewPrivateChat} isCollapsed={isCollapsed} />

              {/* Search Icon */}
              <button
                onClick={onSearchOpen}
                className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors group"
                title="Search Chats (⌘K)"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Invite Icon */}
              <button
                onClick={handleInvitesNavigation}
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center transition-colors group',
                  pathname === '/invites'
                    ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-800'
                    : 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                )}
                title="Invite Friends"
              >
                <UserPlus className="w-5 h-5" />
              </button>

              {/* Shared Sessions Icon */}
              <button
                onClick={handleSharedSessionsNavigation}
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center transition-colors group',
                  pathname === '/shared-sessions'
                    ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-800'
                    : 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                )}
                title="Shared Sessions"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom section with User Menu */}
            <div className="mt-auto flex flex-col items-center space-y-3 px-2 py-4 border-t border-zinc-200 dark:border-zinc-700">
              {/* Collapsed User Menu */}
              <CollapsedUserMenu userName={getUserName()} onLogout={handleLogout} />
            </div>
          </div>
        )}

        {/* Mobile & Desktop Expanded Mode - Full menu items */}
        {!isCollapsed && (
          <div className="block lg:block">
            {/* New Chat Button */}
            <div className="p-2 px-4">
              <NewChatButton onNewChat={handleNewPrivateChat} isCollapsed={false} />
            </div>

            {/* Menu Section */}
            <div className="mb-1">
              <NavigationMenu onMobileMenuClose={onMobileMenuToggle} onSearchOpen={onSearchOpen} />
            </div>
            {/* Divider */}
            <div className="mx-4 border-t border-gray-200 dark:border-gray-600" />

            {/* Chat Sessions Section */}
            <div className="mb-4">
              <div className="px-4 pb-2 pt-4">
                <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  {sidebarConfig.recentChatsText}
                </h3>
              </div>
              <ChatSessionsList userId={userId} onMobileMenuClose={onMobileMenuToggle} />
            </div>
          </div>
        )}
      </div>

      {/* Footer - Only show in expanded mode */}
      {!isCollapsed && (
        <UserProfile
          isCollapsed={isCollapsed}
          userName={getUserName()}
          userId={userId}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
