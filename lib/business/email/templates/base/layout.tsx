import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { EMAIL_FONTS_HREF, getBusinessBrand, getBusinessPalette } from '../../brand';
import { fonts, toneInk, type EmailTone } from '../../styles/constants';

interface BusinessEmailLayoutProps {
  preview: string;
  heading: string;
  children: React.ReactNode;
  /** Short uppercase line above the headline, e.g. "Booking confirmed". */
  eyebrow?: string;
  /** Colours the eyebrow for cancellations, alerts and approvals. */
  tone?: EmailTone;
  /** A reference chip under the headline, e.g. { label: 'Booking', value: 'BK-2026-0031' }. */
  reference?: { label: string; value: string };
}

/**
 * Mobile rules. Inline styles are the baseline every client gets; clients that honour
 * <style> (Apple Mail, iOS, Gmail apps) also get tighter gutters and stacked columns.
 */
const RESPONSIVE_CSS = `
@media only screen and (max-width: 480px) {
  .em-px { padding-left: 22px !important; padding-right: 22px !important; }
  .em-h1 { font-size: 25px !important; line-height: 32px !important; }
  .em-stack { display: block !important; width: 100% !important; }
  .em-stack-gap { padding: 10px 0 0 0 !important; }
  .em-hide { display: none !important; }
  .em-tcol { width: 64px !important; }
  .em-label { width: 100% !important; display: block !important; padding-bottom: 0 !important; }
  .em-value { width: 100% !important; display: block !important; padding-top: 2px !important; }
}
`;

/**
 * The chrome every business email renders inside.
 *
 * A copy of the shared layout, owned by the business module so that tenant colours can
 * be applied without touching a file that customer, vendor, driver, auth, wallet and
 * admin mail also render through.
 *
 * Every colour here comes from the tenant's theme_config, through the derived palette:
 * the masthead band is the tenant's accent with its contrast-picked label colour, and
 * tints are mixed from that accent. Sizes, spacing and the font stack do not: layout is
 * the platform's job, identity is the tenant's. Fonts in particular stay fixed because
 * mail clients strip webfonts, so a per-tenant typeface buys an inconsistent fallback
 * rather than a brand.
 */
