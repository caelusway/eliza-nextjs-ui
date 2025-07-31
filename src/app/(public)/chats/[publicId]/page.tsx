import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicChatView } from '@/components/chat/public-chat-view';
import { siteConfig } from '@/app/shared/constants';

interface PublicChatPageProps {
  params: Promise<{
    publicId: string;
  }>;
}

interface SharedSession {
  id: string;
  session_id: string;
  owner_id: string;
  public_id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  view_count: number;
}

// Server-side function to fetch shared session data
async function getSharedSession(publicId: string): Promise<SharedSession | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000';
    const response = await fetch(`${baseUrl}/api/shared-sessions/${publicId}`, {
      cache: 'no-store', // Always fetch fresh data for SEO
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Error fetching shared session for metadata:', error);
    return null;
  }
}

// Generate dynamic metadata based on shared session data
export async function generateMetadata({ params }: PublicChatPageProps): Promise<Metadata> {
  const { publicId } = await params;
  const sharedSession = await getSharedSession(publicId);

  if (!sharedSession) {
    return {
      title: 'Chat Not Found',
      description: 'This shared chat session was not found or is no longer available.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${sharedSession.title} - Shared Chat`;
  const description =
    sharedSession.description ||
    `Join this shared conversation: ${sharedSession.title}. A live chat session with ${sharedSession.view_count} views.`;

  const ogImage = `${siteConfig.url}/api/og?title=${encodeURIComponent(sharedSession.title)}&description=${encodeURIComponent(description)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/chats/${publicId}`,
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: sharedSession.title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: `${siteConfig.url}/chats/${publicId}`,
    },
  };
}

export default async function PublicChatPage({ params }: PublicChatPageProps) {
  const { publicId } = await params;
  const sharedSession = await getSharedSession(publicId);

  if (!sharedSession) {
    notFound();
  }

  return <PublicChatView sharedSession={sharedSession} />;
}
