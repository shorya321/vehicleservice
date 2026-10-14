import { Button as EmailButton } from '@react-email/components';
import * as React from 'react';
import { fonts, palette } from '../../styles/constants';

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  /** `outline` for a secondary action next to a primary one. */
  variant?: 'primary' | 'outline';
}

/**
 * A filled call to action. Rendered as a padded link, so Outlook keeps the shape and the
 * whole block stays clickable. Consecutive buttons sit side by side and wrap on phones.
 */
export const Button = ({ href, children, variant = 'primary' }: ButtonProps) => {
  return (
    <EmailButton
      href={href}
      className="em-btn"
      style={variant === 'outline' ? outline : primary}
    >
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

const primary = {
  ...base,
  backgroundColor: palette.button,
  border: `1px solid ${palette.button}`,
  color: palette.buttonText,
  padding: '15px 26px',
};

const outline = {
  ...base,
  backgroundColor: palette.card,
  border: `1px solid ${palette.ink}`,
  color: palette.ink,
  padding: '15px 24px',
};

export default Button;
