/**
 * PDF Generator Utilities
 * Helper functions for generating and storing PDF documents
 */

import { serialize } from '@formepdf/react';
import { renderSerializedDoc } from '@formepdf/core';
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
/**
 * Render a Forme document element to a Node Buffer. Forme returns a Uint8Array; callers were
 * written against a Buffer, so the type stays the same for them.
 *
 * Serialised here with the same @formepdf/react our components import, rather than through
 * renderDocument(), which loads its own copy with a dynamic import. Forme recognises <Page>,
 * <View> and the rest by identity, so a second copy (any loader that resolves the package
 * twice) silently renders an empty document with zero pages.
 */
async function renderToPdfBuffer(pdfDocument: React.ReactElement): Promise<Buffer> {
  // serialize() is typed FormeDocument, renderSerializedDoc() takes the same object as a plain
  // record (it is shared with the non-React adapters), so the types differ by name only.
  const doc = serialize(pdfDocument) as unknown as Parameters<typeof renderSerializedDoc>[0];
  const bytes = await renderSerializedDoc(doc);
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

export async function generateAndUploadPDF(
  pdfDocument: React.ReactElement,
  fileName: string,
  bucketName: string = 'documents',
  folder: string = 'statements'
): Promise<PdfGenerationResult> {
  try {
    // Generate PDF buffer
    const pdfBuffer = await renderToPdfBuffer(pdfDocument);

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
    return await renderToPdfBuffer(pdfDocument);
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
