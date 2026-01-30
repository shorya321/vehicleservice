'use client';

/**
 * Compact Stat Card Component
 * Minimal analytics card with sparkline
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { motion } from 'motion/react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/lib/business/animation/hooks';
import { CountUp } from '@/components/business/motion';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

function MiniSparkline({
  data,
  width = 80,
  height = 32,
  color = 'hsl(var(--primary))',
  className,
}: SparklineProps) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  // Create smooth curve points
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 6) - 3;
    return { x, y };
  });

  // Create smooth bezier curve path
  const pathD = points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;

    const prev = points[index - 1];
    const cpx1 = prev.x + (point.x - prev.x) / 3;
    const cpx2 = prev.x + ((point.x - prev.x) * 2) / 3;

    return `${path} C ${cpx1} ${prev.y}, ${cpx2} ${point.y}, ${point.x} ${point.y}`;
  }, '');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
    >
      <defs>
        <linearGradient id="sparkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path
        d={`${pathD} L ${width} ${height} L 0 ${height} Z`}
        fill="url(#sparkGradient)"
      />

      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface TrendBadgeProps {
  value: number;
  isPositive: boolean;
}

function TrendBadge({ value, isPositive }: TrendBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium',
        isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
      )}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {isPositive ? '+' : ''}
      {value}%
    </span>
  );
}

interface CompactStatCardProps {
  title: string;
  value: number | string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  sparklineData?: number[];
  sparklineColor?: string;
  className?: string;
  index?: number;
  prefix?: string;
  isAnimated?: boolean;
}

export function CompactStatCard({
  title,
  value,
  trend,
  sparklineData,
  sparklineColor = 'hsl(var(--primary))',
  className,
  index = 0,
  prefix,
  isAnimated = true,
}: CompactStatCardProps) {
  const prefersReducedMotion = useReducedMotion();

  const displayValue = typeof value === 'number' && isAnimated ? (
    <CountUp value={value} prefix={prefix} />
  ) : (
    <>
      {prefix}
      {value}
    </>
  );

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={cn(
        'p-4 rounded-xl',
        'bg-card',
        'border border-border',
        'hover:border-primary/30',
        'shadow-sm',
        'transition-all duration-150',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium truncate">
            {title}
          </p>
          <p className="text-2xl font-semibold text-foreground mt-1 tracking-tight">
            {displayValue}
          </p>
          {trend && (
            <div className="mt-1">
              <TrendBadge value={trend.value} isPositive={trend.isPositive} />
            </div>
          )}
        </div>
        {sparklineData && sparklineData.length > 1 && (
          <div className="flex-shrink-0 ml-3">
            <MiniSparkline
              data={sparklineData}
              width={80}
              height={32}
              color={sparklineColor}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
