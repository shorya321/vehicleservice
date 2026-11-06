import { EmailManagementClient } from './components/email-management-client';
import { AnimatedPage } from '@/components/layout/animated-page';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { getPlatformEmailLogo } from '@/lib/email/brand/platform-logo.server';
import { getPlatformEmailDetails } from '@/lib/email/brand/platform-details.server';

export const metadata = {
  title: 'Email Templates - Admin',
  description: 'Preview and test email templates',
};

export default async function EmailManagementPage() {
  const [platformLogo, platformDetails] = await Promise.all([
    getPlatformEmailLogo(),
    getPlatformEmailDetails(),
  ]);

  return (
      <AnimatedPage>
        <Breadcrumb items={[{ label: 'Email Templates', href: '/admin/emails' }]} />
        <EmailManagementClient platformLogo={platformLogo} platformDetails={platformDetails} />
      </AnimatedPage>
  );
}
