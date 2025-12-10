/**
 * Password Input Component
 * Reusable password field with show/hide toggle and optional strength indicator
 *
 * SCOPE: Business module ONLY
 */

'use client';

import { forwardRef, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LuxuryInput, type LuxuryInputProps } from '@/components/business/ui/luxury-input';

interface PasswordInputProps extends Omit<LuxuryInputProps, 'type' | 'rightIcon'> {
  /** Show the lock icon on the left side */
  showLockIcon?: boolean;
  /** Additional class for the toggle button */
  toggleClassName?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showLockIcon = false, toggleClassName, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <LuxuryInput
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        className={cn('pr-10', className)}
        leftIcon={showLockIcon ? <Lock className="h-4 w-4" /> : undefined}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={cn(
              'text-[var(--luxury-light-gray)] hover:text-[var(--luxury-gold)] transition-colors focus:outline-none',
              toggleClassName
            )}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        }
        {...props}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

/**
 * Password strength indicator
 * Visual bar showing password strength based on criteria
 */
interface PasswordStrengthBarProps {
  password: string;
  className?: string;
}

export function PasswordStrengthBar({ password, className }: PasswordStrengthBarProps) {
  const getStrength = (pwd: string): { level: number; label: string; color: string } => {
    if (!pwd) return { level: 0, label: '', color: '' };

    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 2) return { level: 2, label: 'Fair', color: 'bg-orange-500' };
    if (score <= 3) return { level: 3, label: 'Good', color: 'bg-yellow-500' };
    if (score <= 4) return { level: 4, label: 'Strong', color: 'bg-[var(--luxury-gold)]' };
    return { level: 5, label: 'Excellent', color: 'bg-green-500' };
  };

  const strength = getStrength(password);

  if (!password) return null;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              level <= strength.level ? strength.color : 'bg-[var(--luxury-gray)]'
            )}
          />
        ))}
      </div>
      <p
        className={cn(
          'text-xs font-medium transition-colors',
          strength.level <= 1 && 'text-red-500',
          strength.level === 2 && 'text-orange-500',
          strength.level === 3 && 'text-yellow-500',
          strength.level === 4 && 'text-[var(--luxury-gold)]',
          strength.level === 5 && 'text-green-500'
        )}
      >
        {strength.label}
      </p>
    </div>
  );
}

/**
 * Password requirements checklist
 * Shows which password criteria are met
 */
interface PasswordRequirementsProps {
  password: string;
  confirmPassword?: string;
  showMatchRequirement?: boolean;
  className?: string;
}

export function PasswordRequirements({
  password,
  confirmPassword,
  showMatchRequirement = false,
  className,
}: PasswordRequirementsProps) {
  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains a number', met: /\d/.test(password) },
  ];

  if (showMatchRequirement && confirmPassword !== undefined) {
    requirements.push({
      label: 'Passwords match',
      met: password.length > 0 && password === confirmPassword,
    });
  }

  return (
    <ul className={cn('space-y-1.5', className)}>
      {requirements.map((req, index) => (
        <li
          key={index}
          className={cn(
            'flex items-center gap-2 text-xs transition-colors duration-200',
            req.met ? 'text-[var(--luxury-gold)]' : 'text-[var(--luxury-light-gray)]'
          )}
        >
          <span
            className={cn(
              'flex h-4 w-4 items-center justify-center rounded-full border transition-all duration-200',
              req.met
                ? 'border-[var(--luxury-gold)] bg-[var(--luxury-gold)]/20'
                : 'border-[var(--luxury-gray)]'
            )}
          >
            {req.met && (
              <svg
                className="h-2.5 w-2.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </span>
          {req.label}
        </li>
      ))}
    </ul>
  );
}
