'use client';

import { useRouter } from 'next/navigation';

// Extend window interface for pre-loaded follow-up questions
declare global {
  interface Window {
    _preloadedFollowUpQuestions?: string[];
  }
}
import { useCallback, useEffect, useRef, useState, FormEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { ChatMessages } from '@/components/chat/chat-messages';
import { TextareaWithActions } from '@/components/ui/textarea-with-actions';
import { toast } from '@/components/ui';
import { CHAT_SOURCE, MESSAGE_STATE_MESSAGES } from '@/constants';
import SocketIOManager, {
  ControlMessageData,
  MessageBroadcastData,
  MessageStateData,
} from '@/lib/socketio-manager';
import { SocketDebugUtils } from '@/lib/socket-debug-utils';
import type { ChatMessage } from '@/types/chat-message';
import { useAuthenticatedAPI } from '@/hooks/useAuthenticatedAPI';
import { useAuthenticatedFetch } from '@/lib/authenticated-fetch';
import { useUserManager } from '@/lib/user-manager';
import { usePrivy } from '@privy-io/react-auth';
import { PostHogTracking } from '@/lib/posthog';
import { logUserPrompt } from '@/services/prompt-service';
import { ShareButton } from '@/components/chat/share-button';

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
  metadata?: {
    initialMessage?: string;
  };
}

interface ChatProps {
  sessionId?: string;
  sessionData?: ChatSession;
}

