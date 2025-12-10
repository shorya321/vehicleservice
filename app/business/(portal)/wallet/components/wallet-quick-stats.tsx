'use client';

/**
 * Wallet Quick Stats Component
 * Premium pill-style stat indicators below hero balance
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { CreditCard, Activity, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { staggerContainer, staggerItem } from '@/lib/business/animation/variants';
import { useReducedMotion } from '@/lib/business/animation/hooks';

interface WalletQuickStatsProps {
  paymentMethodsCount: number;
  monthlyTransactionCount: number;
  autoRechargeEnabled: boolean;
}

interface StatPillProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  variant: 'info' | 'success' | 'warning';
  isActive?: boolean;
}

function StatPill({ icon, value, label, variant, isActive }: StatPillProps) {
  const prefersReducedMotion = useReducedMotion();

  // Variant styles with semantic colors
  const variantStyles = {
    info: {
      iconBg: 'bg-sky-500/10',
      iconColor: 'text-sky-600 dark:text-sky-400',
      borderColor: 'border-border',
    },
    success: {
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-500/30',
    },
    warning: {
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      borderColor: 'border-border',
    },
  };

  const styles = variantStyles[variant];

  const content = (
    <div
      className={cn(
        'relative flex items-center gap-3 rounded-xl px-4 py-3',
        'bg-muted/50 border',
        'transition-all duration-300',
        'hover:shadow-md',
        isActive ? styles.borderColor : 'border-border',
        isActive && 'ring-1 ring-emerald-500/20 shadow-sm'
      )}
    >
      {/* Icon */}
      <div className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg',
        styles.iconBg,
        styles.iconColor
      )}>
        {icon}
      </div>

      {/* Value and Label */}
      <div className="min-w-0 flex-1">
        <p className="text-lg font-semibold text-foreground leading-tight">
          {value}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {label}
        </p>
      </div>
    </div>
  );

  if (prefersReducedMotion) {
    return content;
  }

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      {content}
    </motion.div>
  );
}

export function WalletQuickStats({
  paymentMethodsCount,
  monthlyTransactionCount,
  autoRechargeEnabled,
}: WalletQuickStatsProps) {
  const prefersReducedMotion = useReducedMotion();

  const stats = [
    {
      icon: <CreditCard className="h-4 w-4" />,
      value: paymentMethodsCount,
      label: paymentMethodsCount === 1 ? 'Payment Method' : 'Payment Methods',
      variant: 'info' as const,
    },
    {
      icon: <Activity className="h-4 w-4" />,
      value: monthlyTransactionCount,
      label: 'This Month',
      variant: 'info' as const,
    },
    {
      icon: <Zap className="h-4 w-4" />,
      value: autoRechargeEnabled ? 'Active' : 'Inactive',
      label: 'Auto-Recharge',
      variant: autoRechargeEnabled ? ('success' as const) : ('warning' as const),
      isActive: autoRechargeEnabled,
    },
  ];

  if (prefersReducedMotion) {
    return (
      <div className="flex flex-wrap gap-3">
        {stats.map((stat) => (
          <StatPill
            key={stat.label}
            icon={stat.icon}
            value={stat.value}
            label={stat.label}
            variant={stat.variant}
            isActive={stat.isActive}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-wrap gap-3"
    >
      {stats.map((stat) => (
        <StatPill
          key={stat.label}
          icon={stat.icon}
          value={stat.value}
          label={stat.label}
          variant={stat.variant}
          isActive={stat.isActive}
        />
      ))}
    </motion.div>
  );
}
