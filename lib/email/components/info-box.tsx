import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { boxStyles } from '../styles/constants';

interface InfoBoxProps {
  type?: 'info' | 'success' | 'warning' | 'error' | 'message';
  title?: string;
  children: React.ReactNode;
}

/**
 * A tinted notice. Tones carry meaning: info (gold), success (green), warning (amber),
 * error (red), message (a quoted note from a person).
 */
export const InfoBox = ({ type = 'info', title, children }: InfoBoxProps) => {
  const styles = boxStyles[type];

  return (
    <Section style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      {typeof children === 'string' ? (
        <Text style={styles.text}>{children}</Text>
      ) : (
        children
      )}
    </Section>
  );
};

export default InfoBox;
