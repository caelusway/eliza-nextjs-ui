'use client';

interface HeroSectionProps {
  className?: string;
}

export const HeroSection = ({ className = '' }: HeroSectionProps) => {
  return (
    <div className={`flex flex-col items-center gap-8 text-center ${className}`}>
      {/* Hero Text */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
          <div className="text-zinc-900 dark:text-white">Breaking the</div>
          <div className="text-zinc-900 dark:text-white">50-Year Longevity Barrier</div>
        </h1>
      </div>

      {/* AUBRAI Logo */}
      <div className="flex items-center justify-center">
        <img
          src="/assets/aubrai.png"
          alt="AUBRAI"
          className="w-80 sm:w-96 md:w-[32rem] lg:w-[40rem] max-w-full h-auto"
        />
      </div>
    </div>
  );
}; 