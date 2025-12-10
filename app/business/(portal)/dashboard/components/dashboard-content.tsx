'use client';

/**
 * Dashboard Content Component
 * Business analytics dashboard
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  Plus,
  Clock,
  ArrowRight,
  TrendingUp,
  Wallet,
  BarChart3,
  Sparkles,
  Settings,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/business/wallet-operations';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { CurrencyCountUp } from '@/components/business/motion';
import { useReducedMotion } from '@/lib/business/animation/hooks';
import {
  AnalyticsStatCard,
  LocationsCard,
  Sparkline,
  type LocationData,
} from './analytics-chart';
import { RecentActivity } from './recent-activity';

interface RecentBooking {
  id: string;
  booking_number: string;
  customer_name: string;
  pickup_datetime: string;
  booking_status: string;
  total_price: number;
}

interface DashboardContentProps {
  businessName: string;
  walletBalance: number;
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  monthlyBookings: number;
  recentBookings: RecentBooking[];
  locations: LocationData[];
}

// Quick Action configuration with unique colors per action
const quickActionConfig = [
  {
    key: 'createBooking',
    href: '/business/bookings/new',
    icon: Plus,
    label: 'Create Booking',
    description: 'Start a new booking',
    color: 'text-primary',
    bg: 'bg-primary/10',
    hoverBg: 'hover:bg-primary/15',
    borderHover: 'hover:border-primary/40',
  },
  {
    key: 'manageWallet',
    href: '/business/wallet',
    icon: Wallet,
    label: 'Manage Wallet',
    description: 'View balance & add funds',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    hoverBg: 'hover:bg-emerald-500/15',
    borderHover: 'hover:border-emerald-500/40',
  },
  {
    key: 'viewBookings',
    href: '/business/bookings',
    icon: CalendarCheck,
    label: 'View Bookings',
    description: 'All your bookings',
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
    hoverBg: 'hover:bg-sky-500/15',
    borderHover: 'hover:border-sky-500/40',
  },
  {
    key: 'settings',
    href: '/business/settings',
    icon: Settings,
    label: 'Settings',
    description: 'Account preferences',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    hoverBg: 'hover:bg-violet-500/15',
    borderHover: 'hover:border-violet-500/40',
  },
];

// Generate sample chart data based on real values
function generateChartData(baseValue: number, points: number = 7): number[] {
  const data: number[] = [];
  let current = baseValue * 0.6;

  for (let i = 0; i < points; i++) {
    const variation = (Math.random() - 0.3) * (baseValue * 0.2);
    current = Math.max(0, current + variation);
    data.push(Math.round(current));
  }

  // Ensure last value trends toward current
  data[data.length - 1] = baseValue;
  return data;
}

export function DashboardContent({
  businessName,
  walletBalance,
  totalBookings,
  pendingBookings,
  completedBookings,
  monthlyBookings,
  recentBookings,
  locations,
}: DashboardContentProps) {
  const prefersReducedMotion = useReducedMotion();

  // Get current time of day for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Chart data for wallet sparkline
  const revenueChartData = generateChartData(walletBalance / 100 || 50);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
    },
  };

  return (
    <div className="pb-12 space-y-6">
      {/* Header Section */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <motion.h1
            initial={prefersReducedMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight"
          >
            {getGreeting()}, <span className="text-primary">{businessName}</span>
          </motion.h1>
          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground mt-1"
          >
            Here&apos;s what&apos;s happening with your business today
          </motion.p>
        </div>

        {/* Actions */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex items-center gap-3"
        >
          {/* Settings Button */}
          <Button
            asChild
            variant="outline"
            className="hidden sm:flex items-center gap-2 border-border bg-card/80 backdrop-blur-sm hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
          >
            <Link href="/business/settings">
              <Settings className="h-4 w-4 text-primary" />
              <span className="text-foreground/80">Settings</span>
            </Link>
          </Button>

          <Button asChild className="gap-2 border-none rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
            <Link href="/business/bookings/new">
              <Plus className="h-4 w-4" />
              New Booking
            </Link>
          </Button>
        </motion.div>
      </motion.div>

      {/* Main Analytics Grid */}
      <motion.div
        variants={prefersReducedMotion ? undefined : containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-5 lg:gap-6 lg:grid-cols-12"
      >
        {/* Left Column - Main Stats */}
        <div className="lg:col-span-8 space-y-5">
          {/* Hero Stat Cards - Single Row */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {/* Wallet Balance - Hero Card */}
            <motion.div
              variants={prefersReducedMotion ? undefined : itemVariants}
              className="col-span-2 lg:col-span-4"
              whileHover={prefersReducedMotion ? undefined : { y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <Card className={cn(
                "relative overflow-hidden group rounded-2xl",
                "bg-card",
                "border border-border",
                "shadow-md",
                "transition-all duration-300 ease-out",
                "hover:shadow-lg"
              )}>
                <CardContent className="p-6 sm:p-8 relative z-10">
                  <div className="flex items-start justify-between">
                    <div>
                      {/* Icon with colored background */}
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        className="flex h-14 w-14 items-center justify-center rounded-xl mb-5 bg-primary/10"
                      >
                        <Wallet className="h-7 w-7 text-primary" />
                      </motion.div>

                      {/* Large value - dramatic typography */}
                      <div className="flex items-baseline gap-4 mb-3">
                        <span className="text-5xl sm:text-6xl font-bold tracking-tight text-primary">
                          <CurrencyCountUp value={walletBalance} />
                        </span>
                      </div>

                      {/* Title below value */}
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Wallet Balance
                      </span>

                      <p className="text-sm text-muted-foreground mt-1">
                        Available for bookings
                      </p>
                    </div>

                    <div className="hidden sm:block">
                      <Sparkline
                        data={revenueChartData}
                        width={160}
                        height={70}
                        color="hsl(var(--primary))"
                        gradientId="wallet-gradient"
                      />
                    </div>
                  </div>

                  <Separator className="my-5 bg-border" />
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 hover:border-primary/50 transition-all duration-300"
                  >
                    <Link href="/business/wallet">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Add Credits
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Monthly Bookings */}
            <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
              <AnalyticsStatCard
                title="Monthly Bookings"
                value={monthlyBookings}
                subtitle="This month"
                icon={<BarChart3 className="h-4 w-4" />}
                trend={monthlyBookings > 0 ? { value: 12, isPositive: true } : undefined}
                iconBgColor="bg-amber-500/20 text-amber-600 dark:text-amber-400"
                valueColor="text-amber-600 dark:text-amber-400"
              />
            </motion.div>

            {/* Completed */}
            <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
              <AnalyticsStatCard
                title="Completed"
                value={completedBookings}
                subtitle="Successfully delivered"
                icon={<CalendarCheck className="h-4 w-4" />}
                iconBgColor="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                valueColor="text-emerald-600 dark:text-emerald-400"
              />
            </motion.div>

            {/* Pending */}
            <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
              <AnalyticsStatCard
                title="Pending"
                value={pendingBookings}
                subtitle="Awaiting action"
                icon={<Clock className="h-4 w-4" />}
                iconBgColor="bg-sky-500/20 text-sky-600 dark:text-sky-400"
                valueColor="text-sky-600 dark:text-sky-400"
              />
            </motion.div>

            {/* Total Bookings */}
            <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
              <AnalyticsStatCard
                title="Total Bookings"
                value={totalBookings}
                subtitle="All time"
                icon={<TrendingUp className="h-4 w-4" />}
                iconBgColor="bg-violet-500/20 text-violet-600 dark:text-violet-400"
                valueColor="text-violet-600 dark:text-violet-400"
              />
            </motion.div>
          </div>

          {/* Recent Activity */}
          <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
            <RecentActivity bookings={recentBookings} />
          </motion.div>
        </div>

        {/* Right Column - Traffic & Quick Actions */}
        <div className="lg:col-span-4 space-y-5">
          {/* Locations */}
          <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
            <LocationsCard locations={locations} />
          </motion.div>

          {/* Quick Actions - 2x2 Grid */}
          <motion.div
            variants={prefersReducedMotion ? undefined : itemVariants}
            whileHover={prefersReducedMotion ? undefined : { y: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <Card className={cn(
              'relative overflow-hidden group rounded-xl',
              'bg-card',
              'border border-border',
              'shadow-sm',
              'transition-all duration-300 ease-out',
              'hover:shadow-md'
            )}>
              <CardHeader className="pb-3 relative z-10">
                <CardTitle className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-4 px-4 relative z-10">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { staggerChildren: 0.05, delayChildren: 0.1 }
                    }
                  }}
                  className="grid grid-cols-2 gap-3"
                >
                  {quickActionConfig.map((config) => (
                    <motion.div
                      key={config.key}
                      variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                    >
                      <QuickActionCard config={config} />
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pro Features Card */}
          <motion.div
            variants={prefersReducedMotion ? undefined : itemVariants}
            whileHover={prefersReducedMotion ? undefined : { y: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <Card className={cn(
              'relative overflow-hidden group rounded-2xl',
              'bg-card',
              'border border-border',
              'shadow-sm',
              'transition-all duration-300 ease-out',
              'hover:shadow-md'
            )}>
              <CardContent className="p-5 relative z-10">
                {/* Icon with colored background */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="flex h-12 w-12 items-center justify-center rounded-xl mb-4 bg-violet-500/10"
                >
                  <Sparkles className="h-6 w-6 text-violet-500" />
                </motion.div>

                <span className="text-base font-semibold text-foreground">
                  Premium Features
                </span>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Unlock advanced analytics, custom branding, and priority support
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-violet-500/10 border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 hover:border-violet-500/50 transition-all duration-300"
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// Quick Action Card - 2x2 Grid Item
interface QuickActionCardProps {
  config: {
    key: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    description: string;
    color: string;
    bg: string;
    hoverBg: string;
    borderHover: string;
  };
}

function QuickActionCard({ config }: QuickActionCardProps) {
  const Icon = config.icon;

  return (
    <Link
      href={config.href}
      className={cn(
        'group flex flex-col p-3 rounded-xl',
        'border border-border',
        'bg-card',
        'transition-all duration-200',
        config.hoverBg,
        config.borderHover,
        'hover:shadow-sm hover:-translate-y-0.5'
      )}
    >
      {/* Icon */}
      <div className={cn(
        'flex h-10 w-10 items-center justify-center rounded-lg mb-2',
        config.bg
      )}>
        <Icon className={cn('h-5 w-5', config.color)} />
      </div>

      {/* Label */}
      <span className="text-sm font-medium text-foreground">
        {config.label}
      </span>

      {/* Description */}
      <span className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
        {config.description}
      </span>

      {/* Arrow indicator */}
      <ArrowRight className={cn(
        'h-3.5 w-3.5 mt-2 self-end',
        config.color,
        'opacity-0 -translate-x-1',
        'group-hover:opacity-100 group-hover:translate-x-0',
        'transition-all duration-200'
      )} />
    </Link>
  );
}
