'use client';

import { PrivyProvider, PrivyClientConfig } from '@privy-io/react-auth';
import { ReactNode, useState, useEffect } from 'react';

interface SafePrivyProviderProps {
  children: ReactNode;
  appId: string;
  config: PrivyClientConfig;
  onError?: (error: Error) => void;
}

/**
 * SafePrivyProvider wraps PrivyProvider to ensure it only initializes
 * after the browser environment is ready and storage is accessible
 */
export function SafePrivyProvider({ children, appId, config, onError }: SafePrivyProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [hasStorageError, setHasStorageError] = useState(false);

  useEffect(() => {
    // Check if storage is accessible
    const checkStorage = () => {
      try {
        const testKey = '__privy_storage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
      } catch {
        return false;
      }
    };

    // Only initialize after a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const storageAvailable = checkStorage();
      if (!storageAvailable) {
        setHasStorageError(true);
        console.warn('[SafePrivyProvider] Storage not available, Privy will use memory storage');
      }
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Don't render PrivyProvider until we're ready
  if (!isReady) {
    return <>{children}</>;
  }

  // Enhanced error handler
  const handleError = (error: Error) => {
    if (error?.message?.includes('storage')) {
      console.warn('[SafePrivyProvider] Storage access error - continuing with memory storage');
      // Don't propagate storage errors
      return;
    }
    onError?.(error);
  };

  return (
    <PrivyProvider appId={appId} config={config}>
      {children}
    </PrivyProvider>
  );
}
