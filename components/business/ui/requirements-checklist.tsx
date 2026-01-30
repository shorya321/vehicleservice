/**
 * Password Requirements Checklist Component
 * Interactive checklist that shows validation status in real-time
 *
 * Design System: Premium Indigo - Stripe/Linear/Apple inspired
 * SCOPE: Business module ONLY
 */

'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X } from 'lucide-react';

interface Requirement {
  id: string;
  label: string;
  validator: (password: string, confirmPassword?: string) => boolean;
}

interface RequirementsChecklistProps {
  password: string;
  confirmPassword?: string;
  requirements?: Requirement[];
  className?: string;
  title?: string;
}

const defaultRequirements: Requirement[] = [
  {
    id: 'length',
    label: 'At least 8 characters',
    validator: (password) => password.length >= 8,
  },
  {
    id: 'match',
    label: 'Passwords match',
    validator: (password, confirmPassword) =>
      !!password && !!confirmPassword && password === confirmPassword,
  },
];

const extendedRequirements: Requirement[] = [
  {
    id: 'length',
    label: 'At least 8 characters',
    validator: (password) => password.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'Contains uppercase letter',
    validator: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    label: 'Contains lowercase letter',
    validator: (password) => /[a-z]/.test(password),
  },
  {
    id: 'number',
    label: 'Contains a number',
    validator: (password) => /[0-9]/.test(password),
  },
];

export function RequirementsChecklist({
  password,
  confirmPassword,
  requirements = defaultRequirements,
  className,
  title = 'Password must:',
}: RequirementsChecklistProps) {
  const results = useMemo(() => {
    return requirements.map((req) => ({
      ...req,
      met: req.validator(password, confirmPassword),
    }));
  }, [password, confirmPassword, requirements]);

  const allMet = results.every((r) => r.met);
  const anyStarted = password.length > 0;

  return (
    <div className={cn('space-y-2', className)}>
      {title && (
        <p className="text-xs font-medium text-[var(--business-text-secondary)]">
          {title}
        </p>
      )}
      <ul className="space-y-1.5">
        {results.map((req) => (
          <motion.li
            key={req.id}
            initial={false}
            animate={{
              opacity: 1,
            }}
            className="flex items-center gap-2 text-xs"
          >
            <AnimatePresence mode="wait">
              {!anyStarted ? (
                <motion.div
                  key="empty"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="w-4 h-4 rounded-full border border-[var(--business-border-default)] flex items-center justify-center"
                />
              ) : req.met ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15, type: 'spring', stiffness: 500, damping: 30 }}
                  className="w-4 h-4 rounded-full bg-[var(--business-success)] flex items-center justify-center"
                >
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                </motion.div>
              ) : (
                <motion.div
                  key="x"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="w-4 h-4 rounded-full bg-[var(--business-surface-3)] border border-[var(--business-border-default)] flex items-center justify-center"
                >
                  <X className="w-2.5 h-2.5 text-[var(--business-text-muted)]" strokeWidth={2} />
                </motion.div>
              )}
            </AnimatePresence>
            <motion.span
              animate={{
                color: !anyStarted
                  ? 'var(--business-text-muted)'
                  : req.met
                  ? 'var(--business-success)'
                  : 'var(--business-text-muted)',
              }}
              transition={{ duration: 0.2 }}
            >
              {req.label}
            </motion.span>
          </motion.li>
        ))}
      </ul>

      {/* All requirements met indicator */}
      <AnimatePresence>
        {allMet && anyStarted && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 text-xs text-[var(--business-success)] pt-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span className="font-medium">All requirements met</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Export requirement sets for different use cases
export { defaultRequirements, extendedRequirements, type Requirement };
