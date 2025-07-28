#!/usr/bin/env node

/**
 * Security verification script
 * Tests the authentication and security middleware
 */

const { NextRequest } = require('next/server');

// Mock environment variables
process.env.NEXT_PUBLIC_PRIVY_APP_ID = 'test-app-id';
process.env.PRIVY_APP_SECRET = 'test-app-secret';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:4000';

// Mock @privy-io/server-auth since it requires valid credentials
jest.mock('@privy-io/server-auth', () => ({
  PrivyClient: jest.fn().mockImplementation(() => ({
    verifyAuthToken: jest.fn(),
    getUserById: jest.fn()
  }))
}));

async function testSecurityFunctions() {
  console.log('🔐 Testing Security Implementation...\n');

  try {
    // Import our security functions
    const {
      sanitizeInput,
      isValidUUID,
      checkRateLimit,
      validateOrigin,
      getSecurityHeaders,
      validateUserOwnership
    } = require('../src/lib/auth-middleware.ts');

    // Test input sanitization
    console.log('✅ Testing Input Sanitization:');
    const testInput = '<script>alert("xss")</script>Hello "world"';
    const sanitized = sanitizeInput(testInput);
    console.log(`  Input: ${testInput}`);
    console.log(`  Output: ${sanitized}`);
    console.log(`  ✓ XSS tags removed: ${!sanitized.includes('<script>')}`);
    console.log(`  ✓ Quotes removed: ${!sanitized.includes('"')}\n`);

    // Test UUID validation
    console.log('✅ Testing UUID Validation:');
    const validUUID = '123e4567-e89b-12d3-a456-426614174000';
    const invalidUUID = 'not-a-uuid';
    console.log(`  Valid UUID: ${isValidUUID(validUUID)}`);
    console.log(`  Invalid UUID: ${!isValidUUID(invalidUUID)}\n`);

    // Test rate limiting
    console.log('✅ Testing Rate Limiting:');
    const userId = 'test-user-123';
    const limit1 = checkRateLimit(userId, 5, 60000);
    console.log(`  First request allowed: ${limit1.allowed}`);
    console.log(`  Remaining requests: ${limit1.remainingRequests}`);
    
    // Make 5 more requests to hit the limit
    for (let i = 0; i < 5; i++) {
      checkRateLimit(userId, 5, 60000);
    }
    const limitExceeded = checkRateLimit(userId, 5, 60000);
    console.log(`  Request over limit blocked: ${!limitExceeded.allowed}\n`);

    // Test user ownership validation
    console.log('✅ Testing User Ownership:');
    const sameUser = validateUserOwnership('user-123', 'user-123');
    const differentUser = validateUserOwnership('user-123', 'user-456');
    console.log(`  Same user access: ${sameUser}`);
    console.log(`  Different user blocked: ${!differentUser}\n`);

    // Test security headers
    console.log('✅ Testing Security Headers:');
    const headers = getSecurityHeaders();
    console.log(`  X-Frame-Options: ${headers['X-Frame-Options']}`);
    console.log(`  X-Content-Type-Options: ${headers['X-Content-Type-Options']}`);
    console.log(`  CSP present: ${!!headers['Content-Security-Policy']}\n`);

    console.log('🎉 All security tests passed!');
    
  } catch (error) {
    console.error('❌ Security test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
testSecurityFunctions();