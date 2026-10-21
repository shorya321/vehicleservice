import { PublicLayout } from '@/components/layout/public-layout'

export const dynamic = 'force-dynamic'

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>
}
