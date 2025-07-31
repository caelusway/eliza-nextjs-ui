import { USER_NAME } from '@/constants';
import { Paper } from '@/types/chat-message';
import { Evt } from 'evt';
import { io, type Socket } from 'socket.io-client';
import { v4 } from 'uuid';

// Socket message types from ElizaOS core
enum SOCKET_MESSAGE_TYPE {
  ROOM_JOINING = 1,
  SEND_MESSAGE = 2,
  MESSAGE = 3,
  ACK = 4,
  THINKING = 5,
  CONTROL = 6,
}

// Debug tracking types
interface PendingRequest {
  id: string;
  type: string;
  startTime: number;
  channelId?: string;
  roomId?: string;
  message?: string;
}

interface PerformanceMetrics {
  averageResponseTime: number;
  totalRequests: number;
  totalResponses: number;
  pendingRequests: number;
  slowestRequest: number;
  fastestRequest: number;
  connectionTime?: number;
  lastActivity: number;
}

interface DebugEvent {
  timestamp: number;
  type: 'sent' | 'received' | 'connection' | 'error' | 'performance';
  event: string;
  data?: any;
  duration?: number;
  responseTime?: number;
}

// Direct connection to ElizaOS server for Socket.IO (proxying doesn't work for WebSocket)
const SOCKET_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
console.log('[SocketIO] Using server URL:', SOCKET_URL);

// Enhanced types for ElizaOS Socket.IO events (matching official client)
export type MessageBroadcastData = {
  senderId: string;
  senderName: string;
  text: string;
  channelId: string;
  roomId?: string; // Deprecated - for backward compatibility only
  createdAt: number;
  source: string;
  name: string; // Required for ContentWithUser compatibility
  attachments?: any[];
  thought?: string; // Agent's thought process
  actions?: string[]; // Actions taken by the agent
  prompt?: string; // The LLM prompt used to generate this message
  papers?: Paper[]; // Papers used to generate this message
  [key: string]: any;
};

export type MessageCompleteData = {
  channelId: string;
  roomId?: string; // Deprecated - for backward compatibility only
  [key: string]: any;
};

export type ControlMessageData = {
  action: 'enable_input' | 'disable_input';
  target?: string;
  channelId: string;
  roomId?: string; // Deprecated - for backward compatibility only
  [key: string]: any;
};

export type MessageDeletedData = {
  messageId: string;
  channelId: string;
  roomId?: string; // Deprecated - for backward compatibility only
  [key: string]: any;
};

export type ChannelClearedData = {
  channelId: string;
  roomId?: string; // Deprecated - for backward compatibility only
  [key: string]: any;
};

export type ChannelDeletedData = {
  channelId: string;
  roomId?: string; // Deprecated - for backward compatibility only
  [key: string]: any;
};

export type LogStreamData = {
  level: number;
  time: number;
  msg: string;
  agentId?: string;
  agentName?: string;
  channelId?: string;
  roomId?: string; // Deprecated - for backward compatibility only
  [key: string]: string | number | boolean | null | undefined;
};

export type MessageStateData = {
  messageId?: string;
  roomId: string;
  channelId?: string;
  state: string;
  metadata?: {
    progress?: number;
    error?: string;
    [key: string]: any;
  };
  [key: string]: any;
};

// A simple class that provides EventEmitter-like interface using Evt internally
class EventAdapter {
  private events: Record<string, Evt<any>> = {};

  constructor() {
    // Initialize common events
    this.events.messageBroadcast = Evt.create<MessageBroadcastData>();
    this.events.messageComplete = Evt.create<MessageCompleteData>();
    this.events.controlMessage = Evt.create<ControlMessageData>();
    this.events.messageDeleted = Evt.create<MessageDeletedData>();
    this.events.channelCleared = Evt.create<ChannelClearedData>();
    this.events.channelDeleted = Evt.create<ChannelDeletedData>();
    this.events.logStream = Evt.create<LogStreamData>();
    this.events.messageState = Evt.create<MessageStateData>();
  }

  on(eventName: string, listener: (...args: any[]) => void) {
    if (!this.events[eventName]) {
      this.events[eventName] = Evt.create();
    }

    this.events[eventName].attach(listener);
    return this;
  }

