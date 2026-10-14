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
import { getCurrentBrand, PLATFORM_BRAND_NAME } from '../../brand/brand';
import { EMAIL_FONTS_HREF } from '../../brand/palette';
import { fonts, palette, toneInk, type EmailTone } from '../../styles/constants';

interface EmailLayoutProps {
  preview: string;
  heading: string;
  children: React.ReactNode;
  /** Short uppercase line above the headline, e.g. "Booking confirmed". */
  eyebrow?: string;
  /** Colours the eyebrow for cancellations, alerts and approvals. */
  tone?: EmailTone;
  /** A reference chip under the headline, e.g. { label: 'Trip', value: 'TR-01' }. */
  reference?: { label: string; value: string };
}

/**
 * Mobile rules. Inline styles are the baseline every client gets; clients that honour
 * <style> (Apple Mail, iOS, Gmail apps) also get tighter gutters and stacked columns.
 */
export const RESPONSIVE_CSS = `
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
 * The chrome every email template renders inside.
 *
 * The brand is read at render time rather than passed as a prop, so none of the other
 * templates had to change. On the server, sendEmail establishes the tenant's brand
 * for the duration of the render; in the browser, where app/admin/emails renders these
 * same templates for preview, no brand is ever established and this falls back to the
 * platform's, which is exactly right for an admin previewing platform mail.
 *
 * Colours are the platform palette only. Name, logo, address and footer links follow
 * the brand in scope.
 */
export const EmailLayout = ({
  preview,
  heading,
  children,
  eyebrow,
  tone,
  reference,
}: EmailLayoutProps) => {
  const currentYear = new Date().getFullYear();
  const brand = getCurrentBrand();
  const isPlatformName = brand.name === PLATFORM_BRAND_NAME;
  const [firstWord, ...restWords] = brand.name.split(' ');

  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <link href={EMAIL_FONTS_HREF} rel="stylesheet" />
        <style>{RESPONSIVE_CSS}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={card}>
            {/* Masthead */}
            <Section className="em-px" style={masthead}>
              {brand.logoUrl ? (
                <Img src={brand.logoUrl} alt={brand.name} height={40} style={logo} />
              ) : isPlatformName && restWords.length > 0 ? (
                <>
                  <Text style={wordmark}>{firstWord.toUpperCase()}</Text>
                  <Text style={wordmarkSub}>{restWords.join(' ').toUpperCase()}</Text>
                </>
              ) : (
                <Heading as="h2" style={wordmarkName}>
                  {brand.name}
                </Heading>
              )}
            </Section>
            <Section style={rule}>&nbsp;</Section>

            {/* Hero */}
            <Section className="em-px" style={hero}>
              {eyebrow ? (
                <Text style={{ ...eyebrowStyle, color: toneInk[tone ?? 'info'] }}>{eyebrow}</Text>
              ) : null}
              <Heading className="em-h1" style={h1}>
                {heading}
              </Heading>
              {reference ? (
                <table role="presentation" cellPadding={0} cellSpacing={0} style={chipTable}>
                  <tbody>
                    <tr>
                      <td style={chip}>
                        {reference.label.toUpperCase()}
                        &nbsp;&nbsp;
                        <span style={chipValue}>{reference.value}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : null}
            </Section>

            {/* Main Content */}
            <Section className="em-px" style={content}>
              {children}
            </Section>
          </Section>

          {/* Footer */}
          <Section className="em-px" style={footer}>
            <Text style={footerText}>
              © {currentYear} {brand.name}. All rights reserved.
            </Text>
            <Text style={footerText}>{brand.address}</Text>
            <Text style={footerText}>
              This email was sent to you as part of your account activity.
            </Text>
            {/*
              These are the platform's own legal pages. Showing them under a tenant's
              brand would tell the recipient that the tenant's terms are the platform's,
              so a tenant gets a link to its own support address instead.
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

// Styles
const main = {
  backgroundColor: palette.page,
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
  backgroundColor: palette.card,
  borderRadius: '14px',
  overflow: 'hidden',
};

const masthead = {
  backgroundColor: palette.band,
  padding: '30px 44px 28px',
  textAlign: 'center' as const,
};

const wordmark = {
  color: palette.bandText,
  fontFamily: fonts.display,
  fontSize: '22px',
  letterSpacing: '0.34em',
  lineHeight: '26px',
  margin: '0',
  paddingLeft: '0.34em',
};

const wordmarkSub = {
  color: '#9d917f',
  fontFamily: fonts.sans,
  fontSize: '9px',
  fontWeight: '600',
  letterSpacing: '0.52em',
  lineHeight: '12px',
  margin: '7px 0 0',
  paddingLeft: '0.52em',
};

const wordmarkName = {
  color: palette.bandText,
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
  backgroundColor: palette.rule,
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
  color: palette.ink,
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
  backgroundColor: palette.pale,
  border: `1px solid ${palette.paleLine}`,
  borderRadius: '999px',
  color: palette.accentInk,
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

const footerText = {
  color: palette.muted,
  fontFamily: fonts.sans,
  fontSize: '12px',
  lineHeight: '19px',
  margin: '2px 0',
  textAlign: 'center' as const,
};

const footerLinks = {
  ...footerText,
  margin: '14px 0 0',
};

const footerLink = {
  color: palette.accentInk,
  textDecoration: 'underline',
};

export default EmailLayout;
