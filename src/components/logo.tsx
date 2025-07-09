import clsx from 'clsx';
import Image from 'next/image';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  src: string;
}

export function Logo({ width = 120, height = 32, className = '', src }: LogoProps) {
  return (
    <div className={clsx(['select-none', className])}>
      <Image src={src} alt="Agent logo" width={width} height={height} priority />
    </div>
  );
}
