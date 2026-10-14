import { Text } from '@react-email/components';
import * as React from 'react';
import { fonts, palette } from '../styles/constants';

interface SectionLabelProps {
  children: React.ReactNode;
}

/**
 * Small uppercase caption that opens a block, e.g. "Your journey" or "Payment". A
 * trailing colon carried over from an old inline label is dropped.
 */
export const SectionLabel = ({ children }: SectionLabelProps) => {
  const text = typeof children === 'string' ? children.replace(/:\s*$/, '') : children;
  return <Text style={style}>{text}</Text>;
};

const style = {
  color: palette.muted,
  fontFamily: fonts.sans,
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '0.14em',
  lineHeight: '16px',
  margin: '28px 0 10px',
  textTransform: 'uppercase' as const,
};

export default SectionLabel;
