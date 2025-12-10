'use client';

/**
 * Analytics Chart Components
 * Mini sparkline charts and analytics visualizations
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { motion } from 'framer-motion';
import { Plane, Building2, Hotel, Train, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/lib/business/animation/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  gradientId?: string;
  className?: string;
  animated?: boolean;
}

export function Sparkline({
  data,
  width = 120,
  height = 40,
  color = 'hsl(var(--primary))',
  gradientId = 'sparklineGradient',
  className,
  animated = true,
}: SparklineProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animated && !prefersReducedMotion;

  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  // Create smooth curve points
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 8) - 4;
    return { x, y };
  });

  // Create smooth bezier curve path
  const pathD = points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;

    const prev = points[index - 1];
    const cpx1 = prev.x + (point.x - prev.x) / 3;
    const cpx2 = prev.x + (point.x - prev.x) * 2 / 3;

    return `${path} C ${cpx1} ${prev.y}, ${cpx2} ${point.y}, ${point.x} ${point.y}`;
  }, '');

  // Area path (for gradient fill)
  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  // Check if using gold color for enhanced glow
  const isGoldColor = color === '#C6AA88' || color?.includes('198, 170, 136');
  const glowIntensity = isGoldColor ? 8 : 4;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      style={{
        shapeRendering: 'geometricPrecision',
        filter: `drop-shadow(0 0 ${glowIntensity}px ${color})`,
      }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Gradient fill area */}
      <motion.path
        d={areaD}
        fill={`url(#${gradientId})`}
        initial={shouldAnimate ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />

      {/* Crisp line - sharp stroke, no SVG filter */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={shouldAnimate ? { pathLength: 0, opacity: 0 } : false}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />

      {/* End dot */}
      <motion.circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="3"
        fill={color}
        initial={shouldAnimate ? { scale: 0, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.8 }}
      />
    </svg>
  );
}

interface AnalyticsStatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
  delay?: number;
  iconBgColor?: string;
  valueColor?: string;
}

export function AnalyticsStatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  className,
  delay = 0,
  iconBgColor,
  valueColor,
}: AnalyticsStatCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Card
        className={cn(
          'relative overflow-hidden rounded-xl',
          'bg-card',
          'border border-border',
          'shadow-sm',
          'transition-all duration-300 ease-out',
          'hover:shadow-md hover:border-border/80 dark:hover:border-white/[0.12]',
          className
        )}
      >
        <CardContent className="relative p-5">
          {/* Header row: Title left, Icon right */}
          <div className="flex items-start justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              {title}
            </span>
            {/* Small circular icon in top-right */}
            {icon && (
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full",
                  iconBgColor || "bg-primary/15 text-primary"
                )}
              >
                {icon}
              </motion.div>
            )}
          </div>

          {/* Large value with optional trend */}
          <div className="flex items-baseline gap-2 mb-1">
            <span className={cn(
              "text-2xl sm:text-3xl font-bold tracking-tight",
              valueColor || "text-foreground"
            )}>
              {value}
            </span>
            {/* Trend indicator */}
            {trend && (
              <Badge
                variant="outline"
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium border-0',
                  trend.isPositive
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                    : 'text-rose-600 dark:text-rose-400 bg-rose-500/10'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </Badge>
            )}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface HorizontalBarProps {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
  index?: number;
}

