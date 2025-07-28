'use client';

import { useUIConfigSection } from '@/hooks/use-ui-config';

interface HeroSectionProps {
  className?: string;
}

export const HeroSection = ({ className = '' }: HeroSectionProps) => {
  const heroConfig = useUIConfigSection('hero');
  const brandingConfig = useUIConfigSection('branding');

  // Split hero title by newlines for proper display
  const titleLines = heroConfig.title.split('\n');

  return (
    <div className={`flex flex-col items-center gap-8 text-center ${className}`}>
      {/* Hero Text */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
          {titleLines.map((line, index) => (
            <div key={index} className="text-zinc-900 dark:text-white">
              {line}
            </div>
          ))}
        </h1>
        {heroConfig.subtitle && (
          <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mt-4">
            {heroConfig.subtitle}
          </p>
        )}
      </div>

      {/* App Logo */}
      <div className="flex items-center justify-center">
        <img
          src="/assets/aubrai.png"
          alt={brandingConfig.logoAlt}
          className="w-80 sm:w-96 md:w-[32rem] lg:w-[40rem] max-w-full h-auto"
        />
      </div>
    </div>
  );
}; 