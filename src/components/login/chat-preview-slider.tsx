'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  type: 'user' | 'aubrai';
  content: string;
}

interface ChatSlide {
  id: number;
  messages: ChatMessage[];
}

const chatSlides: ChatSlide[] = [
  {
    id: 1,
    messages: [
      {
        type: 'user',
        content: 'How do DNA methylation clocks relate to biological aging?'
      },
      {
        type: 'aubrai',
        content: 'DNA methylation clocks are powerful biomarkers that measure biological age by analyzing methylation patterns at specific CpG sites. The Horvath clock uses 353 CpG sites and correlates strongly with chronological age (r=0.96). More advanced clocks like GrimAge predict mortality risk and healthspan. These epigenetic changes are potentially reversible - partial reprogramming with Yamanaka factors has shown methylation age reversal in mice without dedifferentiation.'
      }
    ]
  },
  {
    id: 2,
    messages: [
      {
        type: 'user',
        content: 'What are the main goals of the RMR2 project?'
      },
      {
        type: 'aubrai',
        content: 'The Robust Mouse Rejuvenation 2 (RMR2) project aims to double the remaining lifespan of middle-aged mice through combination interventions. Key strategies include: 1) Cellular reprogramming using modified Yamanaka factors, 2) Senolytic drugs to clear damaged cells, 3) Telomerase activation for telomere maintenance, 4) NAD+ restoration, and 5) Mitochondrial rejuvenation. The goal is to achieve synergistic effects by targeting multiple hallmarks of aging simultaneously.'
      }
    ]
  },
  {
    id: 3,
    messages: [
      {
        type: 'user',
        content: 'Are dasatinib and quercetin effective senolytics?'
      },
      {
        type: 'aubrai',
        content: 'Yes, the dasatinib + quercetin (D+Q) combination is one of the most validated senolytic interventions. In mice, D+Q extends healthspan, improves physical function, and reduces senescent cell burden by 30-70% depending on tissue type. Human trials show promise: a pilot study in IPF patients improved 6-minute walk distance. The combination works synergistically - dasatinib targets senescent preadipocytes while quercetin eliminates senescent endothelial cells.'
      }
    ]
  },
  {
    id: 4,
    messages: [
      {
        type: 'user',
        content: 'Rapamycin vs metformin for longevity - which is better?'
      },
      {
        type: 'aubrai',
        content: 'Rapamycin shows stronger evidence for lifespan extension. In the ITP studies, rapamycin consistently extends median lifespan by 10-15% in mice when started late in life. It works via mTOR inhibition, enhancing autophagy and stress resistance. Metformin\'s effects are more modest - the TAME trial is still ongoing. However, metformin has a superior safety profile for long-term human use. For optimal results, consider lower-dose rapamycin (5mg weekly) with breaks, as continuous high doses can cause immunosuppression.'
      }
    ]
  }
];

