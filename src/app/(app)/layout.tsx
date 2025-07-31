'use client';

import { useState, useEffect, ReactNode, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useUserManager } from '@/lib/user-manager';
import { AppSidebar } from '@/components/sidebar';
import { SessionsProvider } from '@/contexts/SessionsContext';
import { PanelLeft } from 'lucide-react';
import SocketIOManager from '@/lib/socketio-manager';
import { PostHogTracking } from '@/lib/posthog';
import { SearchChatModal } from '@/components/chat/search-chat-modal';

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

  // Initialize socket connection and track connection state
  useEffect(() => {
    if (!userId) {
      return;
    }

    // Identify user with PostHog (for returning users who don't go through login)
    PostHogTracking.getInstance().identify(userId);

    console.log('[AppLayout] Initializing socket connection for user:', userId);

    // Get socket instance
    const socketIOManager = SocketIOManager.getInstance();

    // Check if already connected
    if (socketIOManager.isSocketConnected()) {
      console.log('[AppLayout] Socket already connected');
      setIsConnected(true);
      return;
    }

    // Initialize socket connection with authentication
    try {
      // Get JWT token for Socket.IO authentication
      getAccessToken()
        .then((token) => {
          socketIOManager.initialize(userId, undefined, token);
        })
        .catch((error) => {
          console.error('[AppLayout] Failed to get access token for Socket.IO:', error);
          // Fallback to initialize without token
          socketIOManager.initialize(userId);
        });

      // Set up connection monitoring
      const checkConnection = () => {
        const connected = socketIOManager.isSocketConnected();
        console.log('[AppLayout] Connection check:', connected);
        setIsConnected(connected);

        if (!connected) {
          // Check again in 1 second if not connected
          setTimeout(checkConnection, 1000);
        }
      };

      // Start checking connection status
      checkConnection();
    } catch (error) {
      console.error('[AppLayout] Failed to initialize socket connection:', error);
      setIsConnected(false);
    }
  }, [userId]);

  return (
    <SessionsProvider userId={getUserId()}>
      <>
        <div className="flex h-screen bg-white dark:bg-[#292929]">
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
                  className="p-2 rounded-md bg-white dark:bg-[#292929] border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#333333] transition-colors shadow-sm"
                  aria-label="Open mobile menu"
                >
                  <PanelLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
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
  );
}
