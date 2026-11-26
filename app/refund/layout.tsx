import { PublicLayout } from '@/components/layout/public-layout'

export const dynamic = 'force-dynamic'

export default function RefundLayout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>
}
