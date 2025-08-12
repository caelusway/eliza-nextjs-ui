'use client';
import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui';
import clsx from 'clsx';

interface DeepResearchButtonProps {
  isActive: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
}

export default function DeepResearchButton({
  isActive,
  onToggle,
  disabled = false,
  className,
}: DeepResearchButtonProps) {
  return (
    <Button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={isActive ? 'Disable deep research' : 'Enable deep research'}
      className={clsx(
        'size-10 rounded-lg border focus:outline-none transition-colors duration-200 relative',
        'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-300',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      title="Toggle deep research"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={clsx('w-5 h-5', '!shrink-0', 'text-zinc-400')}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 15.75 21 21m-5.25-5.25a7.5 7.5 0 1 1-10.6-10.6 7.5 7.5 0 0 1 10.6 10.6Z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6-3h6m-6 6h3" />
      </svg>

      {/* Red circle indicator when enabled */}
      {isActive && !disabled && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
      )}
    </Button>
  );
}

export { DeepResearchButton };
