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
import { getBusinessBrand } from '../../platform';

interface BusinessEmailLayoutProps {
  preview: string;
  heading: string;
  children: React.ReactNode;
}

/**
 * The chrome every business email renders inside.
 *
 * A copy of the shared layout, owned by the business module so that tenant colours can
 * be applied without touching a file that customer, vendor, driver, auth, wallet and
 * admin mail also render through.
 *
 * Every colour here comes from the tenant's theme_config. Sizes, spacing and the font
 * stack do not: layout is the platform's job, identity is the tenant's. Fonts in
 * particular stay fixed because mail clients strip webfonts, so a per-tenant typeface
 * buys an inconsistent fallback rather than a brand.
 */
export const BusinessEmailLayout = ({ preview, heading, children }: BusinessEmailLayoutProps) => {
  const currentYear = new Date().getFullYear();
  const brand = getBusinessBrand();
  const { colors } = brand;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ ...main, backgroundColor: colors.background }}>
        <Container style={{ ...container, backgroundColor: colors.surface }}>
          <Section style={{ ...header, borderBottom: `1px solid ${colors.border}` }}>
            {brand.logoUrl ? (
              <Img src={brand.logoUrl} alt={brand.name} height={40} style={logo} />
            ) : (
              <Heading style={{ ...h1, color: colors.heading }}>{brand.name}</Heading>
            )}
          </Section>

          <Section style={content}>
            <Heading style={{ ...h2, color: colors.heading }}>{heading}</Heading>
            {children}
          </Section>

          <Section style={{ ...footer, borderTop: `1px solid ${colors.border}` }}>
            <Text style={{ ...footerText, color: colors.muted }}>
              © {currentYear} {brand.name}. All rights reserved.
            </Text>
            <Text style={{ ...footerText, color: colors.muted }}>{brand.address}</Text>
            <Text style={{ ...footerText, color: colors.muted }}>
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
              <Text style={{ ...footerLinks, color: colors.muted }}>
                <Link href={`${brand.url}/privacy`} style={{ ...footerLink, color: colors.primary }}>
                  Privacy Policy
                </Link>
                {' | '}
                <Link href={`${brand.url}/terms`} style={{ ...footerLink, color: colors.primary }}>
                  Terms of Service
                </Link>
                {' | '}
                <Link href={`${brand.url}/contact`} style={{ ...footerLink, color: colors.primary }}>
                  Contact Support
                </Link>
              </Text>
            ) : brand.supportEmail ? (
              <Text style={{ ...footerLinks, color: colors.muted }}>
                <Link
                  href={`mailto:${brand.supportEmail}`}
                  style={{ ...footerLink, color: colors.primary }}
                >
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
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 40px',
  textAlign: 'center' as const,
};

const h1 = {
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
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

const content = {
  padding: '40px',
};

const h2 = {
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.4',
  margin: '0 0 24px',
};

const footer = {
  padding: '0 40px 40px',
  marginTop: '32px',
  paddingTop: '32px',
};

const footerText = {
  fontSize: '12px',
  lineHeight: '16px',
  margin: '4px 0',
  textAlign: 'center' as const,
};

const footerLinks = {
  fontSize: '12px',
  lineHeight: '16px',
  margin: '16px 0 0',
  textAlign: 'center' as const,
};

const footerLink = {
  textDecoration: 'underline',
};

export default BusinessEmailLayout;
