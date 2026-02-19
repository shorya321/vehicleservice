/**
 * Vendor Layout
 * Shares theme with admin portal - not affected by business portal customizations
 * Uses admin-specific globals.css and AdminThemeContextProvider
 * Fetches vendor data at layout level so sidebar/header persist during page navigation
 */

import '@/app/admin/globals.css';
import { getAdminThemeSettings } from '@/lib/admin/theme-server';
import { AdminThemeContextProvider } from '@/lib/admin/theme-context';
import { VendorLayoutShell } from '@/components/layout/vendor-layout-shell';
import { VendorDataProvider } from '@/lib/vendor/vendor-data-context';
import { getCurrentUserProfile } from '@/lib/auth/user-actions';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic'

export default async function VendorRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = await getAdminThemeSettings();

  // Fetch vendor data at layout level so sidebar/header always have it
  let vendorData: { user?: any; vendorApplication?: any } = {};
  try {
    const user = await getCurrentUserProfile();
    if (user) {
      const supabase = await createClient();
      const { data: vendorApplication } = await supabase
        .from('vendor_applications')
        .select('business_name, status')
        .eq('user_id', user.id)
        .single();

      vendorData = {
        user: {
          email: user.email,
          profile: user.profile,
        },
        vendorApplication,
      };
    }
  } catch {
    // If user fetch fails (not logged in), vendorData stays empty
    // Individual pages will handle auth redirects via requireVendor()
  }

  return (
    <div className="font-[family-name:var(--admin-font-body)]">
      <AdminThemeContextProvider theme={theme}>
        <VendorDataProvider data={vendorData}>
          <VendorLayoutShell>
            {children}
          </VendorLayoutShell>
        </VendorDataProvider>
      </AdminThemeContextProvider>
    </div>
  );
}
