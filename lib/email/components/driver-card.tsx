import * as React from 'react';
import { fonts, palette } from '../styles/constants';

interface DriverCardProps {
  name: string;
  /** Rendered as a tel: link when present. */
  phone?: string;
  /** Vehicle line, e.g. "Mercedes-Benz E-Class, Black". */
  vehicle?: React.ReactNode;
  plate?: string;
  /** Extra lines under the card (licence, email). */
  children?: React.ReactNode;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return letters.map((p) => p.charAt(0).toUpperCase()).join('') || '?';
}

/** The driver as a person: initials, name, phone, then vehicle and plate. */
export const DriverCard = ({ name, phone, vehicle, plate, children }: DriverCardProps) => {
  const hasVehicle = Boolean(vehicle) || Boolean(plate);

  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={card}>
      <tbody>
        <tr>
          <td style={top}>
            <table role="presentation" cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr>
                  <td valign="middle" style={avatarCell}>
                    <div style={avatar}>{initialsOf(name)}</div>
                  </td>
                  <td valign="middle" style={{ paddingLeft: '14px' }}>
                    <div style={nameStyle}>{name}</div>
                    {phone ? (
                      <div style={phoneLine}>
                        <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} style={phoneLink}>
                          {phone}
                        </a>
                      </div>
                    ) : null}
                  </td>
                </tr>
              </tbody>
            </table>
            {children ? <div style={extra}>{children}</div> : null}
          </td>
        </tr>
        {hasVehicle ? (
          <tr>
            <td style={bottom}>
              <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
                <tbody>
                  <tr>
                    <td className="em-stack" style={vehicleCell}>
                      {vehicle}
                    </td>
                    {plate ? (
                      <td className="em-stack em-stack-gap" align="right" style={plateCell}>
                        <span style={plateStyle}>{plate}</span>
                      </td>
                    ) : null}
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
};

const card = {
  borderCollapse: 'separate' as const,
  border: `1px solid ${palette.line}`,
  borderRadius: '12px',
  margin: '16px 0',
};

const top = { padding: '20px' };

const avatarCell = { width: '52px' };

const avatar = {
  width: '52px',
  height: '52px',
  borderRadius: '50%',
  backgroundColor: palette.band,
  color: palette.bandText,
  fontFamily: fonts.display,
  fontSize: '19px',
  lineHeight: '52px',
  textAlign: 'center' as const,
};

const nameStyle = {
  color: palette.ink,
  fontFamily: fonts.display,
  fontSize: '20px',
  lineHeight: '26px',
};

const phoneLine = {
  fontFamily: fonts.sans,
  fontSize: '14px',
  lineHeight: '20px',
  marginTop: '3px',
};

const phoneLink = { color: palette.accentInk, textDecoration: 'underline' };

const extra = { marginTop: '12px' };

const bottom = {
  backgroundColor: palette.soft,
  borderTop: `1px solid ${palette.line}`,
  borderRadius: '0 0 12px 12px',
  padding: '14px 20px',
};

const vehicleCell = {
  color: palette.ink,
  fontFamily: fonts.sans,
  fontSize: '14px',
  lineHeight: '20px',
};

const plateCell = { whiteSpace: 'nowrap' as const };

const plateStyle = {
  display: 'inline-block',
  backgroundColor: palette.card,
  border: `1.5px solid ${palette.ink}`,
  borderRadius: '5px',
  color: palette.ink,
  fontFamily: fonts.mono,
  fontSize: '13px',
  fontWeight: '500',
  letterSpacing: '0.06em',
  padding: '5px 10px',
};

export default DriverCard;
