/**
 * Password Strength Indicator Component
 * Displays a visual strength meter with real-time feedback
 *
 * Design System: Premium Indigo - Stripe/Linear/Apple inspired
 * SCOPE: Business module ONLY
 */

'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface PasswordStrengthProps {
  password: string;
  className?: string;
  showLabel?: boolean;
}

type StrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

interface StrengthConfig {
  level: StrengthLevel;
  label: string;
  color: string;
  bgColor: string;
  segments: number;
}

const strengthConfigs: Record<StrengthLevel, StrengthConfig> = {
  empty: {
    level: 'empty',
    label: '',
    color: 'var(--business-text-muted)',
    bgColor: 'var(--business-surface-3)',
    segments: 0,
  },
  weak: {
    level: 'weak',
    label: 'Weak',
    color: 'var(--business-error)',
    bgColor: 'rgba(239, 68, 68, 0.2)',
    segments: 1,
  },
  fair: {
    level: 'fair',
    label: 'Fair',
    color: 'var(--business-warning)',
    bgColor: 'rgba(245, 158, 11, 0.2)',
    segments: 2,
  },
  good: {
    level: 'good',
    label: 'Good',
    color: 'var(--business-warning-bright)',
    bgColor: 'rgba(234, 179, 8, 0.2)',
    segments: 3,
  },
  strong: {
    level: 'strong',
    label: 'Strong',
    color: 'var(--business-success)',
    bgColor: 'rgba(34, 197, 94, 0.2)',
    segments: 4,
  },
};

function calculateStrength(password: string): StrengthLevel {
  if (!password) return 'empty';

  let score = 0;

  // Length checks
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  // Determine strength level based on score
  if (score <= 2) return 'weak';
  if (score <= 3) return 'fair';
  if (score <= 4) return 'good';
  return 'strong';
}

export function PasswordStrength({
  password,
  className,
  showLabel = true,
}: PasswordStrengthProps) {
  const strength = useMemo(() => calculateStrength(password), [password]);
  const config = strengthConfigs[strength];

  if (strength === 'empty') {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Strength Bar */}
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((segment) => (
          <motion.div
            key={segment}
            className="h-1.5 flex-1 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--business-surface-3)' }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: segment <= config.segments ? '100%' : '0%',
              }}
              transition={{
                duration: 0.3,
                delay: segment * 0.05,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="h-full rounded-full"
              style={{
                backgroundColor: segment <= config.segments ? config.color : 'transparent',
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Label */}
      <AnimatePresence mode="wait">
        {showLabel && config.label && (
          <motion.div
            key={config.level}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between"
          >
            <span
              className="text-xs font-medium"
              style={{ color: config.color }}
            >
              {config.label}
            </span>
            <span className="text-xs text-[var(--business-text-muted)]">
              {password.length} characters
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Export for use in other components
export { calculateStrength, type StrengthLevel };
