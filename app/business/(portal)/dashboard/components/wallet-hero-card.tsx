'use client';

/**
 * Wallet Hero Card Component
 * Displays wallet balance with sparkline visualization
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wallet, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/business/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { CurrencyCountUp } from '@/components/business/motion';
import { useReducedMotion } from '@/lib/business/animation/hooks';
import { Sparkline } from './analytics-chart';

interface WalletHeroCardProps {
  walletBalance: number;
  className?: string;
}

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

export function WalletHeroCard({ walletBalance, className }: WalletHeroCardProps) {
  const prefersReducedMotion = useReducedMotion();

  // Chart data for wallet sparkline
  const revenueChartData = generateChartData(walletBalance / 100 || 50);

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
    },
  };

  return (
    <motion.div
      variants={prefersReducedMotion ? undefined : itemVariants}
      initial="hidden"
      animate="visible"
      whileHover={prefersReducedMotion ? undefined : { y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={className}
    >
      <Card className={cn(
        "relative overflow-hidden group rounded-2xl",
        "bg-card",
        "border border-border",
        "shadow-md",
        "transition-all duration-300",
        "hover:shadow-lg card-hover"
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
                className="sparkline-glow"
              />
            </div>
          </div>

          <Separator className="my-5 bg-border" />
          <Button asChild variant="ghost" size="sm" className="bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 hover:border-primary/50">
            <Link href="/business/wallet">
              <CreditCard className="h-4 w-4 mr-2" />
              Add Credits
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
