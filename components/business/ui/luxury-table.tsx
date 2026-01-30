/**
 * Luxury Table Component
 * Premium data tables with sticky headers and hover effects
 *
 * SCOPE: Business module ONLY
 */

'use client';

import {
  forwardRef,
  type HTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { tableRowHover } from '@/lib/business/animation/variants';
import { useReducedMotion } from '@/lib/business/animation/hooks';

// Table Root
interface LuxuryTableProps extends HTMLAttributes<HTMLTableElement> {
  /** Make the table scrollable horizontally */
  scrollable?: boolean;
}

const LuxuryTable = forwardRef<HTMLTableElement, LuxuryTableProps>(
  ({ className, scrollable, children, ...props }, ref) => {
    const table = (
      <table
        ref={ref}
        className={cn(
          'w-full caption-bottom text-sm font-[family-name:var(--business-font-body)]',
          className
        )}
        {...props}
      >
        {children}
      </table>
    );

    if (scrollable) {
      return (
        <div className="relative w-full overflow-auto business-scrollbar rounded-lg border border-[var(--business-border-default)]">
          {table}
        </div>
      );
    }

    return table;
  }
);

LuxuryTable.displayName = 'LuxuryTable';

// Table Header
const LuxuryTableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      'sticky top-0 z-10 bg-gradient-to-b from-[var(--business-surface-1)] to-[var(--business-surface-1)]/95 backdrop-blur-sm',
      className
    )}
    {...props}
  />
));

LuxuryTableHeader.displayName = 'LuxuryTableHeader';

// Table Body
const LuxuryTableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
));

LuxuryTableBody.displayName = 'LuxuryTableBody';

// Table Footer
const LuxuryTableFooter = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t border-[var(--business-border-default)] bg-[var(--business-surface-1)]/50 font-medium',
      className
    )}
    {...props}
  />
));

LuxuryTableFooter.displayName = 'LuxuryTableFooter';

// Table Row
interface LuxuryTableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  /** Enable hover animation */
  animated?: boolean;
  /** Clickable row */
  clickable?: boolean;
}

const LuxuryTableRow = forwardRef<HTMLTableRowElement, LuxuryTableRowProps>(
  ({ className, animated = false, clickable = false, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    const baseClasses = cn(
      'border-b border-[var(--business-border-subtle)] transition-colors relative',
      'hover:bg-[var(--business-primary-500)]/5',
      clickable && 'cursor-pointer',
      className
    );

    // Animated row with left accent on hover
    if (animated && !prefersReducedMotion) {
      return (
        <motion.tr
          ref={ref}
          className={cn(
            baseClasses,
            'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-[var(--business-primary-500)] before:scale-y-0 before:origin-center before:transition-transform hover:before:scale-y-100'
          )}
          initial="rest"
          whileHover="hover"
          variants={tableRowHover}
          {...(props as any)}
        />
      );
    }

    return (
      <tr
        ref={ref}
        className={cn(
          baseClasses,
          'hover:before:absolute hover:before:left-0 hover:before:top-0 hover:before:bottom-0 hover:before:w-[3px] hover:before:bg-[var(--business-primary-500)]'
        )}
        {...props}
      />
    );
  }
);

LuxuryTableRow.displayName = 'LuxuryTableRow';

// Table Head Cell
const LuxuryTableHead = forwardRef<
  HTMLTableCellElement,
  ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-12 px-4 text-left align-middle font-semibold text-[var(--business-text-secondary)] text-xs uppercase tracking-wider',
      '[&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
));

LuxuryTableHead.displayName = 'LuxuryTableHead';

// Table Cell
const LuxuryTableCell = forwardRef<
  HTMLTableCellElement,
  TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'p-4 align-middle text-[var(--business-text-primary)] [&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
));

LuxuryTableCell.displayName = 'LuxuryTableCell';

// Table Caption
const LuxuryTableCaption = forwardRef<
  HTMLTableCaptionElement,
  HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-[var(--business-text-muted)]', className)}
    {...props}
  />
));

LuxuryTableCaption.displayName = 'LuxuryTableCaption';

// Empty State for tables
interface LuxuryTableEmptyProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const LuxuryTableEmpty = ({
  icon,
  title,
  description,
  action,
}: LuxuryTableEmptyProps) => {
  return (
    <LuxuryTableRow>
      <LuxuryTableCell colSpan={100} className="h-64">
        <div className="flex flex-col items-center justify-center text-center">
          {icon && (
            <div className="mb-4 text-[var(--business-text-muted)]">{icon}</div>
          )}
          <h3 className="font-[family-name:var(--business-font-display)] text-lg font-medium text-[var(--business-text-primary)] mb-1">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-[var(--business-text-muted)] max-w-sm mb-4">
              {description}
            </p>
          )}
          {action}
        </div>
      </LuxuryTableCell>
    </LuxuryTableRow>
  );
};

export {
  LuxuryTable,
  LuxuryTableHeader,
  LuxuryTableBody,
  LuxuryTableFooter,
  LuxuryTableRow,
  LuxuryTableHead,
  LuxuryTableCell,
  LuxuryTableCaption,
  LuxuryTableEmpty,
};
