import { NextRequest, NextResponse } from 'next/server';
import { withAuth, getSecurityHeaders, type AuthenticatedUser } from '@/lib/auth-middleware';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

async function textToSpeechHandler(request: NextRequest, user: AuthenticatedUser) {
  const startTime = Date.now();
  
  // Environment detection
  const isVercel = !!process.env.VERCEL;
  const isProduction = process.env.NODE_ENV === 'production';
  
  try {
    console.log('[TTS] === TTS REQUEST DEBUG INFO ===');
    console.log('[TTS] Environment:', process.env.NODE_ENV);
    console.log('[TTS] Vercel Environment:', process.env.VERCEL_ENV);
    console.log('[TTS] Platform:', isVercel ? 'Vercel' : 'Local');
    console.log('[TTS] Is Production:', isProduction);
    console.log('[TTS] Request timestamp:', new Date().toISOString());
    console.log('[TTS] Authenticated request from user:', user.userId);
    console.log('[TTS] User email:', user.email);
    console.log('[TTS] Has ElevenLabs API key:', !!ELEVENLABS_API_KEY);
    console.log('[TTS] Has ElevenLabs voice ID:', !!ELEVENLABS_VOICE_ID);
    
    if (!ELEVENLABS_API_KEY) {
      console.error('[TTS] ElevenLabs API key not configured');
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' }, 
        { status: 500, headers: getSecurityHeaders() }
      );
    }

    if (!ELEVENLABS_VOICE_ID) {
      console.error('[TTS] ElevenLabs voice ID not configured');
      return NextResponse.json(
        { error: 'ElevenLabs voice ID not configured' }, 
        { status: 500, headers: getSecurityHeaders() }
      );
    }

    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' }, 
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Validate text length - same limit for all environments
    if (text.length > 5000) {
      console.warn(`[TTS] Text too long: ${text.length} characters (max: 5000)`);
      return NextResponse.json(
        { error: 'Text too long. Maximum 5000 characters allowed.' }, 
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    console.log(`[TTS] Generating speech for text: "${text.substring(0, 100)}..." (${text.length} chars)`);
    console.log('[TTS] Request start time:', startTime);

    // Use longer timeout for all environments - 401 errors suggest auth expiry, not platform limits
    const timeoutMs = 60000; // 60 seconds for all environments
    
    console.log('[TTS] Using timeout:', timeoutMs, 'ms');

    // Add timeout to prevent long-running requests from causing platform timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      const elapsed = Date.now() - startTime;
      console.error(`[TTS] Request timeout after ${elapsed}ms - aborting to prevent platform timeout`);
      console.error('[TTS] Platform limits may be causing this timeout');
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream?output_format=mp3_44100_128`,
        {
          method: 'POST',
          headers: {
            Accept: 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
              style: 0.0,
              use_speaker_boost: true,
            },
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      console.log(`[TTS] ElevenLabs API response received after ${responseTime}ms`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[TTS] ElevenLabs API error (${response.status}):`, errorText);
        console.error(`[TTS] Error occurred after ${responseTime}ms`);
        return NextResponse.json(
          { error: 'Failed to generate speech' }, 
          { status: response.status, headers: getSecurityHeaders() }
        );
      }

      console.log('[TTS] Starting audio buffer download...');
      const bufferStartTime = Date.now();
      const audioBuffer = await response.arrayBuffer();
      const bufferTime = Date.now() - bufferStartTime;
      const totalTime = Date.now() - startTime;
      
      console.log(`[TTS] Audio buffer downloaded in ${bufferTime}ms`);
      console.log(`[TTS] Total request time: ${totalTime}ms`);
      console.log(`[TTS] Successfully generated ${audioBuffer.byteLength} bytes of audio`);

      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.byteLength.toString(),
          ...getSecurityHeaders(),
        },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('[TTS] Request was aborted due to timeout');
        return NextResponse.json(
          { error: 'Request timeout. Text may be too long for processing.' }, 
          { status: 408, headers: getSecurityHeaders() }
        );
      }
      
      throw fetchError; // Re-throw other errors to be caught by outer catch
    }
  } catch (error) {
    console.error('[TTS] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

export const POST = withAuth(textToSpeechHandler);
