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
        "w-72",
        isCollapsed ? "lg:w-18" : "lg:w-72"
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
          {/* Mobile: always show content, Desktop: respect collapsed state */}
          <div className={cn(
            "lg:block",
            isCollapsed ? "lg:hidden" : "block"
          )}>
            {/* New Chat Button */}
            <div className="p-4">
              <NewChatButton onNewChat={handleNewPrivateChat} />
            </div>

            {/* Chat Options */}
            <ChatOptions 
              currentChannel={currentChannel}
              userId={userId}
              isConnected={isConnected}
              onPublicChat={handlePublicChat}
              onPrivateChat={handleNewPrivateChat}
            />

            {/* Divider */}
            <div className="mx-4 border-t border-gray-200 dark:border-gray-800" />

            {/* Additional Navigation */}
            <NavigationMenu 
              onShowInviteDialog={() => setShowInviteDialog(true)} 
              onMobileMenuClose={onMobileMenuToggle}
            />

            {/* Divider */}
            <div className="mx-4 border-t border-gray-200 dark:border-gray-800" />

            {/* Chat Sessions */}
            <ChatSessionsList 
              userId={userId} 
              onMobileMenuClose={onMobileMenuToggle}
            />
          </div>
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