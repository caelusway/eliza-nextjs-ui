"use client";

import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { Skeleton } from '@/components/ui/skeleton';

export function StatusBanner() {
  const { researchStats, loading, isResearchDataAvailable } = useDashboardStats();

  if (loading) {
    return (
      <div className="border border-white/20 bg-black p-3 rounded-none">
        <div className="flex items-center gap-3 text-sm">
          <Skeleton className="w-48 h-4 rounded" />
          <span className="text-white font-red-hat-mono font-normal leading-[0.9]">•</span>
          <Skeleton className="w-64 h-4 rounded" />
        </div>
      </div>
    );
  }

  // Simple hypothesis preview extraction
  const getHypothesisPreview = () => {
    if (!researchStats?.latestHypothesis) {
      return "No recent hypothesis data";
    }

    const statement = researchStats.latestHypothesis.statement;
    

    
    
    return statement.length > 60 ? statement.substring(0, 60) + '...' : statement;
  };

  const formatHypothesisNumber = () => {
    if (!researchStats) return "#0";
    
    // Use hypothesis count as the sequence number
    return `#${researchStats.hypothesisCount.toLocaleString()}`;
  };

  const getTimeSinceCreation = () => {
    if (!researchStats?.latestHypothesis?.created) {
      return "unknown time ago";
    }
    
    const now = new Date();
    const created = new Date(researchStats.latestHypothesis.created);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  return (
    <div className="border border-white/20 bg-black p-3 rounded-none">
      <div className="flex items-center gap-3 text-sm">
        <span className="text-white font-red-hat-mono font-normal leading-[0.9]">
          Last hypothesis {formatHypothesisNumber()} generated 
        </span>
        <span className="text-white font-red-hat-mono font-normal leading-[0.9]">•</span>
        <span className="text-white font-red-hat-mono font-normal leading-[0.9]">
          {getHypothesisPreview()}
        </span>
        {!isResearchDataAvailable && (
          <>
            <span className="text-white font-red-hat-mono font-normal leading-[0.9]">•</span>
            <span className="text-orange-400 font-red-hat-mono font-normal leading-[0.9]">
              research data offline
            </span>
          </>
        )}
      </div>
    </div>
  );
}
