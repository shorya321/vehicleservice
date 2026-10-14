import { Section } from '@react-email/components';
import * as React from 'react';
import { boxStyles } from '../styles/constants';
import SectionLabel from './section-label';

interface DetailsSectionProps {
  children: React.ReactNode;
  /** Optional caption above the card, e.g. "Booking details". */
  title?: string;
}

/** The bordered card booking details sit in. Takes the tenant's surface and border. */
export const DetailsSection = ({ children, title }: DetailsSectionProps) => {
  const style = boxStyles.details;

  return (
    <>
      {title ? <SectionLabel>{title}</SectionLabel> : null}
      <Section style={title ? { ...style, marginTop: '0' } : style}>{children}</Section>
    </>
  );
};

export default DetailsSection;