export const Chat = ({
  sessionId: propSessionId,
  sessionData: propSessionData,
}: ChatProps = {}) => {
  const router = useRouter();

  // --- Environment Configuration ---
  const agentId = process.env.NEXT_PUBLIC_AGENT_ID;
  const serverId = '00000000-0000-0000-0000-000000000000'; // Default server ID from ElizaOS

  // --- User Management ---
  const { getUserId, getUserName, getUserEmail, isUserAuthenticated, isReady } = useUserManager();
  const { getAccessToken } = usePrivy();

  // --- Authenticated API ---
  const authenticatedAPI = useAuthenticatedAPI();
  const authenticatedFetch = useAuthenticatedFetch();

  // --- State ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [inputDisabled, setInputDisabled] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(propSessionId || null);
  const [sessionData, setSessionData] = useState<ChatSession | null>(propSessionData || null);
  const [followUpQues, setFollowUpQues] = useState<string[] | undefined>([]);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [isPositioned, setIsPositioned] = useState<boolean>(false);
  const [hasInitiallyPositioned, setHasInitiallyPositioned] = useState<boolean>(false);
  const [isAgentThinking, setIsAgentThinking] = useState<boolean>(false);
  const [agentMessageState, setAgentMessageState] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>(
    'connecting'
  );
  const [isUserScrolled, setIsUserScrolled] = useState<boolean>(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState<boolean>(false); // Always false to prevent any auto-scroll
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [agentStatus, setAgentStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [deepResearchEnabled, setDeepResearchEnabled] = useState<boolean>(false);
  const [showDynamicSpacing, setShowDynamicSpacing] = useState<boolean>(false);

  // File upload state
  const [isFileUploading, setIsFileUploading] = useState<boolean>(false);

  // Real-time session tracking
  const [currentMessageCount, setCurrentMessageCount] = useState<number>(0);
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const [timeUpdateTrigger, setTimeUpdateTrigger] = useState<number>(0);

  // Agent readiness tracking
  const [isWaitingForAgent, setIsWaitingForAgent] = useState<boolean>(false);
  const [agentReadinessMessage, setAgentReadinessMessage] = useState<string>('');

  // Animation safeguards
  const [isWaitingForResponse, setIsWaitingForResponse] = useState<boolean>(false);
  const [animationLocked, setAnimationLocked] = useState<boolean>(false);
  const [animationStartTime, setAnimationStartTime] = useState<number | null>(null);

  // --- Refs ---
  const initStartedRef = useRef(false);
  const sessionSetupDone = useRef<string | null>(null); // Track which session has been set up
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const latestUserMessageRef = useRef<HTMLDivElement>(null); // ChatGPT-style scroll target for user messages
  const latestMessageRef = useRef<HTMLDivElement>(null); // For scrolling to latest message (user or agent)
  const sendMessageRef = useRef<
    ((messageText: string, options?: { useInternalKnowledge?: boolean }) => void) | null
  >(null);
  const socketIOManager = SocketIOManager.getInstance();
  const isCurrentlyThinking = useRef<boolean>(false);

  // Function to check if user is scrolled to bottom
  const isScrolledToBottom = useCallback(() => {
    if (!messagesContainerRef.current) return true;
    const container = messagesContainerRef.current;
    const threshold = 50; // Smaller threshold - must be very close to bottom
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const isAtBottom = distanceFromBottom <= threshold;

    // Debug logging
    if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
      console.log('[Scroll Debug]', {
        distanceFromBottom,
        threshold,
        isAtBottom,
        scrollHeight: container.scrollHeight,
        scrollTop: container.scrollTop,
        clientHeight: container.clientHeight,
      });
    }

    return isAtBottom;
  }, []);

  // Scroll event handler
  const handleScroll = useCallback(() => {
    const isAtBottom = isScrolledToBottom();
    const userHasScrolledUp = !isAtBottom;

    setIsUserScrolled(userHasScrolledUp);
    // Never auto-scroll - always keep it false
    setShouldAutoScroll(false);

    if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
      console.log('[Scroll State]', {
        isAtBottom,
        userHasScrolledUp,
        shouldAutoScroll: false, // Always false
      });
    }
  }, [isScrolledToBottom]);

  // Function to scroll to bottom manually
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      // Update states after scrolling but keep auto-scroll disabled
      setTimeout(() => {
        setShouldAutoScroll(false); // Keep disabled
        setIsUserScrolled(false);
      }, 100);
    }
  }, []);

  // Universal scroll: scroll latest message (user or agent) to top with spacing
  const scrollLatestMessageToTop = useCallback(() => {
    console.log('[Universal Scroll] Function called, checking elements...');
    
    if (!messagesContainerRef.current) {
      console.warn('[Universal Scroll] No messages container ref available');
      return;
    }

    const container = messagesContainerRef.current;
    let messageElement = latestMessageRef.current;

    // Fallback: find the last message element directly
    if (!messageElement) {
      console.log('[Universal Scroll] Latest message ref not available, searching for last message...');
      const allMessageDivs = container.querySelectorAll('[data-message-sender]');
      if (allMessageDivs.length > 0) {
        messageElement = allMessageDivs[allMessageDivs.length - 1] as HTMLDivElement;
        console.log('[Universal Scroll] Found last message via fallback search');
      }
    }

    if (!messageElement) {
      console.warn('[Universal Scroll] No message element found');
      return;
    }

    console.log('[Universal Scroll] Starting aggressive scroll sequence...');
    
    // OPTIMIZED SPACING CALCULATION - account for fixed header overlay
    const calculateOptimalSpacing = () => {
      const viewportHeight = window.innerHeight;
      const containerHeight = container.clientHeight;
      const messageHeight = messageElement.offsetHeight;
      
      // Calculate actual fixed header height with mobile considerations
      let headerHeight = 150; // fallback value
      let mobileMenuHeight = 0;
      
      try {
        // Find the fixed header by looking for the previous sibling of the messages container
        const messagesScrollContainer = container; // This is messagesContainerRef.current
        const parentContainer = messagesScrollContainer.parentElement;
        if (parentContainer) {
          const headerElement = parentContainer.querySelector('.flex-shrink-0');
          if (headerElement) {
            headerHeight = headerElement.getBoundingClientRect().height;
            console.log('[Universal Scroll] Measured actual header height:', headerHeight);
          }
        }
        
        // On mobile/tablet, account for the mobile menu button overlay
        const isMobileView = window.innerWidth < 1024; // lg breakpoint
        if (isMobileView) {
          const mobileMenuButton = document.querySelector('.lg\\:hidden [aria-label="Open mobile menu"]');
          if (mobileMenuButton) {
            const buttonRect = mobileMenuButton.getBoundingClientRect();
            // Mobile button: top-4 (16px) + button height + small buffer
            mobileMenuHeight = Math.max(buttonRect.bottom + 8, 48); // Ensure minimum clearance
            console.log('[Universal Scroll] Mobile menu button height:', mobileMenuHeight);
          } else {
            // Fallback: top-4 (16px) + p-2 (8px * 2) + icon height (20px) + buffer
            mobileMenuHeight = 16 + 16 + 20 + 8; // 60px total
          }
        }
      } catch (error) {
        console.warn('[Universal Scroll] Could not measure header height, using fallback');
      }
      
      // Calculate total spacing needed: header + mobile menu (if applicable) + buffer
      const isMobileView = window.innerWidth < 1024;
      let totalSpacing;
      
      if (isMobileView) {
        // Mobile: Use viewport-based calculation to ensure message is in the center area
        const mobileSpacing = Math.min(viewportHeight * 0.4, 300); // 40% of viewport or max 300px
        totalSpacing = Math.max(headerHeight, mobileMenuHeight, mobileSpacing);
        console.log('[Mobile Debug] Using viewport-based mobile spacing:', {
          viewportHeight,
          calculatedSpacing: mobileSpacing,
          finalSpacing: totalSpacing
        });
      } else {
        // Desktop: Use normal calculation
        totalSpacing = Math.max(headerHeight, mobileMenuHeight) + 40;
      }
      
      const dynamicSpacing = totalSpacing;
      
      console.log('[Universal Scroll] Calculated spacing to clear fixed header overlay:', {
        viewportHeight,
        containerHeight,
        messageHeight,
        headerHeight,
        mobileMenuHeight,
        totalSpacing,
        dynamicSpacing,
        isMobileView: window.innerWidth < 1024,
        messageOffsetTop: messageElement.offsetTop,
        windowWidth: window.innerWidth,
        targetScrollPosition: messageElement.offsetTop - dynamicSpacing
      });
      
      return dynamicSpacing;
    };
    
    // AGGRESSIVE SCROLL SEQUENCE - try multiple methods immediately
    const performScroll = () => {
      const optimalSpacing = calculateOptimalSpacing();
      
      console.log('[Universal Scroll] Performing scroll with optimal spacing:', optimalSpacing);
      
      // Method 1: Direct scrollTo calculation with dynamic spacing (most accurate)
      const messageOffsetInDocument = messageElement.offsetTop;
      const targetScrollTop = Math.max(0, messageOffsetInDocument - optimalSpacing);
      
      // Debug mobile scroll behavior
      if (window.innerWidth < 1024) {
        console.log('[Mobile Scroll Debug] Container and message details:', {
          containerScrollHeight: container.scrollHeight,
          containerClientHeight: container.clientHeight,
          containerScrollTop: container.scrollTop,
          messageOffsetTop: messageOffsetInDocument,
          optimalSpacing: optimalSpacing,
          targetScrollTop: targetScrollTop,
          messageText: messageElement.textContent?.substring(0, 50) + '...'
        });
      }
      
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
      
      console.log('[Universal Scroll] Executed scrollTo with offset, target:', targetScrollTop);
      
      // Method 2: Direct property assignment as immediate fallback
      setTimeout(() => {
        console.log('[Universal Scroll] Direct scrollTop assignment fallback');
        container.scrollTop = targetScrollTop;
      }, 10);
      
      return targetScrollTop;
    };
    
    // Execute immediately
    const targetPosition = performScroll();
    
    // Execute again after DOM settles
    setTimeout(() => {
      console.log('[Universal Scroll] Second attempt after 50ms');
      performScroll();
    }, 50);
    
    // Execute one more time after animation
    setTimeout(() => {
      console.log('[Universal Scroll] Third attempt after 200ms');
      performScroll();
    }, 200);
    
    // Final forced scroll if still not working
    setTimeout(() => {
      const currentPosition = container.scrollTop;
      const isStillAtBottom = currentPosition > container.scrollHeight - container.clientHeight - 200;
      
      console.log('[Universal Scroll] Final check:', {
        currentPosition,
        isStillAtBottom,
        containerHeight: container.scrollHeight,
        clientHeight: container.clientHeight
      });
      
      if (isStillAtBottom) {
        console.log('[Universal Scroll] FORCING INSTANT SCROLL - still at bottom!');
        // Force with instant behavior
        messageElement.scrollIntoView({
          behavior: 'instant',
          block: 'start',
          inline: 'nearest'
        });
        
        // Also try direct pixel manipulation
        const messageTop = messageElement.offsetTop;
        container.scrollTop = Math.max(0, messageTop - 80);
        console.log('[Universal Scroll] Forced scroll to pixel position:', container.scrollTop);
      }
      
      setShouldAutoScroll(false);
      setIsUserScrolled(false);
      console.log('[Universal Scroll] Sequence completed');
    }, 400);
  }, []);

  // Legacy function for backward compatibility
  const scrollLatestUserMessageToTop = useCallback(() => {
    console.log('[ChatGPT Scroll] Function called, checking elements...');
    
    if (!messagesContainerRef.current) {
      console.warn('[ChatGPT Scroll] No messages container ref available');
      return;
    }

    const container = messagesContainerRef.current;
    let messageElement = latestUserMessageRef.current;

    // Fallback: if ref isn't available, find the last user message element directly
    if (!messageElement) {
      console.log('[ChatGPT Scroll] Ref not available, searching for last user message...');
      const allMessageDivs = container.querySelectorAll('[data-message-sender]');
      for (let i = allMessageDivs.length - 1; i >= 0; i--) {
        const div = allMessageDivs[i] as HTMLDivElement;
        const senderId = div.getAttribute('data-message-sender');
        if (senderId === currentUserId) {
          messageElement = div;
          console.log('[ChatGPT Scroll] Found last user message via fallback search');
          break;
        }
      }
    }

    if (!messageElement) {
      console.warn('[ChatGPT Scroll] No user message element found (neither ref nor fallback)');
      return;
    }

    console.log('[ChatGPT Scroll] Starting aggressive scroll sequence...');
    
    // OPTIMIZED SPACING CALCULATION - account for fixed header overlay
    const calculateOptimalSpacing = () => {
      const viewportHeight = window.innerHeight;
      const containerHeight = container.clientHeight;
      const messageHeight = messageElement.offsetHeight;
      
      // Calculate actual fixed header height with mobile considerations
      let headerHeight = 150; // fallback value
      let mobileMenuHeight = 0;
      
      try {
        // Find the fixed header by looking for the previous sibling of the messages container
        const messagesScrollContainer = container; // This is messagesContainerRef.current
        const parentContainer = messagesScrollContainer.parentElement;
        if (parentContainer) {
          const headerElement = parentContainer.querySelector('.flex-shrink-0');
          if (headerElement) {
            headerHeight = headerElement.getBoundingClientRect().height;
            console.log('[ChatGPT Scroll] Measured actual header height:', headerHeight);
          }
        }
        
        // On mobile/tablet, account for the mobile menu button overlay
        const isMobileView = window.innerWidth < 1024; // lg breakpoint
        if (isMobileView) {
          const mobileMenuButton = document.querySelector('.lg\\:hidden [aria-label="Open mobile menu"]');
          if (mobileMenuButton) {
            const buttonRect = mobileMenuButton.getBoundingClientRect();
            // Mobile button: top-4 (16px) + button height + small buffer
            mobileMenuHeight = Math.max(buttonRect.bottom + 8, 48); // Ensure minimum clearance
            console.log('[ChatGPT Scroll] Mobile menu button height:', mobileMenuHeight);
          } else {
            // Fallback: top-4 (16px) + p-2 (8px * 2) + icon height (20px) + buffer
            mobileMenuHeight = 16 + 16 + 20 + 8; // 60px total
          }
        }
      } catch (error) {
        console.warn('[ChatGPT Scroll] Could not measure header height, using fallback');
      }
      
      // Calculate total spacing needed: header + mobile menu (if applicable) + buffer
      const isMobileView = window.innerWidth < 1024;
      let totalSpacing;
      
      if (isMobileView) {
        // Mobile: Use viewport-based calculation to ensure message is in the center area
        const mobileSpacing = Math.min(viewportHeight * 0.4, 300); // 40% of viewport or max 300px
        totalSpacing = Math.max(headerHeight, mobileMenuHeight, mobileSpacing);
        console.log('[Mobile Debug] Using viewport-based mobile spacing:', {
          viewportHeight,
          calculatedSpacing: mobileSpacing,
          finalSpacing: totalSpacing
        });
      } else {
        // Desktop: Use normal calculation
        totalSpacing = Math.max(headerHeight, mobileMenuHeight) + 40;
      }
      
      const dynamicSpacing = totalSpacing;
      
      console.log('[ChatGPT Scroll] Calculated spacing to clear fixed header overlay:', {
        viewportHeight,
        containerHeight,
        messageHeight,
        headerHeight,
        mobileMenuHeight,
        totalSpacing,
        dynamicSpacing,
        isMobileView: window.innerWidth < 1024,
        messageOffsetTop: messageElement.offsetTop
      });
      
      return dynamicSpacing;
    };
    
    // AGGRESSIVE SCROLL SEQUENCE - try multiple methods immediately
    const performScroll = () => {
      const optimalSpacing = calculateOptimalSpacing();
      
      console.log('[ChatGPT Scroll] Performing scroll with optimal spacing:', optimalSpacing);
      
      // Method 1: Direct scrollTo calculation with dynamic spacing (most accurate)
      const messageOffsetInDocument = messageElement.offsetTop;
      const targetScrollTop = Math.max(0, messageOffsetInDocument - optimalSpacing);
      
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
      
      console.log('[ChatGPT Scroll] Executed scrollTo with offset, target:', targetScrollTop);
      
      // Method 2: Direct property assignment as immediate fallback
      setTimeout(() => {
        console.log('[ChatGPT Scroll] Direct scrollTop assignment fallback');
        container.scrollTop = targetScrollTop;
      }, 10);
      
      return targetScrollTop;
    };
    
    // Execute immediately
    const targetPosition = performScroll();
    
    // Execute again after DOM settles
    setTimeout(() => {
      console.log('[ChatGPT Scroll] Second attempt after 50ms');
      performScroll();
    }, 50);
    
    // Execute one more time after animation
    setTimeout(() => {
      console.log('[ChatGPT Scroll] Third attempt after 200ms');
      performScroll();
    }, 200);
    
    // Final forced scroll if still not working
    setTimeout(() => {
      const currentPosition = container.scrollTop;
      const isStillAtBottom = currentPosition > container.scrollHeight - container.clientHeight - 200;
      
      console.log('[ChatGPT Scroll] Final check:', {
        currentPosition,
        isStillAtBottom,
        containerHeight: container.scrollHeight,
        clientHeight: container.clientHeight
      });
      
      if (isStillAtBottom) {
        console.log('[ChatGPT Scroll] FORCING INSTANT SCROLL - still at bottom!');
        // Force with instant behavior
        messageElement.scrollIntoView({
          behavior: 'instant',
          block: 'start',
          inline: 'nearest'
        });
        
        // Also try direct pixel manipulation
        const messageTop = messageElement.offsetTop;
        container.scrollTop = Math.max(0, messageTop - 80);
        console.log('[ChatGPT Scroll] Forced scroll to pixel position:', container.scrollTop);
      }
      
      setShouldAutoScroll(false);
      setIsUserScrolled(false);
      console.log('[ChatGPT Scroll] Sequence completed');
    }, 400);
  }, []);

  // --- Derived Values ---
  const currentUserId = getUserId();

  // Debug userId generation
  useEffect(() => {
    console.log('[Chat] 🔍 User Debug Info:', {
      currentUserId,
      userEmail: getUserEmail(),
      isAuthenticated: isUserAuthenticated(),
      isReady,
      userIdLength: currentUserId?.length,
      userIdFormat: currentUserId?.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
        ? 'Valid UUID v5'
        : 'Invalid format',
    });
  }, [currentUserId, getUserEmail, isUserAuthenticated, isReady]);

  // Combined loading state with safeguards - don't show thinking during streaming
  const isShowingAnimation = (isAgentThinking || isWaitingForResponse || animationLocked) && !isStreaming;

  // --- Helper Functions ---
  const safeStopAnimation = (callback?: () => void) => {
    console.log('[Chat] Stopping animation immediately');

    setIsAgentThinking(false);
    setIsWaitingForResponse(false);
    setAnimationLocked(false);
    setInputDisabled(false);
    setAnimationStartTime(null);
    isCurrentlyThinking.current = false;
    setAgentMessageState(null); // Reset message state

    callback?.();
    console.log('[Chat] Animation stopped at:', Date.now());
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // --- Render Connection Status ---
  const renderConnectionStatus = () => {
    if (serverStatus === 'checking') {
      return (
        <span className="text-gray-600 dark:text-gray-400">
          • <span className="text-gray-500 dark:text-gray-400">Checking...</span>
        </span>
      );
    }

    if (serverStatus === 'offline') {
      return (
        <span className="text-red-500 dark:text-red-400">
          • <span className="text-red-500 dark:text-red-400">Offline</span>
        </span>
      );
    }

    if (connectionStatus === 'connecting') {
      return (
        <span className="text-blue-500 dark:text-blue-400">
          • <span className="text-blue-500 dark:text-blue-400">Connecting...</span>
        </span>
      );
    }

    if (connectionStatus === 'error') {
      return (
        <span className="text-red-500 dark:text-red-400">
          • <span className="text-red-500 dark:text-red-400">Error</span>
        </span>
      );
    }

    if (connectionStatus === 'connected') {
      return (
        <span className="text-green-500 dark:text-green-400">
          • <span className="text-green-500 dark:text-green-400">Connected</span>
        </span>
      );
    }

    return null;
  };

  // --- Check Server Status ---
  useEffect(() => {
    if (!agentId) return; // Guard against missing config

    const checkServer = async () => {
      try {
        console.log('[Chat] Checking server status...');
        const isOnline = await authenticatedAPI.pingServer();
        console.log('[Chat] Server ping result:', isOnline);
        setServerStatus(isOnline ? 'online' : 'offline');
        if (!isOnline) {
          setConnectionStatus('error');
        }
      } catch (error) {
        console.error('[Chat] Server check failed:', error);
        setServerStatus('offline');
        setConnectionStatus('error');
      }
    };

    checkServer();
  }, [agentId]);

  // Function to create a new chat session
  const createNewSession = async (initialMessage?: string) => {
    if (!currentUserId || !agentId) {
      console.error('[Chat] Cannot create session - missing userId or agentId');
      return null;
    }

    try {
      console.log(`[Chat] Creating new session with initial message: "${initialMessage}"`);
      console.log(`[Chat] Using user ID: ${currentUserId}`);

      const response = await authenticatedFetch('/api/chat-session/create', {
        method: 'POST',
        body: JSON.stringify({
          userId: currentUserId,
          initialMessage: initialMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const result = await response.json();
      const newSessionId = result.data.sessionId;
      const newChannelId = result.data.channelId;

      console.log(`[Chat] Created new session: ${newSessionId} with channel: ${newChannelId}`);

      // Navigate to the new session
      router.push(`/chat/${newSessionId}`);

      return { sessionId: newSessionId, channelId: newChannelId };
    } catch (error) {
      console.error('[Chat] Failed to create new session:', error);
      return null;
    }
  };

  // --- Use Session Data from Props ---
  useEffect(() => {
    if (!sessionId || !currentUserId || !agentId) return;

    // Clean up stuck requests from previous sessions
    SocketDebugUtils.clearStuckRequests(10000); // Clear requests older than 10s
    console.log('[Chat] Cleaned up stuck requests for new session');

    // Reset session state for new session
    initStartedRef.current = false;
    sessionSetupDone.current = null; // Clear session setup tracking
    setMessages([]);
    setIsLoadingHistory(true);
    setIsPositioned(false);
    setHasInitiallyPositioned(false);

    // Safe reset of thinking states
    if (!isCurrentlyThinking.current) {
      setIsAgentThinking(false);
      setIsWaitingForResponse(false);
      setAnimationLocked(false);
    }

    // Use prop data if available, otherwise fetch from API
    if (propSessionData && propSessionData.id === sessionId) {
      console.log(`[Chat] Using session data from props: ${propSessionData.title}`);
      setSessionData(propSessionData);
      setChannelId(propSessionData.channelId);
    } else {
      // Fallback to API fetch if prop data is not available
      const loadSession = async () => {
        try {
          console.log(`[Chat] Loading session from API: ${sessionId}`);

          const response = await authenticatedFetch(
            `/api/chat-session/${sessionId}?userId=${encodeURIComponent(currentUserId)}`
          );

          if (!response.ok) {
            if (response.status === 404) {
              console.error(`[Chat] Session ${sessionId} not found`);
              // Redirect to home page for invalid sessions
              router.push('/');
              return;
            }
            throw new Error('Failed to load session');
          }

          const result = await response.json();
          const session = result.data;

          setSessionData(session);
          setChannelId(session.channelId);

          console.log(
            `[Chat] Loaded session from API: ${session.title} (${session.messageCount} messages)`
          );
        } catch (error) {
          console.error('[Chat] Failed to load session:', error);
          setIsLoadingHistory(false);
        }
      };

      loadSession();
    }
  }, [sessionId, agentId, router, currentUserId, propSessionData]);

  // --- Initialize Socket Connection ---
  useEffect(() => {
    if (!currentUserId || !agentId || serverStatus !== 'online') {
      return;
    }

    const initializeConnection = async () => {
      console.log('[Chat] Initializing connection...');
      setConnectionStatus('connecting');

      // Check for potential URL mismatch issues
      const socketUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
      const currentOrigin = window.location.origin;
      console.log('[Chat] Connection URLs:', {
        socketUrl,
        currentOrigin,
        agentId,
        userId: currentUserId,
      });

      if (socketUrl !== currentOrigin && !socketUrl.includes('localhost')) {
        console.warn(
          '[Chat] ⚠️ Socket URL differs from current origin - this may cause CORS issues'
        );
      }

      try {
        // Step 1: Try to add agent to centralized channel (optional)
        const centralChannelId = '00000000-0000-0000-0000-000000000000';

        console.log('[Chat] Checking agent availability...');
        setAgentStatus('checking');

        try {
          const addAgentResponse = await authenticatedFetch(
            `/api/eliza/messaging/central-channels/${centralChannelId}/agents`,
            {
              method: 'POST',
              body: JSON.stringify({
                agentId: agentId,
              }),
            }
          );

          if (addAgentResponse.ok) {
            console.log('[Chat] ✅ Agent successfully added to centralized channel');
            setAgentStatus('ready');
          } else {
            const errorText = await addAgentResponse.text();
            console.warn('[Chat] ⚠️ Central channel API not available:', errorText);
            // This is expected if the API endpoint doesn't exist - continue normally
            console.log('[Chat] ✅ Proceeding with direct channel communication');
            setAgentStatus('ready');
          }
        } catch (error) {
          console.warn('[Chat] ⚠️ Central channel setup not available:', error);
          // This is fine - ElizaOS can work without centralized channel setup
          console.log('[Chat] ✅ Using direct socket communication mode');
          setAgentStatus('ready');
        }

        // Step 2: Initialize socket connection with authentication
        console.log('[Chat] Initializing socket connection...');
        try {
          const token = await getAccessToken();
          socketIOManager.initialize(currentUserId, serverId, token);
        } catch (error) {
          console.error('[Chat] Failed to get access token for Socket.IO:', error);
          // Fallback to initialize without token
          socketIOManager.initialize(currentUserId, serverId);
        }

        // Step 3: Check connection status
        const checkConnection = () => {
          if (socketIOManager.isSocketConnected()) {
            console.log('[Chat] ✅ Socket connected successfully');
            setConnectionStatus('connected');
          } else {
            setTimeout(checkConnection, 1000); // Check again in 1 second
          }
        };

        checkConnection();
      } catch (error) {
        console.error('[Chat] ❌ Failed to initialize connection:', error);
        setConnectionStatus('error');
      }
    };

    initializeConnection();
  }, [agentId, serverStatus, socketIOManager, currentUserId]);

  // --- Send Message Logic ---
  useEffect(() => {
    sendMessageRef.current = (
      messageText: string,
      options?: { useInternalKnowledge?: boolean; bypassFileUploadCheck?: boolean }
    ) => {
      if (
        !messageText.trim() ||
        !currentUserId ||
        !channelId ||
        inputDisabled ||
        (isFileUploading && !options?.bypassFileUploadCheck) ||
        connectionStatus !== 'connected'
      ) {
        console.warn('[Chat] Cannot send message (stale state prevented):', {
          hasText: !!messageText.trim(),
          hasUserId: !!currentUserId,
          hasChannelId: !!channelId,
          inputDisabled,
          isFileUploading,
          connectionStatus,
        });
        return;
      }

      // Add deep research suffix if enabled
      const finalMessageText = deepResearchEnabled
        ? `${messageText.trim()} Use FutureHouse to answer.`
        : messageText.trim();

      const userMessage: ChatMessage = {
        id: uuidv4(),
        name: getUserName(),
        text: finalMessageText,
        senderId: currentUserId,
        roomId: channelId,
        createdAt: Date.now(),
        source: CHAT_SOURCE,
        isLoading: false,
      };

      console.log('[Chat] Adding user message to state:', {
        messageId: userMessage.id,
        messageText: userMessage.text,
        senderId: userMessage.senderId
      });
      
      setMessages((prev) => [...prev, userMessage]);
      
      // Enable dynamic spacing for the conversation block (will show after agent responds)
      console.log('[Chat] Enabling dynamic spacing for conversation block');
      setShowDynamicSpacing(true);
      
      // ChatGPT-style scroll: Move latest user message to top of visible area
      // Use a small delay to ensure the message is rendered before scrolling
      console.log('[Chat] Scheduling scroll in 50ms...');
      setTimeout(() => {
        console.log('[Chat] Executing scheduled scroll from sendMessage');
        console.log('[Chat] Container scroll position before scroll:', messagesContainerRef.current?.scrollTop);
        scrollLatestMessageToTop();
        // Check if scroll position changed immediately
        setTimeout(() => {
          console.log('[Chat] Container scroll position after scroll attempt:', messagesContainerRef.current?.scrollTop);
        }, 100);
      }, 50);

      // Log user prompt to database
      const logPrompt = async () => {
        try {
          console.log('[Chat] Logging user prompt to database:', {
            userId: currentUserId,
            content: finalMessageText,
          });
          const result = await logUserPrompt(currentUserId, finalMessageText);
          if (!result.success) {
            console.warn('[Chat] Failed to log user prompt:', result.error);
          } else {
            console.log('[Chat] User prompt logged successfully:', result.promptId);
          }
        } catch (error) {
          console.warn('[Chat] Error logging user prompt:', error);
        }
      };

      logPrompt();

      // Track message sent event
      const posthog = PostHogTracking.getInstance();
      posthog.messageSent({
        sessionId: sessionId || 'unknown',
        messageType: 'text',
        messageLength: finalMessageText.length,
      });

      // Start thinking animation with safeguards
      const currentTime = Date.now();
      setIsAgentThinking(true);
      setIsWaitingForResponse(true);
      setAnimationLocked(true);
      setAnimationStartTime(currentTime);
      setInputDisabled(true);
      isCurrentlyThinking.current = true;
      setAgentMessageState(null); // Reset message state for new request

      console.log('[Chat] Started thinking animation at:', currentTime);

      // Scroll thinking animation to top with spacing
      setTimeout(() => {
        console.log('[Chat] Scrolling thinking animation to top');
        scrollLatestMessageToTop();
      }, 100);

      console.log('[Chat] Sending message to session channel:', {
        messageText: finalMessageText,
        channelId,
        source: CHAT_SOURCE,
        deepResearch: deepResearchEnabled,
        useInternalKnowledge: options?.useInternalKnowledge ?? true,
        activeChannels: Array.from(socketIOManager.getActiveChannels()),
        isConnected: socketIOManager.isSocketConnected(),
        entityId: socketIOManager.getEntityId(),
      });
      console.log('[Chat] Current Channel ID for this message:', channelId);

      socketIOManager.sendChannelMessage(
        // sending message logic
        finalMessageText,
        channelId,
        CHAT_SOURCE,
        undefined,
        undefined,
        options
      );

      // Log debug info to help troubleshoot
      setTimeout(() => {
        const debugInfo = SocketDebugUtils.getDetailedReport();
        console.log('[Chat] Debug info after sending message:', debugInfo);
      }, 1000);

      // No automatic timeout - let the animation run until actual response or user action
    };
  }, [
    channelId,
    currentUserId,
    inputDisabled,
    connectionStatus,
    deepResearchEnabled,
    getUserName,
    socketIOManager,
  ]);

  // This is a stable function that we can pass as a prop
  const sendMessage = useCallback(
    (
      messageText: string,
      options?: { useInternalKnowledge?: boolean; bypassFileUploadCheck?: boolean }
    ) => {
      sendMessageRef.current?.(messageText, options);
    },
    [sessionId]
  );

  // Disable auto-scroll for follow-up questions to prevent forced scrolling
  // useEffect(() => {
  //   if (followUpQues?.length && shouldAutoScroll) {
  //     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  //   }
  // }, [followUpQues, shouldAutoScroll]);

  useEffect(() => {
    const questions = localStorage.getItem('questions');
    if (questions && questions !== 'undefined' && questions !== 'null') {
      try {
        setFollowUpQues(JSON.parse(questions));
      } catch (error) {
        console.error('Error parsing questions from localStorage:', error);
        setFollowUpQues([]);
      }
    } else {
      setFollowUpQues([]);
    }
  }, []);

  // --- Set up Socket Event Listeners ---
  useEffect(() => {
    if (connectionStatus !== 'connected' || !channelId || !sessionId || !currentUserId) {
      return;
    }

    console.log('[Chat] Setting up socket event listeners...');

    // Ensure agent is properly added to the channel for new sessions
    const ensureAgentInChannel = async (): Promise<boolean> => {
      try {
        console.log('[Chat] Ensuring agent is in channel for new session...');

        // Add agent to the specific session channel
        const addAgentResponse = await authenticatedFetch(
          `/api/eliza/messaging/central-channels/${channelId}/agents`,
          {
            method: 'POST',
            body: JSON.stringify({
              agentId: agentId,
            }),
          }
        );

        if (addAgentResponse.ok) {
          console.log('[Chat] ✅ Agent successfully added to session channel');
          return true;
        } else {
          const errorText = await addAgentResponse.text();
          console.log('[Chat] ℹ️ Agent add response:', errorText, '(might already be in channel)');
          // Return true if agent is already in channel (409 conflict or similar)
          return addAgentResponse.status === 409 || errorText.includes('already');
        }
      } catch (error) {
        console.log(
          '[Chat] ℹ️ Could not add agent to channel:',
          error,
          '(might already be in channel)'
        );
        return false;
      }
    };

    // Verify agent is ready to receive messages
    const verifyAgentReadiness = async (): Promise<boolean> => {
      try {
        // Check if agent is in the channel participants
        const channelResponse = await authenticatedFetch(
          `/api/eliza/messaging/central-channels/${channelId}`,
          {
            method: 'GET',
          }
        );

        if (channelResponse.ok) {
          const channelData = await channelResponse.json();
          const isAgentInChannel =
            channelData.participantCentralUserIds?.includes(agentId) ||
            channelData.participants?.some((p: any) => p.id === agentId);

          console.log('[Chat] Agent readiness check:', {
            isInChannel: isAgentInChannel,
            participants: channelData.participantCentralUserIds || channelData.participants,
          });

          return isAgentInChannel;
        }
      } catch (error) {
        console.warn('[Chat] Could not verify agent readiness:', error);
      }
      return false;
    };

    // Enhanced setup for new sessions
    const setupNewSession = async () => {
      if (!sessionData?.metadata?.initialMessage || !sessionId) {
        return;
      }

      // Prevent duplicate setup for the same session
      if (sessionSetupDone.current === sessionId) {
        console.log('[Chat] Session already set up, skipping...');
        return;
      }

      // Check if session already has messages (existing session being refreshed)
      if (sessionData.messageCount > 0) {
        console.log('[Chat] Session has existing messages, skipping initial message send');
        return;
      }

      // Check if we already have messages loaded (from history)
      if (messages.length > 0) {
        console.log('[Chat] Messages already loaded, skipping initial message send');
        return;
      }

      console.log('[Chat] Setting up new session with initial message...');
      sessionSetupDone.current = sessionId;

      try {
        // Step 1: Ensure agent is in channel
        setIsWaitingForAgent(true);
        setAgentReadinessMessage('Adding agent to channel...');

        const agentAdded = await ensureAgentInChannel();
        if (!agentAdded) {
          console.warn('[Chat] ⚠️ Could not confirm agent was added to channel');
        }

        // Step 2: Wait for agent to be ready
        let agentReady = false;
        for (let i = 0; i < 5; i++) {
          setAgentReadinessMessage(`Initializing agent...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          agentReady = await verifyAgentReadiness();
          if (agentReady) break;
          console.log(`[Chat] Initializing agent... (${i + 1}/5)`);
        }

        if (!agentReady) {
          console.warn('[Chat] ⚠️ Could not verify agent readiness, proceeding anyway');
        }

        setAgentReadinessMessage('Agent ready! Sending initial message...');

        // Step 3: Send initial message once
        console.log('[Chat] Sending initial message:', sessionData.metadata.initialMessage);
        sendMessage(sessionData.metadata.initialMessage);
      } catch (error) {
        console.error('[Chat] Error during agent setup:', error);
        setAgentReadinessMessage('Error setting up agent, trying anyway...');

        // Still try to send the message
        setTimeout(() => {
          sendMessage(sessionData.metadata.initialMessage);
        }, 1000);
      } finally {
        // Clear loading state after a short delay
        setTimeout(() => {
          setIsWaitingForAgent(false);
          setAgentReadinessMessage('');
        }, 1500);
      }
    };

    // Message broadcast handler
    const handleMessageBroadcast = (data: MessageBroadcastData) => {
      console.log('[Chat] Received message broadcast:', data);
      console.log('[Chat] Message Channel Info:', {
        messageChannelId: data.channelId,
        messageRoomId: data.roomId,
        currentChannelId: channelId,
        activeSession: socketIOManager.getActiveSessionChannelId(),
        senderId: data.senderId,
        isAgent: data.senderId === agentId,
      });

      // Skip our own messages to avoid duplicates
      if (data.senderId === currentUserId) {
        console.log('[Chat] Skipping our own message broadcast');
        return;
      }

      // Check for duplicate messages based on ID and timestamp
      const isDuplicate = messages.some(
        (msg) =>
          msg.id === data.id ||
          (msg.text === data.text &&
            msg.senderId === data.senderId &&
            Math.abs(msg.createdAt - data.createdAt) < 1000)
      );

      if (isDuplicate) {
        console.log('[Chat] Skipping duplicate message:', data);
        return;
      }

      // Check if this is an agent message by sender ID
      const isAgentMessage = data.senderId === agentId;

      console.log('[Chat] Message analysis:', {
        isAgentMessage,
        senderId: data.senderId,
        expectedAgentId: agentId,
        senderName: data.senderName,
        channelId: data.channelId,
        activeSession: socketIOManager.getActiveSessionChannelId(),
        messageLength: data.text?.length || 0,
      });

      const message: ChatMessage = {
        id: data.id || uuidv4(),
        name: data.senderName || (isAgentMessage ? 'Agent' : 'User'),
        text: data.text,
        senderId: data.senderId,
        roomId: data.roomId || data.channelId || channelId,
        createdAt: data.createdAt || Date.now(),
        source: data.source,
        thought: data.thought,
        actions: data.actions,
        papers: data.papers,
        isLoading: false,
      };

      console.log('[Chat] Adding message:', { isAgentMessage, message });

      // If this is an agent message, simulate streaming by adding character by character
      if (isAgentMessage && message.text) {
        // Track when we start receiving the response
        const streamStartTime = Date.now();
        
        // Keep dynamic spacing during agent response (will apply to agent message when complete)
        console.log('[Chat] Agent started responding, spacing will apply to response when complete');
        
        // Set streaming state to prevent any scroll interference
        setIsStreaming(true);

        // Add the message with empty text first and clear papers during streaming to prevent glitching
        const streamingMessage = { ...message, text: '', papers: undefined };
        setMessages((prev) => [...prev, streamingMessage]);

        // Update last activity timestamp for real-time display
        const timestamp = new Date(message.createdAt).toISOString();
        setLastActivity(timestamp);

        // Stream the text character by character
        const fullText = message.text;
        let currentIndex = 0;
        let followUpFetchStarted = false; // Track if we've started fetching follow-ups
        let followUpQuestionsShown = false; // Track if follow-up questions are already displayed

        const streamInterval = setInterval(() => {
          if (currentIndex < fullText.length) {
            // Show multiple characters at once for faster streaming
            const charsToAdd = Math.min(3, fullText.length - currentIndex);
            currentIndex += charsToAdd;
            
            // Start fetching follow-up questions when we're 50% through streaming
            const progressPercentage = currentIndex / fullText.length;
            if (progressPercentage >= 0.5 && !followUpFetchStarted) {
              followUpFetchStarted = true;
              console.log('[Chat] Starting early follow-up questions fetch at 50% streaming progress');
              
              // Pre-fetch follow-up questions in parallel with streaming
              const preloadFollowUpQuestions = async () => {
                try {
                  if (!isUserAuthenticated() || !isReady || !authenticatedFetch) {
                    return;
                  }
                  
                  const response = await authenticatedFetch('/api/followup-questions', {
                    body: JSON.stringify({ prompt: fullText }),
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                  });
                  
                  if (response.ok) {
                    const data = await response.json();
                    if (data.questions && Array.isArray(data.questions)) {
                      console.log('[Chat] Follow-up questions pre-loaded during streaming');
                      // Store them temporarily, will be set when streaming completes
                      window._preloadedFollowUpQuestions = data.questions;
                      
                      // If streaming is almost done, show them immediately
                      if (progressPercentage >= 0.95 && !followUpQuestionsShown) {
                        console.log('[Chat] Streaming almost complete, showing follow-up questions immediately');
                        setFollowUpQues(data.questions);
                        localStorage.setItem('questions', JSON.stringify(data.questions));
                        followUpQuestionsShown = true;
                      }
                    }
                  }
                } catch (error) {
                  console.log('[Chat] Pre-loading follow-up questions failed (will retry after streaming):', error);
                }
              };
              
              preloadFollowUpQuestions();
            }
            
            setMessages((prev) => {
              const newMessages = [...prev];
              const messageIndex = newMessages.findIndex((msg) => msg.id === message.id);
              if (messageIndex !== -1) {
                newMessages[messageIndex] = {
                  ...newMessages[messageIndex],
                  text: fullText.slice(0, currentIndex),
                };
              }
              return newMessages;
            });

            // No scroll behavior during streaming - user maintains full control
          } else {
            clearInterval(streamInterval);

            // Track message received event with generation time (in seconds)
            const streamEndTime = Date.now();
            const generationTime = streamEndTime - streamStartTime;

            const posthog = PostHogTracking.getInstance();
            posthog.messageReceived({
              sessionId: sessionId || 'unknown',
              generationTime: generationTime / 1000, // Convert to seconds
            });

            // Stop animation immediately when streaming is complete - this is the actual response
            console.log('[Chat] Agent response streaming complete, stopping animation');
            setIsStreaming(false); // Clear streaming state
            safeStopAnimation();
            
            // Restore papers now that streaming is complete to prevent glitching
            setMessages((prev) => {
              const newMessages = [...prev];
              const messageIndex = newMessages.findIndex((msg) => msg.id === message.id);
              if (messageIndex !== -1) {
                newMessages[messageIndex] = {
                  ...newMessages[messageIndex],
                  papers: message.papers, // Restore original papers
                };
              }
              return newMessages;
            });
            
            // Scroll agent response to top and then remove spacing after a delay
            setTimeout(() => {
              console.log('[Chat] Scrolling completed agent response to top');
              scrollLatestMessageToTop();
              
              // Remove dynamic spacing after agent response is complete and positioned
              setTimeout(() => {
                console.log('[Chat] Agent response complete, removing dynamic spacing');
                setShowDynamicSpacing(false);
              }, 500); // Give time for scroll to complete
            }, 200);
            
            // Fetch follow up questions immediately when streaming completes
            const fetchFollowUpQuestions = async (retryCount = 0) => {
              const maxRetries = 3;

              console.log('[Chat] Fetching follow-up questions... (attempt', retryCount + 1, ')');

              // Enhanced authentication checks
              if (!isUserAuthenticated() || !isReady) {
                if (retryCount < maxRetries) {
                  console.log('[Chat] Auth not ready, retrying in 1 second...');
                  setTimeout(() => fetchFollowUpQuestions(retryCount + 1), 1000);
                  return;
                } else {
                  console.warn(
                    '[Chat] User not authenticated or Privy not ready after retries, skipping follow-up questions:',
                    {
                      isAuthenticated: isUserAuthenticated(),
                      isReady,
                    }
                  );
                  return;
                }
              }

              // Additional check to ensure the authenticatedFetch hook is available
              if (!authenticatedFetch) {
                console.warn(
                  '[Chat] AuthenticatedFetch hook not available, skipping follow-up questions'
                );
                return;
              }

              const body = {
                prompt: fullText,
              };

              try {
                console.log('[Chat] Making authenticated request to follow-up questions API...');

                const response = await authenticatedFetch('/api/followup-questions', {
                  body: JSON.stringify(body),
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                });

                console.log('[Chat] Follow-up questions response:', {
                  status: response.status,
                  ok: response.ok,
                  statusText: response.statusText,
                });

                if (response.status === 401 && retryCount < maxRetries) {
                  console.log('[Chat] Got 401, retrying with fresh token...');
                  setTimeout(() => fetchFollowUpQuestions(retryCount + 1), 1000);
                  return;
                }

                if (!response.ok) {
                  const errorText = await response.text();
                  console.error('[Chat] Follow-up questions API error:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText,
                  });
                  throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
                }

                const data = await response.json();
                console.log('[Chat] Follow-up questions data:', data);

                if (data.questions && Array.isArray(data.questions)) {
                  setFollowUpQues(data.questions);
                  localStorage.setItem('questions', JSON.stringify(data.questions));
                } else {
                  console.warn('[Chat] Invalid follow-up questions response format:', data);
                }
              } catch (error) {
                console.error('[Chat] Follow-up questions error:', error);

                // Check if it's an authentication error and retry
                const isAuthError =
                  error instanceof Error &&
                  (error.message.includes('Authentication service not ready') ||
                    error.message.includes('User not authenticated') ||
                    error.message.includes('No access token available'));

                if (isAuthError && retryCount < maxRetries) {
                  console.log('[Chat] Authentication error, retrying follow-up questions...');
                  setTimeout(() => fetchFollowUpQuestions(retryCount + 1), 2000);
                } else if (retryCount < maxRetries) {
                  console.log('[Chat] Retrying follow-up questions due to error...');
                  setTimeout(() => fetchFollowUpQuestions(retryCount + 1), 1500);
                } else {
                  console.warn('[Chat] Max retries exceeded for follow-up questions, giving up');
                }
              }
            };
            
            // Check if we have pre-loaded follow-up questions first (and haven't shown them yet)
            if (window._preloadedFollowUpQuestions && !followUpQuestionsShown) {
              console.log('[Chat] Using pre-loaded follow-up questions');
              setFollowUpQues(window._preloadedFollowUpQuestions);
              localStorage.setItem('questions', JSON.stringify(window._preloadedFollowUpQuestions));
              // Clean up
              delete window._preloadedFollowUpQuestions;
            } else if (!followUpQuestionsShown) {
              // Start the retry-enabled fetch immediately when streaming completes
              console.log('[Chat] Starting follow-up questions fetch immediately after streaming');
              fetchFollowUpQuestions();
            } else {
              console.log('[Chat] Follow-up questions already shown during streaming');
            }
          }
        }, 15); // Adjust speed: lower = faster, higher = slower
      } else {
        // For non-agent messages, add normally
        setMessages((prev) => [...prev, message]);

        // Update last activity timestamp for real-time display
        const timestamp = new Date(message.createdAt).toISOString();
        setLastActivity(timestamp);
      }
    };

    // Control message handler
    const handleControlMessage = (data: ControlMessageData) => {
      console.log('[Chat] Received control message:', data);

      if (data.action === 'disable_input') {
        setInputDisabled(true);
      } else if (data.action === 'enable_input') {
        setInputDisabled(false);
      }
    };

    // Message complete handler
    const handleMessageComplete = () => {
      console.log('[Chat] Message complete - stopping animation immediately');
      // Stop animation immediately when message is complete - this means agent is done
      safeStopAnimation();
    };

    // Message state handler
    const handleMessageState = (data: MessageStateData) => {
      console.log('[Chat] Message state received:', data);
      console.log('[Chat] Message State Channel Info:', {
        stateChannelId: data.channelId,
        stateRoomId: data.roomId,
        currentChannelId: channelId,
        state: data.state,
        willProcess: data.roomId === channelId || data.channelId === channelId,
      });

      // Only update state if this is for our active channel
      if (data.roomId === channelId || data.channelId === channelId) {
        // Hide animation when state is DONE since response is already streaming
        if (data.state === 'DONE') {
          safeStopAnimation();
        } else {
          setAgentMessageState(data.state);
        }
      }
    };

    // Attach event listeners
    socketIOManager.on('messageBroadcast', handleMessageBroadcast);
    socketIOManager.on('controlMessage', handleControlMessage);
    socketIOManager.on('messageComplete', handleMessageComplete);
    socketIOManager.on('messageState', handleMessageState);

    // Join the session channel
    socketIOManager.joinChannel(channelId, serverId);

    // Set the active session channel ID for message filtering
    socketIOManager.setActiveSessionChannelId(channelId);
    console.log('[Chat] Set active session channel ID:', channelId);
    console.log('[Chat] Channel ID Debug Info:', {
      channelId,
      sessionId,
      activeChannels: Array.from(socketIOManager.getActiveChannels()),
      activeSession: socketIOManager.getActiveSessionChannelId(),
    });

    // Setup new session if needed
    setupNewSession();

    // Cleanup function
    return () => {
      socketIOManager.off('messageBroadcast', handleMessageBroadcast);
      socketIOManager.off('controlMessage', handleControlMessage);
      socketIOManager.off('messageComplete', handleMessageComplete);
      socketIOManager.off('messageState', handleMessageState);
      socketIOManager.leaveChannel(channelId);
      socketIOManager.clearActiveSessionChannelId();
    };
  }, [
    connectionStatus,
    channelId,
    agentId,
    socketIOManager,
    currentUserId,
    sessionData,
    sendMessage,
  ]);

  // --- Load Message History (Simplified) ---
  useEffect(() => {
    if (
      !channelId ||
      !agentId ||
      !currentUserId ||
      connectionStatus !== 'connected' ||
      initStartedRef.current
    ) {
      return;
    }

    initStartedRef.current = true;
    setIsLoadingHistory(true);

    console.log(`[Chat] Loading message history for channel: ${channelId}`);

    // Load message history - try channel messages first, fallback to room memories
    const loadMessageHistory = async () => {
      try {
        // First try the channel messages API (matches new message format)
        const channelMessages = await authenticatedAPI.getChannelMessages(channelId, 50);
        if (channelMessages.length > 0) {
          console.log(`[Chat] Loaded ${channelMessages.length} channel messages`);
          return channelMessages;
        }

        // Fallback to room memories if channel messages are empty
        console.log('[Chat] No channel messages found, trying room memories...');
        const roomMessages = await authenticatedAPI.getRoomMemories(agentId, channelId, 50);
        console.log(`[Chat] Loaded ${roomMessages.length} room memory messages`);
        return roomMessages;
      } catch (error) {
        console.error('[Chat] Error loading message history:', error);
        return [];
      }
    };

    loadMessageHistory()
      .then((loadedMessages) => {
        console.log(`[Chat] Loaded ${loadedMessages.length} messages from history`);
        setMessages(loadedMessages);
        // Positioning will be handled by the separate useEffect that watches messages.length
      })
      .catch((error) => {
        console.error('[Chat] Failed to load message history:', error);
      })
      .finally(() => {
        setIsLoadingHistory(false);
      });
  }, [channelId, agentId, connectionStatus, currentUserId]);

  // --- Position at bottom when messages are first rendered ---
  useEffect(() => {
    if (messages.length > 0 && !hasInitiallyPositioned && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      console.log('[Chat] Positioning after messages rendered in DOM');

      const attemptPosition = () => {
        console.log('[Chat] Attempting position with DOM rendered:', {
          scrollHeight: container.scrollHeight,
          clientHeight: container.clientHeight,
          messagesCount: messages.length,
        });

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;

        // Also use messagesEndRef as backup
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: 'end' });
        }

        setHasInitiallyPositioned(true);
        setIsUserScrolled(false);

        // Verify position
        setTimeout(() => {
          const isAtBottom =
            container.scrollTop >= container.scrollHeight - container.clientHeight - 10;
          console.log('[Chat] Final position check:', {
            scrollTop: container.scrollTop,
            scrollHeight: container.scrollHeight,
            isAtBottom,
          });
        }, 100);
      };

      // Try positioning immediately and after a delay
      attemptPosition();
      const timeoutId = setTimeout(attemptPosition, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, hasInitiallyPositioned]);

  // --- Set up scroll event listener ---
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });

    // Check initial scroll position
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // ChatGPT-style scroll behavior: Scroll latest user message to top when messages update
  useEffect(() => {
    if (messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;
    
    // Check if the last message is from the current user (newly sent)
    const isUserMessage = lastMessage.senderId === currentUserId;
    
    if (isUserMessage) {
      console.log('[ChatGPT Scroll] New user message detected in useEffect, triggering scroll');
      console.log('[ChatGPT Scroll] Message details:', {
        messageId: lastMessage.id,
        senderId: lastMessage.senderId,
        currentUserId: currentUserId,
        messagesLength: messages.length
      });
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        console.log('[ChatGPT Scroll] Executing scheduled scroll from useEffect');
        scrollLatestMessageToTop();
      }, 100);
    }
  }, [messages, currentUserId, scrollLatestMessageToTop]);

  // --- Update real-time session stats ---
  useEffect(() => {
    if (messages.length > 0) {
      setCurrentMessageCount(messages.length);

      // Find the most recent message timestamp
      const mostRecentMessage = messages[messages.length - 1];
      if (mostRecentMessage) {
        const timestamp = new Date(mostRecentMessage.createdAt).toISOString();
        setLastActivity(timestamp);
      }
    }
  }, [messages]);

  // --- Initialize session stats ---
  useEffect(() => {
    if (sessionData) {
      setCurrentMessageCount(sessionData.messageCount || 0);
      setLastActivity(sessionData.lastActivity || null);
    }
  }, [sessionData]);

  // --- Update "time ago" display every minute ---
  useEffect(() => {
    const interval = setInterval(() => {
      // Trigger re-render to update "time ago" display
      setTimeUpdateTrigger((prev) => prev + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // --- Form submission handler ---
  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      setFollowUpQues([]);
      if (e) e.preventDefault();
      if (!input.trim() || !currentUserId || inputDisabled || isFileUploading) return;

      const messageToSend = input.trim();
      setInput('');

      sendMessage(messageToSend);
    },
    [input, currentUserId, inputDisabled, isFileUploading, sendMessage]
  );

  // --- Handle Speech-to-Text ---
  const handleTranscript = useCallback(
    (transcribedText: string) => {
      console.log('[Chat] Received transcript:', transcribedText);

      if (transcribedText.trim()) {
        sendMessage(transcribedText.trim());
        setInput(''); // Clear the input field after sending
      }
    },
    [sendMessage]
  );

  // --- Handle Deep Research Toggle ---
  const handleDeepResearchToggle = useCallback(() => {
    setDeepResearchEnabled((prev) => !prev);
  }, []);

  // --- Handle File Upload State Change ---
  const handleFileUploadStateChange = useCallback((isUploading: boolean) => {
    console.log('[Chat] File upload state changed:', isUploading);
    setIsFileUploading(isUploading);
  }, []);

  // --- Handle File Upload ---
  const handleFileUpload = useCallback(
    (file: File, uploadResult: any) => {
      console.log('[Chat] File upload result:', file.name, uploadResult);

      // Check if upload was successful
      if (uploadResult && uploadResult.success) {
        console.log('[Chat] ✅ Upload successful, sending message to agent...');
        console.log('[Chat] Current state before sending:', {
          currentUserId,
          channelId,
          inputDisabled,
          isFileUploading,
          connectionStatus,
          sendMessageRef: !!sendMessageRef.current,
        });

        // Track media upload event
        const posthog = PostHogTracking.getInstance();
        posthog.mediaUploaded(file.type || 'unknown', file.size);

        // Create a message indicating the file was uploaded and enable internal knowledge
        const fileMessage = `I've uploaded "${file.name}" to your knowledge base. Please analyze this document and tell me what it contains.`;
        console.log('[Chat] Message to send:', fileMessage);

        // Small delay to ensure upload state is cleared before sending message
        setTimeout(() => {
          console.log('[Chat] Sending message after short delay...');
          sendMessage(fileMessage, { useInternalKnowledge: true });
        }, 100);
      } else {
        // Handle upload failure
        console.error('[Chat] File upload failed:', uploadResult);

        // Show error message to user via toast
        const errorMessage = uploadResult?.error?.message || 'Failed to upload file';
        toast.error(
          `Failed to upload "${file.name}": ${errorMessage}. Please try uploading the file again.`
        );

        // Make sure animation is stopped since no agent response is expected
        safeStopAnimation();
      }
    },
    [sendMessage, channelId]
  );

  // Check if environment is properly configured
  if (!agentId) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-[#292929]/20">
        <div className="text-center p-8 bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm max-w-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Configuration Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-base mb-4 leading-relaxed">
            NEXT_PUBLIC_AGENT_ID is not configured in environment variables.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 leading-relaxed">
            Please check your .env file and ensure NEXT_PUBLIC_AGENT_ID is set.
          </p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-[#292929]/20">
        <div className="text-center p-8 bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm max-w-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Loading...</h2>
          <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
            Initializing authentication...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-[#292929]">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 pt-4 sm:pt-8 pb-2 sm:pb-2 bg-white dark:bg-[#292929]">
        <div className="max-w-4xl lg:max-w-4xl xl:max-w-4xl 2xl:max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-1">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight truncate pr-2">
                  {sessionData ? (
                    sessionData.title
                  ) : (
                    <span className="animate-pulse">Loading session...</span>
                  )}
                </h1>
              </div>
              {sessionData && (
                <div className="flex-shrink-0">
                  <ShareButton sessionId={sessionId} sessionTitle={sessionData.title} />
                </div>
              )}
            </div>
            {sessionData ? (
              <div className="flex items-center gap-3 mt-3 text-gray-600 dark:text-gray-400 text-sm">
                <span className="flex-shrink-0">{currentMessageCount} messages</span>
                <span className="flex-shrink-0">•</span>
                <span className="flex-shrink-0">
                  Last activity {lastActivity ? formatTimeAgo(lastActivity) : 'Never'}
                </span>
                <span className="flex-shrink-0">{renderConnectionStatus()}</span>
                {/* timeUpdateTrigger is used to force re-render of time display */}
                {timeUpdateTrigger > 0 && ''}
                {/* Real-time indicator */}
              </div>
            ) : (
              <div className="mt-3">{renderConnectionStatus()}</div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Chat Messages */}
      <div
        ref={messagesContainerRef}
        className={`flex-1 overflow-y-auto ${isStreaming ? 'streaming-disabled-scroll' : ''}`}
        style={{
          overflowAnchor: 'none',
          scrollBehavior: 'smooth'
        }}
      >
        <div className="max-w-4xl lg:max-w-4xl xl:max-w-4xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {/* Connection status loading */}
          {connectionStatus === 'connecting' && !isWaitingForAgent && (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center gap-3">
                <LoadingSpinner />
                <span className="text-gray-600 dark:text-gray-400 text-base">
                  Connecting to agent...
                </span>
              </div>
            </div>
          )}

          {/* Agent readiness loading */}
          {isWaitingForAgent && (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center gap-3">
                <LoadingSpinner />
                <span className="text-gray-600 dark:text-gray-400 text-base">
                  {agentReadinessMessage}
                </span>
              </div>
            </div>
          )}

          {/* Connection error state */}
          {connectionStatus === 'error' && !isWaitingForAgent && (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="text-red-500 dark:text-red-400 text-base mb-2">
                  ⚠️ Connection Error
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  Unable to connect to the agent. Please try refreshing the page.
                </div>
              </div>
            </div>
          )}

          {/* Only show history loading if we're connected and actually loading history */}
          {connectionStatus === 'connected' && isLoadingHistory && !isWaitingForAgent && (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center gap-3">
                <LoadingSpinner />
                <span className="text-gray-600 dark:text-gray-400 text-base">
                  Loading conversation history...
                </span>
              </div>
            </div>
          )}

          {/* Show chat messages when not loading */}
          {connectionStatus === 'connected' && !isWaitingForAgent && !isLoadingHistory && (
            <>
              <ChatMessages
                messages={messages}
                followUpPromptsMap={{ [messages.length / 2 - 1]: followUpQues }}
                onFollowUpClick={(prompt) => {
                  // Handle follow-up prompts by setting input value for user to review/edit
                  setInput(prompt.trim());
                  setFollowUpQues([]); // Clear follow-up suggestions after selection
                }}
                lastUserMessageRef={latestUserMessageRef}
                latestMessageRef={latestMessageRef}
                showDynamicSpacing={showDynamicSpacing}
              />
              {/* Agent thinking/processing status with dynamic spacing */}
              {isShowingAnimation && (
                <div 
                  className="flex items-center gap-3 py-3 text-gray-600 dark:text-gray-400"
                  style={showDynamicSpacing ? { 
                    marginBottom: `${Math.min((typeof window !== 'undefined' ? window.innerHeight : 800) * 0.65, 600)}px` 
                  } : undefined}
                  ref={isShowingAnimation ? latestMessageRef : undefined}
                >
                  <LoadingSpinner />
                  <span className="text-base">
                    {process.env.NEXT_PUBLIC_AGENT_NAME || 'Agent'}{' '}
                    {agentMessageState &&
                    MESSAGE_STATE_MESSAGES[agentMessageState as keyof typeof MESSAGE_STATE_MESSAGES]
                      ? MESSAGE_STATE_MESSAGES[
                          agentMessageState as keyof typeof MESSAGE_STATE_MESSAGES
                        ]
                      : MESSAGE_STATE_MESSAGES.DEFAULT}
                  </span>
                </div>
              )}
              {/* Scroll anchor - only used for manual scroll to bottom, not for auto-scroll */}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Scroll to Bottom Button */}
      {isUserScrolled && (
        <div className="fixed bottom-20 right-6 z-10">
          <button
            onClick={scrollToBottom}
            className="bg-white dark:bg-[#1f1f1f] hover:bg-gray-50 dark:hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 rounded-full p-3 border border-gray-200 dark:border-gray-600"
            aria-label="Scroll to bottom"
          >
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Input Area - Fixed at Bottom */}
      <div className="flex-shrink-0 py-3 bg-white dark:bg-[#292929]">
        <div className="max-w-4xl lg:max-w-4xl xl:max-w-4xl 2xl:max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-white dark:bg-[#292929]">
            <TextareaWithActions
              input={input}
              onInputChange={(e) => setInput(e.target.value)}
              onSubmit={handleSubmit}
              isLoading={
                isShowingAnimation ||
                inputDisabled ||
                connectionStatus !== 'connected' ||
                isWaitingForAgent
              }
              placeholder={
                !isUserAuthenticated()
                  ? 'Please login to start a chat..'
                  : isFileUploading
                    ? 'Uploading file...'
                    : isWaitingForAgent
                      ? 'Setting up agent...'
                      : connectionStatus === 'connected'
                        ? 'Type your message...'
                        : 'Connecting...'
              }
              onTranscript={handleTranscript}
              deepResearchEnabled={deepResearchEnabled}
              onDeepResearchToggle={handleDeepResearchToggle}
              onFileUpload={handleFileUpload}
              disabled={!isUserAuthenticated()}
              isFileUploading={isFileUploading}
              onFileUploadStateChange={handleFileUploadStateChange}
            />
          </div>
        </div>
      </div>

      {/* Debug Info (Only when NEXT_PUBLIC_DEBUG is enabled) */}
      {process.env.NEXT_PUBLIC_DEBUG === 'true' && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
          <div>Agent ID: {agentId}</div>
          <div>Session ID: {sessionId}</div>
          <div>Channel ID: {channelId}</div>
          <div>User ID: {currentUserId}</div>
          <div>User Name: {getUserName()}</div>
          <div>Connection: {connectionStatus}</div>
          <div>Server: {serverStatus}</div>
          <div>Agent Status: {agentStatus}</div>
          <div>Input Disabled: {inputDisabled ? 'true' : 'false'}</div>
          <div>Agent Thinking: {isAgentThinking ? 'true' : 'false'}</div>
        </div>
      )}
    </div>
  );
};

export default Chat;
