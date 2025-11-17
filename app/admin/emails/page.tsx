import { AdminLayout } from '@/components/layout/admin-layout';
import { EmailManagementClient } from './components/email-management-client';

export const metadata = {
  title: 'Email Templates - Admin',
  description: 'Preview and test email templates',
};

export default function EmailManagementPage() {
  return (
    <AdminLayout>
      <EmailManagementClient />
    </AdminLayout>
  );
}
