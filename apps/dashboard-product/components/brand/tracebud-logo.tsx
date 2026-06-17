import Image from 'next/image';
import { cn } from '@/lib/utils';

/** Canonical Tracebud mark — transparent PNG, object-fit contained. */
export const TRACEBUD_LOGO_SRC = '/images/tracebud-logo.png';

const SIZE_MAP = {
  xs: { className: 'h-8 w-8', px: 32 },
  sm: { className: 'h-10 w-10', px: 40 },
  md: { className: 'h-12 w-12', px: 48 },
  lg: { className: 'h-14 w-14', px: 56 },
  xl: { className: 'h-24 w-24', px: 96 },
} as const;

export type TracebudLogoSize = keyof typeof SIZE_MAP;

interface TracebudLogoProps {
  size?: TracebudLogoSize;
  /** White tile behind the mark — use on dark green sidebar/nav. */
  variant?: 'default' | 'contrast';
  className?: string;
  priority?: boolean;
  alt?: string;
}

export function TracebudLogo({
  size = 'sm',
  variant = 'default',
  className,
  priority = false,
  alt = 'Tracebud',
}: TracebudLogoProps) {
  const dim = SIZE_MAP[size];
  const image = (
    <Image
      src={TRACEBUD_LOGO_SRC}
      alt={alt}
      width={dim.px}
      height={dim.px}
      unoptimized
      className="h-full w-full object-contain"
      priority={priority}
    />
  );

  if (variant === 'contrast') {
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm',
          dim.className,
          className,
        )}
      >
        {image}
      </span>
    );
  }

  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center', dim.className, className)}
    >
      {image}
    </span>
  );
}
