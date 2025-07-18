'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { ChatMessages } from '@/components/chat/chat-messages';
import { TextareaWithActions } from '@/components/ui/textarea-with-actions';
import { ChatSessions } from '@/components/chat/chat-sessions';
import { Button } from '@/components/ui/button';
import { CHAT_SOURCE } from '@/constants';
import SocketIOManager, { ControlMessageData, MessageBroadcastData } from '@/lib/socketio-manager';
import type { ChatMessage } from '@/types/chat-message';
import { getChannelMessages, getRoomMemories, pingServer } from '@/lib/api-client';
import { useUserManager } from '@/lib/user-manager';
import { PostHogTracking } from '@/lib/posthog';

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
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>(
    'connecting'
  );
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [agentStatus, setAgentStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [deepResearchEnabled, setDeepResearchEnabled] = useState<boolean>(false);
  
  // Animation safeguards
  const [isWaitingForResponse, setIsWaitingForResponse] = useState<boolean>(false);
  const [responseTimeoutId, setResponseTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [animationLocked, setAnimationLocked] = useState<boolean>(false);
  const [animationStartTime, setAnimationStartTime] = useState<number | null>(null);

  // --- Refs ---
  const initStartedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendMessageRef = useRef<((messageText: string, options?: { useInternalKnowledge?: boolean }) => void) | null>(null);
  const socketIOManager = SocketIOManager.getInstance();
  const isCurrentlyThinking = useRef<boolean>(false);
  const minimumAnimationTime = 1000; // Minimum 1 second to prevent flickering

  // --- Derived Values ---
  const currentUserId = getUserId();
  
  // Combined loading state with safeguards
  const isShowingAnimation = isAgentThinking || isWaitingForResponse || animationLocked;

  // --- Helper Functions ---
  const safeStopAnimation = (callback?: () => void) => {
    const currentTime = Date.now();
    const animationDuration = animationStartTime ? currentTime - animationStartTime : 0;
    const remainingTime = Math.max(0, minimumAnimationTime - animationDuration);
    
    console.log('[Chat] Stopping animation - Duration:', animationDuration, 'Remaining:', remainingTime);
    
    setTimeout(() => {
      setIsAgentThinking(false);
      setIsWaitingForResponse(false);
      setAnimationLocked(false);
      setInputDisabled(false);
      setThinkingStartTime(null);
      setAnimationStartTime(null);
      isCurrentlyThinking.current = false;
      
      // Clear timeout
      if (responseTimeoutId) {
        clearTimeout(responseTimeoutId);
        setResponseTimeoutId(null);
      }
      
      callback?.();
      console.log('[Chat] Animation stopped at:', Date.now());
    }, remainingTime);
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
        <div className="flex items-center gap-2 text-sm font-inter text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 rounded-lg">
          <LoadingSpinner />
          <span>Checking server connection...</span>
        </div>
      );
    }

    if (serverStatus === 'offline') {
      return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div>
            <h3 className="text-red-800 dark:text-red-200 font-semibold text-sm font-inter mb-2">
              Connection Failed
            </h3>
            <p className="text-red-700 dark:text-red-300 text-sm font-inter leading-relaxed">
              Unable to establish connection to ElizaOS server at{' '}
              <code className="bg-red-100 dark:bg-red-800/50 px-2 py-1 rounded text-xs font-mono">
                {process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}
              </code>
            </p>
            <p className="text-red-600 dark:text-red-400 text-xs font-inter mt-3">
              Please ensure the server is running and accessible.
            </p>
          </div>
        </div>
      );
    }

    if (connectionStatus === 'connecting') {
      const statusText =
        agentStatus === 'checking'
          ? 'Setting up agent participation...'
          : agentStatus === 'ready'
            ? 'Connecting to agent...'
            : 'Connecting (agent setup failed)...';

      return (
        <div className="flex items-center gap-3 text-sm font-inter text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded-lg">
          <LoadingSpinner />
          <span>{statusText}</span>
        </div>
      );
    }

    if (connectionStatus === 'error') {
      return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-red-700 dark:text-red-300 font-medium font-inter">Connection Error</span>
          </div>
          <p className="text-red-600 dark:text-red-400 text-sm font-inter leading-relaxed">
            Failed to connect to the agent. Please try refreshing the page.
          </p>
        </div>
      );
    }

    if (connectionStatus === 'connected') {
      return (
        <div className="flex items-center gap-3 text-sm font-inter text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-3 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Connected to Agent</span>
        </div>
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

    // Reset session state for new session
    initStartedRef.current = false;
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

      try {
        // Step 1: Add agent to centralized channel
        const centralChannelId = '00000000-0000-0000-0000-000000000000';

        console.log('[Chat] Adding agent to centralized channel...');
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
            console.warn('[Chat] ⚠️ Failed to add agent to channel:', errorText);
            // Agent might already be in channel, treat as success
            setAgentStatus('ready');
          }
        } catch (error) {
          console.warn('[Chat] ⚠️ Error adding agent to channel:', error);
          // Continue anyway but mark as potential issue
          setAgentStatus('error');
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

  // --- Set up Socket Event Listeners ---
  useEffect(() => {
    if (connectionStatus !== 'connected' || !channelId || !sessionId || !currentUserId) {
      return;
    }

    console.log('[Chat] Setting up socket event listeners...');

    // Message broadcast handler
    const handleMessageBroadcast = (data: MessageBroadcastData) => {
      console.log('[Chat] Received message broadcast:', data);

      // Skip our own messages to avoid duplicates
      if (data.senderId === currentUserId) {
        console.log('[Chat] Skipping our own message broadcast');
        return;
      }

      // Check if this is an agent message by sender ID
      const isAgentMessage = data.senderId === agentId;

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

      // Track agent message received
      if (isAgentMessage) {
        const responseTime = thinkingStartTime ? Date.now() - thinkingStartTime : 0;
        PostHogTracking.getInstance().messageReceived({
          sessionId: sessionId || 'unknown',
          responseTime,
          thinkingTime: responseTime,
        });
      }

      // If this is an agent message, simulate streaming by adding character by character
      if (isAgentMessage && message.text) {
        // Add the message with empty text first
        const streamingMessage = { ...message, text: '' };
        setMessages((prev) => [...prev, streamingMessage]);

        // Ensure thinking indicator shows for at least 800ms for better UX
        const minimumThinkingDuration = 800;
        const currentThinkingStartTime = thinkingStartTime || Date.now();

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
            
            // Only disable thinking indicator after minimum duration AND streaming is complete
            const elapsedTime = Date.now() - currentThinkingStartTime;
            const remainingTime = Math.max(0, minimumThinkingDuration - elapsedTime);
            
                  setTimeout(() => {
        safeStopAnimation();
      }, remainingTime);
          }
        }, 10); // Adjust speed: lower = faster, higher = slower
      } else {
        // For non-agent messages, add normally
        setMessages((prev) => [...prev, message]);
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
      console.log('[Chat] Message complete');
      // Ensure minimum thinking duration for better UX
      const minimumThinkingDuration = 800;
      const currentThinkingStartTime = thinkingStartTime || Date.now();
      const elapsedTime = Date.now() - currentThinkingStartTime;
      const remainingTime = Math.max(0, minimumThinkingDuration - elapsedTime);
      
                  setTimeout(() => {
              safeStopAnimation();
            }, remainingTime);
    };

    // Attach event listeners
    socketIOManager.on('messageBroadcast', handleMessageBroadcast);
    socketIOManager.on('controlMessage', handleControlMessage);
    socketIOManager.on('messageComplete', handleMessageComplete);

    // Join the session channel
    socketIOManager.joinChannel(channelId, serverId);

    // Set the active session channel ID for message filtering
    socketIOManager.setActiveSessionChannelId(channelId);
    console.log('[Chat] Set active session channel ID:', channelId);

    // For DM sessions, we don't need to join the central channel
    // The agent should respond directly to the session channel

    // Cleanup function
    return () => {
      socketIOManager.off('messageBroadcast', handleMessageBroadcast);
      socketIOManager.off('controlMessage', handleControlMessage);
      socketIOManager.off('messageComplete', handleMessageComplete);
      socketIOManager.leaveChannel(channelId);
      socketIOManager.clearActiveSessionChannelId();
      
      // Clean up timeout on unmount
      if (responseTimeoutId) {
        clearTimeout(responseTimeoutId);
      }
    };
  }, [connectionStatus, channelId, agentId, socketIOManager, currentUserId, responseTimeoutId]);

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
        connectionStatus !== 'connected'
      ) {
        console.warn('[Chat] Cannot send message (stale state prevented):', {
          hasText: !!messageText.trim(),
          hasUserId: !!currentUserId,
          hasChannelId: !!channelId,
          inputDisabled,
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
      
      // Track message sent
      PostHogTracking.getInstance().messageSent({
        sessionId: sessionId || 'unknown',
        messageType: 'text',
        messageLength: finalMessageText.length,
      });
      
      // Start thinking animation with safeguards
      const currentTime = Date.now();
      setIsAgentThinking(true);
      setIsWaitingForResponse(true);
      setAnimationLocked(true);
      setThinkingStartTime(currentTime);
      setAnimationStartTime(currentTime);
      setInputDisabled(true);
      isCurrentlyThinking.current = true;
      
      console.log('[Chat] Started thinking animation at:', currentTime);

      console.log('[Chat] Sending message to session channel:', {
        messageText: finalMessageText,
        channelId,
        source: CHAT_SOURCE,
        deepResearch: deepResearchEnabled,
        useInternalKnowledge: options?.useInternalKnowledge ?? true,
      });

      socketIOManager.sendChannelMessage(
        finalMessageText,
        channelId,
        CHAT_SOURCE,
        undefined,
        undefined,
        options
      );

      // Clear any existing timeout
      if (responseTimeoutId) {
        clearTimeout(responseTimeoutId);
      }

      // Set backup timeout with better logging
      const timeoutId = setTimeout(() => {
        console.log('[Chat] Response timeout reached, re-enabling input');
        safeStopAnimation();
      }, 60000);
      
      setResponseTimeoutId(timeoutId);
    };
  });

  // This is a stable function that we can pass as a prop
  const sendMessage = useCallback(
    (messageText: string, options?: { useInternalKnowledge?: boolean }) => {
      sendMessageRef.current?.(messageText, options);
    },
    []
  );

  // --- Load Message History and Send Initial Query ---
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

        // If there's an initial message from session creation and no existing messages, send it
        if (sessionData?.metadata?.initialMessage && loadedMessages.length === 0) {
          console.log(
            `[Chat] New session detected - sending initial message: ${sessionData.metadata.initialMessage}`
          );
          setTimeout(() => {
            sendMessage(sessionData.metadata.initialMessage);
          }, 500); // Small delay to ensure everything is ready
        }
      })
      .catch((error) => {
        console.error('[Chat] Failed to load message history:', error);

        // Even if history loading fails, send initial message if present
        if (sessionData?.metadata?.initialMessage) {
          console.log(
            `[Chat] Sending initial message despite history loading failure: ${sessionData.metadata.initialMessage}`
          );
          setTimeout(() => {
            sendMessage(sessionData.metadata.initialMessage);
          }, 1000);
        }
      })
      .finally(() => {
        setIsLoadingHistory(false);
      });
  }, [channelId, agentId, connectionStatus, sessionData, sendMessage, currentUserId]);

  // --- Auto-scroll to bottom ---
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // --- Form submission handler ---
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || !currentUserId || inputDisabled) return;

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
    [input, currentUserId, inputDisabled, sendMessage]
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

  // --- Handle File Upload ---
  const handleFileUpload = useCallback(
    (file: File, uploadResult: any) => {
      console.log('[Chat] File uploaded:', file.name, uploadResult);

      // Create a message indicating the file was uploaded and enable internal knowledge
      const fileMessage = `I've uploaded "${file.name}" to your knowledge base. Please analyze this document and tell me what it contains.`;
      sendMessage(fileMessage, { useInternalKnowledge: true });
    },
    [sendMessage]
  );

  // Check if environment is properly configured
  if (!agentId) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900/20">
        <div className="text-center p-8 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm max-w-md">
          <h2 className="text-xl font-semibold font-inter mb-4 text-gray-900 dark:text-white">Configuration Error</h2>
          <p className="text-gray-600 dark:text-gray-400 text-base font-inter mb-4 leading-relaxed">
            NEXT_PUBLIC_AGENT_ID is not configured in environment variables.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 font-inter leading-relaxed">
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
        <div className="text-center p-8 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm max-w-md">
          <h2 className="text-xl font-semibold font-inter mb-4 text-gray-900 dark:text-white">Loading...</h2>
          <p className="text-gray-600 dark:text-gray-400 text-base font-inter leading-relaxed">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-white dark:bg-black">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 px-4 sm:px-6 pt-16 sm:pt-20 pb-4 sm:pb-6 bg-white dark:bg-black">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <h1 className="text-xl font-bold font-inter text-gray-900 dark:text-white leading-tight">
              {sessionData ? sessionData.title : <span className="animate-pulse">Loading session...</span>}
            </h1>
            {sessionData && (
              <div className="text-gray-600 dark:text-gray-400 text-sm font-inter mt-2 leading-relaxed">
                {sessionData.messageCount} messages • Last activity{' '}
                {formatTimeAgo(sessionData.lastActivity)}
              </div>
            )}
          </div>

          {/* Connection Status */}
          <div className="mt-1">{renderConnectionStatus()}</div>
        </div>
      </div>

      {/* Scrollable Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {/* Only show history loading if we're connected and actually loading history */}
          {connectionStatus === 'connected' && isLoadingHistory ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center gap-3">
                <LoadingSpinner />
                <span className="text-gray-600 dark:text-gray-400 font-inter text-base">Loading conversation history...</span>
              </div>
            </div>
          ) : (
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
                <div className="flex items-center gap-3 py-6 text-gray-600 dark:text-gray-400">
                  <LoadingSpinner />
                  <span className="font-inter text-base">
                    {process.env.NEXT_PUBLIC_AGENT_NAME || 'Agent'} is fetching science knowledge...
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input Area - Fixed at Bottom */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-black">
            <TextareaWithActions
              input={input}
              onInputChange={(e) => setInput(e.target.value)}
              onSubmit={handleSubmit}
              isLoading={isShowingAnimation || inputDisabled || connectionStatus !== 'connected'}
              placeholder={
                !isUserAuthenticated()
                  ? 'Please login to start a chat..'
                  : connectionStatus === 'connected'
                    ? 'Type your message...'
                    : 'Connecting...'
              }
              onTranscript={handleTranscript}
              deepResearchEnabled={deepResearchEnabled}
              onDeepResearchToggle={handleDeepResearchToggle}
              onFileUpload={handleFileUpload}
              disabled={!isUserAuthenticated()}
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
