'use client';

/**
 * Dashboard Content Component
 * Client component with premium indigo styling and animations
 *
 * Design System: Premium Indigo - Stripe/Linear/Apple inspired
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Wallet,
  CalendarCheck,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/business/wallet-operations';
import {
  LuxuryCard,
  LuxuryCardHeader,
  LuxuryCardTitle,
  LuxuryCardDescription,
  LuxuryCardContent,
  HeroStatCard,
  WalletHeroCard,
  ActionCard,
  QuickActionsGrid,
  LuxuryButton,
  StatusBadge,
} from '@/components/business/ui';
import { FadeIn, StaggerContainer, StaggerItem, CurrencyCountUp } from '@/components/business/motion';
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/business/animation/variants';
import { useReducedMotion } from '@/lib/business/animation/hooks';

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
}

export function DashboardContent({
  businessName,
  walletBalance,
  totalBookings,
  pendingBookings,
  completedBookings,
  monthlyBookings,
  recentBookings,
}: DashboardContentProps) {
  const prefersReducedMotion = useReducedMotion();

  // Get current time of day for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'info' | 'default' => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header with Greeting */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              className="text-3xl sm:text-4xl font-semibold text-[var(--business-text-primary)] tracking-tight"
              style={{ fontFamily: 'var(--business-font-display)' }}
            >
              {getGreeting()}
            </h1>
            <p
              className="mt-1 text-[var(--business-text-muted)]"
              style={{ fontFamily: 'var(--business-font-body)' }}
            >
              Welcome back to{' '}
              <span className="text-[var(--business-primary-400)]">{businessName}</span>
            </p>
          </div>
          <LuxuryButton asChild variant="primary" className="gap-2">
            <Link href="/business/bookings/new">
              <Plus className="h-4 w-4" />
              New Booking
            </Link>
          </LuxuryButton>
        </div>
      </FadeIn>

      {/* Hero Stats Grid */}
      <motion.div
        variants={prefersReducedMotion ? undefined : staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* Wallet Balance - Hero Card */}
        <motion.div variants={prefersReducedMotion ? undefined : staggerItem} className="sm:col-span-2">
          <WalletHeroCard
            balance={walletBalance}
            trend={{ value: monthlyBookings, label: 'bookings this month' }}
          />
        </motion.div>

        {/* Total Bookings */}
        <motion.div variants={prefersReducedMotion ? undefined : staggerItem}>
          <HeroStatCard
            title="Total Bookings"
            value={totalBookings}
            subtitle="All time"
            icon={<CalendarCheck className="h-5 w-5" />}
          />
        </motion.div>

        {/* Pending Bookings */}
        <motion.div variants={prefersReducedMotion ? undefined : staggerItem}>
          <HeroStatCard
            title="Pending"
            value={pendingBookings}
            subtitle="Awaiting assignment"
            icon={<Clock className="h-5 w-5" />}
            variant={pendingBookings > 0 ? 'warning' : 'default'}
          />
        </motion.div>
      </motion.div>

      {/* Quick Actions */}
      <FadeIn delay={0.2}>
        <div className="space-y-4">
          <h2
            className="text-xl font-medium text-[var(--business-text-primary)]"
            style={{ fontFamily: 'var(--business-font-display)' }}
          >
            Quick Actions
          </h2>
          <QuickActionsGrid>
            <ActionCard
              href="/business/bookings/new"
              variant="primary"
              icon={<Plus className="h-6 w-6" />}
              title="New Booking"
              description="Create a new transfer booking"
            />
            <ActionCard
              href="/business/wallet"
              icon={<Wallet className="h-6 w-6" />}
              title="Wallet"
              description="Manage your credits"
            />
            <ActionCard
              href="/business/bookings"
              icon={<CalendarCheck className="h-6 w-6" />}
              title="View Bookings"
              description="See all your bookings"
            />
          </QuickActionsGrid>
        </div>
      </FadeIn>

      {/* Recent Bookings */}
      <FadeIn delay={0.3}>
        <LuxuryCard>
          <LuxuryCardHeader className="flex flex-row items-center justify-between">
            <div>
              <LuxuryCardTitle>Recent Bookings</LuxuryCardTitle>
              <LuxuryCardDescription>Your latest transfer bookings</LuxuryCardDescription>
            </div>
            {recentBookings.length > 0 && (
              <LuxuryButton asChild variant="ghost" size="sm" className="gap-1">
                <Link href="/business/bookings">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </LuxuryButton>
            )}
          </LuxuryCardHeader>
          <LuxuryCardContent>
            {recentBookings.length === 0 ? (
              <EmptyBookingsState />
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={`/business/bookings/${booking.id}`}
                      className={cn(
                        'group flex items-center justify-between p-4 rounded-xl',
                        'bg-[var(--business-surface-2)]/50 hover:bg-[var(--business-surface-3)]',
                        'border border-transparent hover:border-[var(--business-primary-500)]/20',
                        'transition-all duration-200'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-xl',
                            'bg-[var(--business-primary-500)]/10 text-[var(--business-primary-400)]'
                          )}
                        >
                          <CalendarCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <p
                            className="font-medium text-[var(--business-text-primary)]"
                            style={{ fontFamily: 'var(--business-font-body)' }}
                          >
                            {booking.booking_number}
                          </p>
                          <p className="text-sm text-[var(--business-text-muted)]">
                            {booking.customer_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="font-medium text-[var(--business-text-primary)]">
                            {formatCurrency(booking.total_price)}
                          </p>
                          <p className="text-xs text-[var(--business-text-muted)]">
                            {new Date(booking.pickup_datetime).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <StatusBadge variant={getStatusVariant(booking.booking_status)}>
                          {booking.booking_status}
                        </StatusBadge>
                        <ArrowRight className="h-4 w-4 text-[var(--business-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </LuxuryCardContent>
        </LuxuryCard>
      </FadeIn>
    </div>
  );
}

// Empty state component
function EmptyBookingsState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="relative mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--business-primary-500)]/10">
          <CalendarCheck className="h-8 w-8 text-[var(--business-primary-400)]" />
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="absolute -right-1 -top-1"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-[var(--business-primary-500)] to-[var(--business-primary-400)]">
            <Sparkles className="h-3 w-3 text-white" />
          </div>
        </motion.div>
      </div>
      <h3
        className="mb-2 text-lg font-medium text-[var(--business-text-primary)]"
        style={{ fontFamily: 'var(--business-font-display)' }}
      >
        No bookings yet
      </h3>
      <p
        className="mb-6 text-sm text-[var(--business-text-muted)] max-w-sm"
        style={{ fontFamily: 'var(--business-font-body)' }}
      >
        Create your first booking to start managing your transfers with ease
      </p>
      <LuxuryButton asChild variant="primary">
        <Link href="/business/bookings/new">
          <Plus className="mr-2 h-4 w-4" />
          Create Your First Booking
        </Link>
      </LuxuryButton>
    </div>
  );
}
