import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audioFile = formData.get('audio') as File;

  if (!audioFile) {
    return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
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
      return NextResponse.json({ error }, { status: apiRes.status });
    }

    const data = await apiRes.json();
    console.log('Transcribed audio:', data.text);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return NextResponse.json({ error: 'Failed to transcribe audio' }, { status: 500 });
  }
}
