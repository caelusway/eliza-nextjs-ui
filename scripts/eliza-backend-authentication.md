# ElizaOS Backend Authentication & Security Guide

This document outlines comprehensive authentication and security measures for protecting the ElizaOS agent server backend, including Socket.IO real-time connections and REST API endpoints.

## Overview

The ElizaOS framework provides extensive API endpoints and real-time Socket.IO communication that require robust authentication to prevent unauthorized access to agent resources, memories, and sensitive operations.

## Table of Contents

- [Authentication Strategies](#authentication-strategies)
- [Socket.IO Authentication](#socketio-authentication)
- [REST API Authentication](#rest-api-authentication)
- [Rate Limiting](#rate-limiting)
- [Security Headers](#security-headers)
- [Environment Configuration](#environment-configuration)
- [Implementation Examples](#implementation-examples)
- [Production Deployment](#production-deployment)

---

## Authentication Strategies

### 1. JWT Token Authentication

**Recommended approach** for stateless authentication across all ElizaOS endpoints.

```typescript
// JWT Token Structure
interface ElizaJWTPayload {
  userId: string;           // Unique user identifier
  agentId?: string;         // Optional agent scope
  permissions: string[];    // User permissions array
  exp: number;             // Token expiration
  iat: number;             // Issued at timestamp
}
```

### 2. API Key Authentication

For service-to-service communication and programmatic access.

```typescript
interface APIKeyConfig {
  key: string;             // API key hash
  userId: string;          // Associated user
  permissions: string[];   // Allowed operations
  rateLimit: {
    requests: number;
    window: number;        // Window in milliseconds
  };
}
```

### 3. Session-Based Authentication

For traditional web applications with server-side sessions.

```typescript
interface SessionData {
  userId: string;
  agentIds: string[];      // Accessible agents
  authenticated: boolean;
  lastActivity: Date;
}
```

---

## Socket.IO Authentication

### Connection Authentication

Authenticate Socket.IO connections before allowing any real-time communication.

```typescript
// Socket.IO Authentication Middleware
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  agentIds?: string[];
  permissions?: string[];
}

const authenticateSocket = (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  try {
    // Extract token from auth header or query params
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as ElizaJWTPayload;
    
    // Attach user context to socket
    socket.userId = payload.userId;
    socket.agentIds = payload.agentId ? [payload.agentId] : [];
    socket.permissions = payload.permissions;
    
    console.log(`[Socket.IO] User ${payload.userId} authenticated`);
    next();
    
  } catch (error) {
    console.error('[Socket.IO] Authentication failed:', error.message);
    next(new Error('Invalid authentication token'));
  }
};

// Apply authentication middleware
io.use(authenticateSocket);
```

### Channel Authorization

Control access to specific channels based on user permissions.

```typescript
// Channel Access Control
const authorizeChannelAccess = (socket: AuthenticatedSocket, channelId: string): boolean => {
  // Public channels - no restrictions
  if (channelId === '00000000-0000-0000-0000-000000000000') {
    return true;
  }
  
  // Check if user has access to specific channel
  const hasChannelAccess = socket.permissions?.includes('channel:access') || 
                          socket.permissions?.includes(`channel:${channelId}`);
  
  // Check if user owns any agents in the channel
  const hasAgentAccess = socket.agentIds?.some(agentId => 
    checkAgentChannelMembership(agentId, channelId)
  );
  
  return hasChannelAccess || hasAgentAccess;
};

// Socket event handlers with authorization
io.on('connection', (socket: AuthenticatedSocket) => {
  socket.on('join', async (data: { roomId: string; agentId?: string }) => {
    // Verify channel access
    if (!authorizeChannelAccess(socket, data.roomId)) {
      socket.emit('error', { 
        message: 'Unauthorized channel access',
        code: 'CHANNEL_UNAUTHORIZED' 
      });
      return;
    }
    
    // Join the room
    await socket.join(data.roomId);
    console.log(`[Socket.IO] User ${socket.userId} joined channel ${data.roomId}`);
  });
  
  socket.on('message', async (data: { text: string; roomId: string; userId: string }) => {
    // Verify user can send messages to this channel
    if (!authorizeChannelAccess(socket, data.roomId)) {
      socket.emit('error', { 
        message: 'Unauthorized to send messages',
        code: 'MESSAGE_UNAUTHORIZED' 
      });
      return;
    }
    
    // Verify user ID matches authenticated user
    if (data.userId !== socket.userId) {
      socket.emit('error', { 
        message: 'User ID mismatch',
        code: 'USER_MISMATCH' 
      });
      return;
    }
    
    // Process the message
    await processMessage(data);
  });
});
```

### Rate Limiting for Socket.IO

Prevent abuse of real-time connections.

```typescript
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Socket.IO Rate Limiters
const socketConnectionLimiter = new RateLimiterMemory({
  points: 10,        // Number of connections
  duration: 60,      // Per 60 seconds
});

const socketMessageLimiter = new RateLimiterMemory({
  points: 30,        // Number of messages
  duration: 60,      // Per 60 seconds
});

// Apply rate limiting to socket connections
io.use(async (socket: AuthenticatedSocket, next) => {
  try {
    await socketConnectionLimiter.consume(socket.userId || socket.handshake.address);
    next();
  } catch (rateLimiterRes) {
    next(new Error('Too many connection attempts'));
  }
});

// Rate limit socket messages
socket.on('message', async (data) => {
  try {
    await socketMessageLimiter.consume(socket.userId!);
    // Process message
  } catch (rateLimiterRes) {
    socket.emit('error', { 
      message: 'Message rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: rateLimiterRes.msBeforeNext 
    });
  }
});
```

---

## REST API Authentication

### Authentication Middleware

Protect all ElizaOS API endpoints with authentication middleware.

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  userId?: string;
  agentIds?: string[];
  permissions?: string[];
}

// JWT Authentication Middleware
export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) {
    return res.status(401).json({
      error: 'Authentication token required',
      code: 'AUTH_REQUIRED'
    });
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as ElizaJWTPayload;
    
    // Attach user context to request
    req.userId = payload.userId;
    req.agentIds = payload.agentId ? [payload.agentId] : [];
    req.permissions = payload.permissions;
    
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid authentication token',
      code: 'INVALID_TOKEN'
    });
  }
};

// API Key Authentication Middleware
export const authenticateAPIKey = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      code: 'API_KEY_REQUIRED'
    });
  }
  
  try {
    const keyConfig = await validateAPIKey(apiKey);
    
    req.userId = keyConfig.userId;
    req.permissions = keyConfig.permissions;
    
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
  }
};
```

### Resource Authorization

Control access to specific resources based on ownership and permissions.

```typescript
// Agent Authorization Middleware
export const authorizeAgent = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const agentId = req.params.agentId;
  
  // Check if user has global agent permissions
  if (req.permissions?.includes('agent:admin')) {
    return next();
  }
  
  // Check if user owns this specific agent
  if (req.agentIds?.includes(agentId)) {
    return next();
  }
  
  // Check database for agent ownership
  if (checkAgentOwnership(req.userId!, agentId)) {
    return next();
  }
  
  return res.status(403).json({
    error: 'Insufficient permissions for this agent',
    code: 'AGENT_UNAUTHORIZED'
  });
};

