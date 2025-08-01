'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Eye, Calendar, ExternalLink, MessageSquare, ArrowLeft, Share2 } from 'lucide-react';
import { PublicChatMessages } from '@/components/chat/public-chat-messages';
import { Logo } from '@/components/ui/logo';
import type { ChatMessage } from '@/types/chat-message';

interface SharedSession {
  id: string;
  session_id: string;
  owner_id: string;
  public_id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  view_count: number;
}

interface PublicChatViewProps {
  sharedSession: SharedSession;
}

export const PublicChatView = ({ sharedSession }: PublicChatViewProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Removed auto-scroll related state and refs
  const [visitorId] = useState(() => {
    // Generate or get visitor ID
    if (typeof window !== 'undefined') {
      const existing = localStorage.getItem('visitor_id');
      if (existing) return existing;
      const newId = crypto.randomUUID();
      localStorage.setItem('visitor_id', newId);
      return newId;
    }
    return crypto.randomUUID();
  });
  const sessionStartTime = useRef<number>(Date.now());

  // Removed scrollToBottom function

  // Track analytics
  const trackPageView = useCallback(async () => {
    try {
      const requestData = {
        sharedSessionId: sharedSession.id,
        visitorId,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
      };
      console.log('[PublicChatView] Tracking page view with data:', requestData);
      
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        console.error('[PublicChatView] Analytics track failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('[PublicChatView] Analytics error details:', errorText);
        return; // Don't throw, just log and continue
      }

      const result = await response.json();
      if (result.message) {
        // View was already tracked for this visitor recently
        console.log('[PublicChatView] View already tracked for this visitor within 24 hours');
      } else {
        console.log('[PublicChatView] New unique view tracked');
      }
    } catch (error) {
      console.error('[PublicChatView] Failed to track page view:', error);
      // Don't let analytics failures break the component
    }
  }, [sharedSession.id, visitorId]);

  const trackSessionEnd = useCallback(async () => {
    const sessionDuration = Math.floor((Date.now() - sessionStartTime.current) / 1000);

    try {
      const requestData = {
        sharedSessionId: sharedSession.id,
        visitorId,
        sessionDuration,
      };
      console.log('[PublicChatView] Tracking session end with data:', requestData);
      
      const response = await fetch('/api/analytics/track', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        console.error('[PublicChatView] Analytics session end failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('[PublicChatView] Analytics session end error details:', errorText);
        return; // Don't throw, just log and continue
      }

      console.log('[PublicChatView] Session end tracked successfully');
    } catch (error) {
      console.error('[PublicChatView] Failed to track session end:', error);
    }
  }, [sharedSession.id, visitorId]);

  // Track page view on mount
  useEffect(() => {
    trackPageView();

    // Set up event listeners for session end tracking
    const handleBeforeUnload = () => {
      trackSessionEnd();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackSessionEnd();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      trackSessionEnd();
    };
  }, [trackPageView, trackSessionEnd]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('[PublicChatView] Fetching messages for public_id:', sharedSession.public_id);

        // Fetch live messages from the shared session (no authentication needed for public view)
        const response = await fetch(`/api/shared-sessions/${sharedSession.public_id}/messages`);

        if (!response.ok) {
          console.error('[PublicChatView] Messages fetch failed:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('[PublicChatView] Messages fetch error details:', errorText);
          throw new Error(`Failed to load chat messages (${response.status}): ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[PublicChatView] Messages fetch response:', data);

        if (data.success && data.data?.messages) {
          console.log('[PublicChatView] Successfully loaded', data.data.messages.length, 'messages');
          setMessages(data.data.messages);
        } else {
          console.log('[PublicChatView] No messages found or invalid response format');
          setMessages([]);
        }
      } catch (err) {
        console.error('[PublicChatView] Error fetching messages:', err);
        setError('Failed to load chat messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [sharedSession.public_id]);

  // Remove automatic scrolling to allow free user scrolling

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return formatDate(dateString);
    }
  };

  return (
    <div style={{ height: 'auto', overflow: 'visible' }} className="w-full">
      {/* Header Section */}
      <header className="bg-white dark:bg-[#1a1a1a] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto  px-6 sm:px-6 py-6">
          {/* Logo Section */}
          <div className="text-center lg:text-left">
            <Logo 
              width={180}
              height={45}
              className="w-auto mx-auto lg:mx-0"
              src="/assets/logo_text.png"
            />
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className="bg-gray-50 dark:bg-[#292929] flex-1 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {sharedSession.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm mb-4 text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{messages.length} messages</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{sharedSession.view_count} views</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Shared {formatTimeAgo(sharedSession.created_at)}</span>
            </div>
          </div>

          {sharedSession.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-3 text-base">
              {sharedSession.description}
            </p>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 dark:border-gray-700 border-t-blue-500 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 text-lg">Loading conversation...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 max-w-md mx-auto">
                <p className="text-red-600 dark:text-red-400 text-lg">{error}</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-20">
              <div className="space-y-6">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto">
                  <MessageSquare className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    No messages yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    This conversation is just getting started.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 mt-8">
              <PublicChatMessages messages={messages} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
