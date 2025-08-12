'use client';

import { useState, useEffect, ReactNode, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useUserManager } from '@/lib/user-manager';
import { AppSidebar } from '@/components/sidebar';
import { SessionsProvider } from '@/contexts/SessionsContext';
import { UserDataProvider } from '@/contexts/UserDataContext';
import { PanelLeft } from 'lucide-react';
import SocketIOManager from '@/lib/socketio-manager';
import { PostHogTracking } from '@/lib/posthog';
import { SearchChatModal } from '@/components/chat/search-chat-modal';
import { AgentProvider } from '@/contexts/AgentContext';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { getAccessToken } = usePrivy();
  const { getUserId } = useUserManager();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const userId = getUserId();

  const handleSearchModalOpen = useCallback(() => {
    setIsSearchModalOpen(true);
  }, []);

  const handleSearchModalClose = useCallback(() => {
    setIsSearchModalOpen(false);
  }, []);

  // Global keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Track PostHog identification and socket connection state (AgentContext handles initialization)
  useEffect(() => {
    if (!userId) {
      return;
    }

    // Identify user with PostHog (for returning users who don't go through login)
    PostHogTracking.getInstance().identify(userId);

    console.log('[AppLayout] User identified for PostHog:', userId);

    // Monitor socket connection status (AgentContext handles initialization)
    const socketIOManager = SocketIOManager.getInstance();

    const checkConnection = () => {
      const connected = socketIOManager.isSocketConnected();
      setIsConnected(connected);

      if (!connected) {
        setTimeout(checkConnection, 1000);
      }
    };

    checkConnection();
  }, [userId]);

  return (
    <AgentProvider>
      <UserDataProvider>
        <SessionsProvider userId={getUserId()}>
          <>
            <div className="flex h-screen bg-black">
              {/* Mobile backdrop overlay */}
              {isMobileMenuOpen && (
                <div
                  className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              )}

              {/* Sidebar */}
              <div
                className={`
            fixed inset-y-0 left-0 z-50 lg:static lg:inset-0
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            transition-transform duration-300 ease-in-out
          `}
              >
                <AppSidebar
                  isCollapsed={isCollapsed}
                  onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
                  isConnected={isConnected}
                  isMobileMenuOpen={isMobileMenuOpen}
                  onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  onSearchOpen={handleSearchModalOpen}
                />
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0 relative overflow-hidden">
                {/* Mobile Menu Button - Fixed at top */}
                {!isMobileMenuOpen && (
                  <div className="lg:hidden fixed top-4 left-4 z-30">
                    <button
                      onClick={() => setIsMobileMenuOpen(true)}
                      className="p-2 rounded-md bg-black/50 backdrop-blur-sm border border-white/20 hover:bg-black/70 transition-colors shadow-sm"
                      aria-label="Open mobile menu"
                    >
                      <PanelLeft className="h-5 w-5 text-white" />
                    </button>
                  </div>
                )}

                <div className="h-full overflow-hidden">{children}</div>
              </div>
            </div>

            {/* Global Search Modal */}
            <SearchChatModal
              isOpen={isSearchModalOpen}
              onClose={handleSearchModalClose}
              onMobileMenuClose={() => setIsMobileMenuOpen(false)}
            />
          </>
        </SessionsProvider>
      </UserDataProvider>
    </AgentProvider>
  );
}
