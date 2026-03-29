import Image from 'next/image';

const dims = {
  sm: { width: 28, height: 28, className: 'h-7 w-7 rounded-md' },
  md: { width: 36, height: 36, className: 'h-9 w-9 rounded-lg' },
  lg: { width: 40, height: 40, className: 'h-10 w-10 rounded-lg' },
} as const;

export function DemoBrandLogo({
  size = 'md',
  className = '',
}: {
  size?: keyof typeof dims;
  className?: string;
}) {
  const d = dims[size];
  return (
    <Image
      src="/images/tracebud-logo.png"
      alt="Tracebud"
      width={d.width}
      height={d.height}
      className={`${d.className} shrink-0 object-contain ${className}`}
      priority
    />
  );
}
