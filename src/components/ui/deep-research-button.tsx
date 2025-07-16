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
      className={clsx('size-10', className)}
      color={(isActive ? 'blue' : 'dark') as 'blue' | 'dark'}
      title="Toggle deep research"
    >
      <Image
        src="/assets/telescope.png"
        alt="Deep research"
        width={25}
        height={25}
        className="!shrink-0"
      />
    </Button>
  );
}

export { DeepResearchButton };
