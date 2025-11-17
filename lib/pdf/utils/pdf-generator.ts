/**
 * PDF Generator Utilities
 * Helper functions for generating and storing PDF documents
 */

import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';

export interface PdfGenerationResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Generate PDF and upload to Supabase Storage
 * @param pdfDocument - React PDF document component
 * @param fileName - Name of the PDF file (without extension)
 * @param bucketName - Supabase storage bucket name
 * @param folder - Optional folder path within the bucket
 * @returns PDF generation result with URL
 */
export async function generateAndUploadPDF(
  pdfDocument: React.ReactElement,
  fileName: string,
  bucketName: string = 'documents',
  folder: string = 'statements'
): Promise<PdfGenerationResult> {
  try {
    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(pdfDocument);

    // Create Supabase client
    const supabase = await createClient();

    // Construct file path
    const timestamp = Date.now();
    const filePath = folder ? `${folder}/${fileName}-${timestamp}.pdf` : `${fileName}-${timestamp}.pdf`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading PDF:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(data.path);

    return {
      success: true,
      url: publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error generating PDF',
    };
  }
}

/**
 * Generate PDF buffer for direct download
 * @param pdfDocument - React PDF document component
 * @returns PDF buffer
 */
export async function generatePDFBuffer(
  pdfDocument: React.ReactElement
): Promise<Buffer> {
  try {
    return await renderToBuffer(pdfDocument);
  } catch (error) {
    console.error('Error generating PDF buffer:', error);
    throw error;
  }
}

/**
 * Delete PDF from Supabase Storage
 * @param filePath - Path to the PDF file in storage
 * @param bucketName - Supabase storage bucket name
 * @returns Deletion result
 */
export async function deletePDF(
  filePath: string,
  bucketName: string = 'documents'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.storage.from(bucketName).remove([filePath]);

    if (error) {
      console.error('Error deleting PDF:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error deleting PDF',
    };
  }
}

/**
 * Generate file name for PDFs
 * @param type - Type of PDF (invoice, statement, etc.)
 * @param businessId - Business account ID
 * @param identifier - Additional identifier (transaction ID, month/year, etc.)
 * @returns Generated file name
 */
export function generatePDFFileName(
  type: 'invoice' | 'statement',
  businessId: string,
  identifier: string
): string {
  const sanitizedBusinessId = businessId.substring(0, 8);
  const sanitizedIdentifier = identifier.replace(/[^a-zA-Z0-9-]/g, '_');

  return `${type}-${sanitizedBusinessId}-${sanitizedIdentifier}`;
}

/**
 * Get PDF download headers for HTTP responses
 * @param fileName - Name of the PDF file
 * @returns HTTP headers object
 */
export function getPDFDownloadHeaders(fileName: string): Record<string, string> {
  return {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${fileName}.pdf"`,
    'Cache-Control': 'no-cache',
  };
}