  off(eventName: string, listener: (...args: any[]) => void) {
    if (this.events[eventName]) {
      const handlers = this.events[eventName].getHandlers();
      for (const handler of handlers) {
        if (handler.callback === listener) {
          handler.detach();
        }
      }
    }
    return this;
  }

  emit(eventName: string, ...args: any[]) {
    if (this.events[eventName]) {
      this.events[eventName].post(args.length === 1 ? args[0] : args);
    }
    return this;
  }

  once(eventName: string, listener: (...args: any[]) => void) {
    if (!this.events[eventName]) {
      this.events[eventName] = Evt.create();
    }

    this.events[eventName].attachOnce(listener);
    return this;
  }

  // For checking if EventEmitter has listeners
  listenerCount(eventName: string): number {
    if (!this.events[eventName]) return 0;
    return this.events[eventName].getHandlers().length;
  }

  // Used only for internal access to the Evt instances
  _getEvt(eventName: string): Evt<any> | undefined {
    return this.events[eventName];
  }
}

/**
 * SocketIOManager handles real-time communication between the client and server
 * using Socket.io. Based on the official ElizaOS client implementation.
 */
class SocketIOManager extends EventAdapter {
  private static instance: SocketIOManager | null = null;
  private socket: Socket | null = null;
  private isConnected = false;
  private connectPromise: Promise<void> | null = null;
  private resolveConnect: (() => void) | null = null;
  private activeChannels: Set<string> = new Set();
  private activeRooms: Set<string> = new Set(); // For backward compatibility
  private activeSessionChannelId: string | null = null; // Current session for message filtering
  private entityId: string | null = null;
  private serverId: string | null = null;

  // Debug tracking properties
  private debugEnabled: boolean = process.env.NODE_ENV === 'development';
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private debugEvents: DebugEvent[] = [];
  private maxDebugEvents: number = 1000;
  private performanceMetrics: PerformanceMetrics = {
    averageResponseTime: 0,
    totalRequests: 0,
    totalResponses: 0,
    pendingRequests: 0,
    slowestRequest: 0,
    fastestRequest: Infinity,
    lastActivity: Date.now(),
  };
  private connectionStartTime: number = 0;

  // Public accessor for EVT instances (for advanced usage)
  public get evtMessageBroadcast() {
    return this._getEvt('messageBroadcast') as Evt<MessageBroadcastData>;
  }

  public get evtMessageComplete() {
    return this._getEvt('messageComplete') as Evt<MessageCompleteData>;
  }

  public get evtControlMessage() {
    return this._getEvt('controlMessage') as Evt<ControlMessageData>;
  }

  public get evtMessageDeleted() {
    return this._getEvt('messageDeleted') as Evt<MessageDeletedData>;
  }

  public get evtChannelCleared() {
    return this._getEvt('channelCleared') as Evt<ChannelClearedData>;
  }

  public get evtChannelDeleted() {
    return this._getEvt('channelDeleted') as Evt<ChannelDeletedData>;
  }

  public get evtLogStream() {
    return this._getEvt('logStream') as Evt<LogStreamData>;
  }

  private constructor() {
    super();

    // Set up periodic performance logging
    if (this.debugEnabled) {
      setInterval(() => {
        this.logPerformanceMetrics();
      }, 30000); // Log every 30 seconds
    }
  }

  public static getInstance(): SocketIOManager {
    if (!SocketIOManager.instance) {
      SocketIOManager.instance = new SocketIOManager();
    }
    return SocketIOManager.instance;
  }

  // Debug helper methods
  private logDebugEvent(event: DebugEvent): void {
    if (!this.debugEnabled) return;

    this.debugEvents.push(event);

    // Keep only the latest events
    if (this.debugEvents.length > this.maxDebugEvents) {
      this.debugEvents = this.debugEvents.slice(-this.maxDebugEvents);
    }

    // Log to console with color coding
    const timestamp = new Date(event.timestamp).toISOString();
    const prefix = `[SocketIO-Debug] ${timestamp}`;

    switch (event.type) {
      case 'sent':
        console.log(`%c${prefix} SENT: ${event.event}`, 'color: #00ff00', event.data);
        break;
      case 'received':
        console.log(
          `%c${prefix} RECEIVED: ${event.event}`,
          'color: #0099ff',
          event.data,
          event.responseTime ? `(${event.responseTime}ms)` : ''
        );
        break;
      case 'connection':
        console.log(`%c${prefix} CONNECTION: ${event.event}`, 'color: #ff9900', event.data);
        break;
      case 'error':
        console.error(`%c${prefix} ERROR: ${event.event}`, 'color: #ff0000', event.data);
        break;
      case 'performance':
        console.log(`%c${prefix} PERFORMANCE: ${event.event}`, 'color: #9900ff', event.data);
        break;
    }
  }

