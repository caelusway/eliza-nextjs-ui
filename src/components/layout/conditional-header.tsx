'use client';

import { usePathname } from 'next/navigation';
import { Header } from './header';

export function ConditionalHeader() {
  const pathname = usePathname();
  
  // Don't render header on login page or app routes (they have their own navigation)
  if (pathname === '/login' || pathname.startsWith('/chat') || pathname.startsWith('/account')) {
    return null;
  }
  
  return <Header />;
} 