// Memory Authorization Middleware
export const authorizeMemory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { agentId, memoryId } = req.params;
  
  // Verify agent access first
  if (!req.agentIds?.includes(agentId) && !req.permissions?.includes('agent:admin')) {
    return res.status(403).json({
      error: 'No access to this agent',
      code: 'AGENT_UNAUTHORIZED'
    });
  }
  
  // If accessing specific memory, verify ownership
  if (memoryId) {
    const memory = await getMemory(agentId, memoryId);
    if (!memory || memory.userId !== req.userId) {
      return res.status(403).json({
        error: 'Memory not found or unauthorized',
        code: 'MEMORY_UNAUTHORIZED'
      });
    }
  }
  
  next();
};
```

### Endpoint Protection

Apply authentication to all ElizaOS API routes.

```typescript
import { Router } from 'express';

const router = Router();

// Agent Management Routes
router.get('/api/agents', authenticateJWT, getAgents);
router.post('/api/agents', authenticateJWT, requirePermission('agent:create'), createAgent);
router.get('/api/agents/:agentId', authenticateJWT, authorizeAgent, getAgent);
router.patch('/api/agents/:agentId', authenticateJWT, authorizeAgent, updateAgent);
router.delete('/api/agents/:agentId', authenticateJWT, authorizeAgent, deleteAgent);

// Agent Operations
router.post('/api/agents/:agentId/start', authenticateJWT, authorizeAgent, startAgent);
router.post('/api/agents/:agentId/stop', authenticateJWT, authorizeAgent, stopAgent);

