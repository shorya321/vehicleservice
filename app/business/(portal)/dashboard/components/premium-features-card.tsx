'use client';

/**
 * Premium Features Card Component
 * Promotional card for premium features
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/business/ui/card';
import { Button } from '@/components/ui/button';
import { useReducedMotion } from '@/lib/business/animation/hooks';

interface PremiumFeaturesCardProps {
  className?: string;
}

export function PremiumFeaturesCard({ className }: PremiumFeaturesCardProps) {
  const prefersReducedMotion = useReducedMotion();

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
        'relative overflow-hidden group rounded-2xl',
        'bg-card',
        'border border-border',
        'shadow-sm',
        'transition-all duration-300',
        'hover:shadow-md card-hover'
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
            className="w-full bg-violet-500/10 border-violet-500/30 text-violet-500 font-medium hover:bg-violet-500/20 hover:border-violet-500/50 transition-all duration-300"
          >
            Learn More
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
