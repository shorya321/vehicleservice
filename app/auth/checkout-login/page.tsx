import { Metadata } from 'next'
import { PublicLayout } from '@/components/layout/public-layout'
import { CheckoutLoginContent } from './components/checkout-login-content'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Login to Continue | Secure Checkout',
  description: 'Login or create an account to complete your booking',
}

interface CheckoutLoginPageProps {
  searchParams: Promise<{
    returnUrl?: string
  }>
}

export default async function CheckoutLoginPage({ searchParams }: CheckoutLoginPageProps) {
  const params = await searchParams
  const returnUrl = params.returnUrl || '/checkout'

  return (
    <PublicLayout>
      <CheckoutLoginContent returnUrl={returnUrl} />
    </PublicLayout>
  )
}
