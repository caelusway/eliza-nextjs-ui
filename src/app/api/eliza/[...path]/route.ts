import { NextRequest, NextResponse } from 'next/server';
import {
  withAuth,
  checkRateLimit,
  getSecurityHeaders,
  validateOrigin,
  sanitizeInput,
  type AuthenticatedUser,
} from '@/lib/auth-middleware';

const ELIZA_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';

async function elizaGetHandler(
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Validate CSRF protection
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { error: 'Invalid origin', code: 'INVALID_ORIGIN' },
        { status: 403, headers: getSecurityHeaders() }
      );
    }

    // Check rate limiting (more permissive for ElizaOS proxy)
    const rateLimitResult = checkRateLimit(user.userId, 60, 60 * 1000); // 60 requests per minute
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          resetTime: rateLimitResult.resetTime,
        },
        {
          status: 429,
          headers: {
            ...getSecurityHeaders(),
            'X-RateLimit-Limit': '60',
            'X-RateLimit-Remaining': rateLimitResult.remainingRequests.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    const resolvedParams = await params;
    const path = resolvedParams.path.join('/');
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.toString();
    const elizaUrl = `${ELIZA_SERVER_URL}/api/${path}${query ? `?${query}` : ''}`;

    console.log(`[Proxy] GET ${elizaUrl} for user: ${user.userId}`);

    const response = await fetch(elizaUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // Pass user context to ElizaOS
        'X-User-ID': user.userId,
        'X-User-Email': user.email,
      },
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        ...getSecurityHeaders(),
        'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-KEY',
      },
    });
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to ElizaOS server', code: 'PROXY_ERROR' },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

async function elizaPostHandler(
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Validate CSRF protection
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { error: 'Invalid origin', code: 'INVALID_ORIGIN' },
        { status: 403, headers: getSecurityHeaders() }
      );
    }

    // Check rate limiting
    const rateLimitResult = checkRateLimit(user.userId, 30, 60 * 1000); // 30 requests per minute for POST
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          resetTime: rateLimitResult.resetTime,
        },
        {
          status: 429,
          headers: {
            ...getSecurityHeaders(),
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': rateLimitResult.remainingRequests.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    const resolvedParams = await params;
    const path = resolvedParams.path.join('/');
    const body = await request.text();

    // Sanitize body if it's a JSON string
    let sanitizedBody = body;
    try {
      const jsonBody = JSON.parse(body);
      if (jsonBody.message) {
        jsonBody.message = sanitizeInput(jsonBody.message);
        sanitizedBody = JSON.stringify(jsonBody);
      }
    } catch {
      // Not JSON, keep as is
    }

    const elizaUrl = `${ELIZA_SERVER_URL}/api/${path}`;

    console.log(`[Proxy] POST ${elizaUrl} for user: ${user.userId}`);

    const response = await fetch(elizaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // Pass user context to ElizaOS
        'X-User-ID': user.userId,
        'X-User-Email': user.email,
      },
      body: sanitizedBody,
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        ...getSecurityHeaders(),
        'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-KEY',
      },
    });
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to ElizaOS server', code: 'PROXY_ERROR' },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

// Create authenticated handlers for PUT and DELETE
async function elizaPutHandler(
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Similar implementation to POST
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const body = await request.text();
  const elizaUrl = `${ELIZA_SERVER_URL}/api/${path}`;

  console.log(`[Proxy] PUT ${elizaUrl} for user: ${user.userId}`);

  const response = await fetch(elizaUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-User-ID': user.userId,
      'X-User-Email': user.email,
    },
    body: body,
  });

  const data = await response.json();
  return NextResponse.json(data, {
    status: response.status,
    headers: {
      ...getSecurityHeaders(),
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-KEY',
    },
  });
}

async function elizaDeleteHandler(
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const elizaUrl = `${ELIZA_SERVER_URL}/api/${path}`;

  console.log(`[Proxy] DELETE ${elizaUrl} for user: ${user.userId}`);

  const response = await fetch(elizaUrl, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-User-ID': user.userId,
      'X-User-Email': user.email,
    },
  });

  const data = await response.json();
  return NextResponse.json(data, {
    status: response.status,
    headers: {
      ...getSecurityHeaders(),
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-KEY',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...getSecurityHeaders(),
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-KEY',
    },
  });
}

// Apply authentication middleware to all methods
export const GET = withAuth(elizaGetHandler);
export const POST = withAuth(elizaPostHandler);
export const PUT = withAuth(elizaPutHandler);
export const DELETE = withAuth(elizaDeleteHandler);