  private trackRequest(
    id: string,
    type: string,
    channelId?: string,
    roomId?: string,
    message?: string
  ): void {
    const request: PendingRequest = {
      id,
      type,
      startTime: Date.now(),
      channelId,
      roomId,
      message,
    };

    this.pendingRequests.set(id, request);
    this.performanceMetrics.totalRequests++;
    this.performanceMetrics.pendingRequests = this.pendingRequests.size;
    this.performanceMetrics.lastActivity = Date.now();

    this.logDebugEvent({
      timestamp: Date.now(),
      type: 'sent',
      event: type,
      data: {
        id,
        channelId,
        roomId,
        message: message?.substring(0, 100) + (message && message.length > 100 ? '...' : ''),
      },
    });
  }

  private trackResponse(
    channelId?: string,
    roomId?: string,
    eventType?: string,
    messageId?: string
  ): number | null {
    const now = Date.now();
    let responseTime: number | null = null;

    // First try to find by exact message ID if provided
    let pendingRequest: PendingRequest | undefined;

    if (messageId && this.pendingRequests.has(messageId)) {
      pendingRequest = this.pendingRequests.get(messageId);
    } else {
      // Fallback: try to find by channelId/roomId for the most recent request in that channel
      const channelRequests = Array.from(this.pendingRequests.values()).filter(
        (req) => (channelId && req.channelId === channelId) || (roomId && req.roomId === roomId)
      );

      // Get the most recent request for this channel
      pendingRequest = channelRequests.sort((a, b) => b.startTime - a.startTime)[0];
    }

    if (pendingRequest) {
      responseTime = now - pendingRequest.startTime;
      this.pendingRequests.delete(pendingRequest.id);

      // Update metrics
      this.performanceMetrics.totalResponses++;
      this.performanceMetrics.pendingRequests = this.pendingRequests.size;
      this.performanceMetrics.lastActivity = now;

      if (responseTime > this.performanceMetrics.slowestRequest) {
        this.performanceMetrics.slowestRequest = responseTime;
      }
      if (responseTime < this.performanceMetrics.fastestRequest) {
        this.performanceMetrics.fastestRequest = responseTime;
      }

      // Update average response time
      this.performanceMetrics.averageResponseTime =
        (this.performanceMetrics.averageResponseTime *
          (this.performanceMetrics.totalResponses - 1) +
          responseTime) /
        this.performanceMetrics.totalResponses;

      this.logDebugEvent({
        timestamp: now,
        type: 'received',
        event: eventType || 'response',
        data: { channelId, roomId, messageId, requestId: pendingRequest.id },
        responseTime,
      });
    } else {
      this.logDebugEvent({
        timestamp: now,
        type: 'received',
        event: eventType || 'response',
        data: { channelId, roomId, messageId, note: 'No matching pending request found' },
      });
    }

    return responseTime;
  }

  private logPerformanceMetrics(): void {
    if (!this.debugEnabled) return;

    const metrics = {
      ...this.performanceMetrics,
      pendingRequestsCount: this.pendingRequests.size,
      oldestPendingRequest:
        this.pendingRequests.size > 0
          ? Math.max(
              ...Array.from(this.pendingRequests.values()).map((req) => Date.now() - req.startTime)
            )
          : 0,
      activeChannels: this.activeChannels.size,
      activeRooms: this.activeRooms.size,
      isConnected: this.isConnected,
    };

    this.logDebugEvent({
      timestamp: Date.now(),
      type: 'performance',
      event: 'metrics_report',
      data: metrics,
    });

    // Warn about slow or stuck requests
    if (this.pendingRequests.size > 0) {
      const now = Date.now();
      const stuckRequests = Array.from(this.pendingRequests.values()).filter(
        (req) => now - req.startTime > 10000 // 10 seconds
      );

      if (stuckRequests.length > 0) {
        console.warn('[SocketIO-Debug] Found stuck requests:', stuckRequests);

        // Auto-clean very old stuck requests (>60 seconds)
        const veryOldRequests = stuckRequests.filter((req) => now - req.startTime > 60000);
        if (veryOldRequests.length > 0) {
          console.warn('[SocketIO-Debug] Auto-cleaning very old requests:', veryOldRequests.length);
          veryOldRequests.forEach((req) => {
            this.pendingRequests.delete(req.id);
          });
          this.performanceMetrics.pendingRequests = this.pendingRequests.size;
        }
      }
    }
  }

