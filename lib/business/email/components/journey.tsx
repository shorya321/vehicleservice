import * as React from 'react';
import { fonts, palette as getPalette } from '../styles/constants';

interface JourneyProps {
  pickup: React.ReactNode;
  /** Omitted for an hourly hire with no fixed drop-off. */
  dropoff?: React.ReactNode;
  /** Pickup time, shown large beside the pickup stop, e.g. "09:30". */
  time?: React.ReactNode;
  /** Pickup date under the time, e.g. "12 August 2026". */
  date?: React.ReactNode;
  /** A single date and time line, for callers that only have one formatted string. */
  when?: React.ReactNode;
  /** Header strip, e.g. "Outbound · TR-02". */
  label?: React.ReactNode;
  /** Right side of the header strip. Hidden on phones. */
  aside?: React.ReactNode;
  /** Text beside the rail between the two stops. */
  note?: React.ReactNode;
  /** Extra lines under the stops (flight, notes). */
  children?: React.ReactNode;
}

/**
 * A journey drawn as a timeline: pickup, a rail, drop-off. One card per leg, so a round
 * trip or multi-city trip reads as a sequence instead of a wall of labelled rows.
 */
export const Journey = ({
  pickup,
  dropoff,
  time,
  date,
  when,
  label,
  aside,
  note,
  children,
}: JourneyProps) => {
  const { card, head, headLabel, headAside, body, whenLine, timeCol, timeBig, timeDate, railCol, ringDot, filledDot, railLine, placeCol, stopLabel, place, noteCell, extra } = makeStyles();
  const hasTime = time !== undefined && time !== null && time !== '';

  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={card}>
      <tbody>
        {label ? (
          <tr>
            <td style={head}>
              <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
                <tbody>
                  <tr>
                    <td style={headLabel}>{label}</td>
                    {aside ? (
                      <td className="em-hide" align="right" style={headAside}>
                        {aside}
                      </td>
                    ) : null}
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        ) : null}
        <tr>
          <td style={body}>
            {when ? <div style={whenLine}>{when}</div> : null}
            {!when && !hasTime && date ? <div style={whenLine}>{date}</div> : null}
            <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr>
                  {hasTime ? (
                    <td className="em-tcol" valign="top" style={timeCol} rowSpan={dropoff ? 3 : 1}>
                      <div style={timeBig}>{time}</div>
                      {date ? <div style={timeDate}>{date}</div> : null}
                    </td>
                  ) : null}
                  <td valign="top" align="center" style={railCol}>
                    <span style={ringDot}>&nbsp;</span>
                  </td>
                  <td valign="top" style={placeCol}>
                    <div style={stopLabel}>Pickup</div>
                    <div style={place}>{pickup}</div>
                  </td>
                </tr>
                {dropoff ? (
                  <>
                    <tr>
                      <td align="center" style={railCol}>
                        <div style={railLine}>&nbsp;</div>
                      </td>
                      <td valign="middle" style={noteCell}>
                        {note}
                      </td>
                    </tr>
                    <tr>
                      <td valign="top" align="center" style={railCol}>
                        <span style={filledDot}>&nbsp;</span>
                      </td>
                      <td valign="top" style={placeCol}>
                        <div style={stopLabel}>Drop-off</div>
                        <div style={place}>{dropoff}</div>
                      </td>
                    </tr>
                  </>
                ) : null}
              </tbody>
            </table>
            {children ? <div style={extra}>{children}</div> : null}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

/** Built per render, inside the brand scope, so each tenant gets its own colours. */
function makeStyles() {
  const palette = getPalette();

  const card = {
    borderCollapse: 'separate' as const,
    border: `1px solid ${palette.line}`,
    borderRadius: '12px',
    margin: '0 0 12px',
  };

  const head = {
    backgroundColor: palette.soft,
    borderBottom: `1px solid ${palette.line}`,
    borderRadius: '12px 12px 0 0',
    padding: '11px 20px',
  };

  const headLabel = {
    color: palette.accentInk,
    fontFamily: fonts.sans,
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
  };

  const headAside = {
    color: palette.muted,
    fontFamily: fonts.sans,
    fontSize: '12px',
  };

  const body = { padding: '20px' };

  const whenLine = {
    color: palette.ink,
    fontFamily: fonts.display,
    fontSize: '18px',
    lineHeight: '24px',
    margin: '0 0 16px',
  };

  const timeCol = { width: '84px', paddingRight: '4px' };

  const timeBig = {
    color: palette.ink,
    fontFamily: fonts.display,
    fontSize: '22px',
    lineHeight: '24px',
  };

  const timeDate = {
    color: palette.muted,
    fontFamily: fonts.sans,
    fontSize: '12px',
    lineHeight: '17px',
    marginTop: '6px',
  };

  const railCol = { width: '24px', padding: '0' };

  const ringDot = {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    border: `2px solid ${palette.accent}`,
    borderRadius: '50%',
    backgroundColor: palette.card,
    fontSize: '0',
    lineHeight: '0',
    marginTop: '4px',
  };

  const filledDot = {
    display: 'inline-block',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: palette.accent,
    fontSize: '0',
    lineHeight: '0',
    marginTop: '4px',
  };

  const railLine = {
    width: '2px',
    height: '30px',
    backgroundColor: palette.paleLine,
    margin: '4px auto',
    fontSize: '0',
    lineHeight: '0',
  };

  const placeCol = { padding: '0 0 0 10px' };

  const stopLabel = {
    color: palette.muted,
    fontFamily: fonts.sans,
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.12em',
    lineHeight: '15px',
    textTransform: 'uppercase' as const,
  };

  const place = {
    color: palette.ink,
    fontFamily: fonts.sans,
    fontSize: '15px',
    fontWeight: '600',
    lineHeight: '22px',
    marginTop: '2px',
  };

  const noteCell = {
    color: palette.body,
    fontFamily: fonts.sans,
    fontSize: '13px',
    lineHeight: '19px',
    padding: '4px 0 4px 10px',
  };

  const extra = {
    borderTop: `1px solid ${palette.line}`,
    marginTop: '16px',
    paddingTop: '6px',
  };

  return { card, head, headLabel, headAside, body, whenLine, timeCol, timeBig, timeDate, railCol, ringDot, filledDot, railLine, placeCol, stopLabel, place, noteCell, extra };
}

export default Journey;
