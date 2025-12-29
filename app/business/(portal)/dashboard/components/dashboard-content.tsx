'use client';

/**
 * Dashboard Content Component
 * Business analytics dashboard orchestrator
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Settings } from 'lucide-react';
import { useReducedMotion } from '@/lib/business/animation/hooks';
import { Button } from '@/components/ui/button';
import { WalletHeroCard } from './wallet-hero-card';
import { StatsGrid } from './stats-grid';
import { QuickActionsCard } from './quick-actions-card';
import { PremiumFeaturesCard } from './premium-features-card';
import { LocationsCard, type LocationData } from './analytics-chart';
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

  return (
    <div className="pb-12 space-y-6">
      {/* Header Section */}
      <DashboardHeader
        greeting={getGreeting()}
        businessName={businessName}
        prefersReducedMotion={prefersReducedMotion}
      />

      {/* Main Analytics Grid */}
      <motion.div
        variants={prefersReducedMotion ? undefined : containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-5 lg:gap-6 lg:grid-cols-12"
      >
        {/* Left Column - Main Stats */}
        <div className="lg:col-span-8 space-y-5">
          {/* Wallet Hero Card */}
          <WalletHeroCard walletBalance={walletBalance} className="col-span-full" />

          {/* Stats Grid */}
          <StatsGrid
            monthlyBookings={monthlyBookings}
            completedBookings={completedBookings}
            pendingBookings={pendingBookings}
            totalBookings={totalBookings}
          />

          {/* Recent Activity */}
          <RecentActivity bookings={recentBookings} />
        </div>

        {/* Right Column - Locations & Quick Actions */}
        <div className="lg:col-span-4 space-y-5">
          {/* Locations */}
          <LocationsCard locations={locations} />

          {/* Quick Actions */}
          <QuickActionsCard />

          {/* Premium Features */}
          <PremiumFeaturesCard />
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Dashboard Header Component
 * Greeting and action buttons
 */
interface DashboardHeaderProps {
  greeting: string;
  businessName: string;
  prefersReducedMotion: boolean;
}

function DashboardHeader({ greeting, businessName, prefersReducedMotion }: DashboardHeaderProps) {
  return (
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
          {greeting}, <span className="text-primary">{businessName}</span>
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
        <Button asChild variant="ghost" className="hidden sm:flex border border-border bg-card/80 backdrop-blur-sm text-foreground/80 hover:border-primary/30 hover:bg-primary/5">
          <Link href="/business/settings">
            <Settings className="h-4 w-4 mr-2 text-primary" />
            Settings
          </Link>
        </Button>

        <Button asChild className="rounded-xl shadow-sm hover:shadow-lg">
          <Link href="/business/bookings/new">
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Link>
        </Button>
      </motion.div>
    </motion.div>
  );
}