export default function ChatPreviewSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentSlide((prev) => (prev + 1) % chatSlides.length);
          setIsTransitioning(false);
        }, 300);
      }, 6000); // Change slide every 6 seconds

      return () => clearInterval(interval);
    }
  }, [isPaused]);

  const goToSlide = (index: number) => {
    if (index !== currentSlide && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide(index);
        setIsTransitioning(false);
      }, 300);
    }
  };

  return (
    <div 
      className="w-full h-full flex flex-col bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="/assets/aubrai-login-image.png"
          alt="AUBRAI Background"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-100 dark:opacity-100 scale-85"
        />
        {/* Light overlay for better text contrast */}
        <div className="absolute inset-0  z-10"></div>
      </div>

      {/* Header */}
      <div className="relative z-30 flex-shrink-0 px-3 sm:px-4 md:px-6 lg:px-8 pt-3 sm:pt-4 md:pt-6 lg:pt-8 pb-2 sm:pb-2 md:pb-3 lg:pb-4">
        <div className="max-w-full lg:max-w-2xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 md:mb-4 lg:mb-6">
            <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 bg-gradient-to-br from-[#FF6E71] to-[#E55A5D] rounded-full flex items-center justify-center shadow-md">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 lg:w-4 lg:h-4 bg-white rounded-full opacity-90"></div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-zinc-900 dark:text-white truncate drop-shadow-sm">
                Chat with AUBRAI
              </h3>
              <p className="text-xs sm:text-xs md:text-sm lg:text-base text-zinc-600 dark:text-zinc-300 truncate drop-shadow-sm opacity-90">
                See how AUBRAI helps with longevity research
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Slider Container */}
      <div className="relative z-30 flex-1 relative overflow-hidden min-h-0 mt-5">
        <div 
          className={cn(
            "flex h-full transition-all duration-700 ease-out",
            isTransitioning && "opacity-90 scale-[0.98]"
          )}
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {chatSlides.map((slide, slideIndex) => (
            <div key={slide.id} className="w-full h-full flex-shrink-0 px-3 sm:px-4 md:px-6 lg:px-8">
              <div className="w-full max-w-full lg:max-w-2xl mx-auto h-full flex flex-col justify-center">
                <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6 py-2 sm:py-3 md:py-4 overflow-y-auto">
                  {slide.messages.map((message, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-start gap-2 sm:gap-2 md:gap-3 transition-all duration-500",
                        message.type === 'user' ? "justify-end" : "justify-start",
                        slideIndex === currentSlide ? "animate-in fade-in-0 slide-in-from-bottom-2" : "opacity-0"
                      )}
                      style={{
                        animationDelay: slideIndex === currentSlide ? `${idx * 300}ms` : '0ms'
                      }}
                    >
                      {message.type === 'aubrai' && (
                        <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 bg-gradient-to-br from-[#FF6E71] to-[#E55A5D] rounded-full flex items-center justify-center shadow-sm mt-0.5 sm:mt-1">
                          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 lg:w-3 lg:h-3 bg-white rounded-full opacity-90"></div>
                        </div>
                      )}
                      
                      <div
                        className={cn(
                          "max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[75%] rounded-lg sm:rounded-xl md:rounded-2xl px-2.5 sm:px-3 md:px-4 lg:px-5 py-2 sm:py-2.5 md:py-3 lg:py-4 shadow-sm backdrop-blur-sm border border-opacity-50",
                          message.type === 'user'
                            ? "bg-gradient-to-br from-[#FF6E71]/90 to-[#E55A5D]/90 text-white shadow-[#FF6E71]/20 border-[#FF6E71]/30"
                            : "bg-white/75 dark:bg-zinc-800/75 text-zinc-900 dark:text-zinc-100 shadow-zinc-900/5 dark:shadow-zinc-100/5 border-zinc-200/40 dark:border-zinc-700/40"
                        )}
                      >
                        <p className="text-xs sm:text-xs md:text-sm lg:text-sm leading-relaxed font-medium opacity-95">
                          {message.content}
                        </p>
                      </div>

                      {message.type === 'user' && (
                        <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 bg-gradient-to-br from-zinc-400 to-zinc-500 rounded-full flex items-center justify-center shadow-sm mt-0.5 sm:mt-1">
                          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 lg:w-3 lg:h-3 bg-white rounded-full opacity-90"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Navigation Dots */}
      <div className="relative z-30 flex-shrink-0 pb-3 sm:pb-4 md:pb-6 lg:pb-8 pt-1 sm:pt-2 md:pt-3 lg:pt-4 flex justify-center items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm rounded-full px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 shadow-sm border border-zinc-200/30 dark:border-zinc-700/30">
          {chatSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "transition-all duration-300 rounded-full",
                index === currentSlide
                  ? "w-4 sm:w-6 md:w-8 h-2 sm:h-2.5 md:h-3 bg-gradient-to-r from-[#FF6E71] to-[#E55A5D] shadow-sm"
                  : "w-2 sm:w-2.5 md:w-3 h-2 sm:h-2.5 md:h-3 bg-zinc-300/80 dark:bg-zinc-600/80 hover:bg-zinc-400/80 dark:hover:bg-zinc-500/80 hover:scale-110"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Subtle corner decorations - softened */}
      <div className="absolute top-0 left-0 w-16 sm:w-24 md:w-32 h-16 sm:h-24 md:h-32 bg-gradient-to-br from-[#FF6E71]/5 to-transparent rounded-full blur-2xl z-20"></div>
      <div className="absolute bottom-0 right-0 w-20 sm:w-32 md:w-40 h-20 sm:h-32 md:h-40 bg-gradient-to-tl from-[#FF6E71]/5 to-transparent rounded-full blur-2xl z-20"></div>
    </div>
  );
} 