/**
 * Vendor Layout
 * Shares theme with admin portal - not affected by business portal customizations
 * Uses admin-specific globals.css and AdminThemeContextProvider
 */

import '@/app/admin/globals.css';
import { getAdminThemeSettings } from '@/lib/admin/theme-server';
import { AdminThemeContextProvider } from '@/lib/admin/theme-context';

export const dynamic = 'force-dynamic'

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = await getAdminThemeSettings();
  return (
    <div className="font-[family-name:var(--admin-font-body)]">
      <AdminThemeContextProvider theme={theme}>
        {children}
      </AdminThemeContextProvider>
    </div>
  );
}
