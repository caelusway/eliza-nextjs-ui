'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useUIConfigSection } from '@/hooks/use-ui-config';

interface ChatMessage {
  type: 'user' | 'aubrai';
  content: string;
}

interface ChatSlide {
  id: number;
  messages: ChatMessage[];
}

export default function ChatPreviewSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const chatConfig = useUIConfigSection('chat');
  const brandingConfig = useUIConfigSection('branding');
  const sliderConfig = useUIConfigSection('loginSlider');

  // Convert config slides to component format
  const chatSlides: ChatSlide[] = chatConfig.previewSlides.map((slide, index) => ({
    id: index + 1,
    messages: [
      {
        type: 'user' as const,
        content: slide.userMessage,
      },
      {
        type: 'aubrai' as const,
        content: slide.aiResponse,
      },
    ],
  }));

  // Generate darker shade for gradient effects
  const getDarkerShade = (color: string) => {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - 20);
    const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - 20);
    const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - 20);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!isPaused && sliderConfig.autoPlay && sliderConfig.showChatContent) {
      const interval = setInterval(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentSlide((prev) => (prev + 1) % chatSlides.length);
          setIsTransitioning(false);
        }, 300);
      }, sliderConfig.interval);

      return () => clearInterval(interval);
    }
  }, [
    isPaused,
    sliderConfig.autoPlay,
    sliderConfig.showChatContent,
    sliderConfig.interval,
    chatSlides.length,
  ]);

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
      className="w-full h-full flex flex-col relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={sliderConfig.backgroundImage}
          alt={sliderConfig.backgroundAlt}
          className="absolute inset-0 w-full h-full object-cover object-center opacity-100 dark:opacity-100 scale-75"
        />
        {/* Light overlay for better text contrast */}
        <div className="absolute inset-0  z-10"></div>
      </div>

      {/* Header - Only show if chat content is enabled */}
      {sliderConfig.showChatContent && (
        <div className="relative z-30 flex-shrink-0 px-6 mt-6 sm:px-4 md:px-6 lg:px-8 pt-4 sm:pt-4 md:pt-6 lg:pt-8 pb-2 sm:pb-2 md:pb-3 lg:pb-4">
          <div className="max-w-full lg:max-w-2xl mx-auto">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 md:mb-4 lg:mb-6">
              <div
                className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${brandingConfig.primaryColor}, ${getDarkerShade(brandingConfig.primaryColor)})`,
                }}
              >
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 lg:w-4 lg:h-4 bg-white rounded-full opacity-90"></div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-zinc-900 dark:text-white truncate drop-shadow-sm">
                  {chatConfig.previewTitle}
                </h3>
                <p className="text-xs sm:text-xs md:text-sm lg:text-base text-zinc-600 dark:text-zinc-300 truncate drop-shadow-sm opacity-90">
                  {chatConfig.previewSubtitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slider Container - Only show if chat content is enabled */}
      {sliderConfig.showChatContent && (
        <div className="relative z-30 flex-1 relative overflow-hidden min-h-0 mt-8">
          <div
            className={cn(
              'flex h-full transition-all ease-out',
              isTransitioning && 'opacity-90 scale-[0.98]'
            )}
            style={{
              transform: `translateX(-${currentSlide * 100}%)`,
              transitionDuration: `${sliderConfig.transitionDuration}ms`,
            }}
          >
            {chatSlides.map((slide, slideIndex) => (
              <div
                key={slide.id}
                className="w-full h-full flex-shrink-0 px-3 sm:px-4 md:px-4 lg:px-6"
              >
                <div className="w-full max-w-full lg:max-w-xl mx-auto h-full flex flex-col justify-center">
                  <div className="space-y-2 sm:space-y-2 md:space-y-3 lg:space-y-4 py-2 sm:py-2 md:py-3 overflow-y-auto">
                    {slide.messages.map((message, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'flex items-start gap-2 sm:gap-2 md:gap-2 transition-all duration-500',
                          message.type === 'user' ? 'justify-end' : 'justify-start',
                          slideIndex === currentSlide
                            ? 'animate-in fade-in-0 slide-in-from-bottom-2'
                            : 'opacity-0'
                        )}
                        style={{
                          animationDelay: slideIndex === currentSlide ? `${idx * 300}ms` : '0ms',
                        }}
                      >
                        {message.type === 'aubrai' && (
                          <div
                            className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-6 lg:h-6 rounded-full flex items-center justify-center shadow-sm mt-0.5 sm:mt-1"
                            style={{
                              background: `linear-gradient(135deg, ${brandingConfig.primaryColor}, ${getDarkerShade(brandingConfig.primaryColor)})`,
                            }}
                          >
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 lg:w-2.5 lg:h-2.5 bg-white rounded-full opacity-90"></div>
                          </div>
                        )}

                        <div
                          className={cn(
                            'max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[75%] rounded-lg sm:rounded-lg md:rounded-xl px-2 sm:px-2.5 md:px-3 lg:px-4 py-2 sm:py-2 md:py-2.5 lg:py-3 shadow-sm backdrop-blur-sm border border-opacity-50',
                            message.type === 'user'
                              ? 'text-white'
                              : 'bg-white/75 dark:bg-zinc-800/75 text-zinc-900 dark:text-zinc-100 shadow-zinc-900/5 dark:shadow-zinc-100/5 border-zinc-200/40 dark:border-zinc-700/40'
                          )}
                          style={
                            message.type === 'user'
                              ? {
                                  background: `linear-gradient(135deg, ${brandingConfig.primaryColor}E6, ${getDarkerShade(brandingConfig.primaryColor)}E6)`,
                                  boxShadow: `0 1px 3px ${brandingConfig.primaryColor}33`,
                                  borderColor: `${brandingConfig.primaryColor}4D`,
                                }
                              : {}
                          }
                        >
                          <p className="text-xs sm:text-xs md:text-xs lg:text-sm leading-relaxed font-medium opacity-95">
                            {message.content}
                          </p>
                        </div>

                        {message.type === 'user' && (
                          <div className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-6 lg:h-6 bg-gradient-to-br from-zinc-400 to-zinc-500 rounded-full flex items-center justify-center shadow-sm mt-0.5 sm:mt-1">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 lg:w-2.5 lg:h-2.5 bg-white rounded-full opacity-90"></div>
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
      )}

      {/* Enhanced Navigation Dots - Only show if chat content is enabled */}
      {sliderConfig.showChatContent && (
        <div className="relative z-30 flex-shrink-0 pb-3 sm:pb-4 md:pb-4 lg:pb-6 pt-1 sm:pt-2 md:pt-2 lg:pt-3 flex justify-center items-center gap-2 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-1.5 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm rounded-full px-2 sm:px-3 md:px-3 py-1 sm:py-1.5 md:py-1.5 shadow-sm border border-zinc-200/30 dark:border-zinc-700/30">
            {chatSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  'transition-all duration-300 rounded-full',
                  index === currentSlide
                    ? 'w-3 sm:w-4 md:w-6 h-1.5 sm:h-2 md:h-2.5 shadow-sm'
                    : 'w-1.5 sm:w-2 md:w-2.5 h-1.5 sm:h-2 md:h-2.5 bg-zinc-300/80 dark:bg-zinc-600/80 hover:bg-zinc-400/80 dark:hover:bg-zinc-500/80 hover:scale-110'
                )}
                style={
                  index === currentSlide
                    ? {
                        background: `linear-gradient(90deg, ${brandingConfig.primaryColor}, ${getDarkerShade(brandingConfig.primaryColor)})`,
                      }
                    : {}
                }
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Subtle corner decorations - softened */}
      <div
        className="absolute top-0 left-0 w-12 sm:w-16 md:w-24 h-12 sm:h-16 md:h-24 rounded-full blur-2xl z-20"
        style={{
          background: `linear-gradient(135deg, ${brandingConfig.primaryColor}0D, transparent)`,
        }}
      ></div>
      <div
        className="absolute bottom-0 right-0 w-16 sm:w-20 md:w-32 h-16 sm:h-20 md:h-32 rounded-full blur-2xl z-20"
        style={{
          background: `linear-gradient(315deg, ${brandingConfig.primaryColor}0D, transparent)`,
        }}
      ></div>
    </div>
  );
}
