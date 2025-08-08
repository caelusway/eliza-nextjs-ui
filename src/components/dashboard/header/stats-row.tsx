"use client";

import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon';
import { useTRPCDashboardStats } from '@/hooks/use-trpc-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsRowProps {
  includeResearchStats?: boolean;
}

export function StatsRow({ includeResearchStats = false }: StatsRowProps) {
  const { tokenStatsData: tokenStats, researchStatsData: researchStats, loading, isTokenDataAvailable, isResearchDataAvailable } = useTRPCDashboardStats();

  // Base token stats
  const tokenDisplayStats = tokenStats ? [
    { icon: "volume", label: "vol", value: tokenStats.volume24h || "$0" },
    { icon: "chart", label: "price", value: tokenStats.price ? `$${parseFloat(tokenStats.price).toFixed(4)}` : "$0" },
    { icon: "bank", label: "mcap", value: tokenStats.marketCap || "$0" },
    { icon: "pie-chart", label: "supply", value: tokenStats.totalSupply || "0" },
  ] : [
    { icon: "volume", label: "vol", value: "$0" },
    { icon: "chart", label: "price", value: "$0" },
    { icon: "bank", label: "mcap", value: "$0" },
    { icon: "pie-chart", label: "supply", value: "0" },
  ];

  // Research stats (optional)
  const researchDisplayStats = includeResearchStats && researchStats ? [
    { icon: "flask", label: "papers", value: researchStats.paperCount.toLocaleString() },
    { icon: "lightbulb", label: "hypotheses", value: researchStats.hypothesisCount.toString() },
  ] : [];

  const displayStats = [...tokenDisplayStats, ...researchDisplayStats];

  if (loading) {
    const skeletonCount = includeResearchStats ? 6 : 4;
    return (
      <div className="flex items-center gap-16 p-2">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="w-8 h-4 rounded" />
            <Skeleton className="w-12 h-4 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-16 p-2">
      {displayStats.map((stat, index) => (
        <div key={index} className="flex items-center gap-3">
          <DynamicSvgIcon iconName={stat.icon} className="w-4 h-4 text-white" />
          <span className="text-sm text-white font-red-hat-mono font-normal leading-[0.9]">{stat.label}</span>
          <span className="text-sm text-[#E0F58F] font-red-hat-mono font-normal leading-[0.9]">{stat.value}</span>
        </div>
      ))}
    </div>
  );
}