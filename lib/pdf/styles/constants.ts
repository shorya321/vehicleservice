/**
 * PDF Styles Constants
 * Common styling for PDF documents
 */

import { StyleSheet } from '@react-pdf/renderer';

export const pdfColors = {
  primary: '#1e40af',
  secondary: '#64748b',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  text: '#1f2937',
  textLight: '#6b7280',
  border: '#e5e7eb',
  background: '#f9fafb',
  white: '#ffffff',
};

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: pdfColors.text,
    backgroundColor: pdfColors.white,
  },

  // Header styles
  header: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: `2 solid ${pdfColors.border}`,
  },

  logo: {
    width: 120,
    height: 40,
    marginBottom: 10,
  },

  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: pdfColors.primary,
    marginBottom: 5,
  },

  companyInfo: {
    fontSize: 9,
    color: pdfColors.textLight,
    marginBottom: 2,
  },

  // Title styles
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: pdfColors.primary,
  },

  subtitle: {
    fontSize: 12,
    color: pdfColors.textLight,
    marginBottom: 20,
  },

  // Section styles
  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: pdfColors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Info box styles
  infoBox: {
    backgroundColor: pdfColors.background,
    padding: 15,
    borderRadius: 4,
    marginBottom: 15,
  },

  infoBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  infoBoxLabel: {
    fontSize: 9,
    color: pdfColors.textLight,
  },

  infoBoxValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: pdfColors.text,
  },

  // Table styles
  table: {
    width: '100%',
    marginBottom: 20,
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: pdfColors.background,
    padding: 10,
    borderBottom: `2 solid ${pdfColors.border}`,
    fontWeight: 'bold',
    fontSize: 9,
  },

  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottom: `1 solid ${pdfColors.border}`,
  },

  tableCell: {
    fontSize: 9,
  },

  tableCellHeader: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },

  // Grid layout
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  column: {
    flex: 1,
  },

  columnHalf: {
    width: '48%',
  },

  // Summary/Total styles
  summaryBox: {
    backgroundColor: pdfColors.background,
    padding: 15,
    borderRadius: 4,
    marginTop: 20,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  summaryLabel: {
    fontSize: 10,
    color: pdfColors.textLight,
  },

  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: pdfColors.text,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 10,
    borderTop: `2 solid ${pdfColors.border}`,
  },

  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: pdfColors.text,
  },

  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: pdfColors.primary,
  },

  // Footer styles
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    paddingTop: 15,
    borderTop: `1 solid ${pdfColors.border}`,
    fontSize: 8,
    color: pdfColors.textLight,
    textAlign: 'center',
  },

  // Utility styles
  textBold: {
    fontWeight: 'bold',
  },

  textRight: {
    textAlign: 'right',
  },

  textCenter: {
    textAlign: 'center',
  },

  textSuccess: {
    color: pdfColors.success,
  },

  textError: {
    color: pdfColors.error,
  },

  textWarning: {
    color: pdfColors.warning,
  },

  mb5: {
    marginBottom: 5,
  },

  mb10: {
    marginBottom: 10,
  },

  mb15: {
    marginBottom: 15,
  },

  mb20: {
    marginBottom: 20,
  },
});
