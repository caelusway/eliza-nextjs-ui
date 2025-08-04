import clsx from 'clsx';
import Image from 'next/image';
import { useState } from 'react';
import { seo, branding } from '@/config/ui-config';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  src?: string;
}

export function Logo({ width = 120, height = 32, className = '', src }: LogoProps) {
  const [imageError, setImageError] = useState(false);
  const logoSrc = src || seo.logoUrl;

  // Fallback to text logo if image fails to load
  if (imageError) {
    return (
      <div className={clsx(['select-none flex items-center justify-center', className])}>
        <span
          className="font-bold text-gray-900 dark:text-white"
          style={{
            fontSize: `${Math.min(width / 8, height * 0.6)}px`,
            lineHeight: `${height}px`,
          }}
        >
          {branding.appName}
        </span>
      </div>
    );
  }

  return (
    <div className={clsx(['select-none', className])}>
      <Image
        src={logoSrc}
        alt={branding.logoAlt}
        width={width}
        height={height}
        priority
        className="object-contain"
        onError={() => {
          console.warn(`Failed to load logo: ${logoSrc}`);
          setImageError(true);
        }}
      />
    </div>
  );
}
