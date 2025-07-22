'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, FormEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { ChatMessages } from '@/components/chat/chat-messages';
import { TextareaWithActions } from '@/components/ui/textarea-with-actions';
import { ChatSessions } from '@/components/chat/chat-sessions';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui';
import { CHAT_SOURCE, MESSAGE_STATE_MESSAGES } from '@/constants';
import SocketIOManager, { ControlMessageData, MessageBroadcastData, MessageStateData } from '@/lib/socketio-manager';
import { SocketDebugUtils } from '@/lib/socket-debug-utils';
import type { ChatMessage } from '@/types/chat-message';
import { getChannelMessages, getRoomMemories, pingServer } from '@/lib/api-client';
import { useUserManager } from '@/lib/user-manager';

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

export const Chat = ({ sessionId: propSessionId, sessionData: propSessionData }: ChatProps = {}) => {
  const router = useRouter();

  // --- Environment Configuration ---
  const agentId = process.env.NEXT_PUBLIC_AGENT_ID;
  const serverId = '00000000-0000-0000-0000-000000000000'; // Default server ID from ElizaOS

  // --- User Management ---
  const { getUserId, getUserName, isUserAuthenticated, isReady } = useUserManager();

  // --- State ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [inputDisabled, setInputDisabled] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(propSessionId || null);
  const [sessionData, setSessionData] = useState<ChatSession | null>(propSessionData || null);
  
  const [channelId, setChannelId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [isAgentThinking, setIsAgentThinking] = useState<boolean>(false);
  const [thinkingStartTime, setThinkingStartTime] = useState<number | null>(null);
  const [agentMessageState, setAgentMessageState] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>(
    'connecting'
  );
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [agentStatus, setAgentStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [deepResearchEnabled, setDeepResearchEnabled] = useState<boolean>(false);
  
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
  const sendMessageRef = useRef<((messageText: string, options?: { useInternalKnowledge?: boolean }) => void) | null>(null);
  const socketIOManager = SocketIOManager.getInstance();
  const isCurrentlyThinking = useRef<boolean>(false);

  // --- Derived Values ---
  const currentUserId = getUserId();
  
  // Combined loading state with safeguards
  const isShowingAnimation = isAgentThinking || isWaitingForResponse || animationLocked;

  // --- Helper Functions ---
  const safeStopAnimation = (callback?: () => void) => {
    console.log('[Chat] Stopping animation immediately');
    
    setIsAgentThinking(false);
    setIsWaitingForResponse(false);
    setAnimationLocked(false);
    setInputDisabled(false);
    setThinkingStartTime(null);
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
        const isOnline = await pingServer();
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

      const response = await fetch('/api/chat-session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

          const response = await fetch(
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

          console.log(`[Chat] Loaded session from API: ${session.title} (${session.messageCount} messages)`);
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
          console.warn('[Chat] ⚠️ Socket URL differs from current origin - this may cause CORS issues');
        }

      try {
        // Step 1: Try to add agent to centralized channel (optional)
        const centralChannelId = '00000000-0000-0000-0000-000000000000';

        console.log('[Chat] Checking agent availability...');
        setAgentStatus('checking');

        try {
          const addAgentResponse = await fetch(
            `/api/eliza/messaging/central-channels/${centralChannelId}/agents`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
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

        // Step 2: Initialize socket connection
        console.log('[Chat] Initializing socket connection...');
        socketIOManager.initialize(currentUserId, serverId);

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
      options?: { useInternalKnowledge?: boolean }
    ) => {
      if (
        !messageText.trim() ||
        !currentUserId ||
        !channelId ||
        inputDisabled ||
        isFileUploading ||
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

      setMessages((prev) => [...prev, userMessage]);
      
      // Start thinking animation with safeguards
      const currentTime = Date.now();
      setIsAgentThinking(true);
      setIsWaitingForResponse(true);
      setAnimationLocked(true);
      setThinkingStartTime(currentTime);
      setAnimationStartTime(currentTime);
      setInputDisabled(true);
      isCurrentlyThinking.current = true;
      setAgentMessageState(null); // Reset message state for new request
      
      console.log('[Chat] Started thinking animation at:', currentTime);

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
  }, [channelId, currentUserId, inputDisabled, connectionStatus, deepResearchEnabled, getUserName, socketIOManager]);

  // This is a stable function that we can pass as a prop
  const sendMessage = useCallback(
    (messageText: string, options?: { useInternalKnowledge?: boolean }) => {
      sendMessageRef.current?.(messageText, options);
    },
    []
  );

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
        const addAgentResponse = await fetch(
          `/api/eliza/messaging/central-channels/${channelId}/agents`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
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
        console.log('[Chat] ℹ️ Could not add agent to channel:', error, '(might already be in channel)');
        return false;
      }
    };

    // Verify agent is ready to receive messages
    const verifyAgentReadiness = async (): Promise<boolean> => {
      try {
        // Check if agent is in the channel participants
        const channelResponse = await fetch(
          `/api/eliza/messaging/central-channels/${channelId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (channelResponse.ok) {
          const channelData = await channelResponse.json();
          const isAgentInChannel = channelData.participantCentralUserIds?.includes(agentId) || 
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
          await new Promise(resolve => setTimeout(resolve, 1000));
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
        isAgent: data.senderId === agentId
      });

      // Skip our own messages to avoid duplicates
      if (data.senderId === currentUserId) {
        console.log('[Chat] Skipping our own message broadcast');
        return;
      }

      // Check for duplicate messages based on ID and timestamp
      const isDuplicate = messages.some(msg => 
        msg.id === data.id || 
        (msg.text === data.text && msg.senderId === data.senderId && Math.abs(msg.createdAt - data.createdAt) < 1000)
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
        // Add the message with empty text first
        const streamingMessage = { ...message, text: '' };
        setMessages((prev) => [...prev, streamingMessage]);

        // Update last activity timestamp for real-time display
        const timestamp = new Date(message.createdAt).toISOString();
        setLastActivity(timestamp);

        // Stream the text character by character
        const fullText = message.text;
        let currentIndex = 0;

        const streamInterval = setInterval(() => {
          if (currentIndex < fullText.length) {
            setMessages((prev) => {
              const newMessages = [...prev];
              const messageIndex = newMessages.findIndex((msg) => msg.id === message.id);
              if (messageIndex !== -1) {
                newMessages[messageIndex] = {
                  ...newMessages[messageIndex],
                  text: fullText.slice(0, currentIndex + 1),
                };
              }
              return newMessages;
            });
            currentIndex++;

            // Scroll to bottom during streaming
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          } else {
            clearInterval(streamInterval);
            
            // Stop animation immediately when streaming is complete - this is the actual response
            console.log('[Chat] Agent response streaming complete, stopping animation');
            safeStopAnimation();
          }
        }, 10); // Adjust speed: lower = faster, higher = slower
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
        willProcess: data.roomId === channelId || data.channelId === channelId
      });
      
      // Only update state if this is for our active channel
      if (data.roomId === channelId || data.channelId === channelId) {
        setAgentMessageState(data.state);
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
      activeSession: socketIOManager.getActiveSessionChannelId()
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
  }, [connectionStatus, channelId, agentId, socketIOManager, currentUserId, sessionData, sendMessage]);

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
        const channelMessages = await getChannelMessages(channelId, 50);
        if (channelMessages.length > 0) {
          console.log(`[Chat] Loaded ${channelMessages.length} channel messages`);
          return channelMessages;
        }

        // Fallback to room memories if channel messages are empty
        console.log('[Chat] No channel messages found, trying room memories...');
        const roomMessages = await getRoomMemories(agentId, channelId, 50);
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
        
        // Note: Initial message sending is now handled in the socket event listeners setup
        // This prevents race conditions between history loading and message sending
      })
      .catch((error) => {
        console.error('[Chat] Failed to load message history:', error);
      })
      .finally(() => {
        setIsLoadingHistory(false);
      });
  }, [channelId, agentId, connectionStatus, currentUserId]);

  // --- Auto-scroll to bottom ---
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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
      setTimeUpdateTrigger(prev => prev + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // --- Form submission handler ---
  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!input.trim() || !currentUserId || inputDisabled || isFileUploading) return;

      const messageToSend = input.trim();
      setInput('');
      
      // Immediately start animation for better UX - ensure it shows before any async operations
      const currentTime = Date.now();
      setIsAgentThinking(true);
      setIsWaitingForResponse(true);
      setAnimationLocked(true);
      setAnimationStartTime(currentTime);
      setInputDisabled(true);
      isCurrentlyThinking.current = true;
      
      console.log('[Chat] Animation started immediately on submit at:', currentTime);
      
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
  const handleFileUploadStateChange = useCallback(
    (isUploading: boolean) => {
      console.log('[Chat] File upload state changed:', isUploading);
      setIsFileUploading(isUploading);
    },
    []
  );

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
          sendMessageRef: !!sendMessageRef.current
        });
        
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
        toast.error(`Failed to upload "${file.name}": ${errorMessage}. Please try uploading the file again.`);
        
        // Make sure animation is stopped since no agent response is expected
        safeStopAnimation();
      }
    },
    [sendMessage, channelId]
  );

  // Check if environment is properly configured
  if (!agentId) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900/20">
        <div className="text-center p-8 bg-white dark:bg-[#171717] rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm max-w-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Configuration Error</h2>
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
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900/20">
        <div className="text-center p-8 bg-white dark:bg-[#171717] rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm max-w-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Loading...</h2>
          <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-[#171717] mt-8 sm:mt-5">
      {/* Fixed Header Section */}
              <div className="flex-shrink-0 px-4 sm:px-6 pt-10 sm:pt-8 pb-4 sm:pb-4 bg-white dark:bg-[#171717]">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              {sessionData ? sessionData.title : <span className="animate-pulse">Loading session...</span>}
            </h1>
            {sessionData ? (
              <div className="flex items-center gap-3 mt-2">
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  {currentMessageCount} messages • Last activity{' '}
                  {lastActivity ? formatTimeAgo(lastActivity) : 'Never'}
                  {/* timeUpdateTrigger is used to force re-render of time display */}
                  {timeUpdateTrigger > 0 && ''}
                  {/* Real-time indicator */}
                </div>
                <div className="text-sm">
                  {renderConnectionStatus()}
                </div>
              </div>
            ) : (
              <div className="mt-2">
                {renderConnectionStatus()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {/* Connection status loading */}
          {connectionStatus === 'connecting' && !isWaitingForAgent && (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center gap-3">
                <LoadingSpinner />
                <span className="text-gray-600 dark:text-gray-400 text-base">Connecting to agent...</span>
              </div>
            </div>
          )}
          
          {/* Agent readiness loading */}
          {isWaitingForAgent && (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center gap-3">
                <LoadingSpinner />
                <span className="text-gray-600 dark:text-gray-400 text-base">{agentReadinessMessage}</span>
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
                <span className="text-gray-600 dark:text-gray-400 text-base">Loading conversation history...</span>
              </div>
            </div>
          )}
          
          {/* Show chat messages when not loading */}
          {connectionStatus === 'connected' && !isWaitingForAgent && !isLoadingHistory && (
            <>
              <ChatMessages
                messages={messages}
                followUpPromptsMap={{}}
                onFollowUpClick={(prompt) => {
                  // Handle follow-up prompts by setting as new input
                  setInput(prompt);
                }}
              />
              {isShowingAnimation && (
                <div className="flex items-center gap-3 py-3 text-gray-600 dark:text-gray-400">
                  <LoadingSpinner />
                  <span className="text-base">
                    {process.env.NEXT_PUBLIC_AGENT_NAME || 'Agent'}{' '}
                    {agentMessageState && MESSAGE_STATE_MESSAGES[agentMessageState as keyof typeof MESSAGE_STATE_MESSAGES]
                      ? MESSAGE_STATE_MESSAGES[agentMessageState as keyof typeof MESSAGE_STATE_MESSAGES]
                      : MESSAGE_STATE_MESSAGES.DEFAULT}
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input Area - Fixed at Bottom */}
      <div className="flex-shrink-0 p-3 bg-white dark:bg-[#171717]">
        <div className="max-w-4xl mx-auto">
                      <div className="bg-white dark:bg-[#171717]">
            <TextareaWithActions
              input={input}
              onInputChange={(e) => setInput(e.target.value)}
              onSubmit={handleSubmit}
              isLoading={isShowingAnimation || inputDisabled || connectionStatus !== 'connected' || isWaitingForAgent}
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
