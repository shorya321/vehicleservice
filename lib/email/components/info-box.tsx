import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { boxStyles } from '../styles/constants';

interface InfoBoxProps {
  type?: 'info' | 'success' | 'warning' | 'message';
  title?: string;
  children: React.ReactNode;
}

/**
 * Reusable info box component for emails
 * Supports different visual styles: info (blue), success (green), warning (yellow), message (light blue)
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
