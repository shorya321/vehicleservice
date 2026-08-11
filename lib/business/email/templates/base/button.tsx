import { Button as EmailButton } from '@react-email/components';
import * as React from 'react';
import { getBusinessBrand } from '../../brand';

interface ButtonProps {
  href: string;
  children: React.ReactNode;
}

/**
 * The call to action in a business email.
 *
 * The single most brand-visible element in the whole message, and the one that was
 * hardcoded to Stripe indigo for every tenant before the business module owned this
 * file. Both colours come from the brand: the fill is the tenant's accent, and the label
 * is whichever of white or near-black stays readable on it, computed rather than
 * configured so a tenant who picks a pale accent does not end up with an invisible
 * button label.
 */
export const Button = ({ href, children }: ButtonProps) => {
  const { colors } = getBusinessBrand();

  return (
    <EmailButton
      href={href}
      style={{ ...button, backgroundColor: colors.primary, color: colors.primaryText }}
    >
      {children}
    </EmailButton>
  );
};

const button = {
  borderRadius: '5px',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '16px 0',
};

export default Button;
