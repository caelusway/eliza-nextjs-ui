"use client";

import { useEffect, useState } from 'react';
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsRowProps {
  includeResearchStats?: boolean;
}

// Custom hook for number animation
function useAnimatedNumber(targetValue: number, duration: number = 1000): number {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (targetValue === 0) {
      setCurrent(0);
      return;
    }

    const startTime = Date.now();
    const startValue = current;
    const difference = targetValue - startValue;

    const animateValue = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const nextValue = Math.floor(startValue + (difference * easeOut));
      
      setCurrent(nextValue);
      
      if (progress < 1) {
        requestAnimationFrame(animateValue);
      }
    };

    requestAnimationFrame(animateValue);
  }, [targetValue, duration]);

  return current;
}

// Helper to extract number from value string
function extractNumber(value: string): number {
  if (!value) return 0;
  
  // Handle different formats
  const numStr = value.replace(/[^\d.]/g, '');
  const num = parseFloat(numStr);
  
  // Handle thousands, millions, billions
  if (value.includes('K') || value.includes('k')) return num * 1000;
  if (value.includes('M') || value.includes('m')) return num * 1000000;
  if (value.includes('B') || value.includes('b')) return num * 1000000000;
  
  return num || 0;
}

// Helper to format animated number back to display format
function formatAnimatedValue(originalValue: string, animatedNumber: number): string {
  if (!originalValue || originalValue === '$0' || originalValue === '0') return originalValue;
  
  const hasPrefix = originalValue.startsWith('$');
  const prefix = hasPrefix ? '$' : '';
  
  // For large numbers, use appropriate suffixes
  if (animatedNumber >= 1000000000) {
    return `${prefix}${(animatedNumber / 1000000000).toFixed(1)}B`;
  }
  if (animatedNumber >= 1000000) {
    return `${prefix}${(animatedNumber / 1000000).toFixed(1)}M`;
  }
  if (animatedNumber >= 1000) {
    return `${prefix}${(animatedNumber / 1000).toFixed(1)}K`;
  }
  
  // For small numbers (like prices), preserve decimal places
  if (hasPrefix && animatedNumber < 1000) {
    return `${prefix}${animatedNumber.toFixed(4)}`;
  }
  
  return `${prefix}${animatedNumber.toLocaleString()}`;
}

// Animated stat value component
function AnimatedStatValue({ value }: { value: string }) {
  const targetNumber = extractNumber(value);
  const animatedNumber = useAnimatedNumber(targetNumber, 1500);
  const displayValue = formatAnimatedValue(value, animatedNumber);
  
  return (
    <span className="text-sm text-[#E0F58F] font-red-hat-mono font-normal leading-[0.9] tabular-nums">
      {displayValue}
    </span>
  );
}

export function StatsRow({ includeResearchStats = false }: StatsRowProps) {
  const { tokenStats, researchStats, loading } = useDashboardStats();

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
          <AnimatedStatValue value={stat.value} />
        </div>
      ))}
    </div>
  );
}