// Memory Management
router.get('/api/memory/:agentId/memories', authenticateJWT, authorizeMemory, getMemories);
router.post('/api/memory/:agentId/rooms', authenticateJWT, authorizeMemory, createRoom);
router.delete('/api/memory/:agentId/memories', authenticateJWT, authorizeMemory, deleteMemories);

// Messaging System
router.post('/api/messaging/submit', authenticateJWT, submitMessage);
router.post('/api/messaging/central-channels/:channelId/messages', authenticateJWT, sendMessage);
router.get('/api/messaging/central-channels/:channelId/messages', authenticateJWT, getMessages);

// System Endpoints (Admin Only)
router.get('/api/server/status', authenticateJWT, requirePermission('system:read'), getStatus);
router.post('/api/server/stop', authenticateJWT, requirePermission('system:admin'), stopServer);
router.get('/api/server/logs', authenticateJWT, requirePermission('system:logs'), getLogs);

// Permission Helper
function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.permissions?.includes(permission)) {
      return res.status(403).json({
        error: `Required permission: ${permission}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    next();
  };
}
```

---

## Rate Limiting

### API Rate Limiting

Implement comprehensive rate limiting for all API endpoints.

```typescript
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';

// Redis-based rate limiter (recommended for production)
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'eliza_rl',
  points: 100,        // Number of requests
  duration: 60,       // Per 60 seconds
});

// Different limits for different endpoint types
const endpointLimits = {
  // Agent operations - moderate limits
  'agent:read': { points: 60, duration: 60 },
  'agent:write': { points: 20, duration: 60 },
  
  // Memory operations - higher limits for reads
  'memory:read': { points: 100, duration: 60 },
  'memory:write': { points: 30, duration: 60 },
  
  // Messaging - balanced limits
  'messaging:send': { points: 50, duration: 60 },
  'messaging:read': { points: 200, duration: 60 },
  
  // System operations - strict limits
  'system:read': { points: 20, duration: 60 },
  'system:write': { points: 5, duration: 60 },
};

// Rate limiting middleware
export const rateLimit = (category: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const limit = endpointLimits[category];
    if (!limit) return next();
    
    const limiter = new RateLimiterMemory(limit);
    
    try {
      await limiter.consume(req.userId!);
      next();
    } catch (rateLimiterRes) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.round(rateLimiterRes.msBeforeNext / 1000),
        limit: limit.points,
        window: limit.duration
      });
    }
  };
};

// Apply rate limiting to routes
router.get('/api/agents', authenticateJWT, rateLimit('agent:read'), getAgents);
router.post('/api/agents', authenticateJWT, rateLimit('agent:write'), createAgent);
router.post('/api/messaging/submit', authenticateJWT, rateLimit('messaging:send'), submitMessage);
```

### Adaptive Rate Limiting

Implement smart rate limiting based on user behavior and system load.

```typescript
// Adaptive Rate Limiter
class AdaptiveRateLimiter {
  private baseLimiter: RateLimiterMemory;
  private suspiciousUsers: Set<string> = new Set();
  
  constructor() {
    this.baseLimiter = new RateLimiterMemory({
      points: 100,
      duration: 60,
    });
  }
  
  async checkLimit(userId: string, endpoint: string): Promise<boolean> {
    const baseLimit = endpointLimits[endpoint] || { points: 50, duration: 60 };
    
    // Reduce limits for suspicious users
    if (this.suspiciousUsers.has(userId)) {
      baseLimit.points = Math.floor(baseLimit.points * 0.5);
    }
    
    // Check system load and adjust limits
    const systemLoad = await getSystemLoad();
    if (systemLoad > 0.8) {
      baseLimit.points = Math.floor(baseLimit.points * 0.7);
    }
    
    const limiter = new RateLimiterMemory(baseLimit);
    
    try {
      await limiter.consume(userId);
      return true;
    } catch {
      // Mark user as suspicious after multiple rate limit hits
      this.markSuspicious(userId);
      return false;
    }
  }
  
  private markSuspicious(userId: string) {
    this.suspiciousUsers.add(userId);
    // Remove after 1 hour
    setTimeout(() => this.suspiciousUsers.delete(userId), 3600000);
  }
}
```

---

## Security Headers

### HTTP Security Headers

Implement comprehensive security headers for all responses.

```typescript
import helmet from 'helmet';

// Apply security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Minimize unsafe-inline
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: { policy: "credentialless" },
  crossOriginOpenerPolicy: { policy: "cross-origin" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
}));

// Additional custom headers
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filtering
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Prevent Adobe Flash and PDF from loading
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  
  // Server identification
  res.setHeader('Server', 'ElizaOS/1.0');
  
  next();
});
```

### CORS Configuration

Configure Cross-Origin Resource Sharing securely.

```typescript
import cors from 'cors';

// CORS Configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:4000',
      'https://localhost:3000',
      'https://localhost:4000',
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
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
    'X-API-Key',
    'X-User-ID',
    'X-Agent-ID',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));
```

---

## Environment Configuration

### Required Environment Variables

```bash
# Authentication
JWT_SECRET=your-256-bit-secret-key-here
JWT_EXPIRES_IN=24h
API_KEY_SALT=your-api-key-salt

# Rate Limiting
REDIS_URL=redis://localhost:6379
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Security
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4000
CORS_CREDENTIALS=true
HELMET_CSP_ENABLED=true

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/eliza
PGLITE_DATA_DIR=./.elizadb

# Logging
LOG_LEVEL=info
LOG_AUTH_EVENTS=true
LOG_RATE_LIMIT_VIOLATIONS=true

# Server
PORT=3000
NODE_ENV=production
```

### Security Configuration Validation

```typescript
// Environment validation
const requiredEnvVars = [
  'JWT_SECRET',
  'DATABASE_URL',
  'ALLOWED_ORIGINS',
];

const validateEnvironment = () => {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    process.exit(1);
  }
  
  // Validate JWT secret strength
  if (process.env.JWT_SECRET!.length < 32) {
    console.error('JWT_SECRET must be at least 32 characters long');
    process.exit(1);
  }
  
  console.log('[Security] Environment validation passed');
};

validateEnvironment();
```

---

## Implementation Examples

### Complete Authentication Setup

```typescript
// server.ts - Complete ElizaOS Server with Authentication
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
});

// Middleware setup
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Authentication middleware
app.use('/api', authenticateJWT);

// Socket.IO authentication
io.use(authenticateSocket);

// Routes with proper authorization
app.use('/api/agents', agentRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/server', systemRoutes);

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[ElizaOS] Server running on port ${PORT}`);
  console.log('[Security] Authentication enabled');
  console.log('[Security] Rate limiting active');
});
```

### User Authentication Service

```typescript
// auth.service.ts - User Authentication Service
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  email: string;
  passwordHash: string;
  permissions: string[];
  agentIds: string[];
  createdAt: Date;
  lastActive: Date;
}

