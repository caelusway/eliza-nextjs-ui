'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface ContentSectionProps {
  title?: string;
  children: ReactNode;
  buttonText?: string;
  onButtonClick?: () => void;
  className?: string;
}

export const ContentSection = ({
  title,
  children,
  buttonText,
  onButtonClick,
  className = '',
}: ContentSectionProps) => {
  return (
    <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="space-y-6">
        {title && (
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-light text-zinc-900 dark:text-white">
            {title}
          </h2>
        )}
        
        <div className="text-sm sm:text-base lg:text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
          {children}
        </div>
        
        {buttonText && onButtonClick && (
          <div className="flex justify-center lg:justify-start">
            <Button
              onClick={onButtonClick}
              color="dark"
              className="px-6 py-3 text-xs uppercase tracking-wide font-medium border border-zinc-400 dark:border-zinc-600 hover:border-zinc-600 dark:hover:border-zinc-400 transition-colors"
            >
              {buttonText}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}; 