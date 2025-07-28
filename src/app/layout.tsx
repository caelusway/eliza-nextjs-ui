import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { ThemeProvider } from 'next-themes';
import { siteConfig } from '@/app/shared/constants';
import { fontVariables } from '@/app/shared/fonts';
import '@/app/globals.css';
import { ProgressBar } from '@/app/core/progress-bar';
import { Toaster } from '@/app/core/toaster';
import { ConditionalHeader } from '@/components/layout/conditional-header';
import { PrivyClientProvider } from './core/privy-client-provider';
import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { BugHerdScript } from '@/components/bugherd-script';
import Script from 'next/script'


export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.creator }],
  creator: siteConfig.creator,
  publisher: siteConfig.creator,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  icons: siteConfig.icons,
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: siteConfig.creator,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en" className={`${fontVariables} dark`}>
      <head>

        {/* Feedbug Config Script */}
        <Script id="feedbug-config" strategy="beforeInteractive">
          {`
            window.feedbugConfig = {
              apiKey: 'fb_wWIU1WLYNWnTGMoAXfsT6euEQsAl3J85',
              domain: 'https://staging.aubr.ai'
            };
          `}
        </Script>

        {/* Feedbug Widget Loader */}
        <Script
          src="https://feedbug.xyz/widget.js"
          strategy="lazyOnload"
        />
      </head>
      <body className="min-h-dvh antialiased bg-[#171717] text-white scheme-dark selection:!bg-[#3d2b15] overscroll-none font-geist">
        <div className="flex min-h-dvh w-full flex-col grow">
          <div className="flex grow flex-col size-full min-h-dvh">
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem={false}
              disableTransitionOnChange
            >
              <PrivyClientProvider>
                <AuthWrapper>
                  <ConditionalHeader />
                  {children}
                </AuthWrapper>
              </PrivyClientProvider>
            </ThemeProvider>
          </div>
        </div>
        <ProgressBar />
        <Toaster />
      </body>
    </html>
  );
}
