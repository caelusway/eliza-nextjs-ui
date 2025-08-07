import clsx from 'clsx';
import Image from 'next/image';

interface DynamicSvgIcon {
  iconName: string;
  className?: string;
  alt?: string;
  height?: number;
  width?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFocus?: () => void;
  onClick?: () => void;
}

const DynamicSvgIcon = ({
  iconName,
  className,
  alt,
  height = 20,
  width = 20,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onClick,
}: DynamicSvgIcon) => {
  const iconPathSrc = `assets/icon-svgs/${iconName?.toLowerCase()}.svg`;

  const iconClass = clsx('rounded-none p-1', className);

  return (
    <span
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onClick={onClick}
    >
      <Image
        style={{ minWidth: `${width}px`, minHeight: `${height}px` }}
        className={iconClass}
        src={iconPathSrc}
        alt={alt ?? `${iconName}`}
        width={height}
        height={width}
      />
    </span>
  );
};

export default DynamicSvgIcon;
