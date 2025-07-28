import clsx from 'clsx';
import Image from 'next/image';
import { seo, branding } from '@/config/ui-config';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  src?: string;
}

export function Logo({ width = 120, height = 32, className = '', src }: LogoProps) {
  const logoSrc = src || seo.logoUrl;

  return (
    <div className={clsx(['select-none', className])}>
      <Image
        src={logoSrc}
        alt={branding.logoAlt}
        width={width}
        height={height}
        priority
        className="rounded-4xl"
      />
    </div>
  );
}
