'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { authenticated, ready, user } = usePrivy();

  // Define public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/privacy', '/terms', '/about', '/dashboard'];

  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname.startsWith('/invite') ||
    pathname.startsWith('/chats/');

  useEffect(() => {
    if (!ready) return; // Wait for Privy to initialize

    // If accessing a protected route and not authenticated
    if (!isPublicRoute && !authenticated) {
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/login?returnUrl=${returnUrl}`);
      return;
    }

    // If authenticated and on login page, redirect appropriately
    if (authenticated && pathname === '/login') {
      // Check URL parameters for returnUrl
      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get('returnUrl');

      if (returnUrl) {
        router.push(decodeURIComponent(returnUrl));
      } else {
        router.push('/chat');
      }
      return;
    }
  }, [ready, authenticated, pathname, isPublicRoute, router]);

  // Show loading for protected routes while checking authentication
  if (!ready) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6E71] mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render protected content if not authenticated
  if (!isPublicRoute && !authenticated) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6E71] mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
