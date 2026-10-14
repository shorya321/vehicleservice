import { Section } from '@react-email/components';
import * as React from 'react';
import { boxStyles } from '../styles/constants';
import SectionLabel from './section-label';

interface DetailsSectionProps {
  children: React.ReactNode;
  /** Optional caption above the card, e.g. "Booking details". */
  title?: string;
}

/**
 * The bordered card booking details, application info and similar blocks sit in.
 * Holds DetailRow lines, or any Text and Hr children.
 */
export const DetailsSection = ({ children, title }: DetailsSectionProps) => {
  return (
    <>
      {title ? <SectionLabel>{title}</SectionLabel> : null}
      <Section style={title ? { ...boxStyles.details, marginTop: '0' } : boxStyles.details}>
        {children}
      </Section>
    </>
  );
};

export default DetailsSection;
