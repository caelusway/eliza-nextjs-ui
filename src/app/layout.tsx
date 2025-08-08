import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { ThemeProvider } from 'next-themes';
import { siteConfig } from '@/app/shared/constants';
import { seo } from '@/config/ui-config';
import { fontVariables } from '@/app/shared/fonts';
import '@/app/globals.css';
import { ProgressBar } from '@/app/core/progress-bar';
import { Toaster } from '@/app/core/toaster';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: seo.themeColor,
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
    card: seo.twitterCard,
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
        <script
          type="text/javascript"
          src="https://www.bugherd.com/sidebarv2.js?apikey=eueujerg3pkawdagajobfq"
          async={true}
        />
      </head>
      <body className="antialiased bg-[#171717] text-white scheme-dark selection:!bg-[#3d2b15] font-geist">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <ProgressBar />
        <Toaster />
      </body>
    </html>
  );
}
