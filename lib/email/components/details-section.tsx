import { Section } from '@react-email/components';
import * as React from 'react';
import { boxStyles } from '../styles/constants';

interface DetailsSectionProps {
  children: React.ReactNode;
}

/**
 * Reusable gray box component for displaying details
 * Used for booking details, application info, status boxes, etc.
 */
export const DetailsSection = ({ children }: DetailsSectionProps) => {
  return <Section style={boxStyles.details}>{children}</Section>;
};

export default DetailsSection;
