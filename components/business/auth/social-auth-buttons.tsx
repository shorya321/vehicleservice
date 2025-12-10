/**
 * Social Auth Buttons Component
 * Social login buttons for Google, Facebook, and X (Twitter)
 *
 * SCOPE: Business module ONLY
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { authSocialButton } from '@/lib/business/animation/variants';
import { useReducedMotion } from '@/lib/business/animation/hooks';

type SocialProvider = 'google' | 'facebook' | 'twitter';

interface SocialAuthButtonsProps {
  /** Which providers to show */
  providers?: SocialProvider[];
  /** Callback when a provider is clicked */
  onProviderClick?: (provider: SocialProvider) => Promise<void>;
  /** Whether all buttons are disabled */
  disabled?: boolean;
  /** Layout direction */
  layout?: 'horizontal' | 'vertical';
  /** Additional class names */
  className?: string;
}

// Social provider icons
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const providerConfig: Record<SocialProvider, {
  name: string;
  icon: React.ComponentType;
  bgHover: string;
}> = {
  google: {
    name: 'Google',
    icon: GoogleIcon,
    bgHover: 'hover:bg-white/5',
  },
  facebook: {
    name: 'Facebook',
    icon: FacebookIcon,
    bgHover: 'hover:bg-[#1877F2]/10',
  },
  twitter: {
    name: 'X',
    icon: TwitterIcon,
    bgHover: 'hover:bg-white/5',
  },
};

export function SocialAuthButtons({
  providers = ['google', 'facebook', 'twitter'],
  onProviderClick,
  disabled = false,
  layout = 'horizontal',
  className,
}: SocialAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const handleClick = async (provider: SocialProvider) => {
    if (disabled || loadingProvider) return;

    setLoadingProvider(provider);

    try {
      if (onProviderClick) {
        await onProviderClick(provider);
      } else {
        // Default behavior: show coming soon toast
        await new Promise((resolve) => setTimeout(resolve, 500));
        toast.info('Coming soon', {
          description: `${providerConfig[provider].name} sign-in will be available soon.`,
        });
      }
    } catch (error) {
      toast.error('Authentication failed', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setLoadingProvider(null);
    }
  };

  const ButtonWrapper = prefersReducedMotion ? 'div' : motion.div;

  return (
    <div
      className={cn(
        'flex gap-3',
        layout === 'vertical' ? 'flex-col' : 'flex-row',
        className
      )}
    >
      {providers.map((provider, index) => {
        const config = providerConfig[provider];
        const Icon = config.icon;
        const isLoading = loadingProvider === provider;

        return (
          <ButtonWrapper
            key={provider}
            {...(!prefersReducedMotion && {
              variants: authSocialButton,
              custom: index,
            })}
            className="flex-1"
          >
            <button
              type="button"
              onClick={() => handleClick(provider)}
              disabled={disabled || loadingProvider !== null}
              className={cn(
                'auth-social-btn w-full',
                config.bgHover,
                isLoading && 'opacity-70',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Icon />
              )}
              {layout === 'vertical' && (
                <span className="ml-2">{config.name}</span>
              )}
            </button>
          </ButtonWrapper>
        );
      })}
    </div>
  );
}

/**
 * Single social button for custom layouts
 */
interface SocialButtonProps {
  provider: SocialProvider;
  onClick?: () => Promise<void>;
  disabled?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function SocialButton({
  provider,
  onClick,
  disabled = false,
  showLabel = false,
  className,
}: SocialButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const config = providerConfig[provider];
  const Icon = config.icon;

  const handleClick = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      if (onClick) {
        await onClick();
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
        toast.info('Coming soon', {
          description: `${config.name} sign-in will be available soon.`,
        });
      }
    } catch (error) {
      toast.error('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        'auth-social-btn',
        config.bgHover,
        isLoading && 'opacity-70',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Icon />
      )}
      {showLabel && <span>{config.name}</span>}
    </button>
  );
}
