/**
 * PDF Header Component
 * Reusable header for PDF documents
 */

import { View, Text } from '@react-pdf/renderer';
import { pdfStyles } from '../styles/constants';

interface PdfHeaderProps {
  title: string;
  subtitle?: string;
  businessName?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: string;
}

export const PdfHeader = ({
  title,
  subtitle,
  businessName,
  businessEmail,
  businessPhone,
  businessAddress,
}: PdfHeaderProps) => {
  return (
    <View style={pdfStyles.header}>
      {/* Company/Business Info */}
      {businessName && (
        <View style={pdfStyles.mb10}>
          <Text style={pdfStyles.companyName}>{businessName}</Text>
          {businessEmail && (
            <Text style={pdfStyles.companyInfo}>{businessEmail}</Text>
          )}
          {businessPhone && (
            <Text style={pdfStyles.companyInfo}>{businessPhone}</Text>
          )}
          {businessAddress && (
            <Text style={pdfStyles.companyInfo}>{businessAddress}</Text>
          )}
        </View>
      )}

      {/* Document Title */}
      <View>
        <Text style={pdfStyles.title}>{title}</Text>
        {subtitle && <Text style={pdfStyles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
};
