import { PublicLayout } from '@/components/layout/public-layout'

export const dynamic = 'force-dynamic'

export default function RoutesLayout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>
}
