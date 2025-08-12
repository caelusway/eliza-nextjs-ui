import { NextRequest, NextResponse } from 'next/server';
import { withAuth, getSecurityHeaders, type AuthenticatedUser } from '@/lib/auth-middleware';

async function transcribeHandler(request: NextRequest, user: AuthenticatedUser) {
  const formData = await request.formData();
  const audioFile = formData.get('audio') as File;

  if (!audioFile) {
    return NextResponse.json(
      { error: 'No audio file provided' },
      { status: 400, headers: getSecurityHeaders() }
    );
  }

  const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY!;
  const apiUrl = 'https://api.elevenlabs.io/v1/speech-to-text';

  try {
    const apiFormData = new FormData();
    apiFormData.append('file', audioFile);
    apiFormData.append('model_id', 'scribe_v1');

    const apiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenlabsApiKey,
      },
      body: apiFormData,
    });

    if (!apiRes.ok) {
      const error = await apiRes.text();
      return NextResponse.json({ error }, { status: apiRes.status, headers: getSecurityHeaders() });
    }

    const data = await apiRes.json();
    console.log('Transcribed audio:', data.text);
    return NextResponse.json(data, { headers: getSecurityHeaders() });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

export const POST = withAuth(transcribeHandler);
