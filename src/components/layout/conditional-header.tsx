'use client';

import { usePathname } from 'next/navigation';
import { Header } from './header';

export function ConditionalHeader() {
  const pathname = usePathname();
  
  // Don't render header on login page or app routes (they have their own sidebar navigation)
  const isAppRoute = pathname.startsWith('/chat') || pathname.startsWith('/account') || pathname.startsWith('/invites');
  
  if (pathname === '/login' || isAppRoute) {
    return null;
  }
  
  return <Header />;
} 