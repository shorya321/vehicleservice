import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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

  // Redirect authenticated users to checkout
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    redirect(decodeURIComponent(returnUrl))
  }

  return (
    <PublicLayout>
      <CheckoutLoginContent returnUrl={returnUrl} />
    </PublicLayout>
  )
}
