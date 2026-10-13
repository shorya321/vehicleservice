/**
 * Document colours. Engine-free so both the theme and any generator can import them.
 */

export const pdfColors = {
  primary: '#1e40af',
  secondary: '#64748b',
  /**
   * The brand gold spectrum from app/globals.css. A PDF page is always white, and --gold itself
   * measures only 2.2:1 against it, so document type steps down the spectrum rather than off it:
   * every value here is a gold the brand already owns.
   */
  gold: '#c6aa88',      // --gold. The site's accent. Rules and fills, not type on white.
  goldDeep: '#a68b5b',  // --gold-deep. 3.3:1 on white. The accent for document type.
  goldDark: '#8b7349',  // --gold-dark. 4.5:1 on white, for anything that must meet AA at body size.
  goldText: '#6b5530',  // --gold-text. The site's own light-mode substitution.
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  text: '#1f2937',
  textLight: '#6b7280',
  border: '#e5e7eb',
  background: '#f9fafb',
  white: '#ffffff',
};
