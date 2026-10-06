import { PublicLayout } from '@/components/layout/public-layout'
import { NOINDEX_METADATA } from '@/lib/seo/noindex'

export const metadata = NOINDEX_METADATA

export const dynamic = 'force-dynamic'

export default function VendorApplicationLayout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>
}
