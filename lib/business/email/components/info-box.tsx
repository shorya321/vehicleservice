import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { boxStyles } from '../styles/constants';

interface InfoBoxProps {
  type?: 'info' | 'success' | 'warning' | 'error' | 'message';
  title?: string;
  children: React.ReactNode;
}

/**
 * A callout box. Success, warning and error carry meaning rather than identity and stay
 * fixed: green reads as good and amber as caution to a recipient regardless of whose
 * logo is at the top, and a tenant whose accent is red must not end up with a red
 * success box. Info and message are neutral and take the tenant's tint.
 */
export const InfoBox = ({ type = 'info', title, children }: InfoBoxProps) => {
  const styles = boxStyles[type];

  return (
    <Section style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      {typeof children === 'string' ? <Text style={styles.text}>{children}</Text> : children}
    </Section>
  );
};

export default InfoBox;
