'use client';

/**
 * Success Page Content with Animations
 * Features animated checkmark, staggered timeline, and entrance effects
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { LuxuryButton } from '@/components/business/ui/luxury-button';
import {
  LuxuryCard,
  LuxuryCardContent,
  LuxuryCardDescription,
  LuxuryCardHeader,
  LuxuryCardTitle,
} from '@/components/business/ui/luxury-card';
import { useReducedMotion } from '@/lib/business/animation/hooks';

// Animated checkmark component
function AnimatedCheckmark() {
  return (
    <motion.svg
      viewBox="0 0 50 50"
      className="w-10 h-10"
      initial="hidden"
      animate="visible"
    >
      {/* Background circle */}
      <motion.circle
        cx="25"
        cy="25"
        r="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-[var(--business-success)]"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      {/* Checkmark */}
      <motion.path
        d="M14 27 L22 35 L38 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[var(--business-success)]"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
      />
    </motion.svg>
  );
}

// Container animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const checkmarkBadgeVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
      delay: 0.1,
    },
  },
};

const alertVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// Timeline step component
function TimelineStep({
  number,
  children,
  delay,
}: {
  number: number;
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.li
      className="flex gap-3 relative"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Number badge */}
      <motion.span
        className="w-6 h-6 rounded-full bg-[var(--business-primary-500)] text-white text-xs font-semibold flex items-center justify-center flex-shrink-0"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 15,
          delay: delay + 0.1,
        }}
      >
        {number}
      </motion.span>
      <span>{children}</span>
    </motion.li>
  );
}

export function SuccessPageContent() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    // Render without animations
    return (
      <div className="min-h-screen flex items-center justify-center p-4 business-mesh-bg">
        <LuxuryCard className="w-full max-w-2xl">
          <LuxuryCardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-[rgba(16,185,129,0.15)] rounded-full flex items-center justify-center mb-4">
              <svg viewBox="0 0 50 50" className="w-10 h-10">
                <circle
                  cx="25"
                  cy="25"
                  r="22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-[var(--business-success)]"
                />
                <path
                  d="M14 27 L22 35 L38 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[var(--business-success)]"
                />
              </svg>
            </div>
            <LuxuryCardTitle className="text-2xl">Registration Successful!</LuxuryCardTitle>
            <LuxuryCardDescription className="text-base mt-2">
              Your business account has been created and is pending approval
            </LuxuryCardDescription>
          </LuxuryCardHeader>
          {/* ... rest of static content */}
        </LuxuryCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 business-mesh-bg">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-2xl"
      >
        <motion.div variants={cardVariants}>
          <LuxuryCard>
            <LuxuryCardHeader className="text-center">
              {/* Animated Checkmark Badge */}
              <motion.div
                variants={checkmarkBadgeVariants}
                className="mx-auto w-16 h-16 bg-[rgba(16,185,129,0.15)] rounded-full flex items-center justify-center mb-4"
              >
                <AnimatedCheckmark />
              </motion.div>

              <motion.div variants={itemVariants}>
                <LuxuryCardTitle className="text-2xl">Registration Successful!</LuxuryCardTitle>
              </motion.div>
              <motion.div variants={itemVariants}>
                <LuxuryCardDescription className="text-base mt-2">
                  Your business account has been created and is pending approval
                </LuxuryCardDescription>
              </motion.div>
            </LuxuryCardHeader>

            <LuxuryCardContent className="space-y-6">
              {/* Status Info */}
              <motion.div
                variants={alertVariants}
                className="bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <motion.div
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <Clock className="h-5 w-5 text-[var(--business-warning)] mt-0.5" />
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-[var(--business-text-primary)]">
                      Awaiting Admin Approval
                    </h3>
                    <p className="text-sm text-[var(--business-text-secondary)] mt-1">
                      Our team will review your application shortly. This usually takes 24-48 hours
                      during business days.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Next Steps - Animated Timeline */}
              <motion.div variants={itemVariants}>
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-[var(--business-text-primary)]">
                  <Mail className="h-5 w-5 text-[var(--business-primary-400)]" />
                  What happens next?
                </h3>
                <ol className="space-y-4 text-sm text-[var(--business-text-secondary)] relative">
                  {/* Vertical line connector */}
                  <motion.div
                    className="absolute left-3 top-6 bottom-6 w-px bg-[var(--business-border-default)]"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    style={{ originY: 0 }}
                  />

                  <TimelineStep number={1} delay={0.6}>
                    Our admin team will review your business registration details
                  </TimelineStep>
                  <TimelineStep number={2} delay={0.75}>
                    You will receive an email notification once your account is approved
                  </TimelineStep>
                  <TimelineStep number={3} delay={0.9}>
                    After approval, you can login and start managing your transfers and bookings
                  </TimelineStep>
                </ol>
              </motion.div>

              {/* Account Details */}
              <motion.div
                variants={itemVariants}
                className="border-t border-[rgba(255,255,255,0.1)] pt-4"
              >
                <h3 className="font-semibold mb-2 text-[var(--business-text-primary)]">
                  Your Account Status
                </h3>
                <div className="bg-[var(--business-surface-2)] rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[var(--business-text-muted)]">Status:</span>
                    <motion.span
                      className="font-medium text-[var(--business-warning)]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.0 }}
                    >
                      Pending Approval
                    </motion.span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--business-text-muted)]">Login Access:</span>
                    <span className="font-medium text-[var(--business-text-primary)]">
                      Disabled (until approved)
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 pt-4">
                <LuxuryButton asChild variant="outline" className="flex-1">
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Link>
                </LuxuryButton>
                <LuxuryButton asChild className="flex-1">
                  <Link href="/business/login">
                    Try Login
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </LuxuryButton>
              </motion.div>

              {/* Support Info */}
              <motion.div
                variants={itemVariants}
                className="text-center text-sm text-[var(--business-text-muted)] pt-2"
              >
                <p>
                  Have questions?{' '}
                  <Link
                    href="/contact"
                    className="text-[var(--business-primary-400)] hover:underline"
                  >
                    Contact our support team
                  </Link>
                </p>
              </motion.div>
            </LuxuryCardContent>
          </LuxuryCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
