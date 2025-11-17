/**
 * CSV Generator Utility
 * Utilities for generating CSV files from transaction data
 */

export interface CSVColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

export interface CSVOptions {
  columns: CSVColumn[];
  filename?: string;
  includeHeaders?: boolean;
}

/**
 * Escapes a CSV value to handle special characters
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If the value contains comma, double quote, or newline, wrap it in quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    // Escape double quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Converts an array of objects to CSV string
 */
export function generateCSV<T extends Record<string, any>>(
  data: T[],
  options: CSVOptions
): string {
  const { columns, includeHeaders = true } = options;

  const lines: string[] = [];

  // Add header row
  if (includeHeaders) {
    const headers = columns.map((col) => escapeCSVValue(col.label));
    lines.push(headers.join(','));
  }

  // Add data rows
  for (const row of data) {
    const values = columns.map((col) => {
      const value = row[col.key];
      const formattedValue = col.format ? col.format(value) : value;
      return escapeCSVValue(formattedValue);
    });
    lines.push(values.join(','));
  }

  return lines.join('\n');
}

/**
 * Triggers a CSV file download in the browser
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for UTF-8 encoding
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create a download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Formats a date for CSV export
 */
export function formatDateForCSV(date: Date | string | null): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  // Format as YYYY-MM-DD HH:MM:SS
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Formats a number for CSV export with specified decimal places
 */
export function formatNumberForCSV(value: number | null, decimals: number = 2): string {
  if (value === null || value === undefined) return '';
  return value.toFixed(decimals);
}

/**
 * Formats currency for CSV export
 */
export function formatCurrencyForCSV(amount: number | null, currency: string): string {
  if (amount === null || amount === undefined) return '';
  return `${formatNumberForCSV(amount, 2)} ${currency}`;
}

/**
 * Default transaction CSV columns configuration
 */
export const DEFAULT_TRANSACTION_COLUMNS: CSVColumn[] = [
  {
    key: 'transaction_id',
    label: 'Transaction ID',
  },
  {
    key: 'transaction_date',
    label: 'Date & Time',
    format: formatDateForCSV,
  },
  {
    key: 'transaction_type',
    label: 'Type',
  },
  {
    key: 'description',
    label: 'Description',
  },
  {
    key: 'amount',
    label: 'Amount',
    format: (value) => formatNumberForCSV(value, 2),
  },
  {
    key: 'currency',
    label: 'Currency',
  },
  {
    key: 'balance_after',
    label: 'Balance After',
    format: (value) => formatNumberForCSV(value, 2),
  },
  {
    key: 'reference_id',
    label: 'Reference ID',
  },
  {
    key: 'stripe_payment_intent_id',
    label: 'Stripe Payment Intent ID',
  },
  {
    key: 'created_by',
    label: 'Created By',
  },
];

/**
 * Extended transaction CSV columns (includes exchange rate fields)
 */
export const EXTENDED_TRANSACTION_COLUMNS: CSVColumn[] = [
  ...DEFAULT_TRANSACTION_COLUMNS,
  {
    key: 'original_amount',
    label: 'Original Amount',
    format: (value) => (value ? formatNumberForCSV(value, 2) : ''),
  },
  {
    key: 'original_currency',
    label: 'Original Currency',
  },
  {
    key: 'exchange_rate',
    label: 'Exchange Rate',
    format: (value) => (value ? formatNumberForCSV(value, 6) : ''),
  },
];

/**
 * Generates a filename for transaction export
 */
export function generateTransactionExportFilename(
  businessName: string,
  startDate?: Date | string,
  endDate?: Date | string
): string {
  const sanitizedName = businessName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  let filename = `${sanitizedName}_transactions`;

  if (startDate) {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    filename += `_from_${start.toISOString().split('T')[0]}`;
  }

  if (endDate) {
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    filename += `_to_${end.toISOString().split('T')[0]}`;
  }

  filename += `_${timestamp}.csv`;

  return filename;
}
