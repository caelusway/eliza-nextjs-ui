'use client';

interface CircleIndicatorProps {
  isLoading?: boolean;
  primaryColor: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CircleIndicator({
  isLoading = false,
  primaryColor,
  size = 'sm',
}: CircleIndicatorProps) {
  const sizeClasses = {
    sm: { container: 'w-5 h-5', spinner: 'w-3 h-3', dot: 'w-1.5 h-1.5' },
    md: { container: 'w-6 h-6', spinner: 'w-4 h-4', dot: 'w-2 h-2' },
    lg: { container: 'w-8 h-8', spinner: 'w-5 h-5', dot: 'w-2.5 h-2.5' },
  };

  const sizes = sizeClasses[size];

  return (
    <div
      className={`flex items-center justify-center ${sizes.container} rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700`}
    >
      {isLoading ? (
        <div
          className={`${sizes.spinner} border-2 border-t-transparent rounded-full animate-spin`}
          style={{ borderColor: primaryColor, borderTopColor: 'transparent' }}
        />
      ) : (
        <div className={`${sizes.dot} rounded-full`} style={{ backgroundColor: primaryColor }} />
      )}
    </div>
  );
}
