import { Section } from '@react-email/components';
import * as React from 'react';
import { boxStyles } from '../styles/constants';

interface DetailsSectionProps {
  children: React.ReactNode;
}

/** The neutral box booking details sit in. Takes the tenant's surface and border. */
export const DetailsSection = ({ children }: DetailsSectionProps) => {
  return <Section style={boxStyles.details}>{children}</Section>;
};

export default DetailsSection;
