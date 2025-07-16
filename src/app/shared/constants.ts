export const siteConfig = {
  name: process.env.NEXT_PUBLIC_AGENT_NAME || 'Bio Launchpad Agent',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://ai.eliza.how/' || 'http://localhost:4000',
  description: process.env.NEXT_PUBLIC_AGENT_DESCRIPTION || 'Bio Launchpad Agent',
  ogImage: '/og.png',
  creator: 'BioProtocol',
  icons: [
    {
      rel: 'icon',
      type: 'image/png',
      url: '/favicon.ico',
      media: '(prefers-color-scheme: light)',
    },
    {
      rel: 'icon',
      type: 'image/png',
      url: '/favicon.ico',
      media: '(prefers-color-scheme: dark)',
    },
  ],
};
