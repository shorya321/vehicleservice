import * as React from 'react';
import { fonts, palette } from '../styles/constants';

interface StatBlockProps {
  label: React.ReactNode;
  /** The figure, pre-formatted, e.g. "AED 1,240.00". */
  value: React.ReactNode;
  /** A line or two under the figure. */
  children?: React.ReactNode;
}

/** One headline figure on a tinted panel: a payout, a balance, an amount refunded. */
export const StatBlock = ({ label, value, children }: StatBlockProps) => {
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={card}>
      <tbody>
        <tr>
          <td style={cell}>
            <div style={labelStyle}>{label}</div>
            <div style={valueStyle}>{value}</div>
            {children ? <div style={sub}>{children}</div> : null}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

const card = {
  borderCollapse: 'separate' as const,
  backgroundColor: palette.pale,
  border: `1px solid ${palette.paleLine}`,
  borderRadius: '12px',
  margin: '20px 0',
};

const cell = { padding: '20px 22px' };

const labelStyle = {
  color: palette.accentInk,
  fontFamily: fonts.sans,
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '0.14em',
  lineHeight: '16px',
  textTransform: 'uppercase' as const,
};

const valueStyle = {
  color: palette.ink,
  fontFamily: fonts.display,
  fontSize: '32px',
  lineHeight: '38px',
  marginTop: '8px',
};

const sub = {
  color: palette.body,
  fontFamily: fonts.sans,
  fontSize: '13px',
  lineHeight: '20px',
  marginTop: '6px',
};

export default StatBlock;
