import { seo } from '@/config/ui-config';

export const siteConfig = {
  name: seo.title,
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000',
  description: seo.description,
  ogImage: seo.ogImage,
  creator: seo.author,
  keywords: seo.keywords.split(',').map((k) => k.trim()),
  icons: [
    {
      rel: 'icon',
      type: 'image/x-icon',
      url: seo.faviconUrl,
    },
    {
      rel: 'icon',
      type: 'image/png',
      url: seo.faviconUrl.replace('.ico', '.png'),
    },
    {
      rel: 'apple-touch-icon',
      url: '/apple-touch-icon.png',
    },
    {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      url: '/apple-touch-icon.png',
    },
  ],
};
