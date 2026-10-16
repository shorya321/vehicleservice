'use client';

/**
 * Business Portal Content Wrapper
 * Handles dynamic margin based on sidebar collapse state
 */

import { type ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/business/sidebar-context';
import { useReducedMotion } from '@/lib/business/animation/hooks';
import { BusinessHeader } from './business-header';
import { navGroups } from './business-sidebar';
import { NavigationProgressProvider } from '@/components/business/layout/navigation-progress/navigation-progress-provider';
import { TopProgressBar } from '@/components/business/layout/navigation-progress/top-progress-bar';
import { ContentLoader } from '@/components/business/layout/navigation-progress/content-loader';
import { flattenNavLabels } from '@/components/business/layout/navigation-progress/classify-navigation';

/** Sidebar sections, used to name the page being loaded ("Loading Quotations"). */
const BUSINESS_NAV_LABELS = flattenNavLabels(navGroups);

interface BusinessPortalContentProps {
  children: ReactNode;
  userEmail: string;
  contactPersonName: string | null;
  /** business_users.role of the signed-in member. */
  role?: string | null;
  businessName: string;
  brandName?: string | null;
  logoUrl?: string | null;
  avatarUrl?: string | null;
}

export function BusinessPortalContent({
  children,
  userEmail,
  contactPersonName,
  role,
  businessName,
  brandName,
  logoUrl,
  avatarUrl,
}: BusinessPortalContentProps) {
  const { isCollapsed } = useSidebar();
  const prefersReducedMotion = useReducedMotion();

  // Sidebar widths - match sidebar component
  const expandedWidth = 256;
  const collapsedWidth = 72;
  const currentWidth = isCollapsed ? collapsedWidth : expandedWidth;

  return (
    <NavigationProgressProvider navLabels={BUSINESS_NAV_LABELS}>
      <TopProgressBar />
      <motion.div
        initial={false}
        animate={{ marginLeft: currentWidth }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 300, damping: 30 }
        }
        className={cn(
          'min-h-screen flex flex-col',
          'bg-background',
          !prefersReducedMotion && 'will-change-[margin-left]',
          'max-md:!ml-0'
        )}
        style={{ marginLeft: prefersReducedMotion ? currentWidth : undefined }}
      >
        <BusinessHeader
          userEmail={userEmail}
          contactPersonName={contactPersonName}
          role={role}
          businessName={businessName}
          brandName={brandName}
          logoUrl={logoUrl}
          avatarUrl={avatarUrl}
        />

        <main id="main-content" className="flex-1 pt-14" tabIndex={-1}>
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
        <ContentLoader />
      </motion.div>
    </NavigationProgressProvider>
  );
}
