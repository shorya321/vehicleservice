/**
 * Admin Layout
 * Isolated theme system - not affected by business portal customizations
 * Uses admin-specific globals.css and AdminThemeProvider
 */

import '@/app/admin/globals.css';
import { AdminThemeProvider } from '@/lib/admin/theme-provider';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminThemeProvider>
      <div className="font-[family-name:var(--admin-font-body)]">
        {children}
      </div>
    </AdminThemeProvider>
  );
}
