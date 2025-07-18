'use client';

import { ReactNode } from 'react';

interface LoadingScreenProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

export const LoadingScreen = ({ 
  message = 'Loading...', 
  size = 'md',
  fullScreen = true,
  className = '' 
}: LoadingScreenProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base'
  };

  const containerClasses = fullScreen 
    ? 'h-screen w-full flex items-center justify-center bg-white dark:bg-black'
    : 'flex items-center justify-center p-8';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center">
        <div className={`inline-block animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-[#FF6E71] mb-4`}></div>
        <p className={`text-zinc-600 dark:text-zinc-400 ${textSizeClasses[size]}`}>
          {message}
        </p>
      </div>
    </div>
  );
};

// Mini loading spinner for inline use
export const LoadingSpinner = ({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`inline-block animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-[#FF6E71]`}></div>
  );
};

// Loading overlay for content
export const LoadingOverlay = ({ children, isLoading, message = 'Loading...' }: {
  children: ReactNode;
  isLoading: boolean;
  message?: string;
}) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6E71] mb-2"></div>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}; 