class AuthService {
  async registerUser(email: string, password: string): Promise<{ user: User; token: string }> {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create user
    const user: User = {
      id: uuidv4(),
      email,
      passwordHash,
      permissions: ['agent:create', 'agent:read'],
      agentIds: [],
      createdAt: new Date(),
      lastActive: new Date(),
    };
    
    // Save to database
    await saveUser(user);
    
    // Generate JWT
    const token = this.generateToken(user);
    
    return { user, token };
  }
  
  async authenticateUser(email: string, password: string): Promise<{ user: User; token: string }> {
    // Find user
    const user = await findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw new Error('Invalid credentials');
    }
    
    // Update last active
    user.lastActive = new Date();
    await updateUser(user);
    
    // Generate JWT
    const token = this.generateToken(user);
    
    return { user, token };
  }
  
  generateToken(user: User): string {
    const payload: ElizaJWTPayload = {
      userId: user.id,
      permissions: user.permissions,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      iat: Math.floor(Date.now() / 1000),
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET!);
  }
  
  async createAPIKey(userId: string, permissions: string[]): Promise<string> {
    const apiKey = `eliza_${uuidv4().replace(/-/g, '')}`;
    const hashedKey = await bcrypt.hash(apiKey, 10);
    
    await saveAPIKey({
      key: hashedKey,
      userId,
      permissions,
      rateLimit: { requests: 1000, window: 3600000 }, // 1000/hour
      createdAt: new Date(),
    });
    
    return apiKey;
  }
}

export const authService = new AuthService();
```

---

## Production Deployment

### Security Checklist

- [ ] **JWT Secrets**: Use strong, unique JWT secrets (32+ characters)
- [ ] **HTTPS**: Enable HTTPS for all communications
- [ ] **Rate Limiting**: Implement Redis-based rate limiting
- [ ] **CORS**: Configure restrictive CORS policies
- [ ] **Headers**: Apply comprehensive security headers
- [ ] **Input Validation**: Sanitize all user inputs
- [ ] **Database**: Use parameterized queries to prevent injection
- [ ] **Logging**: Enable security event logging
- [ ] **Monitoring**: Set up alerts for failed authentication attempts
- [ ] **Updates**: Keep dependencies updated

### Docker Security Configuration

```dockerfile
# Dockerfile for Secure ElizaOS Deployment
FROM node:18-alpine AS builder

