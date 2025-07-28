/**
 * Hook for authenticated API calls using Privy JWT tokens
 */

import { usePrivy } from '@privy-io/react-auth';
import { useCallback } from 'react';
import * as apiClient from '@/lib/api-client';

export function useAuthenticatedAPI() {
  const { getAccessToken } = usePrivy();

  // Helper to get auth token
  const getAuthToken = useCallback(async (): Promise<string | undefined> => {
    try {
      return await getAccessToken();
    } catch (error) {
      console.error('[useAuthenticatedAPI] Failed to get access token:', error);
      return undefined;
    }
  }, [getAccessToken]);

  // Authenticated API functions
  const authenticatedAPI = {
    // Agent Management
    getAgents: useCallback(async () => {
      const token = await getAuthToken();
      return apiClient.getAgents(token);
    }, [getAuthToken]),

    getAgent: useCallback(
      async (agentId: string) => {
        const token = await getAuthToken();
        return apiClient.getAgent(agentId, token);
      },
      [getAuthToken]
    ),

    // Memory Management
    getAgentMemories: useCallback(
      async (agentId: string, limit = 50) => {
        const token = await getAuthToken();
        return apiClient.getAgentMemories(agentId, limit, token);
      },
      [getAuthToken]
    ),

    getRoomMemories: useCallback(
      async (agentId: string, roomId: string, limit = 50) => {
        const token = await getAuthToken();
        return apiClient.getRoomMemories(agentId, roomId, limit, token);
      },
      [getAuthToken]
    ),

    // Messaging System
    submitMessage: useCallback(
      async (payload: Parameters<typeof apiClient.submitMessage>[0]) => {
        const token = await getAuthToken();
        return apiClient.submitMessage(payload, token);
      },
      [getAuthToken]
    ),

    getChannelMessages: useCallback(
      async (channelId: string, limit = 50) => {
        const token = await getAuthToken();
        return apiClient.getChannelMessages(channelId, limit, token);
      },
      [getAuthToken]
    ),

    sendChannelMessage: useCallback(
      async (channelId: string, content: string, userId: string, agentId?: string) => {
        const token = await getAuthToken();
        return apiClient.sendChannelMessage(channelId, content, userId, agentId, token);
      },
      [getAuthToken]
    ),

    // Server Health
    pingServer: useCallback(async () => {
      const token = await getAuthToken();
      return apiClient.pingServer(token);
    }, [getAuthToken]),

    // DM Channel Management
    createDMChannel: useCallback(
      async (userId: string, agentId: string, channelId?: string, title?: string) => {
        const token = await getAuthToken();
        return apiClient.createDMChannel(userId, agentId, channelId, title, token);
      },
      [getAuthToken]
    ),

    getOrCreateDMChannel: useCallback(
      async (userId: string, agentId: string, sessionId?: string) => {
        const token = await getAuthToken();
        return apiClient.getOrCreateDMChannel(userId, agentId, sessionId, token);
      },
      [getAuthToken]
    ),

    listDMChannels: useCallback(
      async (userId: string, agentId: string) => {
        const token = await getAuthToken();
        return apiClient.listDMChannels(userId, agentId, token);
      },
      [getAuthToken]
    ),

    // Room Management
    getAgentRooms: useCallback(
      async (agentId: string) => {
        const token = await getAuthToken();
        return apiClient.getAgentRooms(agentId, token);
      },
      [getAuthToken]
    ),

    createRoom: useCallback(
      async (agentId: string, roomData: Parameters<typeof apiClient.createRoom>[1]) => {
        const token = await getAuthToken();
        return apiClient.createRoom(agentId, roomData, token);
      },
      [getAuthToken]
    ),
  };

  return authenticatedAPI;
}

// Utility function for one-off authenticated API calls
export async function withAuth<T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
  getAccessToken: () => Promise<string | undefined>
): Promise<ReturnType<T>> {
  const token = await getAccessToken();
  // Extract the original parameters and add the token as the last parameter
  return apiFunction.bind(null, token);
}
