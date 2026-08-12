import { EmailManagementClient } from './components/email-management-client';
import { AnimatedPage } from '@/components/layout/animated-page';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export const metadata = {
  title: 'Email Templates - Admin',
  description: 'Preview and test email templates',
};

export default function EmailManagementPage() {
  return (
      <AnimatedPage>
        <Breadcrumb items={[{ label: 'Email Templates', href: '/admin/emails' }]} />
        <EmailManagementClient />
      </AnimatedPage>
  );
}
