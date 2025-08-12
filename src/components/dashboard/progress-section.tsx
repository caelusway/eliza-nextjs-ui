"use client";

import { useEffect, useState } from 'react';

// Custom hook for number animation
function useAnimatedNumber(targetValue: number, duration: number = 1800): number {
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
      const nextValue = startValue + (difference * easeOut);
      
      setCurrent(nextValue);
      
      if (progress < 1) {
        requestAnimationFrame(animateValue);
      }
    };

    requestAnimationFrame(animateValue);
  }, [targetValue, duration]);

  return current;
}

// Animated progress value component
function AnimatedProgressValue({ value }: { value: string }) {
  const numericValue = parseInt(value.replace(/,/g, ''));
  const animatedNumber = useAnimatedNumber(numericValue, 2200);
  const displayValue = Math.round(animatedNumber).toLocaleString();
  
  return (
    <span className="text-sm text-white font-red-hat-mono font-normal leading-[0.9] tabular-nums">
      {displayValue}
    </span>
  );
}

// Animated percentage component
function AnimatedPercentage({ percentage }: { percentage: string }) {
  const numericValue = parseInt(percentage.replace('%', ''));
  const animatedNumber = useAnimatedNumber(numericValue, 2000);
  const displayValue = `${Math.round(animatedNumber)}%`;
  
  return (
    <span className="text-sm text-[#D0E38A] font-red-hat-mono font-normal leading-[0.9] tabular-nums">
      {displayValue}
    </span>
  );
}

// Animated conversion rate component
function AnimatedConversion({ conversion }: { conversion: string }) {
  const numericValue = parseInt(conversion.replace(/[^\d]/g, ''));
  const animatedNumber = useAnimatedNumber(numericValue, 1800);
  const displayValue = `${Math.round(animatedNumber)}% conv.`;
  
  return (
    <span className="text-sm text-[#E0F58F] font-red-hat-mono font-normal leading-[0.9] tabular-nums">
      {displayValue}
    </span>
  );
}

// Animated cycle time component
function AnimatedCycleTime() {
  const animatedNumber = useAnimatedNumber(5, 1500);
  const displayValue = Math.round(animatedNumber);
  
  return (
    <span className="text-xs md:text-sm text-[#E0F58F] font-red-hat-mono font-normal leading-[0.9] tabular-nums">
      {displayValue}
    </span>
  );
}

export function ProgressSection() {
  const progressItems = [
    { value: '847,320', percentage: '23%', label: 'Papers Uploaded', conversion: '89% conv.' },
    { value: '3,429,851', percentage: '15%', label: 'Nodes in Knowledge Graph', conversion: '76% conv.' },
    { value: '156,832', percentage: '31%', label: 'Hypotheses Generated', conversion: '62% conv.' },
    { value: '2,147,483', percentage: '12%', label: 'IPTs minted', conversion: '45% conv.' },
    { value: '42,718', percentage: '28%', label: 'Experiments started', conversion: '83% conv.' },
  ];

  return (
    <div className="border border-white/20 bg-black p-2 md:p-3 rounded-none h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 p-1 md:p-2 mb-3 md:mb-4">
        <span className="text-xs md:text-sm text-white font-red-hat-mono font-normal leading-[0.9]">Median cycle-time:</span>
        <div className="flex items-center gap-1">
          <AnimatedCycleTime />
          <span className="text-xs md:text-sm text-white font-red-hat-mono font-normal leading-[0.9]">D</span>
        </div>
      </div>

      {/* Progress Flow */}
      <div className="space-y-2 flex-1">
        {progressItems.map((item, index) => (
          <div key={index} className="flex gap-1">
            {/* Arrow */}
            <div className="flex flex-col items-center w-3">
              <div className="w-px h-[70px] bg-white/20"></div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white/30">
                <path d="M8 12L3 4H13L8 12Z" fill="currentColor"/>
              </svg>
            </div>
            
            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="border border-white/20 bg-black p-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AnimatedProgressValue value={item.value} />
                    <div className="flex items-center gap-1">
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none" className="text-[#D0E38A]">
                        <path d="M3.5 0.5L8.5 0.5L8.5 5.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8.5 0.5L0.5 8.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <AnimatedPercentage percentage={item.percentage} />
                    </div>
                  </div>
                </div>
                <div className="text-sm text-white font-red-hat-mono font-normal leading-[0.9]">{item.label}</div>
              </div>
              
              {/* Conversion Rate */}
              <div className="flex items-center gap-1">
                <AnimatedConversion conversion={item.conversion} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 