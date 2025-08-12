'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuthenticatedAPI } from '@/hooks/useAuthenticatedAPI';
import { useAuthenticatedFetch } from '@/lib/authenticated-fetch';
import { useUserManager } from '@/lib/user-manager';
import { usePrivy } from '@privy-io/react-auth';
import SocketIOManager from '@/lib/socketio-manager';

interface AgentContextType {
  // Connection states
  serverStatus: 'checking' | 'online' | 'offline';
  agentStatus: 'checking' | 'ready' | 'error';
  connectionStatus: 'connecting' | 'connected' | 'error';

  // Agent readiness
  isAgentReady: boolean;

  // Initialization
  initializeAgent: () => Promise<void>;
  isInitialized: boolean;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [agentStatus, setAgentStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>(
    'connecting'
  );
  const [isInitialized, setIsInitialized] = useState(false);

  const authenticatedAPI = useAuthenticatedAPI();
  const authenticatedFetch = useAuthenticatedFetch();
  const { getUserId, isUserAuthenticated, isReady } = useUserManager();
  const { getAccessToken } = usePrivy();
  const socketIOManager = SocketIOManager.getInstance();

  const initializationStarted = useRef(false);
  const currentUserId = getUserId();
  const agentId = process.env.NEXT_PUBLIC_AGENT_ID;
  const serverId = '00000000-0000-0000-0000-000000000000';

  const isAgentReady =
    serverStatus === 'online' &&
    agentStatus === 'ready' &&
    connectionStatus === 'connected' &&
    isInitialized;

  const initializeAgent = async () => {
    if (!currentUserId || !agentId || !isReady || !isUserAuthenticated()) {
      console.log('[AgentContext] Prerequisites not met for initialization');
      return;
    }

    if (initializationStarted.current) {
      console.log('[AgentContext] Initialization already in progress');
      return;
    }

    initializationStarted.current = true;
    console.log('[AgentContext] 🚀 Starting global agent initialization...');

    try {
      // Step 1: Check server status
      console.log('[AgentContext] Checking server status...');
      setServerStatus('checking');
      const isOnline = await authenticatedAPI.pingServer();
      console.log('[AgentContext] Server ping result:', isOnline);
      setServerStatus(isOnline ? 'online' : 'offline');

      if (!isOnline) {
        setConnectionStatus('error');
        return;
      }

      // Step 2: Setup agent in centralized channel
      console.log('[AgentContext] Setting up agent...');
      setAgentStatus('checking');
      const centralChannelId = '00000000-0000-0000-0000-000000000000';

      try {
        const addAgentResponse = await authenticatedFetch(
          `/api/eliza/messaging/central-channels/${centralChannelId}/agents`,
          {
            method: 'POST',
            body: JSON.stringify({ agentId }),
          }
        );

        if (addAgentResponse.ok) {
          console.log('[AgentContext] ✅ Agent successfully added to centralized channel');
        } else {
          console.log(
            '[AgentContext] ⚠️ Central channel setup not available (expected for some setups)'
          );
        }
        setAgentStatus('ready');
      } catch (error) {
        console.log('[AgentContext] ⚠️ Central channel setup not available:', error);
        setAgentStatus('ready'); // Continue anyway - ElizaOS can work without centralized setup
      }

      // Step 3: Initialize socket connection
      console.log('[AgentContext] Initializing socket connection...');
      setConnectionStatus('connecting');

      try {
        const token = await getAccessToken();
        socketIOManager.initialize(currentUserId, serverId, token);
      } catch (error) {
        console.error('[AgentContext] Failed to get access token for Socket.IO:', error);
        socketIOManager.initialize(currentUserId, serverId);
      }

      // Step 4: Wait for socket connection
      const checkConnection = () => {
        if (socketIOManager.isSocketConnected()) {
          console.log('[AgentContext] ✅ Socket connected successfully');
          setConnectionStatus('connected');
          setIsInitialized(true);
          console.log('[AgentContext] 🎉 Agent initialization complete!');
        } else {
          setTimeout(checkConnection, 500);
        }
      };

      checkConnection();
    } catch (error) {
      console.error('[AgentContext] ❌ Agent initialization failed:', error);
      setConnectionStatus('error');
      setAgentStatus('error');
    }
  };

  // Auto-initialize when prerequisites are met
  useEffect(() => {
    if (
      isReady &&
      isUserAuthenticated() &&
      currentUserId &&
      agentId &&
      !isInitialized &&
      !initializationStarted.current
    ) {
      console.log('[AgentContext] Prerequisites met, starting initialization...');
      initializeAgent();
    }
  }, [isReady, isUserAuthenticated, currentUserId, agentId, isInitialized]);

  const value: AgentContextType = {
    serverStatus,
    agentStatus,
    connectionStatus,
    isAgentReady,
    initializeAgent,
    isInitialized,
  };

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
}
