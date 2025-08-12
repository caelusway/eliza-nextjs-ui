import { NextRequest, NextResponse } from 'next/server';
import {
  withAuth,
  validateUserOwnership,
  sanitizeInput,
  checkRateLimit,
  getSecurityHeaders,
  validateOrigin,
  type AuthenticatedUser,
} from '@/lib/auth-middleware';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function suggestedPromptsHandler(request: NextRequest, user: AuthenticatedUser) {
  try {
    // Validate CSRF protection
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { success: false, error: 'Invalid origin' },
        { status: 403, headers: getSecurityHeaders() }
      );
    }

    // Check rate limiting - 5 requests per 15 minutes to align with cache duration
    const rateLimitResult = checkRateLimit(user.userId, 5, 15 * 60 * 1000);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        { status: 429, headers: getSecurityHeaders() }
      );
    }

    // Check request size to prevent large payload attacks
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1024) {
      // 1KB limit
      return NextResponse.json(
        { success: false, error: 'Request too large' },
        { status: 413, headers: getSecurityHeaders() }
      );
    }

    const body = await request.json();
    const { userId, userContext } = body;

    // Validate user ownership
    if (!validateUserOwnership(userId, user.userId)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403, headers: getSecurityHeaders() }
      );
    }

    // Sanitize and validate inputs
    const sanitizedUserId = sanitizeInput(userId);
    const sanitizedUserContext = userContext ? sanitizeInput(userContext) : undefined;

    // Validate userContext length to prevent prompt injection
    if (sanitizedUserContext && sanitizedUserContext.length > 500) {
      return NextResponse.json(
        { success: false, error: 'User context too long' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Additional validation for malicious patterns
    if (sanitizedUserContext && containsMaliciousPatterns(sanitizedUserContext)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user context' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    const prompts = await generateSuggestedPrompts(sanitizedUserContext);

    return NextResponse.json(
      {
        success: true,
        prompts: prompts,
        generatedAt: new Date().toISOString(),
        cacheKey: `suggested_prompts_${sanitizedUserId}`,
      },
      { headers: getSecurityHeaders() }
    );
  } catch (err) {
    console.error(
      '[SuggestedPrompts] Error:',
      err instanceof Error ? err.message : 'Unknown error'
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Service temporarily unavailable',
        prompts: [], // Return empty array as fallback
      },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

// Security function to detect malicious patterns
function containsMaliciousPatterns(input: string): boolean {
  const maliciousPatterns = [
    /ignore\s+previous\s+instructions/i,
    /system\s+prompt/i,
    /new\s+instructions/i,
    /roleplay\s+as/i,
    /pretend\s+to\s+be/i,
    /forget\s+everything/i,
    /<script/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
  ];

  return maliciousPatterns.some((pattern) => pattern.test(input));
}

export const POST = withAuth(suggestedPromptsHandler);

async function generateSuggestedPrompts(userContext?: string): Promise<string[]> {
  try {
    // Check if OpenAI API key is available
    if (!OPENAI_API_KEY) {
      console.warn('[SuggestedPrompts] OpenAI API key not configured, using fallback prompts');
      return getFallbackPrompts();
    }

    const response = await makeRequestToOpenAi(userContext);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[SuggestedPrompts] OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      return getFallbackPrompts();
    }

    const rawResponseFromOai = await response.json();

    if (!rawResponseFromOai.choices || rawResponseFromOai.choices.length === 0) {
      console.error('[SuggestedPrompts] No choices in OpenAI response');
      return getFallbackPrompts();
    }

    const promptsText = rawResponseFromOai.choices[0].message.content;

    if (!promptsText) {
      console.error('[SuggestedPrompts] Empty content in OpenAI response');
      return getFallbackPrompts();
    }

    const parsedPrompts = JSON.parse(promptsText);

    // Ensure we have exactly 4 prompts
    if (
      parsedPrompts.prompts &&
      Array.isArray(parsedPrompts.prompts) &&
      parsedPrompts.prompts.length > 0
    ) {
      const validPrompts = parsedPrompts.prompts.filter(
        (p) => typeof p === 'string' && p.trim().length > 0
      );
      if (validPrompts.length > 0) {
        return validPrompts.slice(0, 4);
      }
    }

    console.warn('[SuggestedPrompts] Invalid prompts format from OpenAI, using fallback');
    return getFallbackPrompts();
  } catch (error) {
    console.error('[SuggestedPrompts] Error generating prompts:', error);
    return getFallbackPrompts();
  }
}

async function makeRequestToOpenAi(userContext?: string) {
  // Validate API key exists
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const baseUrl = 'https://api.openai.com/v1/chat/completions';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${OPENAI_API_KEY}`,
  };

  // Escape and sanitize user context to prevent prompt injection
  const sanitizedContext = userContext
    ? userContext
        .replace(/[<>\"'&]/g, '') // Remove HTML/script chars
        .replace(/\n{3,}/g, '\n\n') // Limit excessive newlines
        .trim()
    : null;

  const contextualPrompt = sanitizedContext
    ? `Generate 4 diverse and engaging suggested prompts for a longevity research AI assistant. The user is interested in: ${sanitizedContext}. Focus on scientific longevity research and make them accessible.`
    : `Generate 4 diverse and engaging suggested prompts for AUBRAI, a longevity research AI assistant inspired by Dr. Aubrey de Grey. Focus on:
    - Anti-aging research and therapies
    - Biomedical longevity science
    - RMR2 project and robust mouse rejuvenation
    - SENS framework and damage repair
    - Cellular senescence and rejuvenation
    - NAD+ precursors and metabolic health
    - Clinical trials for age-related diseases
    
    Make them scientifically interesting but accessible to general audience. Each prompt should be a complete question or request.`;

  const body = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are an expert at generating engaging scientific prompts. Generate exactly 4 suggested prompts as a JSON object with a "prompts" array. Each prompt should be 10-25 words, scientifically accurate, and designed to spark interesting conversations about longevity research.',
      },
      {
        role: 'user',
        content: contextualPrompt,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'suggested_prompts',
        schema: {
          type: 'object',
          properties: {
            prompts: {
              type: 'array',
              items: { type: 'string' },
              minItems: 4,
              maxItems: 4,
            },
          },
          required: ['prompts'],
          additionalProperties: false,
        },
        strict: true,
      },
    },
    max_tokens: 500,
    temperature: 0.7,
  };

  // Add timeout and error handling for OpenAI API calls
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(baseUrl, {
      headers,
      body: JSON.stringify(body),
      method: 'POST',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('OpenAI API request timed out');
    }
    throw error;
  }
}

// Fallback prompts in case API fails - use same prompts from config
function getFallbackPrompts(): string[] {
  // Use the same default prompts as the UI config
  const defaultPrompts = (
    process.env.NEXT_PUBLIC_SUGGESTED_PROMPTS ||
    'What drug combinations show synergistic effects for longevity?,Analyze the latest research on NAD+ precursors,Design a compound targeting cellular senescence,Find clinical trials for age-related diseases'
  ).split(',');

  // Return exactly 4 prompts, taking the first 4 if more are available
  return defaultPrompts.slice(0, 4);
}
