/**
 * Authentication middleware for API routes using Privy JWT tokens
 * Provides secure user verification and data scoping
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';

// Privy configuration
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;

// Initialize Privy client
let privyClient: PrivyClient | null = null;
if (PRIVY_APP_ID && PRIVY_APP_SECRET) {
  privyClient = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);
}

if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) {
  console.warn('[Auth] Missing Privy configuration - API routes will not be protected');
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  userId: string; // UUID derived from email
}

/**
 * Extract and verify Privy JWT token from request
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    if (!token) {
      return null;
    }

    if (!privyClient) {
      console.error('[Auth] Privy client not initialized - missing configuration');
      return null;
    }

    // Verify JWT token using Privy client
    const verifiedClaims = await privyClient.verifyAuthToken(token);

    if (!verifiedClaims) {
      console.warn('[Auth] JWT verification failed');
      return null;
    }

    // Extract user information from verified claims
    // verifiedClaims contains: { appId, issuer, issuedAt, expiration, sessionId, userId }
    const privyUserId = verifiedClaims.userId;
    if (!privyUserId) {
      console.warn('[Auth] No userId found in JWT claims');
      return null;
    }

    // Get full user details from Privy to get email
    let userDetails: any;
    try {
      userDetails = await privyClient.getUserById(privyUserId);
    } catch (error) {
      console.error('[Auth] Failed to get user details from Privy:', error);
      return null;
    }

    if (!userDetails || !userDetails.email?.address) {
      console.warn('[Auth] No email found in user details');
      return null;
    }

    const email = userDetails.email.address;

    // Generate deterministic UUID from email (matching frontend logic)
    const { v5: uuidv5 } = require('uuid');
    const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // Same as constants
    const userId = uuidv5(email, UUID_NAMESPACE);

    return {
      id: privyUserId,
      email: email,
      userId: userId,
    };
  } catch (error) {
    console.error('[Auth] JWT verification failed:', error);
    return null;
  }
}

/**
 * Middleware wrapper for protected API routes
 */
export function withAuth(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]) => {
    const user = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Valid authentication token required',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      );
    }

    try {
      return await handler(request, user, ...args);
    } catch (error) {
      console.error('[Auth] Handler error:', error);
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: 'An error occurred processing your request',
          code: 'INTERNAL_ERROR',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Validate that the requesting user owns the requested data
 */
export function validateUserOwnership(
  requestedUserId: string,
  authenticatedUserId: string
): boolean {
  return requestedUserId === authenticatedUserId;
}

/**
 * Extract user ID from request body or query params
 */
export function extractUserIdFromRequest(request: NextRequest, body?: any): string | null {
  // Try query params first
  const { searchParams } = new URL(request.url);
  const queryUserId = searchParams.get('userId');

  if (queryUserId) {
    return queryUserId;
  }

  // Try request body
  if (body?.userId) {
    return body.userId;
  }

  return null;
}

/**
 * Sanitize input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .substring(0, 1000); // Limit length
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Rate limiting store (in-memory for demonstration)
 * In production, use Redis or similar
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple rate limiting function
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60 * 1000 // 1 minute
): { allowed: boolean; remainingRequests: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;

  let record = rateLimitStore.get(key);

  // Clean up expired records
  if (record && now > record.resetTime) {
    record = undefined;
  }

  if (!record) {
    record = { count: 0, resetTime: now + windowMs };
    rateLimitStore.set(key, record);
  }

  record.count++;

  return {
    allowed: record.count <= maxRequests,
    remainingRequests: Math.max(0, maxRequests - record.count),
    resetTime: record.resetTime,
  };
}

/**
 * Clean up expired rate limit records
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Enhanced security headers
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  };
}

/**
 * Validate request origin for CSRF protection
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:4000',
    'https://localhost:4000',
  ].filter(Boolean);

  // Check origin header
  if (origin && !allowedOrigins.includes(origin)) {
    return false;
  }

  // Check referer as fallback
  if (!origin && referer) {
    const refererUrl = new URL(referer);
    const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
    return allowedOrigins.includes(refererOrigin);
  }

  return true;
}
