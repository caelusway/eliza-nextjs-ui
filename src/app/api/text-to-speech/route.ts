import { NextRequest, NextResponse } from 'next/server';
import { withAuth, getSecurityHeaders, type AuthenticatedUser } from '@/lib/auth-middleware';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
}

async function textToSpeechHandler(request: NextRequest, user: AuthenticatedUser) {
  const startTime = Date.now();

  try {
    console.log('[TTS] === TTS REQUEST FOR USER:', user.userId, '===');
    console.log('[TTS] Request timestamp:', new Date().toISOString());
    console.log('[TTS] Environment:', process.env.NODE_ENV);
    console.log('[TTS] Has ElevenLabs API key:', !!ELEVENLABS_API_KEY);
    console.log('[TTS] Has ElevenLabs voice ID:', !!ELEVENLABS_VOICE_ID);

    // Get security headers with CORS
    const corsHeaders = {
      ...getSecurityHeaders(),
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    };

    if (!ELEVENLABS_API_KEY) {
      console.error('[TTS] ElevenLabs API key not configured');
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    if (!ELEVENLABS_VOICE_ID) {
      console.error('[TTS] ElevenLabs voice ID not configured');
      return NextResponse.json(
        { error: 'ElevenLabs voice ID not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate text length
    if (text.length > 5000) {
      console.warn(`[TTS] Text too long: ${text.length} characters`);
      return NextResponse.json(
        { error: 'Text too long. Maximum 5000 characters allowed.' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(
      `[TTS] Generating speech for text: "${text.substring(0, 100)}..." (${text.length} chars)`
    );
    console.log('[TTS] Request start time:', startTime);

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
      }
    );

    const responseTime = Date.now() - startTime;
    console.log(`[TTS] ElevenLabs API response received after ${responseTime}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TTS] ElevenLabs API error (${response.status}):`, errorText);
      return NextResponse.json(
        { error: 'Failed to generate speech' },
        { status: response.status, headers: corsHeaders }
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
        ...corsHeaders,
      },
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[TTS] Error after ${totalTime}ms:`, error);

    const corsHeaders = {
      ...getSecurityHeaders(),
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    };

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export const POST = withAuth(textToSpeechHandler);
