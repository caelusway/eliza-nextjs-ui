"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';

// Custom hook for number animation
function useAnimatedNumber(targetValue: number, duration: number = 1500): number {
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

// Helper to extract number from value string
function extractNumber(value: string): number {
  if (!value) return 0;
  
  const numStr = value.replace(/[^\d.-]/g, '');
  const num = parseFloat(numStr);
  
  if (value.includes('K') || value.includes('k')) return num * 1000;
  if (value.includes('M') || value.includes('m')) return num * 1000000;
  if (value.includes('B') || value.includes('b')) return num * 1000000000;
  
  return num || 0;
}

// Helper to format animated number back to display format
function formatAnimatedValue(originalValue: string, animatedNumber: number): string {
  if (!originalValue || originalValue === '0') return originalValue;
  
  // For large numbers, use appropriate suffixes
  if (animatedNumber >= 1000000000) {
    return `${(animatedNumber / 1000000000).toFixed(1)}B`;
  }
  if (animatedNumber >= 1000000) {
    return `${(animatedNumber / 1000000).toFixed(1)}M`;
  }
  if (animatedNumber >= 1000) {
    return `${(animatedNumber / 1000).toFixed(1)}K`;
  }
  
  return animatedNumber.toLocaleString();
}

// Animated metric value component
function AnimatedMetricValue({ value }: { value: string }) {
  const targetNumber = extractNumber(value);
  const animatedNumber = useAnimatedNumber(targetNumber, 2000);
  const displayValue = formatAnimatedValue(value, animatedNumber);
  
  return (
    <span className="text-sm text-[#E9FF98] font-red-hat-mono font-normal leading-[0.9] text-right tabular-nums">
      {displayValue}
    </span>
  );
}

export function InferenceSection() {
  const { researchStats, loading } = useDashboardStats();
  const aiModels = [
    { name: 'LARGE_', model: 'anthropic/claude-opus-4', time: '20.5 s' },
    { name: 'SMALL_', model: 'openai/gpt-oss-120b', time: '10.2 s' },
  ];

  const knowledgeBars = [
    { label: 'Agent knowledge', filledBlocks: 4, totalBlocks: 7 },
    { label: 'Knowledge graph db', filledBlocks: 5, totalBlocks: 7 },
  ];

  const inferenceMetrics = [
    { label: 'AI models used', value: loading ? '0' : '47' },
    { label: 'Aubrai is inferencing', value: loading ? '0' : '12.4K' },
    { label: 'Tokens per second', value: loading ? '0' : '8.2K' },
  ];

  const allMetrics = [
    { label: 'IPTs minted', value: loading ? '0' : '2.1M', isHighlight: true },
    { 
      label: 'Papers ingested', 
      value: loading ? '0' : (researchStats?.paperCount ? researchStats.paperCount.toLocaleString() : '847.3K'), 
      isHighlight: true 
    },
    { 
      label: 'Hypotheses generated', 
      value: loading ? '0' : (researchStats?.hypothesisCount ? researchStats.hypothesisCount.toLocaleString() : '156.8K'), 
      isHighlight: true 
    },
    { 
      label: 'Knowledge nodes', 
      value: loading ? '0' : (researchStats?.nodeCount ? researchStats.nodeCount.toLocaleString() : '3.4M'), 
      isHighlight: true 
    },
    { label: 'Experiments designed', value: loading ? '0' : '42.7K', isHighlight: true },
    { label: 'Experiments executed', value: loading ? '0' : '38.1K', isHighlight: true },
    { label: 'Targets identified', value: loading ? '0' : '1.2K', isHighlight: true },
    { label: 'Failure records', value: loading ? '0' : '127', isHighlight: true },
    { label: 'Aubrai mentions on X', value: loading ? '0' : '18.5K', isHighlight: true },
  ];

  return (
    <div className="h-full flex flex-col gap-1">
      {/* Top Section - Inference with AI Models and Metrics */}
      <div className="border border-white/20 bg-black p-3 md:p-6 rounded-none flex-1 relative">
        {/* Corner decoration - hidden on mobile */}
        <div className="absolute top-3 right-3 w-16 h-16 md:top-6 md:right-6 md:w-24 md:h-24 hidden sm:block">
          <Image
            src="/assets/Union.png"
            alt="Corner decoration"
            width={100}
            height={100}
          />
        </div>

        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-3xl md:text-5xl text-[#E9FF98] font-red-hat-mono font-normal leading-[1.1] uppercase">
            Inference
          </h2>
          <div className="relative w-full opacity-10 hidden md:block">
            <Image
              src="/assets/logo_text.png"
              alt="Aubrai"
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* AI Models */}
        <div className="space-y-3 mb-6">
          {aiModels.map((model, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#E9FF98]">
                  <path d="M8 1.5C4.5 1.5 1.5 4.5 1.5 8C1.5 11.5 4.5 14.5 8 14.5C11.5 14.5 14.5 11.5 14.5 8C14.5 4.5 11.5 1.5 8 1.5Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 4.5V8L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-sm text-[#E9FF98] font-red-hat-mono font-normal leading-[0.9]">
                  {model.name}
                </span>
                <span className="text-sm text-white font-red-hat-mono font-normal leading-[0.9]">
                  MODEL: {model.model}
                </span>
              </div>
              <span className="text-sm text-[#E9FF98] font-red-hat-mono font-normal leading-[0.9]">
                {model.time}
              </span>
            </div>
          ))}
        </div>

        {/* Knowledge Progress Bars */}
        <div className="space-y-6 mb-8">
          {knowledgeBars.map((bar, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-white font-red-hat-mono font-normal leading-[0.9]">
                {bar.label}
              </span>
              <div className="flex items-center gap-1">
                {Array.from({ length: bar.totalBlocks }, (_, blockIndex) => (
                  <div
                    key={blockIndex}
                    className={`w-3 h-3 ${
                      blockIndex < bar.filledBlocks
                        ? blockIndex < 2
                          ? 'bg-[#8B9F6A]' // Left 2 blocks - darker green
                          : blockIndex === 2
                          ? 'bg-[#D0E38A]' // Middle block - specified color
                          : blockIndex < 5
                          ? 'bg-[#C5D67A]' // Next 2 blocks - medium green
                          : 'bg-[#B8CC66]' // Right blocks - lighter green
                        : 'bg-transparent border border-[#323A17]' // Unfilled blocks - dark green border
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Inference Metrics */}
        <div className="space-y-3">
          {inferenceMetrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-white font-red-hat-mono font-normal leading-[0.9]">
                {metric.label}
              </span>
              <AnimatedMetricValue value={metric.value} />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section - All Metrics in separate bordered section */}
      <div className="border border-white/20 bg-black p-3 md:p-6 rounded-none flex-1">
        <div className="space-y-3">
          {allMetrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-white font-red-hat-mono font-normal leading-[0.9]">
                {metric.label}
              </span>
              <AnimatedMetricValue value={metric.value} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 