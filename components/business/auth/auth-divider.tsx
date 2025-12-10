/**
 * Auth Divider Component
 * "Or continue with" style divider for auth pages
 *
 * SCOPE: Business module ONLY
 */

import { cn } from '@/lib/utils';

interface AuthDividerProps {
  /** Text to display in the divider */
  text?: string;
  /** Additional class names */
  className?: string;
}

export function AuthDivider({ text = 'Or continue with', className }: AuthDividerProps) {
  return (
    <div className={cn('auth-divider', className)}>
      <span>{text}</span>
    </div>
  );
}