export const BusinessEmailLayout = ({
  preview,
  heading,
  children,
  eyebrow,
  tone,
  reference,
}: BusinessEmailLayoutProps) => {
  const currentYear = new Date().getFullYear();
  const brand = getBusinessBrand();
  const p = getBusinessPalette();

  const footerText = {
    color: p.muted,
    fontFamily: fonts.sans,
    fontSize: '12px',
    lineHeight: '19px',
    margin: '2px 0',
    textAlign: 'center' as const,
  };
  const footerLinks = { ...footerText, margin: '14px 0 0' };
  const footerLink = { color: p.accentInk, textDecoration: 'underline' };

  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <link href={EMAIL_FONTS_HREF} rel="stylesheet" />
        <style>{RESPONSIVE_CSS}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ ...main, backgroundColor: p.page }}>
        <Container style={container}>
          <Section style={{ ...card, backgroundColor: p.card }}>
            {/* Masthead */}
            <Section className="em-px" style={{ ...masthead, backgroundColor: p.band }}>
              {brand.logoUrl ? (
                <Img src={brand.logoUrl} alt={brand.name} height={40} style={logo} />
              ) : (
                <Heading as="h2" style={{ ...wordmark, color: p.bandText }}>
                  {brand.name}
                </Heading>
              )}
            </Section>
            <Section style={{ ...rule, backgroundColor: p.rule }}>&nbsp;</Section>

            {/* Hero */}
            <Section className="em-px" style={hero}>
              {eyebrow ? (
                <Text style={{ ...eyebrowStyle, color: toneInk(tone ?? 'info') }}>{eyebrow}</Text>
              ) : null}
              <Heading className="em-h1" style={{ ...h1, color: p.ink }}>
                {heading}
              </Heading>
              {reference ? (
                <table role="presentation" cellPadding={0} cellSpacing={0} style={chipTable}>
                  <tbody>
                    <tr>
                      <td
                        style={{
                          ...chip,
                          backgroundColor: p.pale,
                          border: `1px solid ${p.paleLine}`,
                          color: p.accentInk,
                        }}
                      >
                        {reference.label.toUpperCase()}
                        &nbsp;&nbsp;
                        <span style={chipValue}>{reference.value}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : null}
            </Section>

            <Section className="em-px" style={content}>
              {children}
            </Section>
          </Section>

          <Section className="em-px" style={footer}>
            <Text style={footerText}>
              © {currentYear} {brand.name}. All rights reserved.
            </Text>
            <Text style={footerText}>{brand.address}</Text>
            <Text style={footerText}>
              This email was sent to you as part of your account activity.
            </Text>
            {/*
              A tenant never gets the platform's /privacy and /terms: those are the
              platform's own pages, and showing them under someone else's brand tells the
              recipient the tenant's legal terms are the platform's. They get their own
              support address instead.

              showPlatformLinks is still honoured rather than assumed false, because a
              handful of business templates (account approved, account rejected, the
              registration notice) are sent by the platform about a tenant rather than by
              the tenant, and those legitimately carry platform chrome.
            */}
            {brand.showPlatformLinks ? (
              <Text style={footerLinks}>
                <Link href={`${brand.url}/privacy`} style={footerLink}>
                  Privacy Policy
                </Link>
                {'  ·  '}
                <Link href={`${brand.url}/terms`} style={footerLink}>
                  Terms of Service
                </Link>
                {'  ·  '}
                <Link href={`${brand.url}/contact`} style={footerLink}>
                  Contact Support
                </Link>
              </Text>
            ) : brand.supportEmail ? (
              <Text style={footerLinks}>
                <Link href={`mailto:${brand.supportEmail}`} style={footerLink}>
                  Contact {brand.name}
                </Link>
              </Text>
            ) : null}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  fontFamily: fonts.sans,
  margin: '0',
  padding: '24px 0 40px',
};

const container = {
  margin: '0 auto',
  maxWidth: '600px',
  width: '100%',
};

const card = {
  borderRadius: '14px',
  overflow: 'hidden',
};

const masthead = {
  padding: '30px 44px 28px',
  textAlign: 'center' as const,
};

const wordmark = {
  fontFamily: fonts.display,
  fontSize: '22px',
  fontWeight: '500',
  letterSpacing: '0.02em',
  lineHeight: '28px',
  margin: '0',
};

/**
 * Height is fixed and width is left to the image so any aspect ratio sits on the same
 * baseline as the wordmark it replaces. Mail clients ignore CSS max-width often enough
 * that constraining the height is the reliable control.
 */
const logo = {
  margin: '0 auto',
  maxWidth: '220px',
};

const rule = {
  fontSize: '0',
  height: '2px',
  lineHeight: '2px',
};

const hero = {
  padding: '40px 44px 0',
};

const eyebrowStyle = {
  fontFamily: fonts.sans,
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '0.18em',
  lineHeight: '16px',
  margin: '0 0 12px',
  textTransform: 'uppercase' as const,
};

const h1 = {
  fontFamily: fonts.display,
  fontSize: '30px',
  fontWeight: '500',
  letterSpacing: '-0.005em',
  lineHeight: '38px',
  margin: '0',
};

const chipTable = {
  borderCollapse: 'separate' as const,
  marginTop: '20px',
};

const chip = {
  borderRadius: '999px',
  fontFamily: fonts.sans,
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '0.12em',
  padding: '7px 14px',
};

const chipValue = {
  fontFamily: fonts.mono,
  fontWeight: '500',
  letterSpacing: '0.04em',
};

const content = {
  padding: '24px 44px 40px',
};

const footer = {
  padding: '28px 44px 8px',
  textAlign: 'center' as const,
};

export default BusinessEmailLayout;