# Create non-root user
RUN addgroup -g 1001 -S eliza && \
    adduser -S eliza -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Security updates
RUN apk update && apk upgrade

# Create non-root user
RUN addgroup -g 1001 -S eliza && \
    adduser -S eliza -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=eliza:eliza /app/dist ./dist
COPY --from=builder --chown=eliza:eliza /app/node_modules ./node_modules
COPY --from=builder --chown=eliza:eliza /app/package.json ./

# Switch to non-root user
USER eliza

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/server/health || exit 1

# Start application
CMD ["node", "dist/server.js"]
```

### Production Environment Variables

```bash
# Production .env template
NODE_ENV=production
PORT=3000

# Authentication (REQUIRED)
JWT_SECRET=your-super-secure-256-bit-secret-key-here
JWT_EXPIRES_IN=24h
API_KEY_SALT=your-unique-api-key-salt

# Database (REQUIRED)
DATABASE_URL=postgresql://eliza:secure_password@postgres:5432/eliza_prod

# Redis for Rate Limiting (RECOMMENDED)
REDIS_URL=redis://redis:6379
RATE_LIMIT_STORE=redis

# Security
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
CORS_CREDENTIALS=true
HELMET_CSP_ENABLED=true
TRUST_PROXY=true

# Logging
LOG_LEVEL=warn
LOG_AUTH_EVENTS=true
LOG_RATE_LIMIT_VIOLATIONS=true
LOG_SECURITY_EVENTS=true

# Performance
CLUSTER_MODE=true
WORKER_PROCESSES=auto
```

### Monitoring and Alerting

```typescript
// monitoring.ts - Security Monitoring
import { EventEmitter } from 'events';

class SecurityMonitor extends EventEmitter {
  private failedAttempts = new Map<string, number>();
  
  constructor() {
    super();
    this.setupAlerts();
  }
  
  logAuthFailure(userId: string, ip: string, userAgent: string) {
    const key = `${userId}:${ip}`;
    const attempts = this.failedAttempts.get(key) || 0;
    this.failedAttempts.set(key, attempts + 1);
    
    console.warn(`[Security] Failed auth attempt: ${userId} from ${ip}`);
    
    // Alert on multiple failures
    if (attempts >= 5) {
      this.emit('security-alert', {
        type: 'MULTIPLE_AUTH_FAILURES',
        userId,
        ip,
        attempts: attempts + 1,
        userAgent,
      });
    }
  }
  
  logRateLimitViolation(userId: string, endpoint: string, ip: string) {
    console.warn(`[Security] Rate limit exceeded: ${userId} on ${endpoint} from ${ip}`);
    
    this.emit('security-alert', {
      type: 'RATE_LIMIT_VIOLATION',
      userId,
      endpoint,
      ip,
      timestamp: new Date(),
    });
  }
  
  private setupAlerts() {
    this.on('security-alert', (alert) => {
      // Send to monitoring service (e.g., Sentry, DataDog)
      console.error('[SECURITY ALERT]', JSON.stringify(alert, null, 2));
      
      // Send email/Slack notification for critical alerts
      if (alert.type === 'MULTIPLE_AUTH_FAILURES') {
        this.sendCriticalAlert(alert);
      }
    });
  }
  
  private async sendCriticalAlert(alert: any) {
    // Implementation for critical alerts
    // - Send email notification
    // - Post to Slack channel
    // - Create incident in PagerDuty
  }
}

export const securityMonitor = new SecurityMonitor();
```

---

## Conclusion

This comprehensive authentication and security guide provides the foundation for protecting your ElizaOS backend server. Key implementation points:

1. **Multi-layered Security**: JWT tokens, API keys, and session-based auth
2. **Real-time Protection**: Socket.IO authentication and authorization
3. **Resource Control**: Granular permissions and ownership validation
4. **Rate Limiting**: Adaptive rate limiting to prevent abuse
5. **Security Headers**: Comprehensive HTTP security headers
6. **Monitoring**: Real-time security event monitoring and alerting

Remember to regularly update dependencies, monitor security logs, and conduct security audits to maintain a robust security posture.

For questions or issues, refer to the [ElizaOS documentation](https://eliza.how) or create an issue in the project repository.