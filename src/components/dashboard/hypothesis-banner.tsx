'use client';

import { useState } from 'react';
import { useTRPCDashboardStats } from '@/hooks/use-trpc-dashboard';
import { DotTyping } from '@/components/ui/dot-typing';
import { HypothesisOverlay } from './hypothesis-overlay';

export function HypothesisBanner() {
  const {
    researchStatsData: researchStats,
    loading: isLoading,
    isResearchDataAvailable,
  } = useTRPCDashboardStats();
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);


  // Simple hypothesis preview extraction
  const getHypothesisPreview = () => {
    if (!researchStats?.latestHypothesis) {
      return 'No recent hypothesis data';
    }

    const statement = researchStats.latestHypothesis.statement;

    return statement.length > 60 ? statement.substring(0, 60) + '...' : statement;
  };

  const formatHypothesisNumber = () => {
    if (!researchStats) return '#0';

    // Use hypothesis count as the sequence number
    return `#${researchStats.hypothesisCount.toLocaleString()}`;
  };

  return (
    <div className="relative">
      <div 
        className="border border-white/20 bg-black p-3 rounded-none cursor-pointer hover:bg-gray-900/50 transition-colors"
        onClick={() => setIsOverlayOpen(true)}
      >
        <div className="flex items-center gap-3 text-sm">
          <div className="min-w-[200px] flex justify-start">
            {isLoading ? (
              <DotTyping />
            ) : (
              <span className="text-white font-red-hat-mono font-normal leading-[0.9]">
                Last hypothesis {formatHypothesisNumber()} generated
              </span>
            )}
          </div>
          <span className="text-white font-red-hat-mono font-normal leading-[0.9]">•</span>
          <div className="min-w-[300px] flex justify-start">
            {isLoading ? (
              <DotTyping />
            ) : (
              <span className="text-white font-red-hat-mono font-normal leading-[0.9]">
                {getHypothesisPreview()}
              </span>
            )}
          </div>
          {!isResearchDataAvailable && !isLoading && (
            <>
              <span className="text-white font-red-hat-mono font-normal leading-[0.9]">•</span>
              <span className="text-orange-400 font-red-hat-mono font-normal leading-[0.9]">
                research data offline
              </span>
            </>
          )}
        </div>
      </div>

      <HypothesisOverlay 
        isOpen={isOverlayOpen} 
        onClose={() => setIsOverlayOpen(false)}
        researchStats={researchStats}
      />
    </div>
  );
}
