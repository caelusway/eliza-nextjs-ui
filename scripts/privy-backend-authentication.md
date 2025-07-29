# Privy JWT Backend Authentication for ElizaOS

This guide shows how to extend your existing Privy JWT authentication from the frontend to protect your ElizaOS backend server, creating a unified authentication system that secures all real ElizaOS API endpoints and Socket.IO connections.

## Overview

Since your frontend already uses Privy JWT authentication, we can leverage the same tokens to secure the ElizaOS backend API routes and Socket.IO connections. This approach provides:

- **Unified Authentication**: Same user identity across frontend and backend
- **Seamless Integration**: No additional login flows required
- **User Scoping**: Automatic user-based resource filtering for agents, memories, and messages
- **ElizaOS Integration**: Protection for all documented ElizaOS API endpoints
- **Real-time Security**: Authenticated Socket.IO connections with proper event filtering

## Table of Contents

- [Privy Backend Setup](#privy-backend-setup)
- [JWT Verification Middleware](#jwt-verification-middleware)
- [Socket.IO Authentication](#socketio-authentication)
- [ElizaOS API Protection](#elizaos-api-protection)
- [Central Messaging System](#central-messaging-system)
- [Agent & Memory Management](#agent--memory-management)
- [Real-time Event Handling](#real-time-event-handling)
- [Rate Limiting & Security](#rate-limiting--security)
- [Production Deployment](#production-deployment)

---

## Privy Backend Setup

### Install Privy Server Auth

```bash
# Install Privy server-side authentication package
bun add @privy-io/server-auth
```

### Environment Configuration

Add your Privy configuration to the ElizaOS server environment:

```bash
# .env - ElizaOS Server Environment
# Privy Configuration (REQUIRED)
PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-app-secret

# ElizaOS Configuration
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/eliza
# OR for PGLite
PGLITE_DATA_DIR=./.elizadb

# Model Providers (at least one required)
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GROQ_API_KEY=your-groq-api-key

# Frontend URLs for CORS
NEXT_PUBLIC_APP_URL=http://localhost:4000
ALLOWED_ORIGINS=http://localhost:4000,https://localhost:4000

# Central Messaging
NEXT_PUBLIC_WORLD_ID=00000000-0000-0000-0000-000000000000
```

### Initialize Privy in ElizaOS Server

```typescript
// src/lib/privy-auth.ts - Privy Authentication Setup
import { PrivyApi } from '@privy-io/server-auth';

// Initialize Privy API client
export const privyApi = new PrivyApi({
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
});

// Privy JWT verification configuration
export const PRIVY_CONFIG = {
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
  verificationKey: process.env.PRIVY_VERIFICATION_KEY,
};

// Validate required Privy environment variables
export const validatePrivyConfig = () => {
  const required = ['PRIVY_APP_ID', 'PRIVY_APP_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('[Privy] Missing required environment variables:', missing);
    process.exit(1);
  }
  
  console.log('[Privy] Configuration validated successfully');
};
```

---

## JWT Verification Middleware

### Privy JWT Authentication Middleware

```typescript
// src/middleware/privy-auth.ts - Privy JWT Middleware
import { Request, Response, NextFunction } from 'express';
import { verifyAuthToken } from '@privy-io/server-auth';
import { createHash } from 'crypto';

// Extend Express Request to include Privy user context
export interface PrivyAuthenticatedRequest extends Request {
  user: {
    userId: string;          // Deterministic UUID from email
    email: string;           // User's email address
    privyUserId: string;     // Original Privy user ID
    walletAddress?: string;  // Wallet address if connected
    permissions: string[];   // User permissions array
  };
}

// Privy JWT verification middleware
export const verifyPrivyAuth = async (
  req: PrivyAuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        error: 'Authentication token required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Verify Privy JWT token
    const verifiedClaims = await verifyAuthToken(token, process.env.PRIVY_APP_SECRET!);
    
    if (!verifiedClaims || !verifiedClaims.userId) {
      return res.status(401).json({
        error: 'Invalid authentication token',
        code: 'INVALID_TOKEN'
      });
    }

    // Get user details from Privy
    const privyUser = await privyApi.getUser(verifiedClaims.userId);
    
    if (!privyUser) {
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Extract email from Privy user data
    const email = privyUser.email?.address || 
                  privyUser.google?.email || 
                  privyUser.twitter?.username + '@twitter.privy';

    if (!email) {
      return res.status(401).json({
        error: 'User email not available',
        code: 'EMAIL_REQUIRED'
      });
    }

    // Generate deterministic UUID from email (matching frontend logic)
    const userId = createHash('sha256')
      .update(email.toLowerCase().trim())
      .digest('hex')
      .substring(0, 32)
      .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');

    // Create user context
    req.user = {
      userId,
      email,
      privyUserId: verifiedClaims.userId,
      walletAddress: privyUser.wallet?.address,
      permissions: getUserPermissions(email), // Define based on your logic
    };

    console.log(`[Privy] User authenticated: ${email} (${userId})`);
    next();

  } catch (error) {
    console.error('[Privy] Authentication error:', error);
    return res.status(401).json({
      error: 'Authentication failed',
      code: 'AUTH_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to determine user permissions
const getUserPermissions = (email: string): string[] => {
  // Define your permission logic here
  const basePermissions = [
    'agent:read',
    'agent:create',
    'memory:read',
    'memory:write',
    'messaging:send',
    'messaging:read'
  ];

  // Add admin permissions for specific users
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  if (adminEmails.includes(email)) {
    return [...basePermissions, 'admin:*', 'system:read', 'system:write'];
  }

  return basePermissions;
};

// Optional: Middleware to require specific permissions
export const requirePermission = (permission: string) => {
  return (req: PrivyAuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user?.permissions.includes(permission) && !req.user?.permissions.includes('admin:*')) {
      return res.status(403).json({
        error: `Required permission: ${permission}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    next();
  };
};
```

---

## Socket.IO Authentication

### Privy Socket.IO Authentication

```typescript
// src/lib/socket-privy-auth.ts - Socket.IO Privy Authentication
import { Socket } from 'socket.io';
import { verifyAuthToken } from '@privy-io/server-auth';
import { createHash } from 'crypto';
import { privyApi } from './privy-auth';

// Extend Socket with Privy user context
export interface PrivyAuthenticatedSocket extends Socket {
  user?: {
    userId: string;
    email: string;
    privyUserId: string;
    walletAddress?: string;
    permissions: string[];
  };
}

// Socket.IO Privy authentication middleware
export const authenticateSocketWithPrivy = async (
  socket: PrivyAuthenticatedSocket, 
  next: (err?: Error) => void
) => {
  try {
    // Extract token from auth or query params
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify Privy JWT token
    const verifiedClaims = await verifyAuthToken(token, process.env.PRIVY_APP_SECRET!);
    
    if (!verifiedClaims?.userId) {
      return next(new Error('Invalid authentication token'));
    }

    // Get user details from Privy
    const privyUser = await privyApi.getUser(verifiedClaims.userId);
    
    if (!privyUser) {
      return next(new Error('User not found'));
    }

    // Extract email
    const email = privyUser.email?.address || 
                  privyUser.google?.email || 
                  privyUser.twitter?.username + '@twitter.privy';

    if (!email) {
      return next(new Error('User email not available'));
    }

    // Generate deterministic UUID from email
    const userId = createHash('sha256')
      .update(email.toLowerCase().trim())
      .digest('hex')
      .substring(0, 32)
      .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');

    // Attach user context to socket
    socket.user = {
      userId,
      email,
      privyUserId: verifiedClaims.userId,
      walletAddress: privyUser.wallet?.address,
      permissions: getUserPermissions(email),
    };

    console.log(`[Socket.IO] Privy user authenticated: ${email} (${userId})`);
    next();

  } catch (error) {
    console.error('[Socket.IO] Privy authentication failed:', error);
    next(new Error('Authentication failed'));
  }
};

// Socket.IO authorization helper
export const authorizeSocketChannel = (socket: PrivyAuthenticatedSocket, channelId: string): boolean => {
  if (!socket.user) return false;

  // Allow access to central channel
  if (channelId === '00000000-0000-0000-0000-000000000000') {
    return true;
  }

  // Check user permissions
  return socket.user.permissions.includes('messaging:read') || 
         socket.user.permissions.includes('admin:*');
};
```

---

## ElizaOS API Protection

### Protecting Real ElizaOS API Routes with Privy

```typescript
// src/routes/eliza-protected.ts - Protected ElizaOS Routes
import { Router } from 'express';
import { verifyPrivyAuth, requirePermission, PrivyAuthenticatedRequest } from '../middleware/privy-auth';

const router = Router();

// Apply Privy authentication to all routes
router.use(verifyPrivyAuth);

// ============================================================================
// AGENT MANAGEMENT ROUTES (Based on ElizaOS API Documentation)
// ============================================================================

// List all agents (user-scoped)
router.get('/api/agents', async (req: PrivyAuthenticatedRequest, res) => {
  try {
    const agents = await getAgentsByUserId(req.user.userId);
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agents', code: 'AGENTS_FETCH_ERROR' });
  }
});

// Create a new agent
router.post('/api/agents', requirePermission('agent:create'), async (req: PrivyAuthenticatedRequest, res) => {
  try {
    const agentData = {
      ...req.body,
      userId: req.user.userId,
      userEmail: req.user.email,
    };
    
    const agent = await createAgent(agentData);
    res.status(201).json(agent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create agent', code: 'AGENT_CREATE_ERROR' });
  }
});

// Get agent details
router.get('/api/agents/:agentId', async (req: PrivyAuthenticatedRequest, res) => {
  try {
    const { agentId } = req.params;
    
    if (!(await verifyAgentOwnership(agentId, req.user.userId))) {
      return res.status(404).json({ error: 'Agent not found', code: 'AGENT_NOT_FOUND' });
    }
    
    const agent = await getAgentDetails(agentId);
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent', code: 'AGENT_FETCH_ERROR' });
  }
});

// Update agent
router.patch('/api/agents/:agentId', async (req: PrivyAuthenticatedRequest, res) => {
  try {
    const { agentId } = req.params;
    
    if (!(await verifyAgentOwnership(agentId, req.user.userId))) {
      return res.status(403).json({ error: 'Unauthorized', code: 'AGENT_UNAUTHORIZED' });
    }
    
    const updatedAgent = await updateAgent(agentId, req.body);
    res.json(updatedAgent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update agent', code: 'AGENT_UPDATE_ERROR' });
  }
});

// Delete agent
router.delete('/api/agents/:agentId', async (req: PrivyAuthenticatedRequest, res) => {
  try {
    const { agentId } = req.params;
    
    if (!(await verifyAgentOwnership(agentId, req.user.userId))) {
      return res.status(403).json({ error: 'Unauthorized', code: 'AGENT_UNAUTHORIZED' });
    }
    
    await deleteAgent(agentId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete agent', code: 'AGENT_DELETE_ERROR' });
  }
});

// Start an agent
router.post('/api/agents/:agentId/start', async (req: PrivyAuthenticatedRequest, res) => {
  try {
    const { agentId } = req.params;
    
    if (!(await verifyAgentOwnership(agentId, req.user.userId))) {
      return res.status(403).json({ error: 'Unauthorized', code: 'AGENT_UNAUTHORIZED' });
    }
    
    const result = await startAgent(agentId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to start agent', code: 'AGENT_START_ERROR' });
  }
});

// Stop an agent
router.post('/api/agents/:agentId/stop', async (req: PrivyAuthenticatedRequest, res) => {
  try {
    const { agentId } = req.params;
    
    if (!(await verifyAgentOwnership(agentId, req.user.userId))) {
      return res.status(403).json({ error: 'Unauthorized', code: 'AGENT_UNAUTHORIZED' });
    }
    
    const result = await stopAgent(agentId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to stop agent', code: 'AGENT_STOP_ERROR' });
  }
});

// Get agent logs
router.get('/api/agents/:agentId/logs', async (req: PrivyAuthenticatedRequest, res) => {
  try {
    const { agentId } = req.params;
    
    if (!(await verifyAgentOwnership(agentId, req.user.userId))) {
      return res.status(403).json({ error: 'Unauthorized', code: 'AGENT_UNAUTHORIZED' });
    }
    
    const logs = await getAgentLogs(agentId, req.query);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs', code: 'LOGS_FETCH_ERROR' });
  }
});

export default router;
```

---

## Central Messaging System

### ElizaOS Central Messaging Protection

```typescript
// src/routes/messaging-protected.ts - Central Messaging Routes
import { Router } from 'express';
import { verifyPrivyAuth, PrivyAuthenticatedRequest } from '../middleware/privy-auth';

const messagingRouter = Router();
messagingRouter.use(verifyPrivyAuth);

// Submit message to central messaging system (PRIMARY ENDPOINT)
router.post('/api/messaging/submit', async (req: PrivyAuthenticatedRequest, res) => {
  try {
    const messageData = {
      text: req.body.text,
      channelId: req.body.channelId || process.env.NEXT_PUBLIC_WORLD_ID,
      userId: req.user.userId,
      name: req.user.email.split('@')[0],
      userEmail: req.user.email,
    };
    
    const result = await submitMessageToCentralBus(messageData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit message', code: 'MESSAGE_SUBMIT_ERROR' });
  }
});

// Create central channel
router.post('/api/messaging/central-channels', async (req: PrivyAuthenticatedRequest, res) => {
  try {
    const channelData = {
      ...req.body,
      createdBy: req.user.userId,
    };
    
    const channel = await createCentralChannel(channelData);
    res.status(201).json(channel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create channel', code: 'CHANNEL_CREATE_ERROR' });
  }
});

// Add agent to central channel
router.post('/api/messaging/central-channels/:channelId/agents', async (req: PrivyAuthenticatedRequest, res) => {
  try {
    const { channelId } = req.params;
    const { agentId } = req.body;
    
    // Verify user owns the agent
    if (!(await verifyAgentOwnership(agentId, req.user.userId))) {
      return res.status(403).json({ error: 'Unauthorized', code: 'AGENT_UNAUTHORIZED' });
    }
    
    const result = await addAgentToChannel(channelId, agentId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add agent to channel', code: 'CHANNEL_AGENT_ERROR' });
  }
});

// Get channel messages (user-filtered)
router.get('/api/messaging/central-channels/:channelId/messages', async (req: PrivyAuthenticatedRequest, res) => {
  try {
    const { channelId } = req.params;
    
    const messages = await getChannelMessages(channelId, {
      userId: req.user.userId,
      limit: parseInt(req.query.limit as string) || 50,
      offset: parseInt(req.query.offset as string) || 0,
    });
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages', code: 'MESSAGES_FETCH_ERROR' });
  }
});

// Send message to specific channel
router.post('/api/messaging/central-channels/:channelId/messages', async (req: PrivyAuthenticatedRequest, res) => {
  try {
    const { channelId } = req.params;
    
    const messageData = {
      ...req.body,
      channelId,
      senderId: req.user.userId,
      senderName: req.user.email.split('@')[0],
    };
    
    const message = await sendMessageToChannel(messageData);
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message', code: 'MESSAGE_SEND_ERROR' });
  }
});

// Get or create DM channel
router.get('/api/messaging/dm-channel', async (req: PrivyAuthenticatedRequest, res) => {
  try {
    const { agentId } = req.query;
    
    const dmChannel = await getOrCreateDMChannel({
      userId: req.user.userId,
      userEmail: req.user.email,
      agentId: agentId as string,
    });
    
    res.json(dmChannel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get DM channel', code: 'DM_CHANNEL_ERROR' });
  }
});

export { messagingRouter };
```

---

## Agent & Memory Management

### Memory Routes Protection

```typescript
// src/routes/memory-protected.ts - Memory Management Routes
import { Router } from 'express';
import { verifyPrivyAuth, PrivyAuthenticatedRequest } from '../middleware/privy-auth';

const memoryRouter = Router();
memoryRouter.use(verifyPrivyAuth);

// Get agent memories
router.get('/api/memory/:agentId/memories', async (req: PrivyAuthenticatedRequest, res) => {
  try {
    const { agentId } = req.params;
    
    if (!(await verifyAgentOwnership(agentId, req.user.userId))) {
      return res.status(403).json({ error: 'Unauthorized access to agent', code: 'AGENT_UNAUTHORIZED' });
    }
    
    const memories = await getAgentMemories(agentId, {
      userId: req.user.userId,
      limit: parseInt(req.query.limit as string) || 100,
      offset: parseInt(req.query.offset as string) || 0,
    });
    
    res.json(memories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch memories', code: 'MEMORIES_FETCH_ERROR' });
  }
});

// Create a room for agent
router.post('/api/memory/:agentId/rooms', async (req: PrivyAuthenticatedRequest, res) => {
  try {
    const { agentId } = req.params;
    
    if (!(await verifyAgentOwnership(agentId, req.user.userId))) {
      return res.status(403).json({ error: 'Unauthorized', code: 'AGENT_UNAUTHORIZED' });
    }
    
    const roomData = {
      ...req.body,
      agentId,
      userId: req.user.userId,
    };
    
    const room = await createRoom(roomData);
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create room', code: 'ROOM_CREATE_ERROR' });
  }
});

// Get room memories
router.get('/api/agents/:agentId/rooms/:roomId/memories', async (req: PrivyAuthenticatedRequest, res) => {
  try {
    const { agentId, roomId } = req.params;
    
    if (!(await verifyAgentOwnership(agentId, req.user.userId))) {
      return res.status(403).json({ error: 'Unauthorized', code: 'AGENT_UNAUTHORIZED' });
    }
    
    const memories = await getRoomMemories(agentId, roomId, {
      userId: req.user.userId,
    });
    
    res.json(memories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch room memories', code: 'ROOM_MEMORIES_ERROR' });
  }
});

// Delete all agent memories
router.delete('/api/memory/:agentId/memories', async (req: PrivyAuthenticatedRequest, res) => {
  try {
    const { agentId } = req.params;
    
    if (!(await verifyAgentOwnership(agentId, req.user.userId))) {
      return res.status(403).json({ error: 'Unauthorized', code: 'AGENT_UNAUTHORIZED' });
    }
    
    await deleteAllAgentMemories(agentId, req.user.userId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete memories', code: 'MEMORIES_DELETE_ERROR' });
  }
});

export { memoryRouter };
```

---

## Real-time Event Handling

### Socket.IO Event Management

```typescript
// src/lib/socket-events.ts - ElizaOS Socket.IO Event Handlers
import { PrivyAuthenticatedSocket } from './socket-privy-auth';

// Handle Socket.IO events based on ElizaOS documentation
export const setupSocketEvents = (io: any) => {
  io.on('connection', (socket: PrivyAuthenticatedSocket) => {
    console.log(`[Socket.IO] User connected: ${socket.user?.email} (${socket.user?.userId})`);
    
    // Join room/channel event
    socket.on('join', async (data: { roomId: string; agentId?: string }) => {
      try {
        // Authorize channel access
        if (!authorizeChannelAccess(socket, data.roomId)) {
          socket.emit('error', { 
            error: 'Unauthorized channel access',
            code: 'CHANNEL_UNAUTHORIZED' 
          });
          return;
        }
        
        await socket.join(data.roomId);
        console.log(`[Socket.IO] User ${socket.user?.email} joined room ${data.roomId}`);
        
        // Acknowledge successful join
        socket.emit('joined', { roomId: data.roomId });
        
      } catch (error) {
        socket.emit('error', { 
          error: 'Failed to join room',
          code: 'JOIN_ERROR',
          details: error.message 
        });
      }
    });
    
    // Leave room/channel event
    socket.on('leave', async (data: { roomId: string; agentId?: string }) => {
      try {
        await socket.leave(data.roomId);
        console.log(`[Socket.IO] User ${socket.user?.email} left room ${data.roomId}`);
        
        socket.emit('left', { roomId: data.roomId });
        
      } catch (error) {
        socket.emit('error', { 
          error: 'Failed to leave room',
          code: 'LEAVE_ERROR' 
        });
      }
    });
    
    // Send message event
    socket.on('message', async (data: { text: string; roomId: string; userId: string; name?: string }) => {
      try {
        // Validate user ID matches authenticated user
        if (data.userId !== socket.user?.userId) {
          socket.emit('error', { 
            error: 'User ID mismatch',
            code: 'USER_MISMATCH' 
          });
          return;
        }
        
        // Authorize message sending
        if (!authorizeChannelAccess(socket, data.roomId)) {
          socket.emit('error', { 
            error: 'Unauthorized to send messages',
            code: 'MESSAGE_UNAUTHORIZED' 
          });
          return;
        }
        
        // Process message through central messaging system
        const messageData = {
          text: data.text,
          roomId: data.roomId,
          userId: socket.user.userId,
          name: data.name || socket.user.email.split('@')[0],
          userEmail: socket.user.email,
        };
        
        await processSocketMessage(messageData);
        
      } catch (error) {
        socket.emit('error', { 
          error: 'Failed to process message',
          code: 'MESSAGE_ERROR',
          details: error.message 
        });
      }
    });
    
    // Request world state event
    socket.on('request-world-state', async (data: { roomId: string }) => {
      try {
        if (!authorizeChannelAccess(socket, data.roomId)) {
          socket.emit('error', { 
            error: 'Unauthorized access to world state',
            code: 'WORLD_STATE_UNAUTHORIZED' 
          });
          return;
        }
        
        const worldState = await getWorldState(data.roomId, socket.user?.userId);
        socket.emit('world-state', worldState);
        
      } catch (error) {
        socket.emit('error', { 
          error: 'Failed to get world state',
          code: 'WORLD_STATE_ERROR' 
        });
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] User disconnected: ${socket.user?.email}`);
    });
  });
};

// Authorization helper for channel access
const authorizeChannelAccess = (socket: PrivyAuthenticatedSocket, channelId: string): boolean => {
  if (!socket.user) return false;
  
  // Allow access to central channel (world)
  if (channelId === process.env.NEXT_PUBLIC_WORLD_ID) {
    return true;
  }
  
  // Check user permissions
  return socket.user.permissions.includes('messaging:read') || 
         socket.user.permissions.includes('admin:*');
};

// Process message through ElizaOS central messaging
const processSocketMessage = async (messageData: any) => {
  // Submit to central messaging bus
  await submitMessageToCentralBus({
    text: messageData.text,
    channelId: messageData.roomId,
    userId: messageData.userId,
    name: messageData.name,
    userEmail: messageData.userEmail,
  });
};
```

---

## User Context Integration

### ElizaOS Database Operations with User Scoping

```typescript
// src/lib/eliza-database.ts - ElizaOS Database Operations with User Context
import { PrivyUser } from '../types/privy-user';

interface UserContext {
  userId: string;
  email: string;
  permissions: string[];
}

// ============================================================================
// AGENT OPERATIONS
// ============================================================================

export const getAgentsByUserId = async (userId: string) => {
  // In ElizaOS, agents are typically managed per user
  return await elizaDb.query(`
    SELECT id, name, status, created_at, user_id, character_data
    FROM agents 
    WHERE user_id = $1 OR $1 = ANY(shared_with_users)
    ORDER BY created_at DESC
  `, [userId]);
};

export const createAgent = async (agentData: any) => {
  const agentId = generateAgentId();
  
  return await elizaDb.query(`
    INSERT INTO agents (id, name, character_data, user_id, user_email, created_at, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'stopped')
    RETURNING *
  `, [
    agentId,
    agentData.name,
    JSON.stringify(agentData.character || {}),
    agentData.userId,
    agentData.userEmail,
    new Date().toISOString()
  ]);
};

export const verifyAgentOwnership = async (agentId: string, userId: string): Promise<boolean> => {
  const result = await elizaDb.query(`
    SELECT 1 FROM agents 
    WHERE id = $1 AND (user_id = $2 OR $2 = ANY(shared_with_users))
  `, [agentId, userId]);
  
  return result.length > 0;
};

export const getAgentDetails = async (agentId: string) => {
  const result = await elizaDb.query(`
    SELECT * FROM agents WHERE id = $1
  `, [agentId]);
  
  return result[0];
};

export const startAgent = async (agentId: string) => {
  await elizaDb.query(`
    UPDATE agents SET status = 'running', updated_at = $1 WHERE id = $2
  `, [new Date().toISOString(), agentId]);
  
  // Trigger actual agent startup logic here
  await elizaRuntimeManager.startAgent(agentId);
  
  return { status: 'started', agentId };
};

export const stopAgent = async (agentId: string) => {
  await elizaDb.query(`
    UPDATE agents SET status = 'stopped', updated_at = $1 WHERE id = $2
  `, [new Date().toISOString(), agentId]);
  
  // Trigger actual agent shutdown logic here
  await elizaRuntimeManager.stopAgent(agentId);
  
  return { status: 'stopped', agentId };
};

// ============================================================================
// MEMORY OPERATIONS
// ============================================================================

export const getAgentMemories = async (agentId: string, options: { userId: string; limit?: number; offset?: number }) => {
  return await elizaDb.query(`
    SELECT m.* FROM memories m
    JOIN agents a ON m.agent_id = a.id
    WHERE a.id = $1 AND a.user_id = $2
    ORDER BY m.created_at DESC
    LIMIT $3 OFFSET $4
  `, [
    agentId, 
    options.userId, 
    options.limit || 100, 
    options.offset || 0
  ]);
};

export const createRoom = async (roomData: any) => {
  const roomId = generateRoomId();
  
  return await elizaDb.query(`
    INSERT INTO rooms (id, name, agent_id, user_id, created_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [
    roomId,
    roomData.name,
    roomData.agentId,
    roomData.userId,
    new Date().toISOString()
  ]);
};

export const getRoomMemories = async (agentId: string, roomId: string, options: { userId: string }) => {
  return await elizaDb.query(`
    SELECT m.* FROM memories m
    JOIN rooms r ON m.room_id = r.id
    JOIN agents a ON r.agent_id = a.id
    WHERE r.id = $1 AND a.id = $2 AND a.user_id = $3
    ORDER BY m.created_at DESC
  `, [roomId, agentId, options.userId]);
};

// ============================================================================
// MESSAGING OPERATIONS
// ============================================================================

export const submitMessageToCentralBus = async (messageData: any) => {
  const messageId = generateMessageId();
  
  // Store message in central messages table
  const message = await elizaDb.query(`
    INSERT INTO messages (id, text, channel_id, sender_id, sender_name, user_email, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [
    messageId,
    messageData.text,
    messageData.channelId || process.env.NEXT_PUBLIC_WORLD_ID,
    messageData.userId,
    messageData.name,
    messageData.userEmail,
    new Date().toISOString()
  ]);
  
  // Trigger agent processing through ElizaOS message bus
  await elizaMessageBus.processMessage(message[0]);
  
  return message[0];
};

export const getChannelMessages = async (channelId: string, options: { userId: string; limit?: number; offset?: number }) => {
  return await elizaDb.query(`
    SELECT m.*, 
           CASE WHEN m.sender_id = $2 THEN true ELSE false END as is_own_message
    FROM messages m
    WHERE m.channel_id = $1
    ORDER BY m.created_at ASC
    LIMIT $3 OFFSET $4
  `, [
    channelId,
    options.userId,
    options.limit || 50,
    options.offset || 0
  ]);
};

export const createCentralChannel = async (channelData: any) => {
  const channelId = generateChannelId();
  
  return await elizaDb.query(`
    INSERT INTO channels (id, name, type, created_by, created_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [
    channelId,
    channelData.name,
    channelData.type || 'public',
    channelData.createdBy,
    new Date().toISOString()
  ]);
};

export const addAgentToChannel = async (channelId: string, agentId: string) => {
  return await elizaDb.query(`
    INSERT INTO channel_agents (channel_id, agent_id, added_at)
    VALUES ($1, $2, $3)
    ON CONFLICT (channel_id, agent_id) DO NOTHING
    RETURNING *
  `, [channelId, agentId, new Date().toISOString()]);
};

// ============================================================================
// SYSTEM OPERATIONS
// ============================================================================

export const getSystemStatus = async () => {
  const agentCount = await elizaDb.query('SELECT COUNT(*) as count FROM agents WHERE status = \'running\'');
  const totalMessages = await elizaDb.query('SELECT COUNT(*) as count FROM messages WHERE created_at > NOW() - INTERVAL \'24 hours\'');
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeAgents: agentCount[0].count,
    messages24h: totalMessages[0].count,
    uptime: process.uptime(),
  };
};

export const getAgentLogs = async (agentId: string, options: any) => {
  return await elizaDb.query(`
    SELECT * FROM agent_logs 
    WHERE agent_id = $1 
    ORDER BY timestamp DESC 
    LIMIT $2 OFFSET $3
  `, [agentId, options.limit || 100, options.offset || 0]);
};

// Helper functions
const generateAgentId = () => `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateRoomId = () => `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateChannelId = () => `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
```

### Chat Session Management

```typescript
// src/lib/chat-session-management.ts - ElizaOS Chat Session Integration
export const createChatSession = async (userContext: UserContext, agentId?: string) => {
  // Create or get DM channel for user-agent communication
  const dmChannel = await getOrCreateDMChannel({
    userId: userContext.userId,
    userEmail: userContext.email,
    agentId: agentId,
  });
  
  // Ensure agent is added to the central channel for message processing
  if (agentId) {
    await addAgentToChannel(process.env.NEXT_PUBLIC_WORLD_ID!, agentId);
  }
  
  // Create chat session record
  const sessionId = generateSessionId();
  const session = await elizaDb.query(`
    INSERT INTO chat_sessions (id, user_id, user_email, channel_id, agent_id, created_at, last_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [
    sessionId,
    userContext.userId,
    userContext.email,
    dmChannel.id,
    agentId,
    new Date().toISOString(),
    new Date().toISOString()
  ]);
  
  return {
    sessionId: session[0].id,
    channelId: dmChannel.id,
    userId: userContext.userId,
    userEmail: userContext.email,
    agentId: agentId,
  };
};

export const getOrCreateDMChannel = async (options: {
  userId: string;
  userEmail: string;
  agentId?: string;
}) => {
  // Check if DM channel already exists
  let channel = await elizaDb.query(`
    SELECT * FROM channels 
    WHERE type = 'dm' AND created_by = $1 AND metadata->>'agentId' = $2
  `, [options.userId, options.agentId]);
  
  if (channel.length === 0) {
    // Create new DM channel
    const channelId = generateChannelId();
    channel = await elizaDb.query(`
      INSERT INTO channels (id, name, type, created_by, metadata, created_at)
      VALUES ($1, $2, 'dm', $3, $4, $5)
      RETURNING *
    `, [
      channelId,
      `DM: ${options.userEmail}${options.agentId ? ` <-> Agent ${options.agentId}` : ''}`,
      options.userId,
      JSON.stringify({ agentId: options.agentId, userEmail: options.userEmail }),
      new Date().toISOString()
    ]);
  }
  
  return channel[0];
};

export const getUserChatSessions = async (userId: string) => {
  return await elizaDb.query(`
    SELECT cs.*, a.name as agent_name, a.status as agent_status
    FROM chat_sessions cs
    LEFT JOIN agents a ON cs.agent_id = a.id
    WHERE cs.user_id = $1
    ORDER BY cs.last_active DESC
  `, [userId]);
};

export const updateSessionActivity = async (sessionId: string) => {
  await elizaDb.query(`
    UPDATE chat_sessions 
    SET last_active = $1 
    WHERE id = $2
  `, [new Date().toISOString(), sessionId]);
};

const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
```

---

## Rate Limiting & Security

### User-specific Rate Limiting

```typescript
// src/middleware/privy-rate-limit.ts - Privy User Rate Limiting
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { PrivyAuthenticatedRequest } from './privy-auth';

// Redis-based rate limiter with user-specific keys
const createUserRateLimiter = (points: number, duration: number) => {
  return new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'privy_rl',
    points,
    duration,
  });
};

// Different rate limits based on user type
const rateLimiters = {
  // Standard users
  standard: {
    api: createUserRateLimiter(100, 60),      // 100 requests per minute
    messaging: createUserRateLimiter(30, 60), // 30 messages per minute
    agent: createUserRateLimiter(20, 60),     // 20 agent operations per minute
  },
  
  // Premium users (if you have tiers)
  premium: {
    api: createUserRateLimiter(200, 60),
    messaging: createUserRateLimiter(60, 60),
    agent: createUserRateLimiter(50, 60),
  },
  
  // Admin users
  admin: {
    api: createUserRateLimiter(1000, 60),
    messaging: createUserRateLimiter(200, 60),
    agent: createUserRateLimiter(100, 60),
  }
};

// Rate limiting middleware factory
export const createPrivyRateLimit = (category: 'api' | 'messaging' | 'agent') => {
  return async (req: PrivyAuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Determine user tier
      const userTier = getUserTier(req.user);
      const limiter = rateLimiters[userTier][category];
      
      // Use user ID as rate limit key
      await limiter.consume(req.user.userId);
      
      // Add rate limit headers
      const resRateLimiter = await limiter.get(req.user.userId);
      if (resRateLimiter) {
        res.set({
          'X-RateLimit-Limit': rateLimiters[userTier][category].points,
          'X-RateLimit-Remaining': resRateLimiter.remainingPoints,
          'X-RateLimit-Reset': new Date(Date.now() + resRateLimiter.msBeforeNext)
        });
      }
      
      next();
    } catch (rateLimiterRes) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.round(rateLimiterRes.msBeforeNext / 1000),
        userId: req.user.userId,
      });
    }
  };
};

// Helper to determine user tier
const getUserTier = (user: any): 'standard' | 'premium' | 'admin' => {
  if (user.permissions.includes('admin:*')) return 'admin';
  if (user.permissions.includes('premium:*')) return 'premium';
  return 'standard';
};
```

---

## System Routes Protection

### Admin and System Endpoints

```typescript
// src/routes/system-protected.ts - System Routes
import { Router } from 'express';
import { verifyPrivyAuth, requirePermission, PrivyAuthenticatedRequest } from '../middleware/privy-auth';

const systemRouter = Router();
systemRouter.use(verifyPrivyAuth);

// Health check endpoints
router.get('/api/server/ping', (req, res) => {
  res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

router.get('/api/server/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// System status (requires read permission)
router.get('/api/server/status', requirePermission('system:read'), async (req: PrivyAuthenticatedRequest, res) => {
  try {
    const status = await getSystemStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get system status', code: 'SYSTEM_STATUS_ERROR' });
  }
});

// System logs (admin only)
router.get('/api/server/logs', requirePermission('admin:*'), async (req: PrivyAuthenticatedRequest, res) => {
  try {
    const logs = await getSystemLogs(req.query);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs', code: 'LOGS_FETCH_ERROR' });
  }
});

// Stop server (admin only)
router.post('/api/server/stop', requirePermission('admin:*'), async (req: PrivyAuthenticatedRequest, res) => {
  try {
    console.log(`[System] Server shutdown initiated by ${req.user.email}`);
    res.json({ message: 'Server shutdown initiated' });
    
    // Graceful shutdown
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  } catch (error) {
    res.status(500).json({ error: 'Failed to stop server', code: 'SERVER_STOP_ERROR' });
  }
});

export { systemRouter };
```

---

## Production Deployment

### Complete ElizaOS Server with Privy Authentication

```typescript
// src/server.ts - Production ElizaOS Server with Privy Integration
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import helmet from 'helmet';
import cors from 'cors';
import { validatePrivyConfig } from './lib/privy-auth';
import { authenticateSocketWithPrivy } from './lib/socket-privy-auth';
import { setupSocketEvents } from './lib/socket-events';
import elizaProtectedRoutes from './routes/eliza-protected';
import { messagingRouter } from './routes/messaging-protected';
import { memoryRouter } from './routes/memory-protected';
import { systemRouter } from './routes/system-protected';
import { createPrivyRateLimit } from './middleware/privy-rate-limit';

// Validate environment configuration
validatePrivyConfig();

const app = express();
const server = createServer(app);

// CORS configuration for Privy frontend integration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:4000',
      'https://localhost:4000'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-User-ID',
    'X-User-Email',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
};

// Security middleware with Privy-specific CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'", 
        "wss:", 
        "ws:", 
        "https://auth.privy.io",
        "https://api.privy.io"
      ],
      imgSrc: ["'self'", "data:", "https:", "https://auth.privy.io"],
      scriptSrc: ["'self'", "https://auth.privy.io"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://auth.privy.io"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow Privy iframe embedding
}));

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply global rate limiting
app.use('/api', createPrivyRateLimit('api'));

// Mount protected route modules
app.use('/', elizaProtectedRoutes);      // Agent management
app.use('/', messagingRouter);            // Central messaging
app.use('/', memoryRouter);               // Memory management  
app.use('/', systemRouter);               // System endpoints

// Public health check (no auth required)
app.get('/api/server/hello', (req, res) => {
  res.json({ 
    message: 'ElizaOS server is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Socket.IO setup with Privy authentication
const io = new SocketIOServer(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
});

// Apply Privy authentication to all Socket.IO connections
io.use(authenticateSocketWithPrivy);

// Setup ElizaOS-specific Socket.IO event handlers
setupSocketEvents(io);

// Broadcast system events to connected clients
export const broadcastToAll = (event: string, data: any) => {
  io.emit(event, data);
};

export const broadcastToChannel = (channelId: string, event: string, data: any) => {
  io.to(channelId).emit(event, data);
};

// Global error handling
app.use((error: any, req: any, res: any, next: any) => {
  console.error('[Server] Error:', error);
  
  // Don't expose error details in production
  const errorResponse = {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
  };
  
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = error.message;
    errorResponse.stack = error.stack;
  }
  
  res.status(error.status || 500).json(errorResponse);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('[Server] Process terminated');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[ElizaOS] Server running on port ${PORT}`);
  console.log('[Privy] Authentication system active');
  console.log('[Security] CORS configured for:', process.env.ALLOWED_ORIGINS);
  console.log('[Database] Connection:', process.env.DATABASE_URL ? 'PostgreSQL' : 'PGLite');
});
```

### Environment Variables for Production

```bash
# .env - Production Configuration with Privy
NODE_ENV=production
PORT=3000

# Privy Configuration (REQUIRED)
PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-app-secret
PRIVY_VERIFICATION_KEY=your-verification-key

# Database
DATABASE_URL=postgresql://eliza:password@postgres:5432/eliza_prod

# Redis for Rate Limiting
REDIS_URL=redis://redis:6379

# CORS and Security
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Admin Users (comma-separated emails)
ADMIN_EMAILS=admin@yourdomain.com,dev@yourdomain.com

# Logging
LOG_LEVEL=info
LOG_AUTH_EVENTS=true
```

### Docker Compose with Privy

```yaml
# docker-compose.yml - ElizaOS with Privy Backend
version: '3.8'

services:
  eliza-backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - PRIVY_APP_ID=${PRIVY_APP_ID}
      - PRIVY_APP_SECRET=${PRIVY_APP_SECRET}
      - DATABASE_URL=postgresql://eliza:password@postgres:5432/eliza
      - REDIS_URL=redis://redis:6379
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=eliza
      - POSTGRES_USER=eliza
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  postgres_data:
```

## Benefits of Privy Backend Integration

1. **Unified Authentication**: Same user identity across frontend and backend
2. **Seamless User Experience**: No additional login flows or token management
3. **User-Scoped Resources**: Automatic filtering of agents, memories, and messages by user
4. **Built-in Security**: Privy handles token security, validation, and user management
5. **Flexible Permissions**: Easy to implement role-based access control
6. **Rate Limiting**: User-specific rate limiting with different tiers
7. **Audit Trail**: Complete user activity tracking across the system

This approach creates a secure, user-centric ElizaOS backend that seamlessly integrates with your existing Privy-authenticated frontend.