  public enableDebug(enabled: boolean = true): void {
    this.debugEnabled = enabled;
    console.log(`[SocketIO-Debug] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  public getDebugEvents(): DebugEvent[] {
    return [...this.debugEvents];
  }

  public getPerformanceMetrics(): PerformanceMetrics & {
    pendingRequestsDetails: PendingRequest[];
  } {
    return {
      ...this.performanceMetrics,
      pendingRequestsDetails: Array.from(this.pendingRequests.values()),
    };
  }

  public clearDebugData(): void {
    this.debugEvents = [];
    this.pendingRequests.clear();
    this.performanceMetrics = {
      averageResponseTime: 0,
      totalRequests: 0,
      totalResponses: 0,
      pendingRequests: 0,
      slowestRequest: 0,
      fastestRequest: Infinity,
      connectionTime: this.performanceMetrics.connectionTime,
      lastActivity: Date.now(),
    };
    console.log('[SocketIO-Debug] Debug data cleared');
  }

  public clearStuckRequests(olderThanMs: number = 30000): number {
    const now = Date.now();
    const stuckRequests = Array.from(this.pendingRequests.entries()).filter(
      ([id, req]) => now - req.startTime > olderThanMs
    );

    stuckRequests.forEach(([id]) => {
      this.pendingRequests.delete(id);
    });

    this.performanceMetrics.pendingRequests = this.pendingRequests.size;

    if (stuckRequests.length > 0) {
      console.log(`[SocketIO-Debug] Cleared ${stuckRequests.length} stuck requests`);
    }

    return stuckRequests.length;
  }

  public clearRequestsForChannel(channelId: string): number {
    const channelRequests = Array.from(this.pendingRequests.entries()).filter(
      ([id, req]) => req.channelId === channelId || req.roomId === channelId
    );

    channelRequests.forEach(([id]) => {
      this.pendingRequests.delete(id);
    });

    this.performanceMetrics.pendingRequests = this.pendingRequests.size;

    if (channelRequests.length > 0) {
      console.log(
        `[SocketIO-Debug] Cleared ${channelRequests.length} requests for channel ${channelId}`
      );
    }

    return channelRequests.length;
  }

  /**
   * Initialize the Socket.io connection to the server
   * @param entityId The client entity ID
   * @param serverId Server ID for channel-based messaging
   * @param authToken JWT token for authentication
   */
  public initialize(entityId: string, serverId?: string, authToken?: string): void {
    this.entityId = entityId;
    this.serverId = serverId;
    this.connectionStartTime = Date.now();

    if (this.socket) {
      console.warn('[SocketIO] Socket already initialized');
      return;
    }

    this.logDebugEvent({
      timestamp: Date.now(),
      type: 'connection',
      event: 'initialize',
      data: { entityId, serverId, socketUrl: SOCKET_URL },
    });

    // Create a single socket connection with authentication
    console.info('connecting to', SOCKET_URL);
    const socketOptions: any = {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      transports: ['polling', 'websocket'], // Try polling first
      forceNew: false,
      upgrade: true,
    };

    // Add authentication if token is provided
    if (authToken) {
      socketOptions.auth = {
        token: authToken,
      };
      socketOptions.extraHeaders = {
        Authorization: `Bearer ${authToken}`,
      };
      console.info('SocketIO authentication configured with JWT token');
    }

    this.socket = io(SOCKET_URL, socketOptions);

    // Set up connection promise for async operations that depend on connection
    this.connectPromise = new Promise<void>((resolve) => {
      this.resolveConnect = resolve;
    });

    this.socket.on('connect', () => {
      const connectionTime = Date.now() - this.connectionStartTime;
      console.info('[SocketIO] Connected to server successfully');
      console.info('[SocketIO] Socket ID:', this.socket?.id);
      this.isConnected = true;
      this.performanceMetrics.connectionTime = connectionTime;
      this.resolveConnect?.();

      this.logDebugEvent({
        timestamp: Date.now(),
        type: 'connection',
        event: 'connected',
        data: { socketId: this.socket?.id, connectionTime },
      });

      // Rejoin any active channels after reconnection
      this.activeChannels.forEach((channelId) => {
        this.joinChannel(channelId);
      });

      // Rejoin any active rooms after reconnection (backward compatibility)
      this.activeRooms.forEach((roomId) => {
        this.joinRoom(roomId);
      });
    });

    this.socket.on('connection_established', (data) => {
      console.info('[SocketIO] Connection established:', data);
      this.logDebugEvent({
        timestamp: Date.now(),
        type: 'connection',
        event: 'connection_established',
        data,
      });
    });

    this.socket.on('messageBroadcast', (data) => {
      // Try to track response using the message ID from the data
      const responseTime = this.trackResponse(
        data.channelId,
        data.roomId,
        'messageBroadcast',
        data.id
      );
      console.info(`[SocketIO] Message broadcast received:`, data);

      // Check if this message is for our active session
      const isForActiveSession =
        this.activeSessionChannelId &&
        (data.channelId === this.activeSessionChannelId ||
          data.roomId === this.activeSessionChannelId);

      // Also check if it's for any of our joined channels (for backward compatibility)
      const isActiveChannel = data.channelId && this.activeChannels.has(data.channelId);
      const isActiveRoom = data.roomId && this.activeRooms.has(data.roomId);

      if (isForActiveSession || isActiveChannel || isActiveRoom) {
        const context = isForActiveSession
          ? `active session ${this.activeSessionChannelId}`
          : isActiveChannel
            ? `active channel ${data.channelId}`
            : `active room ${data.roomId}`;
        console.info(`[SocketIO] Handling message for ${context}`);

        // Post the message to the event
        this.emit('messageBroadcast', {
          ...data,
          name: data.senderName, // Required for ContentWithUser compatibility
        });
      } else {
        console.warn(
          `[SocketIO] Received message for inactive session/channel/room:`,
          {
            channelId: data.channelId,
            roomId: data.roomId,
            activeSession: this.activeSessionChannelId,
          },
          'Active channels:',
          Array.from(this.activeChannels),
          'Active rooms:',
          Array.from(this.activeRooms)
        );
      }
    });

    this.socket.on('messageComplete', (data) => {
      const responseTime = this.trackResponse(
        data.channelId,
        data.roomId,
        'messageComplete',
        data.messageId
      );
      console.info(`[SocketIO] Message complete received:`, data);

      // Check if this event is for our active session
      const isForActiveSession =
        this.activeSessionChannelId &&
        (data.channelId === this.activeSessionChannelId ||
          data.roomId === this.activeSessionChannelId);

      // Also check if it's for any of our joined channels (for backward compatibility)
      const isActiveChannel = data.channelId && this.activeChannels.has(data.channelId);
      const isActiveRoom = data.roomId && this.activeRooms.has(data.roomId);

      if (isForActiveSession || isActiveChannel || isActiveRoom) {
        const context = isForActiveSession
          ? `active session ${this.activeSessionChannelId}`
          : isActiveChannel
            ? `active channel ${data.channelId}`
            : `active room ${data.roomId}`;
        console.info(`[SocketIO] Handling messageComplete for ${context}`);

        // Post the event now that we've confirmed it's for us
        this.emit('messageComplete', data);
      } else {
        // This is not an error, it's expected. It's a messageComplete for a
        // channel we are no longer actively listening to. We can safely ignore it.
        console.warn(
          `[SocketIO] Received messageComplete for inactive session/channel/room, ignoring:`,
          {
            channelId: data.channelId,
            roomId: data.roomId,
            activeSession: this.activeSessionChannelId,
          }
        );
      }
    });

    this.socket.on('controlMessage', (data) => {
      this.trackResponse(data.channelId, data.roomId, 'controlMessage');
      console.info(`[SocketIO] Control message received:`, data);

      const isActiveChannel = data.channelId && this.activeChannels.has(data.channelId);
      const isActiveRoom = data.roomId && this.activeRooms.has(data.roomId);

      if (isActiveChannel || isActiveRoom) {
        const context = isActiveChannel ? `channel ${data.channelId}` : `room ${data.roomId}`;
        console.info(`[SocketIO] Handling control message for active ${context}`);
        this.emit('controlMessage', data);
      } else {
        console.warn(`[SocketIO] Received control message for inactive channel/room:`, {
          channelId: data.channelId,
          roomId: data.roomId,
        });
      }
    });

    this.socket.on('messageDeleted', (data) => {
      this.trackResponse(data.channelId, data.roomId, 'messageDeleted');
      console.info(`[SocketIO] Message deleted:`, data);
      this.emit('messageDeleted', data);
    });

    this.socket.on('channelCleared', (data) => {
      this.trackResponse(data.channelId, data.roomId, 'channelCleared');
      console.info(`[SocketIO] Channel cleared:`, data);
      this.emit('channelCleared', data);
    });

    this.socket.on('channelDeleted', (data) => {
      this.trackResponse(data.channelId, data.roomId, 'channelDeleted');
      console.info(`[SocketIO] Channel deleted:`, data);
      this.emit('channelDeleted', data);
    });

    this.socket.on('log_stream', (data) => {
      this.logDebugEvent({
        timestamp: Date.now(),
        type: 'received',
        event: 'log_stream',
        data,
      });
      this.emit('logStream', data);
    });

    this.socket.on('messageState', (data) => {
      console.info(`[SocketIO] Message state received:`, data);
      this.logDebugEvent({
        timestamp: Date.now(),
        type: 'received',
        event: 'messageState',
        data,
      });

      // Check if this is for one of our active channels
      const channelId = data.roomId || data.channelId;
      if (channelId && this.activeChannels.has(channelId)) {
        console.info(
          `[SocketIO] Handling message state update for active channel ${channelId}: ${data.state}`
        );
        this.emit('messageState', data);
      } else {
        console.warn(
          `[SocketIO] Received message state for inactive channel ${channelId}, active channels:`,
          Array.from(this.activeChannels)
        );
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.info(`[SocketIO] Disconnected. Reason: ${reason}`);
      this.isConnected = false;

      this.logDebugEvent({
        timestamp: Date.now(),
        type: 'connection',
        event: 'disconnect',
        data: { reason },
      });

      // Reset connect promise for next connection
      this.connectPromise = new Promise<void>((resolve) => {
        this.resolveConnect = resolve;
      });

      if (reason === 'io server disconnect') {
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SocketIO] Connection error:', error);
      console.error('[SocketIO] Error details:', {
        message: error.message,
        description: (error as any).description,
        context: (error as any).context,
        type: (error as any).type,
      });

      this.logDebugEvent({
        timestamp: Date.now(),
        type: 'error',
        event: 'connect_error',
        data: {
          message: error.message,
          description: (error as any).description,
          context: (error as any).context,
          type: (error as any).type,
        },
      });
    });

    // Track all socket events for debugging
    if (this.debugEnabled && this.socket) {
      const originalEmit = this.socket.emit.bind(this.socket);
      this.socket.emit = (event: string, ...args: any[]) => {
        this.logDebugEvent({
          timestamp: Date.now(),
          type: 'sent',
          event: `emit_${event}`,
          data: args,
        });
        return originalEmit(event, ...args);
      };
    }
  }

  /**
   * Join a channel to receive messages from it
   * @param channelId Channel ID to join
   * @param serverId Optional server ID for the channel
   */
  public async joinChannel(channelId: string, serverId?: string): Promise<void> {
    if (!this.socket) {
      console.error('[SocketIO] Cannot join channel: socket not initialized');
      return;
    }

    // Wait for connection if needed
    if (!this.isConnected) {
      await this.connectPromise;
    }

    // Clear any existing requests for this channel before joining
    this.clearRequestsForChannel(channelId);

    const requestId = v4();
    this.trackRequest(requestId, 'joinChannel', channelId);

    this.activeChannels.add(channelId);
    this.socket.emit('message', {
      type: SOCKET_MESSAGE_TYPE.ROOM_JOINING,
      payload: {
        channelId,
        serverId: serverId || this.serverId,
        entityId: this.entityId,
        metadata: { isDm: true }, // Mark as DM channel for proper routing
      },
    });

    console.info(`[SocketIO] Joined channel ${channelId} (DM session)`);

    // Give a small delay to ensure channel joining is processed
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  /**
   * Join a room to receive messages from it (backward compatibility)
   * @param roomId Room/Agent ID to join
   */
  public async joinRoom(roomId: string): Promise<void> {
    if (!this.socket) {
      console.error('[SocketIO] Cannot join room: socket not initialized');
      return;
    }

    // Wait for connection if needed
    if (!this.isConnected) {
      await this.connectPromise;
    }

    const requestId = v4();
    this.trackRequest(requestId, 'joinRoom', undefined, roomId);

    this.activeRooms.add(roomId);
    this.socket.emit('message', {
      type: SOCKET_MESSAGE_TYPE.ROOM_JOINING,
      payload: {
        roomId,
        entityId: this.entityId,
      },
    });

    console.info(`[SocketIO] Joined room ${roomId}`);
  }

  /**
   * Leave a channel to stop receiving messages from it
   * @param channelId Channel ID to leave
   */
  public leaveChannel(channelId: string): void {
    if (!this.socket || !this.isConnected) {
      console.warn(`[SocketIO] Cannot leave channel ${channelId}: not connected`);
      return;
    }

    // Clear any pending requests for this channel
    this.clearRequestsForChannel(channelId);

    this.activeChannels.delete(channelId);

    this.logDebugEvent({
      timestamp: Date.now(),
      type: 'sent',
      event: 'leaveChannel',
      data: { channelId },
    });

    console.info(`[SocketIO] Left channel ${channelId}`);
  }

  /**
   * Leave a room to stop receiving messages from it (backward compatibility)
   * @param roomId Room/Agent ID to leave
   */
  public leaveRoom(roomId: string): void {
    if (!this.socket || !this.isConnected) {
      console.warn(`[SocketIO] Cannot leave room ${roomId}: not connected`);
      return;
    }

    this.activeRooms.delete(roomId);

    this.logDebugEvent({
      timestamp: Date.now(),
      type: 'sent',
      event: 'leaveRoom',
      data: { roomId },
    });

    console.info(`[SocketIO] Left room ${roomId}`);
  }

  /**
   * Send a message to a specific channel
   * @param message Message text to send
   * @param channelId Channel ID to send the message to (usually central bus)
   * @param source Source identifier (e.g., 'client_chat')
   * @param sessionChannelId Optional session channel ID for filtering (following official client pattern)
   * @param serverId Optional server ID
   */
  public async sendChannelMessage(
    message: string,
    channelId: string,
    source: string,
    sessionChannelId?: string,
    serverId?: string,
    options?: { useInternalKnowledge?: boolean }
  ): Promise<void> {
    if (!this.socket) {
      console.error('[SocketIO] Cannot send channel message: socket not initialized');
      return;
    }

    // Wait for connection if needed
    if (!this.isConnected) {
      await this.connectPromise;
    }

    const messageId = v4();
    const finalChannelId = sessionChannelId || channelId; // Use session channel ID if provided

    this.trackRequest(messageId, 'sendChannelMessage', finalChannelId, undefined, message);

    console.info(
      `[SocketIO] Sending message to channel ${channelId} with session ID ${finalChannelId}`
    );

    // Emit message to server - always send to central bus but tag with session channel ID
    this.socket.emit('message', {
      type: SOCKET_MESSAGE_TYPE.SEND_MESSAGE,
      payload: {
        senderId: this.entityId,
        senderName: USER_NAME,
        message,
        channelId: finalChannelId, // Use session channel ID for proper routing
        roomId: finalChannelId, // Keep for backward compatibility
        serverId: serverId || this.serverId,
        messageId,
        source,
        attachments: [],
        metadata: { channelType: 'DM' },
        useInternalKnowledge: options?.useInternalKnowledge ?? true,
      },
    });

    // Immediately broadcast message locally so UI updates instantly
    this.emit('messageBroadcast', {
      senderId: this.entityId || '',
      senderName: USER_NAME,
      text: message,
      channelId: finalChannelId, // Use session channel ID for filtering
      roomId: finalChannelId, // Keep for backward compatibility
      createdAt: Date.now(),
      source,
      name: USER_NAME, // Required for ContentWithUser compatibility
    });
  }

  /**
   * Send a message to a specific room (backward compatibility)
   * @param message Message text to send
   * @param roomId Room/Agent ID to send the message to
   * @param source Source identifier (e.g., 'client_chat')
   */
  public async sendMessage(message: string, roomId: string, source: string): Promise<void> {
    if (!this.socket) {
      console.error('[SocketIO] Cannot send message: socket not initialized');
      return;
    }

    // Wait for connection if needed
    if (!this.isConnected) {
      await this.connectPromise;
    }

    const messageId = v4();
    const worldId = '00000000-0000-0000-0000-000000000000';

    this.trackRequest(messageId, 'sendMessage', undefined, roomId, message);

    console.info(`[SocketIO] Sending message to room ${roomId}`);

    // Emit message to server
    this.socket.emit('message', {
      type: SOCKET_MESSAGE_TYPE.SEND_MESSAGE,
      payload: {
        senderId: this.entityId,
        senderName: USER_NAME,
        message,
        roomId,
        worldId,
        messageId,
        source,
      },
    });

    // Immediately broadcast message locally so UI updates instantly
    this.emit('messageBroadcast', {
      senderId: this.entityId || '',
      senderName: USER_NAME,
      text: message,
      roomId,
      createdAt: Date.now(),
      source,
      name: USER_NAME, // Required for ContentWithUser compatibility
    });
  }

  /**
   * Subscribe to log streaming
   */
  public subscribeToLogs(): void {
    if (this.socket && this.isConnected) {
      this.logDebugEvent({
        timestamp: Date.now(),
        type: 'sent',
        event: 'subscribeToLogs',
        data: {},
      });

      this.socket.emit('subscribe_logs');
      console.info('[SocketIO] Subscribed to log streaming');
    }
  }

  /**
   * Unsubscribe from log streaming
   */
  public unsubscribeFromLogs(): void {
    if (this.socket && this.isConnected) {
      this.logDebugEvent({
        timestamp: Date.now(),
        type: 'sent',
        event: 'unsubscribeFromLogs',
        data: {},
      });

      this.socket.emit('unsubscribe_logs');
      console.info('[SocketIO] Unsubscribed from log streaming');
    }
  }

  /**
   * Update log filters
   */
  public updateLogFilters(filters: { agentName?: string; level?: string }): void {
    if (this.socket && this.isConnected) {
      this.logDebugEvent({
        timestamp: Date.now(),
        type: 'sent',
        event: 'updateLogFilters',
        data: filters,
      });

      this.socket.emit('update_log_filters', filters);
      console.info('[SocketIO] Updated log filters:', filters);
    }
  }

  /**
   * Get active channels
   */
  public getActiveChannels(): Set<string> {
    return new Set(this.activeChannels);
  }

  /**
   * Get active rooms (backward compatibility)
   */
  public getActiveRooms(): Set<string> {
    return new Set(this.activeRooms);
  }

  /**
   * Check if connected
   */
  public isSocketConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get entity ID
   */
  public getEntityId(): string | null {
    return this.entityId;
  }

  /**
   * Get server ID
   */
  public getServerId(): string | null {
    return this.serverId;
  }

  /**
   * Set the active session channel ID for message filtering (following official client pattern)
   * @param sessionChannelId The session channel ID to filter messages by
   */
  public setActiveSessionChannelId(sessionChannelId: string): void {
    // Clear stuck requests from previous session
    if (this.activeSessionChannelId && this.activeSessionChannelId !== sessionChannelId) {
      this.clearRequestsForChannel(this.activeSessionChannelId);
    }

    this.activeSessionChannelId = sessionChannelId;

    this.logDebugEvent({
      timestamp: Date.now(),
      type: 'connection',
      event: 'setActiveSessionChannelId',
      data: { sessionChannelId, clearedOldSession: !!this.activeSessionChannelId },
    });

    console.info(`[SocketIO] Active session channel set to: ${sessionChannelId}`);
  }

  /**
   * Get the current active session channel ID
   */
  public getActiveSessionChannelId(): string | null {
    return this.activeSessionChannelId;
  }

  /**
   * Clear the active session channel ID
   */
  public clearActiveSessionChannelId(): void {
    this.activeSessionChannelId = null;

    this.logDebugEvent({
      timestamp: Date.now(),
      type: 'connection',
      event: 'clearActiveSessionChannelId',
      data: {},
    });

    console.info(`[SocketIO] Active session channel cleared`);
  }

  /**
   * Disconnect from the server
   */
  public disconnect(): void {
    if (this.socket) {
      this.logDebugEvent({
        timestamp: Date.now(),
        type: 'connection',
        event: 'disconnect',
        data: { manual: true },
      });

      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.activeChannels.clear();
      this.activeRooms.clear();
      console.info('[SocketIO] Disconnected from server');
    }
  }
}

export default SocketIOManager;
