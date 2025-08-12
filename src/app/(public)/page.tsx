'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard as the default landing
    router.push('/dashboard');
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6E71] mb-4"></div>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">Loading AUBRAI...</p>
      </div>
    </div>
  );
}
