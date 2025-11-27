'use client';

/**
 * Signup Page Content with Animations
 * Client component that wraps signup page with entrance animations
 */

import Link from 'next/link';
import { Building2, Wallet, Globe, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { SignupForm } from './signup-form';
import {
  AuthPageWrapper,
  AnimatedIconBadge,
  AnimatedHeader,
  AnimatedCard,
} from '@/components/business/auth/auth-page-wrapper';

const featureCardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const featuresContainerVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.4,
    },
  },
};

export function SignupPageContent() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 business-mesh-bg">
      <AuthPageWrapper className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <AnimatedIconBadge className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-[rgba(99,102,241,0.15)]">
              <Building2 className="h-8 w-8 text-[var(--business-primary-400)]" />
            </div>
          </AnimatedIconBadge>
          <AnimatedHeader>
            <h1 className="business-text-headline mb-2">Create Business Account</h1>
            <p className="business-text-body text-[var(--business-text-secondary)]">
              Start booking transfers for your customers with prepaid credits
            </p>
          </AnimatedHeader>
        </div>

        {/* Signup Form Card */}
        <AnimatedCard className="business-glass-elevated rounded-2xl p-8">
          <SignupForm />

          {/* Login Link */}
          <div className="mt-6 text-center text-sm text-[var(--business-text-muted)]">
            Already have an account?{' '}
            <Link
              href="/business/login"
              className="text-[var(--business-primary-400)] hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>
        </AnimatedCard>

        {/* Features List */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={featuresContainerVariants}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm"
        >
          <motion.div
            variants={featureCardVariants}
            className="text-center p-5 rounded-xl bg-[rgba(99,102,241,0.05)] border border-[rgba(99,102,241,0.1)] transition-all duration-200 hover:bg-[rgba(99,102,241,0.08)] hover:border-[rgba(99,102,241,0.2)]"
          >
            <div className="flex justify-center mb-3">
              <div className="p-2.5 rounded-lg bg-[rgba(99,102,241,0.1)]">
                <Wallet className="h-5 w-5 text-[var(--business-primary-400)]" />
              </div>
            </div>
            <div className="font-medium mb-1 text-[var(--business-text-primary)]">
              Prepaid Wallet
            </div>
            <p className="text-[var(--business-text-secondary)]">
              Add credits and book transfers easily
            </p>
          </motion.div>

          <motion.div
            variants={featureCardVariants}
            className="text-center p-5 rounded-xl bg-[rgba(99,102,241,0.05)] border border-[rgba(99,102,241,0.1)] transition-all duration-200 hover:bg-[rgba(99,102,241,0.08)] hover:border-[rgba(99,102,241,0.2)]"
          >
            <div className="flex justify-center mb-3">
              <div className="p-2.5 rounded-lg bg-[rgba(99,102,241,0.1)]">
                <Globe className="h-5 w-5 text-[var(--business-primary-400)]" />
              </div>
            </div>
            <div className="font-medium mb-1 text-[var(--business-text-primary)]">
              Custom Domain
            </div>
            <p className="text-[var(--business-text-secondary)]">
              Use your own branded domain
            </p>
          </motion.div>

          <motion.div
            variants={featureCardVariants}
            className="text-center p-5 rounded-xl bg-[rgba(99,102,241,0.05)] border border-[rgba(99,102,241,0.1)] transition-all duration-200 hover:bg-[rgba(99,102,241,0.08)] hover:border-[rgba(99,102,241,0.2)]"
          >
            <div className="flex justify-center mb-3">
              <div className="p-2.5 rounded-lg bg-[rgba(99,102,241,0.1)]">
                <LayoutDashboard className="h-5 w-5 text-[var(--business-primary-400)]" />
              </div>
            </div>
            <div className="font-medium mb-1 text-[var(--business-text-primary)]">
              Dedicated Portal
            </div>
            <p className="text-[var(--business-text-secondary)]">
              Manage all bookings in one place
            </p>
          </motion.div>
        </motion.div>
      </AuthPageWrapper>
    </div>
  );
}
