import Image from 'next/image';
import { Car } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VehicleThumbProps {
  src?: string | null;
  size?: 'md' | 'sm';
  className?: string;
}

const SIZES = {
  md: { box: 'h-11 w-16 sm:h-12 sm:w-[72px]', icon: 'h-5 w-5', sizes: '72px' },
  sm: { box: 'h-6 w-9', icon: 'h-3.5 w-3.5', sizes: '36px' },
} as const;

/**
 * Vehicle photo for quotation trip lists. Same treatment as the trip editor sheet's picker,
 * with a car icon in the same box when the type has no photo, so rows stay aligned.
 */
export function VehicleThumb({ src, size = 'md', className }: VehicleThumbProps) {
  const s = SIZES[size];
  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted',
        s.box,
        className
      )}
    >
      {src ? (
        <Image src={src} alt="" fill sizes={s.sizes} className="object-cover" />
      ) : (
        <Car className={cn(s.icon, 'text-muted-foreground')} aria-hidden />
      )}
    </div>
  );
}
