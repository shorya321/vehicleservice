/**
 * Admin Shell Layout
 *
 * Renders the admin chrome (sidebar, header, main region) for every admin route
 * except login. The split is a route group rather than a pathname check inside a
 * client component: Next resolves it on the server, so the server and client
 * always agree on the tree shape.
 */

import { AdminLayout } from '@/components/layout/admin-layout';
import { getPortalLogo } from '@/lib/site-settings/portal-logo';

export default async function AdminShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const logo = await getPortalLogo();
  return <AdminLayout logo={logo}>{children}</AdminLayout>;
}
