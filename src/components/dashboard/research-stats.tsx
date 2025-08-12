"use client";

import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon';
import { useTRPCDashboardStats } from '@/hooks/use-trpc-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export function ResearchStats() {
  const { researchStatsData: researchStats, loading, isResearchDataAvailable } = useTRPCDashboardStats();

  if (loading) {
    return (
      <div className="bg-black border border-white/10 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="w-24 h-5 rounded" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="w-16 h-4 rounded" />
            <Skeleton className="w-12 h-4 rounded" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="w-20 h-4 rounded" />
            <Skeleton className="w-8 h-4 rounded" />
          </div>
          <Skeleton className="w-full h-16 rounded" />
        </div>
      </div>
    );
  }

  if (!researchStats) return null;

  return (
    <div className="bg-black border border-white/10 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-4">
        <DynamicSvgIcon iconName="flask" className="w-5 h-5 text-white" />
        <h3 className="text-sm font-red-hat-mono font-medium text-white">Research Stats</h3>
        {!isResearchDataAvailable && (
          <span className="text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded">
            Offline
          </span>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/70 font-red-hat-mono">papers</span>
          <span className="text-xs text-[#E0F58F] font-red-hat-mono font-medium">
            {researchStats.paperCount.toLocaleString()}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/70 font-red-hat-mono">hypotheses</span>
          <span className="text-xs text-[#E0F58F] font-red-hat-mono font-medium">
            {researchStats.hypothesisCount}
          </span>
        </div>
        
        {researchStats.latestHypothesis && (
          <div className="mt-4 p-3 bg-white/5 rounded border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <DynamicSvgIcon iconName="lightbulb" className="w-3 h-3 text-[#E0F58F]" />
              <span className="text-xs text-white/70 font-red-hat-mono">latest hypothesis</span>
              {researchStats.latestHypothesis.metrics.hasPercentage && (
                <span className="text-xs bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded">%</span>
              )}
              {researchStats.latestHypothesis.metrics.hasPrediction && (
                <span className="text-xs bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded">pred</span>
              )}
              {researchStats.latestHypothesis.metrics.hasTimeframe && (
                <span className="text-xs bg-green-500/20 text-green-300 px-1 py-0.5 rounded">time</span>
              )}
            </div>
            
            <p className="text-xs text-white/80 font-red-hat-mono leading-relaxed">
              {researchStats.latestHypothesis.preview}
            </p>
            
            <div className="mt-2 text-xs text-white/50 font-red-hat-mono">
              {new Date(researchStats.latestHypothesis.created).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}