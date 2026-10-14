import * as React from 'react';
import { fonts, palette } from '../styles/constants';

interface DetailRowProps {
  label: React.ReactNode;
  children: React.ReactNode;
  /** Bold, slightly larger value, for totals and the one figure that matters. */
  emphasis?: boolean;
}

/**
 * One label and value line inside a DetailsSection. Label on the left, value on the
 * right; on phones the label sits above the value.
 */
export const DetailRow = ({ label, children, emphasis = false }: DetailRowProps) => {
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={table}>
      <tbody>
        <tr>
          <td className="em-label" valign="top" style={labelCell}>
            {label}
          </td>
          <td className="em-value" valign="top" style={emphasis ? valueStrong : valueCell}>
            {children}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

const table = { borderCollapse: 'collapse' as const };

const labelCell = {
  color: palette.muted,
  fontFamily: fonts.sans,
  fontSize: '13px',
  lineHeight: '21px',
  padding: '7px 16px 7px 0',
  width: '38%',
};

const valueCell = {
  color: palette.ink,
  fontFamily: fonts.sans,
  fontSize: '14px',
  lineHeight: '21px',
  padding: '7px 0',
};

const valueStrong = {
  ...valueCell,
  fontSize: '15px',
  fontWeight: '600',
};

export default DetailRow;