export function HorizontalBar({
  label,
  value,
  maxValue,
  color = '#C6AA88',
  index = 0,
}: HorizontalBarProps) {
  const prefersReducedMotion = useReducedMotion();
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={prefersReducedMotion ? undefined : { x: 4 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group hover:bg-muted/50 rounded-lg px-2 py-1.5 -mx-2 transition-colors duration-200"
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-1.5 py-0 border-border bg-muted text-primary">
            {index + 1}
          </Badge>
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            {label}
          </span>
        </div>
        <span className="text-sm font-medium text-foreground">
          {value} <Badge variant="outline" className="text-xs ml-1 px-1.5 py-0 border-0 bg-transparent text-muted-foreground/50">({percentage.toFixed(0)}%)</Badge>
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full transition-shadow duration-300 bg-primary"
          initial={prefersReducedMotion ? { width: `${percentage}%` } : { width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.7, delay: index * 0.1, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

interface TrafficSourceCardProps {
  title: string;
  data: Array<{ label: string; value: number; color?: string }>;
  className?: string;
  delay?: number;
}

export function TrafficSourceCard({
  title,
  data,
  className,
  delay = 0,
}: TrafficSourceCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const maxValue = Math.max(...data.map(d => d.value), 1);

  // Luxury gold color palette
  const defaultColors = [
    '#C6AA88',
    '#E8D9C5',
    '#F5F5F5',
    '#AAAAAA',
  ];

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={prefersReducedMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Card className={cn(
        'relative overflow-hidden group rounded-xl',
        'bg-card',
        'border border-border',
        'shadow-sm',
        'transition-all duration-300 ease-out',
        'hover:shadow-md',
        className
      )}>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.map((item, index) => (
            <HorizontalBar
              key={item.label}
              label={item.label}
              value={item.value}
              maxValue={maxValue}
              color={item.color || defaultColors[index % defaultColors.length]}
              index={index}
            />
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// LOCATIONS CARD COMPONENT
// ============================================================================

export interface LocationData {
  id: string;
  name: string;
  type: 'airport' | 'city' | 'hotel' | 'station';
  city: string | null;
  country_code: string;
  booking_count: number;
}

interface LocationsCardProps {
  locations: LocationData[];
  className?: string;
}

const locationTypeConfig = {
  airport: { icon: Plane, color: 'text-sky-500', bg: 'bg-sky-500/10', progressBg: 'bg-sky-500', badgeClass: 'border-sky-500/20 bg-sky-500/5 text-sky-500' },
  city: { icon: Building2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', progressBg: 'bg-emerald-500', badgeClass: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500' },
  hotel: { icon: Hotel, color: 'text-amber-500', bg: 'bg-amber-500/10', progressBg: 'bg-amber-500', badgeClass: 'border-amber-500/20 bg-amber-500/5 text-amber-500' },
  station: { icon: Train, color: 'text-violet-500', bg: 'bg-violet-500/10', progressBg: 'bg-violet-500', badgeClass: 'border-violet-500/20 bg-violet-500/5 text-violet-500' },
};

// Color variants for cities to avoid repetition
const cityColorVariants = [
  { color: 'text-emerald-500', bg: 'bg-emerald-500/10', progressBg: 'bg-emerald-500', badgeClass: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500' },
  { color: 'text-rose-500', bg: 'bg-rose-500/10', progressBg: 'bg-rose-500', badgeClass: 'border-rose-500/20 bg-rose-500/5 text-rose-500' },
  { color: 'text-cyan-500', bg: 'bg-cyan-500/10', progressBg: 'bg-cyan-500', badgeClass: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-500' },
  { color: 'text-orange-500', bg: 'bg-orange-500/10', progressBg: 'bg-orange-500', badgeClass: 'border-orange-500/20 bg-orange-500/5 text-orange-500' },
];

export function LocationsCard({ locations, className }: LocationsCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const maxBookings = Math.max(...locations.map(l => l.booking_count), 1);

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={prefersReducedMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Card className={cn(
        'relative overflow-hidden group rounded-xl',
        'bg-card',
        'border border-border',
        'shadow-sm hover:shadow-md',
        'transition-all duration-300',
        className
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Locations
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {locations.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No locations available
            </div>
          ) : (
            locations.map((location, index) => (
              <LocationItem
                key={location.id}
                location={location}
                maxBookings={maxBookings}
                index={index}
              />
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface LocationItemProps {
  location: LocationData;
  maxBookings: number;
  index: number;
}

function LocationItem({ location, maxBookings, index }: LocationItemProps) {
  const prefersReducedMotion = useReducedMotion();

  // Get base config for the location type
  const baseConfig = locationTypeConfig[location.type] || locationTypeConfig.city;

  // For cities, rotate through color variants to avoid all being the same color
  let config = baseConfig;
  if (location.type === 'city') {
    const cityIndex = index % cityColorVariants.length;
    config = { ...baseConfig, ...cityColorVariants[cityIndex] };
  }

  const Icon = baseConfig.icon;
  const percentage = (location.booking_count / maxBookings) * 100;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={prefersReducedMotion ? undefined : { x: 4 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="group/item hover:bg-muted/50 rounded-lg px-2 py-2 -mx-2 transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          config.bg
        )}>
          <Icon className={cn('h-4 w-4', config.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground truncate">
              {location.name}
            </span>
            <Badge variant="outline" className={cn("shrink-0 text-xs px-2 py-0.5", config.badgeClass)}>
              {location.booking_count} {location.booking_count === 1 ? 'trip' : 'trips'}
            </Badge>
          </div>

          {/* Subtitle with city */}
          <p className="text-xs text-muted-foreground mt-0.5">
            {location.city ? `${location.city}, ` : ''}{location.country_code}
          </p>

          {/* Progress bar */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className={cn("h-full rounded-full", config.progressBg)}
              initial={prefersReducedMotion ? { width: `${percentage}%` } : { width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.6, delay: index * 0.08, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
