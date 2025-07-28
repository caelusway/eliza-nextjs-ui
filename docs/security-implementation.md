# Security Implementation Guide

This document outlines the comprehensive security measures implemented in the Eliza Next.js UI application.

## Overview

The application implements a multi-layered security approach using Privy JWT authentication, rate limiting, input sanitization, and secure headers to protect API routes and user data.

## Authentication & Authorization

### JWT Token Verification

- **Library**: `@privy-io/server-auth`
- **Validation**: All API routes verify JWT tokens from Privy
- **User Context**: Extracted user information is passed to downstream services
- **Deterministic UUIDs**: User IDs are generated consistently from email addresses

### API Route Protection

All sensitive API routes are protected using the `withAuth` middleware:

```typescript
export const POST = withAuth(protectedHandler);
```

### User Data Scoping

- Users can only access their own data
- `validateUserOwnership()` ensures proper authorization
- User context is passed to ElizaOS for request filtering

## Rate Limiting

### Implementation Details

- **Store**: In-memory Map (Redis recommended for production)
- **Limits**: Configurable per endpoint
  - Chat session creation: 10 requests/minute
  - ElizaOS GET requests: 60 requests/minute  
  - ElizaOS POST requests: 30 requests/minute
- **Headers**: Rate limit information returned in response headers

### Configuration

```typescript
const rateLimitResult = checkRateLimit(user.userId, maxRequests, windowMs);
```

## Input Sanitization

### Security Measures

- HTML tag removal to prevent XSS
- Quote character stripping
- Length limiting (1000 characters max)
- Whitespace trimming

### Usage

```typescript
const sanitizedInput = sanitizeInput(userInput);
```

## Security Headers

### Implemented Headers

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`: Restrictive camera/microphone/geolocation
- `Content-Security-Policy`: Restrictive with necessary unsafe allowances

## CSRF Protection

### Origin Validation

- Validates `Origin` header against allowed domains
- Falls back to `Referer` header validation
- Blocks requests from unauthorized origins

### Allowed Origins

- `NEXT_PUBLIC_APP_URL` (from environment)
- `http://localhost:4000` (development)
- `https://localhost:4000` (development SSL)

## ElizaOS API Proxy Security

### Enhanced Protection

- All proxy routes require authentication
- User context headers passed to ElizaOS
- Rate limiting applied per user
- Input sanitization for message content
- Restricted CORS headers (no wildcard origins)

### User Context Headers

```typescript
'X-User-ID': user.userId,
'X-User-Email': user.email
```

## Environment Configuration

### Required Variables

```env
# Privy Authentication
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-app-secret

# Application URLs
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_SERVER_URL=https://your-elizaos-server.com
```

### Security Considerations

- `PRIVY_APP_SECRET` must be kept secure (server-side only)
- Use HTTPS in production
- Set restrictive CORS origins

## Error Handling

### Consistent Error Format

```typescript
{
  error: "Human readable error message",
  code: "MACHINE_READABLE_CODE",
  details?: "Additional context"
}
```

### Error Codes

- `AUTH_REQUIRED`: Missing or invalid authentication
- `RATE_LIMIT_EXCEEDED`: Rate limit hit
- `INVALID_ORIGIN`: CSRF protection triggered
- `UNAUTHORIZED_USER`: Insufficient permissions
- `MISSING_CONFIG`: Server configuration issue

## Testing

### Test Coverage

- Authentication middleware functions
- Rate limiting logic
- Input sanitization
- UUID validation
- Origin validation
- Security headers

### Running Tests

```bash
bun run test src/lib/__tests__/auth-middleware.test.ts
```

## Production Deployment

### Security Checklist

- [ ] Install `@privy-io/server-auth` package
- [ ] Set `PRIVY_APP_SECRET` environment variable
- [ ] Configure proper `NEXT_PUBLIC_APP_URL`
- [ ] Use HTTPS for all communications
- [ ] Consider Redis for rate limiting store
- [ ] Monitor rate limit metrics
- [ ] Set up error logging and alerting
- [ ] Regular security dependency updates

### Performance Considerations

- Rate limit store cleanup runs automatically
- Consider Redis for distributed deployments
- JWT verification adds ~10ms per request
- Security headers add minimal overhead

## Monitoring & Logging

### Security Events Logged

- Failed authentication attempts
- Rate limit violations
- CSRF protection triggers
- Input sanitization triggers
- ElizaOS proxy errors

### Log Format

```
[Auth] Authentication failed for user: email@example.com
[RateLimit] User user-123 exceeded limit for endpoint /api/chat-session/create
[CSRF] Invalid origin detected: https://evil.com
```

## Future Enhancements

### Recommended Improvements

1. **Redis Integration**: Replace in-memory rate limiting
2. **Request Logging**: Comprehensive audit trail
3. **Honeypot Fields**: Bot detection in forms
4. **Rate Limit Bypass**: Admin/system accounts
5. **Security Monitoring**: Real-time alerting
6. **WAF Integration**: Additional protection layer
7. **API Key Management**: Alternative authentication method

### Security Monitoring

Consider implementing:
- Failed authentication rate monitoring
- Suspicious IP detection
- Rate limit pattern analysis
- Error rate alerting

## Compliance Notes

### Data Protection

- User data is scoped to authenticated users only
- No sensitive data in logs or error messages
- JWT tokens are properly validated
- Input sanitization prevents injection attacks

### Best Practices Followed

- Defense in depth security model
- Principle of least privilege
- Secure by default configuration
- Regular security dependency updates
- Comprehensive error handling
- Proper secret management