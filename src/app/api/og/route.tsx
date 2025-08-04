import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'Shared Chat';
    const description = searchParams.get('description') || 'A shared conversation';

    // Fetch the logo image
    const logoResponse = await fetch(new URL('/assets/logo_text.png', request.url));
    const logoBuffer = await logoResponse.arrayBuffer();

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
            background: '#1a1a1a', // Single dark color for entire image
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {/* Logo */}
          <div
            style={{
              marginBottom: '40px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <img
              src={`data:image/png;base64,${Buffer.from(logoBuffer).toString('base64')}`}
              alt="Logo"
              width="200"
              height="50"
              style={{
                objectFit: 'contain',
              }}
            />
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: '52px',
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: '24px',
              lineHeight: '1.2',
              textAlign: 'center',
              maxWidth: '900px',
            }}
          >
            {title.length > 80 ? title.substring(0, 80) + '...' : title}
          </div>

          {/* Description */}
          {description && description.trim() && (
            <div
              style={{
                fontSize: '28px',
                color: '#d1d5db',
                lineHeight: '1.4',
                textAlign: 'center',
                maxWidth: '800px',
                marginBottom: '20px',
              }}
            >
              {description.length > 140 ? description.substring(0, 140) + '...' : description}
            </div>
          )}

          {/* Subtle accent line */}
          <div
            style={{
              width: '120px',
              height: '4px',
              background: 'linear-gradient(90deg, #6b7280, #9ca3af)',
              borderRadius: '2px',
              marginTop: '20px',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    // Extract search params for fallback
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'Shared Chat';
    // Fallback without logo if logo fetch fails
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
            background: '#1a1a1a',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <div
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: '40px',
              letterSpacing: '0.05em',
            }}
          >
            AUBRAI
          </div>

          <div
            style={{
              fontSize: '52px',
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: '24px',
              lineHeight: '1.2',
              textAlign: 'center',
              maxWidth: '900px',
            }}
          >
            {title.length > 80 ? title.substring(0, 80) + '...' : title}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
