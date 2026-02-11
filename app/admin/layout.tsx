/**
 * Admin Layout
 * Isolated theme system - not affected by business portal customizations
 * Uses admin-specific globals.css and AdminThemeContextProvider
 */

import '@/app/admin/globals.css';
import { getAdminThemeSettings } from '@/lib/admin/theme-server';
import { AdminThemeContextProvider } from '@/lib/admin/theme-context';
import { AdminLayoutShell } from '@/components/layout/admin-layout-shell';

export const dynamic = 'force-dynamic'

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = await getAdminThemeSettings();
  return (
    <div className="font-[family-name:var(--admin-font-body)]">
      <AdminThemeContextProvider theme={theme}>
        <AdminLayoutShell>
          {children}
        </AdminLayoutShell>
      </AdminThemeContextProvider>
    </div>
  );
}
