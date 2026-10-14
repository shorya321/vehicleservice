import * as React from 'react';
import { fonts, palette } from '../styles/constants';

export interface FareLine {
  label: React.ReactNode;
  /** Pre-formatted, e.g. "AED 380.00". */
  amount: React.ReactNode;
}

interface FareLedgerProps {
  items: readonly FareLine[];
  totalLabel: React.ReactNode;
  total: React.ReactNode;
  /** Small print under the total: payment method, currency conversion. */
  note?: React.ReactNode;
}

/** Line items, a ruled total and an optional note. */
export const FareLedger = ({ items, totalLabel, total, note }: FareLedgerProps) => {
  return (
    <>
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={table}>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td style={lineLabel}>{item.label}</td>
              <td align="right" style={lineAmount}>
                {item.amount}
              </td>
            </tr>
          ))}
          <tr>
            <td style={totalLabelCell}>{totalLabel}</td>
            <td align="right" style={totalCell}>
              {total}
            </td>
          </tr>
        </tbody>
      </table>
      {note ? <div style={noteStyle}>{note}</div> : null}
    </>
  );
};

const table = { borderCollapse: 'collapse' as const };

const lineLabel = {
  color: palette.body,
  fontFamily: fonts.sans,
  fontSize: '14px',
  lineHeight: '20px',
  padding: '8px 12px 8px 0',
};

const lineAmount = {
  color: palette.ink,
  fontFamily: fonts.sans,
  fontSize: '14px',
  lineHeight: '20px',
  padding: '8px 0',
  whiteSpace: 'nowrap' as const,
};

const totalLabelCell = {
  borderTop: `1.5px solid ${palette.ink}`,
  color: palette.ink,
  fontFamily: fonts.sans,
  fontSize: '14px',
  fontWeight: '600',
  padding: '14px 12px 2px 0',
};

const totalCell = {
  borderTop: `1.5px solid ${palette.ink}`,
  color: palette.ink,
  fontFamily: fonts.display,
  fontSize: '24px',
  lineHeight: '30px',
  padding: '12px 0 2px',
  whiteSpace: 'nowrap' as const,
};

const noteStyle = {
  color: palette.muted,
  fontFamily: fonts.sans,
  fontSize: '12px',
  lineHeight: '19px',
  marginTop: '10px',
};

export default FareLedger;
