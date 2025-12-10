/**
 * Auth Brand Panel Component
 * Left side of split-screen auth layout with gradient background and branding
 *
 * SCOPE: Business module ONLY
 */

'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { authBrandPanel, authBrandLogo, authTagline, authParticle } from '@/lib/business/animation/variants';
import { useReducedMotion } from '@/lib/business/animation/hooks';

interface AuthBrandPanelProps {
  /** Custom logo element */
  logo?: ReactNode;
  /** Main tagline text (can include line breaks with \n) */
  tagline: string;
  /** Optional description below tagline */
  description?: string;
  /** Show floating particle decorations */
  showParticles?: boolean;
  /** Additional class names */
  className?: string;
}

export function AuthBrandPanel({
  logo,
  tagline,
  description,
  showParticles = true,
  className,
}: AuthBrandPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  // Split tagline by newlines for multi-line rendering
  const taglineLines = tagline.split('\n');

  const MotionWrapper = prefersReducedMotion ? 'div' : motion.div;

  return (
    <div className={cn('auth-brand-panel', className)}>
      {/* Floating particles */}
      {showParticles && !prefersReducedMotion && (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="auth-particle"
              variants={authParticle}
              initial="hidden"
              animate="visible"
              custom={i}
            />
          ))}
        </>
      )}

      <MotionWrapper
        {...(!prefersReducedMotion && {
          variants: authBrandPanel,
          initial: 'hidden',
          animate: 'visible',
        })}
        className="relative z-10 flex flex-col justify-center h-full max-w-md"
      >
        {/* Logo */}
        {logo && (
          <MotionWrapper
            {...(!prefersReducedMotion && { variants: authBrandLogo })}
            className="mb-8"
          >
            {logo}
          </MotionWrapper>
        )}

        {/* Default logo if none provided */}
        {!logo && (
          <MotionWrapper
            {...(!prefersReducedMotion && { variants: authBrandLogo })}
            className="mb-8"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--luxury-gold)] to-[var(--luxury-gold-dark)] flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[var(--luxury-black)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8c-.1.3-.1.6-.1.9v6.6c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
              </div>
              <span className="luxury-text-accent text-lg tracking-wider">
                Business Portal
              </span>
            </div>
          </MotionWrapper>
        )}

        {/* Tagline */}
        <MotionWrapper
          {...(!prefersReducedMotion && { variants: authTagline })}
          className="space-y-2"
        >
          {taglineLines.map((line, index) => (
            <h1
              key={index}
              className="luxury-text-display text-4xl md:text-5xl lg:text-6xl leading-tight"
            >
              {line}
            </h1>
          ))}
        </MotionWrapper>

        {/* Description */}
        {description && (
          <MotionWrapper
            {...(!prefersReducedMotion && { variants: authTagline })}
            className="mt-6"
          >
            <p className="luxury-text-body text-lg md:text-xl max-w-md">
              {description}
            </p>
          </MotionWrapper>
        )}

        {/* Decorative accent line */}
        <MotionWrapper
          {...(!prefersReducedMotion && { variants: authTagline })}
          className="mt-8"
        >
          <div className="w-24 h-1 rounded-full bg-gradient-to-r from-[var(--luxury-gold)] to-transparent" />
        </MotionWrapper>
      </MotionWrapper>

      {/* Mobile-only: Compact version */}
      <style jsx>{`
        @media (max-width: 767px) {
          .auth-brand-panel {
            padding: 1.5rem;
            min-height: auto;
          }
          .luxury-text-display {
            font-size: 1.75rem !important;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Minimal brand header for mobile view
 * Shows condensed branding when space is limited
 */
interface AuthBrandHeaderProps {
  logo?: ReactNode;
  title?: string;
  className?: string;
}

export function AuthBrandHeader({ logo, title = 'Business Portal', className }: AuthBrandHeaderProps) {
  return (
    <div className={cn('flex items-center gap-3 p-4 bg-[var(--luxury-black)]', className)}>
      {logo || (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--luxury-gold)] to-[var(--luxury-gold-dark)] flex items-center justify-center">
          <svg
            className="w-5 h-5 text-[var(--luxury-black)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8c-.1.3-.1.6-.1.9v6.6c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <circle cx="17" cy="17" r="2" />
          </svg>
        </div>
      )}
      <span className="luxury-text-accent text-sm tracking-wider">{title}</span>
    </div>
  );
}
