import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'Shared Chat';
    const description = searchParams.get('description') || 'A shared conversation';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              padding: '60px',
              margin: '40px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              maxWidth: '1000px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '30px',
              }}
            >
              <svg
                width="60"
                height="60"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ marginRight: '20px' }}
              >
                <path
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  stroke="#667eea"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#667eea',
                }}
              >
                Shared Chat
              </div>
            </div>

            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#1a202c',
                marginBottom: '20px',
                lineHeight: '1.2',
                textAlign: 'center',
              }}
            >
              {title.length > 60 ? title.substring(0, 60) + '...' : title}
            </div>

            <div
              style={{
                fontSize: '24px',
                color: '#4a5568',
                lineHeight: '1.4',
                textAlign: 'center',
                maxWidth: '800px',
              }}
            >
              {description.length > 120 ? description.substring(0, 120) + '...' : description}
            </div>

            <div
              style={{
                marginTop: '40px',
                padding: '12px 24px',
                backgroundColor: '#667eea',
                color: 'white',
                borderRadius: '12px',
                fontSize: '20px',
                fontWeight: '600',
              }}
            >
              View Conversation →
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
