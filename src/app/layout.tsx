import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'next-themes';
import { siteConfig } from '@/app/shared/constants';
import { inter } from '@/app/shared/fonts';
import '@/app/globals.css';
import { ProgressBar } from '@/app/core/progress-bar';
import { Toaster } from '@/app/core/toaster';
import { ConditionalHeader } from '@/components/layout/conditional-header';
import { PrivyClientProvider } from './core/privy-client-provider';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: 'white',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: `${siteConfig.name}`,
  description: siteConfig.description,
  openGraph: {
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    type: 'website',
    url: siteConfig.url,
    locale: 'en_US',
  },
  icons: siteConfig.icons,
  twitter: {
    card: 'summary_large_image',
    site: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: siteConfig.creator,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en" className={inter.className}>
      <body className="min-h-dvh antialiased bg-white text-black scheme-light dark:bg-black dark:text-white dark:scheme-dark selection:!bg-[#fff0dd] dark:selection:!bg-[#3d2b15] overscroll-none">
        <div className="flex min-h-dvh w-full flex-col grow">
          <div className="flex grow flex-col size-full min-h-dvh">
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <PrivyClientProvider>
                <ConditionalHeader />
                {children}
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
