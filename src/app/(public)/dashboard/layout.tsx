'use client';

import { TRPCProvider } from '@/components/providers/trpc-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TRPCProvider>
      <div className="min-h-screen text-white font-mono overflow-hidden flex items-start justify-center bg-black">
        {children}
      </div>
    </TRPCProvider>
  );
}