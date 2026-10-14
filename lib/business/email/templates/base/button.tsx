import { Button as EmailButton } from '@react-email/components';
import * as React from 'react';
import { getBusinessPalette } from '../../brand';
import { fonts } from '../../styles/constants';

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  /** `outline` for a secondary action next to a primary one. */
  variant?: 'primary' | 'outline';
}

/**
 * The call to action in a business email.
 *
 * The single most brand-visible element in the whole message. Both colours come from the
 * brand: the fill is the tenant's accent, and the label is whichever of white or
 * near-black stays readable on it, computed rather than configured so a tenant who picks
 * a pale accent does not end up with an invisible button label.
 */
export const Button = ({ href, children, variant = 'primary' }: ButtonProps) => {
  const p = getBusinessPalette();
  const style =
    variant === 'outline'
      ? {
          ...base,
          backgroundColor: p.card,
          border: `1px solid ${p.ink}`,
          color: p.ink,
          padding: '15px 24px',
        }
      : {
          ...base,
          backgroundColor: p.button,
          border: `1px solid ${p.button}`,
          color: p.buttonText,
          padding: '15px 26px',
        };

  return (
    <EmailButton href={href} className="em-btn" style={style}>
      {children}
    </EmailButton>
  );
};

const base = {
  borderRadius: '8px',
  fontFamily: fonts.sans,
  fontSize: '14px',
  fontWeight: '600',
  letterSpacing: '0.03em',
  lineHeight: '20px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  margin: '16px 10px 16px 0',
};

export default Button;
