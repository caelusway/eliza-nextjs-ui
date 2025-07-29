import { NextRequest, NextResponse } from 'next/server';
import { withAuth, getSecurityHeaders, type AuthenticatedUser } from '@/lib/auth-middleware';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

async function textToSpeechHandler(request: NextRequest, user: AuthenticatedUser) {
  try {
    console.log('[TTS] Authenticated request from user:', user.userId);
    console.log('[TTS] User email:', user.email);
    
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

    // Validate text length - ElevenLabs has limits
    if (text.length > 5000) {
      console.warn(`[TTS] Text too long: ${text.length} characters`);
      return NextResponse.json(
        { error: 'Text too long. Maximum 5000 characters allowed.' }, 
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    console.log(`[TTS] Generating speech for text: "${text.substring(0, 100)}..." (${text.length} chars)`);

    // Add timeout to prevent long-running requests from causing token expiration
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error('[TTS] Request timeout - aborting to prevent token expiration');
      controller.abort();
    }, 45000); // 45 second timeout

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
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[TTS] ElevenLabs API error (${response.status}):`, errorText);
        return NextResponse.json(
          { error: 'Failed to generate speech' }, 
          { status: response.status, headers: getSecurityHeaders() }
        );
      }

      const audioBuffer = await response.arrayBuffer();
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
