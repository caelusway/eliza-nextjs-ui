import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  authenticateRequest,
  validateUserOwnership,
  sanitizeInput,
  isValidUUID,
  checkRateLimit,
  validateOrigin,
  getSecurityHeaders,
} from '../auth-middleware';

// Mock Privy server auth
const mockVerifyAuthToken = vi.fn();
vi.mock('@privy-io/server-auth', () => ({
  PrivyClient: vi.fn().mockImplementation(() => ({
    verifyAuthToken: mockVerifyAuthToken,
  })),
}));

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateUserOwnership', () => {
    it('should return true for matching user IDs', () => {
      const userId = 'user-123';
      expect(validateUserOwnership(userId, userId)).toBe(true);
    });

    it('should return false for different user IDs', () => {
      expect(validateUserOwnership('user-123', 'user-456')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeInput(input);
      expect(result).toBe('scriptalert(xss)/scriptHello');
    });

    it('should remove quotes', () => {
      const input = 'Hello "world" and \'test\'';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello world and test');
    });

    it('should limit length to 1000 characters', () => {
      const input = 'a'.repeat(1500);
      const result = sanitizeInput(input);
      expect(result.length).toBe(1000);
    });

    it('should trim whitespace', () => {
      const input = '  hello world  ';
      const result = sanitizeInput(input);
      expect(result).toBe('hello world');
    });
  });

  describe('isValidUUID', () => {
    it('should validate correct UUID v4', () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';
      expect(isValidUUID(validUUID)).toBe(true);
    });

    it('should reject invalid UUID format', () => {
      expect(isValidUUID('invalid-uuid')).toBe(false);
      expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false);
      expect(isValidUUID('')).toBe(false);
    });
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const result = checkRateLimit('user-123', 10, 60000);
      expect(result.allowed).toBe(true);
      expect(result.remainingRequests).toBe(9);
    });

    it('should deny requests over limit', () => {
      const identifier = 'user-456';
      // Make 11 requests (over limit of 10)
      for (let i = 0; i < 11; i++) {
        checkRateLimit(identifier, 10, 60000);
      }
      const result = checkRateLimit(identifier, 10, 60000);
      expect(result.allowed).toBe(false);
      expect(result.remainingRequests).toBe(0);
    });
  });

  describe('validateOrigin', () => {
    it('should allow requests from allowed origins', () => {
      const request = new NextRequest('http://localhost:4000/api/test', {
        headers: {
          origin: 'http://localhost:4000',
        },
      });
      expect(validateOrigin(request)).toBe(true);
    });

    it('should reject requests from disallowed origins', () => {
      const request = new NextRequest('http://localhost:4000/api/test', {
        headers: {
          origin: 'http://evil.com',
        },
      });
      expect(validateOrigin(request)).toBe(false);
    });

    it('should validate using referer when origin is missing', () => {
      const request = new NextRequest('http://localhost:4000/api/test', {
        headers: {
          referer: 'http://localhost:4000/some-page',
        },
      });
      expect(validateOrigin(request)).toBe(true);
    });
  });

  describe('getSecurityHeaders', () => {
    it('should return proper security headers', () => {
      const headers = getSecurityHeaders();
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-XSS-Protection']).toBe('1; mode=block');
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
      expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
    });
  });

  describe('authenticateRequest', () => {
    it('should return null for missing authorization header', async () => {
      const request = new NextRequest('http://localhost:4000/api/test');
      const result = await authenticateRequest(request);
      expect(result).toBeNull();
    });

    it('should return null for invalid bearer token format', async () => {
      const request = new NextRequest('http://localhost:4000/api/test', {
        headers: {
          authorization: 'InvalidFormat token',
        },
      });
      const result = await authenticateRequest(request);
      expect(result).toBeNull();
    });

    it('should return user data for valid JWT', async () => {
      const { verifyJWT } = await import('@privy-io/server-auth');
      const mockVerifyJWT = vi.mocked(verifyJWT);

      const mockClaims = {
        sub: 'user-123',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };

      mockVerifyJWT.mockResolvedValueOnce(mockClaims);

      const request = new NextRequest('http://localhost:4000/api/test', {
        headers: {
          authorization: 'Bearer valid-jwt-token',
        },
      });

      const result = await authenticateRequest(request);
      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
      expect(result?.id).toBe('user-123');
    });

    it('should return null for invalid JWT', async () => {
      const { verifyJWT } = await import('@privy-io/server-auth');
      const mockVerifyJWT = vi.mocked(verifyJWT);

      mockVerifyJWT.mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:4000/api/test', {
        headers: {
          authorization: 'Bearer invalid-jwt-token',
        },
      });

      const result = await authenticateRequest(request);
      expect(result).toBeNull();
    });
  });
});
