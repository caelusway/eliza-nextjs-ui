'use client';

interface DecorativeElementsProps {
  className?: string;
}

export const DecorativeElements = ({ className = '' }: DecorativeElementsProps) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Geometric shapes inspired by old UI */}

      {/* Small decorative box - top right */}
      <div className="absolute top-[20%] right-[15%] w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 border border-zinc-300 dark:border-zinc-700 opacity-30 lg:opacity-60" />

      {/* Large left rectangle */}
      <div className="absolute top-[10%] left-[-5%] w-32 h-24 sm:w-48 sm:h-36 lg:w-64 lg:h-48 border border-zinc-300 dark:border-zinc-700 opacity-20 lg:opacity-40" />

      {/* Large right rectangle */}
      <div className="absolute top-[15%] right-[5%] w-16 h-32 sm:w-20 sm:h-40 lg:w-24 lg:h-48 border border-zinc-300 dark:border-zinc-700 opacity-25 lg:opacity-50" />

      {/* Medium decorative box - bottom left */}
      <div className="absolute bottom-[30%] left-[10%] w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 border border-zinc-300 dark:border-zinc-700 opacity-40 lg:opacity-60" />

      {/* Square decorative box - bottom right */}
      <div className="absolute bottom-[20%] right-[20%] w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 border border-zinc-300 dark:border-zinc-700 opacity-30 lg:opacity-50" />

      {/* Rotated elements for visual interest */}
      <div className="absolute top-[40%] right-[8%] w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 border border-zinc-300 dark:border-zinc-700 opacity-40 transform rotate-45" />

      <div className="absolute bottom-[40%] left-[5%] w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 border border-zinc-300 dark:border-zinc-700 opacity-35 transform rotate-12" />

      {/* Subtle gradient overlays */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-zinc-100 dark:from-zinc-800 to-transparent opacity-20 rounded-full blur-2xl" />
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-zinc-100 dark:from-zinc-800 to-transparent opacity-20 rounded-full blur-2xl" />
    </div>
  );
};
