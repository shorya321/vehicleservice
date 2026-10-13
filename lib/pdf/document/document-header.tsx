/**
 * Invoice Modern header: a band in the document ink with the issuer on the left and the
 * document title and reference on the right. A logo sits on a white chip so any logo colour
 * stays legible on the band; without one, the issuer name is set as a wordmark.
 */

import { usePdfcnTheme } from '@/components/pdf/theme-provider';
import { Image, Text, View } from '@/lib/pdf-primitives';

interface DocumentHeaderProps {
  issuerName: string;
  /** Data URI (see lib/pdf/utils/image.ts). Omit to print issuerName as a wordmark. */
  logo?: string;
  contactLines: Array<string | undefined>;
  title: string;
  reference: string;
  /** Extra lines under the reference, e.g. "Valid until 20 Oct 2026". */
  metaLines?: Array<string | undefined>;
}

export function DocumentHeader({
  issuerName,
  logo,
  contactLines,
  title,
  reference,
  metaLines = [],
}: DocumentHeaderProps) {
  const theme = usePdfcnTheme();
  const onBand = theme.colors.primaryForeground;
  const contact = contactLines.filter((line): line is string => Boolean(line));
  const meta = metaLines.filter((line): line is string => Boolean(line));

  return (
    <View
      wrap={false}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        backgroundColor: theme.colors.primary,
        borderRadius: 4,
        padding: 20,
        marginBottom: 20,
      }}
    >
      <View style={{ flex: 1, paddingRight: 16 }}>
        {logo ? (
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: '#ffffff',
              borderRadius: 3,
              padding: 6,
              marginBottom: 8,
            }}
          >
            {/* Height only: Forme keeps the aspect ratio when one dimension is given. */}
            <Image src={logo} alt={issuerName} height={30} style={{ maxWidth: 140 }} />
          </View>
        ) : (
          <Text style={{ color: onBand, fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
            {issuerName}
          </Text>
        )}
        {contact.map((line) => (
          <Text key={line} style={{ color: onBand, fontSize: 8.5, marginTop: 1 }}>
            {line}
          </Text>
        ))}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text
          style={{
            color: onBand,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 1,
            textAlign: 'right',
          }}
        >
          {title}
        </Text>
        <Text style={{ color: onBand, fontSize: 9.5, marginTop: 4, textAlign: 'right' }}>
          #{reference}
        </Text>
        {meta.map((line) => (
          <Text key={line} style={{ color: onBand, fontSize: 8.5, marginTop: 2, textAlign: 'right' }}>
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}
