'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAgentConfig } from '@/lib/agent-config';

export default function Page() {
  const router = useRouter();
  const agentConfig = getAgentConfig();

  useEffect(() => {
    // Redirect to login page as the default landing
    router.push('/login');
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 mb-4" 
             style={{ borderBottomColor: agentConfig.theme.primaryColor }}></div>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">Loading {agentConfig.name}...</p>
      </div>
    </div>
  );
}
