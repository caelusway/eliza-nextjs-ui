export const siteConfig = {
  name: process.env.NEXT_PUBLIC_AGENT_NAME || 'AUBRAI - Longevity Lab AI',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://aubr.ai' || 'http://localhost:4000',
  description: process.env.NEXT_PUBLIC_AGENT_DESCRIPTION || 'Advanced Understanding of Biological Research through AI - Accelerating longevity breakthroughs for the RMR2 project',
  ogImage: '/og.png',
  creator: 'AUBRAI Team',
  keywords: ['longevity', 'AI', 'research', 'RMR2', 'Aubrey de Grey', 'mouse rejuvenation', 'bioDAO', 'science'],
  icons: [
    {
      rel: 'icon',
      type: 'image/x-icon',
      url: '/favicon.ico',
    },
    {
      rel: 'icon',
      type: 'image/png',
      url: '/favicon.png',
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
