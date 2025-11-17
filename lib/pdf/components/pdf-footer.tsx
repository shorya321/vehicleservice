/**
 * PDF Footer Component
 * Reusable footer for PDF documents
 */

import { View, Text } from '@react-pdf/renderer';
import { pdfStyles } from '../styles/constants';

interface PdfFooterProps {
  generatedDate: string;
  pageNumbers?: boolean;
}

export const PdfFooter = ({ generatedDate, pageNumbers = true }: PdfFooterProps) => {
  return (
    <View style={pdfStyles.footer} fixed>
      <Text>
        Generated on {generatedDate} | Vehicle Service
        {pageNumbers && ' | Page '}
      </Text>
      {pageNumbers && (
        <Text
          render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`}
          fixed
        />
      )}
    </View>
  );
};
