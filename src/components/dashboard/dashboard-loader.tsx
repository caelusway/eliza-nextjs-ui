"use client";

import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardLoaderProps {
  children: React.ReactNode;
}

export function DashboardLoader({ children }: DashboardLoaderProps) {
  const { loading } = useDashboardStats();

  if (loading) {
    return (
      <div className="bg-black text-white w-full lg:h-screen lg:overflow-hidden">
        <div className="min-h-screen lg:h-full flex flex-col p-2">
          {/* Header Section Loading */}
          <div className="flex-shrink-0 mb-1">
            {/* Dashboard Header Loading */}
            <div className="bg-black border border-white/20 p-4 mb-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-8 h-8 rounded" />
                  <Skeleton className="w-32 h-6 rounded" />
                </div>
                <div className="flex items-center gap-8">
                  <Skeleton className="w-16 h-4 rounded" />
                  <Skeleton className="w-16 h-4 rounded" />
                  <Skeleton className="w-16 h-4 rounded" />
                  <Skeleton className="w-16 h-4 rounded" />
                </div>
              </div>
            </div>
            
            {/* Status Banner Loading */}
            <div className="border border-white/20 bg-black p-3">
              <div className="flex items-center gap-3 text-sm">
                <Skeleton className="w-48 h-4 rounded" />
                <span className="text-white font-red-hat-mono font-normal leading-[0.9]">•</span>
                <Skeleton className="w-64 h-4 rounded" />
              </div>
            </div>
          </div>

          {/* Main Content Loading */}
          <div className="flex-1 flex flex-col lg:min-h-0">
            <div className="flex-1 flex flex-col gap-1 lg:grid lg:grid-cols-12 lg:min-h-0">
              {/* Mobile Only - Robot Artwork Loading */}
              <div className="w-full min-h-[300px] md:min-h-[350px] lg:hidden flex items-center justify-center">
                <div className="w-full h-full bg-black border border-white/20 flex items-center justify-center">
                  <div className="animate-pulse">
                    <div className="w-32 h-32 bg-white/10 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Left Panel Loading */}
              <div className="w-full min-h-[400px] lg:flex-1 lg:col-span-4 lg:min-h-0">
                <div className="h-full bg-black border border-white/20 p-4">
                  <div className="space-y-4">
                    <Skeleton className="w-24 h-6 rounded" />
                    <div className="space-y-2">
                      {Array.from({ length: 8 }).map((_, index) => (
                        <Skeleton key={index} className="w-full h-4 rounded" />
                      ))}
                    </div>
                    <div className="mt-8 space-y-3">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Skeleton className="w-4 h-4 rounded" />
                          <Skeleton className="w-16 h-4 rounded" />
                          <Skeleton className="w-12 h-4 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Center and Right Panel Container */}
              <div className="w-full flex flex-col gap-1 lg:flex-1 lg:col-span-8 lg:min-h-0">
                <div className="flex flex-col gap-1 lg:flex-1 md:grid md:grid-cols-4 lg:min-h-0">
                  {/* Center Panel - Robot Artwork Loading (Desktop) */}
                  <div className="hidden md:flex md:col-span-3 lg:min-h-0 items-center justify-center">
                    <div className="w-full h-full bg-black border border-white/20 flex items-center justify-center">
                      <div className="animate-pulse">
                        <div className="w-48 h-48 bg-white/10 rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Right Panel Loading */}
                  <div className="w-full min-h-[400px] lg:flex-1 md:col-span-1 lg:min-h-0">
                    <div className="h-full bg-black border border-white/20 p-4">
                      <div className="space-y-4">
                        <Skeleton className="w-20 h-6 rounded" />
                        <div className="space-y-3">
                          {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <Skeleton className="w-16 h-4 rounded" />
                              <Skeleton className="w-12 h-4 rounded" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Partners Section Loading */}
                <div className="h-[38.5px] flex-shrink-0">
                  <div className="h-full bg-black border border-white/20 flex items-center justify-center">
                    <div className="flex items-center gap-4">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton key={index} className="w-8 h-8 rounded" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Mentions Loading */}
            <div className="h-[85px] w-full mt-3 mb-3 rounded-none flex-shrink-0">
              <div className="h-full bg-black border border-white/20 flex items-center p-4">
                <div className="flex items-center gap-8">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="bg-black border border-white/10 p-3 min-w-[250px]">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="w-16 h-4 rounded" />
                          <Skeleton className="w-3 h-3 rounded" />
                        </div>
                        <Skeleton className="w-full h-8 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Loading */}
          <div className="flex-shrink-0 mt-1">
            <div className="bg-black border border-white/20 p-3">
              <div className="flex items-center justify-between">
                <Skeleton className="w-32 h-4 rounded" />
                <div className="flex items-center gap-4">
                  <Skeleton className="w-16 h-4 rounded" />
                  <Skeleton className="w-16 h-4 rounded" />
                  <Skeleton className="w-16 h-4 rounded" />
                </div>
              </div>
            </div>
          </div>

          {/* Loading Overlay with Spinner */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-black border border-white/20 rounded-lg p-8 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-2 border-white/20 rounded-full"></div>
                <div className="w-12 h-12 border-2 border-[#E0F58F] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
              <div className="text-center">
                <p className="text-white font-red-hat-mono text-sm mb-1">Loading Dashboard</p>
                <p className="text-white/60 font-red-hat-mono text-xs">Fetching real-time data...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}