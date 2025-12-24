'use client';

/**
 * Stats Grid Component
 * Displays 4 key metrics in a responsive grid
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { motion } from 'framer-motion';
import { BarChart3, CalendarCheck, Clock, TrendingUp } from 'lucide-react';
import { useReducedMotion } from '@/lib/business/animation/hooks';
import { AnalyticsStatCard } from './analytics-chart';

interface StatsGridProps {
  monthlyBookings: number;
  completedBookings: number;
  pendingBookings: number;
  totalBookings: number;
}

export function StatsGrid({
  monthlyBookings,
  completedBookings,
  pendingBookings,
  totalBookings,
}: StatsGridProps) {
  const prefersReducedMotion = useReducedMotion();

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
    },
  };

  const stats = [
    {
      key: 'monthly',
      title: 'Monthly Bookings',
      value: monthlyBookings,
      subtitle: 'This month',
      icon: <BarChart3 className="h-4 w-4" />,
      trend: monthlyBookings > 0 ? { value: 12, isPositive: true } : undefined,
      iconBgColor: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
      valueColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      key: 'completed',
      title: 'Completed',
      value: completedBookings,
      subtitle: 'Successfully delivered',
      icon: <CalendarCheck className="h-4 w-4" />,
      iconBgColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      valueColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      key: 'pending',
      title: 'Pending',
      value: pendingBookings,
      subtitle: 'Awaiting action',
      icon: <Clock className="h-4 w-4" />,
      iconBgColor: 'bg-sky-500/20 text-sky-600 dark:text-sky-400',
      valueColor: 'text-sky-600 dark:text-sky-400',
    },
    {
      key: 'total',
      title: 'Total Bookings',
      value: totalBookings,
      subtitle: 'All time',
      icon: <TrendingUp className="h-4 w-4" />,
      iconBgColor: 'bg-violet-500/20 text-violet-600 dark:text-violet-400',
      valueColor: 'text-violet-600 dark:text-violet-400',
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.key}
          variants={prefersReducedMotion ? undefined : itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: index * 0.05 }}
        >
          <AnalyticsStatCard
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            trend={stat.trend}
            iconBgColor={stat.iconBgColor}
            valueColor={stat.valueColor}
          />
        </motion.div>
      ))}
    </div>
  );
}
