import { NextRequest, NextResponse } from 'next/server';
import { getSecurityHeaders } from '@/lib/auth-middleware';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...getSecurityHeaders(),
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Add CORS headers for cross-origin requests
    const origin = request.headers.get('origin');
    const authHeader = request.headers.get('authorization');
    
    console.log('[TTS] Request from origin:', origin);
    console.log('[TTS] Has auth header:', !!authHeader);
    console.log('[TTS] User-Agent:', request.headers.get('user-agent'));
    
    // Add CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    if (!ELEVENLABS_API_KEY) {
      console.error('[TTS] ElevenLabs API key not configured');
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' }, 
        { status: 500, headers: { ...getSecurityHeaders(), ...corsHeaders } }
      );
    }

    if (!ELEVENLABS_VOICE_ID) {
      console.error('[TTS] ElevenLabs voice ID not configured');
      return NextResponse.json(
        { error: 'ElevenLabs voice ID not configured' }, 
        { status: 500, headers: { ...getSecurityHeaders(), ...corsHeaders } }
      );
    }

    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' }, 
        { status: 400, headers: { ...getSecurityHeaders(), ...corsHeaders } }
      );
    }

    console.log(`[TTS] Generating speech for text: "${text.substring(0, 100)}..."`);

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

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TTS] ElevenLabs API error (${response.status}):`, errorText);
      return NextResponse.json(
        { error: 'Failed to generate speech' }, 
        { status: response.status, headers: { ...getSecurityHeaders(), ...corsHeaders } }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    console.log(`[TTS] Successfully generated ${audioBuffer.byteLength} bytes of audio`);

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        ...getSecurityHeaders(),
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('[TTS] Error:', error);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500, headers: { ...getSecurityHeaders(), ...corsHeaders } }
    );
  }
}
