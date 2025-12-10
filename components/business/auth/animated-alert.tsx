/**
 * Animated Alert Component
 * Alert with entrance/exit animations for auth feedback
 *
 * SCOPE: Business module ONLY
 */

'use client';

import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { authAlert } from '@/lib/business/animation/variants';
import { useReducedMotion } from '@/lib/business/animation/hooks';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AnimatedAlertProps {
  /** Alert variant determines color and icon */
  variant: AlertVariant;
  /** Main message to display */
  message: string;
  /** Optional title above the message */
  title?: string;
  /** Custom icon (overrides default) */
  icon?: ReactNode;
  /** Whether the alert is visible */
  isVisible: boolean;
  /** Callback when alert is dismissed */
  onDismiss?: () => void;
  /** Auto-dismiss after specified milliseconds (0 = never) */
  dismissAfter?: number;
  /** Whether to show dismiss button */
  showDismissButton?: boolean;
  /** Additional class names */
  className?: string;
}

const variantStyles: Record<AlertVariant, {
  bg: string;
  border: string;
  icon: string;
  title: string;
  message: string;
  iconComponent: typeof CheckCircle2;
}> = {
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    icon: 'text-green-500',
    title: 'text-green-400',
    message: 'text-green-300/90',
    iconComponent: CheckCircle2,
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: 'text-red-500',
    title: 'text-red-400',
    message: 'text-red-300/90',
    iconComponent: XCircle,
  },
  warning: {
    bg: 'bg-[var(--luxury-gold)]/10',
    border: 'border-[var(--luxury-gold)]/30',
    icon: 'text-[var(--luxury-gold)]',
    title: 'text-[var(--luxury-gold-light)]',
    message: 'text-[var(--luxury-gold-light)]/90',
    iconComponent: AlertCircle,
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: 'text-blue-500',
    title: 'text-blue-400',
    message: 'text-blue-300/90',
    iconComponent: Info,
  },
};

export function AnimatedAlert({
  variant,
  message,
  title,
  icon,
  isVisible,
  onDismiss,
  dismissAfter = 0,
  showDismissButton = false,
  className,
}: AnimatedAlertProps) {
  const prefersReducedMotion = useReducedMotion();
  const styles = variantStyles[variant];
  const IconComponent = styles.iconComponent;

  // Auto-dismiss effect
  useEffect(() => {
    if (isVisible && dismissAfter > 0 && onDismiss) {
      const timer = setTimeout(onDismiss, dismissAfter);
      return () => clearTimeout(timer);
    }
  }, [isVisible, dismissAfter, onDismiss]);

  const content = (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl p-4 border',
        styles.bg,
        styles.border,
        className
      )}
    >
      <div className={cn('flex-shrink-0 mt-0.5', styles.icon)}>
        {icon || <IconComponent className="h-5 w-5" />}
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={cn('font-medium text-sm mb-0.5', styles.title)}>
            {title}
          </h4>
        )}
        <p className={cn('text-sm', styles.message)}>{message}</p>
      </div>
      {showDismissButton && onDismiss && (
        <button
          onClick={onDismiss}
          className={cn(
            'flex-shrink-0 p-1 rounded-lg transition-colors hover:bg-white/10',
            styles.icon
          )}
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  if (prefersReducedMotion) {
    return isVisible ? content : null;
  }

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          variants={authAlert}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Simple inline alert without animation
 * Use for static feedback that doesn't need to animate
 */
interface InlineAlertProps {
  variant: AlertVariant;
  message: string;
  className?: string;
}

export function InlineAlert({ variant, message, className }: InlineAlertProps) {
  const styles = variantStyles[variant];
  const IconComponent = styles.iconComponent;

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm',
        styles.message,
        className
      )}
    >
      <IconComponent className={cn('h-4 w-4 flex-shrink-0', styles.icon)} />
      <span>{message}</span>
    </div>
  );
}
