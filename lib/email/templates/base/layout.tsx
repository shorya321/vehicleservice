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
import { getCurrentBrand } from '../../brand/brand';

interface EmailLayoutProps {
  preview: string;
  heading: string;
  children: React.ReactNode;
}

/**
 * The chrome every email template renders inside.
 *
 * The brand is read at render time rather than passed as a prop, so none of the other
 * 56 templates had to change. On the server, sendEmail establishes the tenant's brand
 * for the duration of the render; in the browser, where app/admin/emails renders these
 * same templates for preview, no brand is ever established and this falls back to the
 * platform's, which is exactly right for an admin previewing platform mail.
 */
export const EmailLayout = ({ preview, heading, children }: EmailLayoutProps) => {
  const currentYear = new Date().getFullYear();
  const brand = getCurrentBrand();

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo/Header */}
          <Section style={header}>
            {brand.logoUrl ? (
              <Img src={brand.logoUrl} alt={brand.name} height={40} style={logo} />
            ) : (
              <Heading style={h1}>{brand.name}</Heading>
            )}
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={h2}>{heading}</Heading>
            {children}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {currentYear} {brand.name}. All rights reserved.
            </Text>
            <Text style={footerText}>
              {brand.address}
            </Text>
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
                {' | '}
                <Link href={`${brand.url}/terms`} style={footerLink}>
                  Terms of Service
                </Link>
                {' | '}
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
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 40px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #e6ebf1',
};

const h1 = {
  color: '#1a1a1a',
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
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.4',
  margin: '0 0 24px',
};

const footer = {
  padding: '0 40px 40px',
  borderTop: '1px solid #e6ebf1',
  marginTop: '32px',
  paddingTop: '32px',
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '4px 0',
  textAlign: 'center' as const,
};

const footerLinks = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '16px 0 0',
  textAlign: 'center' as const,
};

const footerLink = {
  color: '#556cd6',
  textDecoration: 'underline',
};

export default EmailLayout;
