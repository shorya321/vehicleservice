/**
 * Invoice Modern building blocks shared by every generator, composed from pdfcn components.
 * Every value they print is passed in pre-formatted; nothing here derives a number.
 */

import type { ReactNode } from 'react';
import { usePdfcnTheme } from '@/components/pdf/theme-provider';
import { KeyValue, type KeyValueEntry } from '@/components/pdf/key-value/key-value';
import { Text, View } from '@/lib/pdf-primitives';
import type { Style } from '@/lib/pdf-primitives';

export interface MetaItem {
  label: string;
  value: string;
}

export interface Party {
  label: string;
  /** First line is set bold (the name); the rest are muted. Empty lines are dropped. */
  lines: Array<string | undefined>;
}

/** Small uppercase label used above every section and meta value. */
export function SectionLabel({ children, style }: { children: ReactNode; style?: Style }) {
  const theme = usePdfcnTheme();
  return (
    <Text
      style={{
        color: theme.colors.mutedForeground,
        fontSize: 8,
        fontWeight: 700,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 4,
        ...style,
      }}
    >
      {children}
    </Text>
  );
}

/** Document facts in a two-up grid, a rule, then the party the document is addressed to. */
export function MetaGrid({ items, party }: { items: MetaItem[]; party?: Party }) {
  const theme = usePdfcnTheme();
  const lines = party?.lines.filter((line): line is string => Boolean(line)) ?? [];
  return (
    <View wrap={false} style={{ flexDirection: 'row', marginBottom: 20 }}>
      <View style={{ flex: 3, flexDirection: 'row', flexWrap: 'wrap' }}>
        {items.map((item) => (
          <View key={item.label} style={{ width: '50%', paddingRight: 10, marginBottom: 10 }}>
            <SectionLabel style={{ marginBottom: 3 }}>{item.label}</SectionLabel>
            <Text style={{ fontSize: 9.5 }}>{item.value}</Text>
          </View>
        ))}
      </View>
      {party && (
        <>
          <View style={{ width: 1, backgroundColor: theme.colors.border, marginRight: 14 }} />
          <View style={{ flex: 2 }}>
            <SectionLabel style={{ marginBottom: 3 }}>{party.label}</SectionLabel>
            {lines.map((line, index) => (
              <Text
                key={`${index}-${line}`}
                style={{
                  fontSize: 9.5,
                  fontWeight: index === 0 ? 700 : 400,
                  color: index === 0 ? theme.colors.foreground : theme.colors.mutedForeground,
                  marginTop: index === 0 ? 0 : 1,
                }}
              >
                {line}
              </Text>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

/**
 * Label/value rows on a muted panel, for trip and transaction details. Own rows rather than
 * pdfcn KeyValue, which right-aligns values: a long address reads badly ragged-left.
 */
export function DetailPanel({ title, items }: { title: string; items: MetaItem[] }) {
  const theme = usePdfcnTheme();
  return (
    <View wrap={false} style={{ marginBottom: 18 }}>
      <SectionLabel>{title}</SectionLabel>
      <View style={{ backgroundColor: theme.colors.muted, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 8 }}>
        {items.map((item, index) => (
          <View
            key={`${index}-${item.label}`}
            style={{
              flexDirection: 'row',
              paddingVertical: 4,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: theme.colors.border,
            }}
          >
            <Text style={{ width: 120, fontSize: 9.5, color: theme.colors.mutedForeground }}>
              {item.label}
            </Text>
            <Text style={{ flex: 1, fontSize: 9.5 }}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Right-aligned totals with a rule above the final line, which is set in the document ink.
 * Kept on one page: a total orphaned from its subtotal is the worst outcome on a document.
 */
export function TotalsBox({
  rows,
  total,
  note,
  aside,
}: {
  rows: KeyValueEntry[];
  total: { label: string; value: string; color?: string };
  note?: string;
  aside?: ReactNode;
}) {
  const theme = usePdfcnTheme();
  const items: KeyValueEntry[] = [
    ...rows,
    {
      key: total.label,
      value: total.value,
      keyStyle: { fontSize: 11, fontWeight: 700, color: theme.colors.foreground },
      valueStyle: { fontSize: 13, fontWeight: 700, color: total.color ?? theme.colors.accent },
    },
  ];
  return (
    <View wrap={false} style={{ flexDirection: 'row', marginTop: 14, marginBottom: 18 }}>
      <View style={{ flex: 1, paddingRight: 20 }}>{aside}</View>
      <View style={{ width: 250 }}>
        <KeyValue size="sm" divided dividerThickness={1} items={items} />
        {note && (
          <Text style={{ fontSize: 7.5, color: theme.colors.mutedForeground, marginTop: 6, textAlign: 'right' }}>
            {note}
          </Text>
        )}
      </View>
    </View>
  );
}

/** A titled paragraph of small muted text: notes, terms, important information. */
export function NotesBlock({ title, children }: { title: string; children: ReactNode }) {
  const theme = usePdfcnTheme();
  return (
    <View wrap={false} style={{ marginBottom: 12 }}>
      <SectionLabel>{title}</SectionLabel>
      <Text style={{ fontSize: 8.5, lineHeight: 1.5, color: theme.colors.mutedForeground }}>
        {children}
      </Text>
    </View>
  );
}
