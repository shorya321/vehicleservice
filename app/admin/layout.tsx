/**
 * Admin Layout
 * Isolated theme system - not affected by business portal customizations
 * Uses admin-specific globals.css and AdminThemeContextProvider
 *
 * Theming only. The chrome (sidebar, header, main) lives in the `(shell)` route
 * group so that login sits outside it and no client-side pathname check is
 * needed to tell the two apart.
 */

import '@/app/admin/globals.css';
import { getAdminThemeSettings } from '@/lib/admin/theme-server';
import { AdminThemeContextProvider } from '@/lib/admin/theme-context';

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
        {children}
      </AdminThemeContextProvider>
    </div>
  );
}
