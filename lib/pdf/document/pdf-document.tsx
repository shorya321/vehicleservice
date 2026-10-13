/**
 * Shell shared by every generated document: pdfcn theme, A4 page and a repeating footer.
 *
 * Forme serialises the tree by calling components directly, not through React's renderer, so
 * pdfcn keeps its theme in a module variable that PdfcnThemeProvider sets. Serialisation is
 * synchronous, so one document's theme can never leak into another rendered concurrently, but
 * only as long as every document is wrapped here. Nothing should render a document without it.
 */

import type { ReactNode } from 'react';
import { Document, Page } from '@formepdf/react';
import { PdfcnThemeProvider } from '@/components/pdf/theme-provider';
import { Fixed, Text, View } from '@/lib/pdf-primitives';
import type { PdfcnTheme } from '@/types/pdf-themes';

const PAGE_MARGIN = { top: 36, right: 40, bottom: 36, left: 40 };

interface PdfDocumentProps {
  theme: PdfcnTheme;
  /** PDF metadata title, shown by viewers in the window title. */
  title: string;
  /** Left side of the footer, e.g. "Generated on 13 Oct 2026 | Brand". */
  footerText: string;
  children: ReactNode;
}

function DocumentFooter({ text, theme }: { text: string; theme: PdfcnTheme }) {
  const style = { fontSize: 8, color: theme.colors.mutedForeground };
  return (
    <Fixed position="footer">
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingTop: 8,
          marginTop: 12,
        }}
      >
        <Text style={{ ...style, flex: 1, paddingRight: 12 }}>{text}</Text>
        <Text style={style}>{'Page {{pageNumber}} of {{totalPages}}'}</Text>
      </View>
    </Fixed>
  );
}

export function PdfDocument({ theme, title, footerText, children }: PdfDocumentProps) {
  return (
    <PdfcnThemeProvider theme={theme}>
      <Document title={title}>
        <Page size="A4" margin={PAGE_MARGIN}>
          <DocumentFooter text={footerText} theme={theme} />
          <View
            style={{
              fontFamily: theme.typography.body.fontFamily,
              color: theme.colors.foreground,
            }}
          >
            {children}
          </View>
        </Page>
      </Document>
    </PdfcnThemeProvider>
  );
}
