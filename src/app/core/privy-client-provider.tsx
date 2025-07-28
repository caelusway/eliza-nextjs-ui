'use client';

import { PrivyClientConfig } from '@privy-io/react-auth';
import { SafePrivyProvider } from '@/components/auth';
import { useMemo } from 'react';

export function PrivyClientProvider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  // Memoize the Privy config to prevent re-initialization
  const privyConfig = useMemo<PrivyClientConfig>(
    () => ({
      // Display only email as login method
      loginMethods: ['email'],
      // Disable all Privy modals for whitelabel experience
      showWalletUIs: false,
      // Customize the appearance of the login flow
      appearance: {
        theme: 'dark',
        accentColor: '#FF6E71',
        logo: '/assets/aubrai_logo_white.png',
      },
      // Modal configuration
      modal: {
        // Ensure modal closes background interaction
        closeOnClickOutside: true,
        // Prevent page scroll when modal is open
        preventPageScroll: true,
      },
    }),
    []
  );

  // If no Privy App ID is configured, render children without Privy provider
  if (!appId) {
    console.warn('[PrivyClientProvider] NEXT_PUBLIC_PRIVY_APP_ID not configured');
    return <>{children}</>;
  }

  return (
    <SafePrivyProvider
      appId={appId}
      config={privyConfig}
      onError={(error) => {
        if (error?.message?.includes('storage')) {
          console.warn('[PrivyClientProvider] Storage error - continuing without persistent auth');
        } else {
          console.error('[PrivyClientProvider] Privy error:', error);
        }
      }}
    >
      {children}
    </SafePrivyProvider>
  );
}
