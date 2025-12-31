'use client'

import { UseFormReturn } from 'react-hook-form'
import { motion } from 'framer-motion'
import { CreditCard, Wallet, Banknote, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaymentMethodSectionProps {
  form: UseFormReturn<any>
}

interface PaymentMethod {
  id: 'card' | 'paypal' | 'cash'
  name: string
  description: string
  icon: React.ElementType
  badge?: string
  disabled?: boolean
}

/**
 * Payment Method Section Component
 *
 * Displays available payment options:
 * - Credit/Debit Card (primary, secure online payment)
 * - PayPal (visual only, disabled)
 * - Cash (visual only, disabled)
 *
 * @component
 */
export function PaymentMethodSection({ form }: PaymentMethodSectionProps) {
  const { watch, setValue } = form
  const paymentMethod = watch('paymentMethod')

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      name: 'Credit / Debit Card',
      description: 'Visa, Mastercard, Amex accepted',
      icon: CreditCard,
      badge: 'Recommended'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Pay with your PayPal account',
      icon: Wallet,
      disabled: true
    },
    {
      id: 'cash',
      name: 'Cash on Arrival',
      description: 'Pay driver directly',
      icon: Banknote,
      disabled: true
    }
  ]

  return (
    <motion.div
      className="checkout-form-section"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* Section Header */}
      <div className="checkout-section-header">
        <span className="checkout-section-number">4</span>
        <h2 className="checkout-section-title">Payment Method</h2>
        <CreditCard className="checkout-section-icon" />
      </div>

      {/* Section Content */}
      <div className="checkout-section-content">
        <div className="checkout-payment-methods">
          {paymentMethods.map((method) => {
            const Icon = method.icon
            const isSelected = paymentMethod === method.id

            return (
              <div
                key={method.id}
                className={cn(
                  "checkout-payment-method",
                  isSelected && "selected",
                  method.disabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => {
                  if (!method.disabled) {
                    setValue('paymentMethod', method.id)
                  }
                }}
              >
                <div className="checkout-payment-radio">
                  <div className="checkout-payment-radio-inner" />
                </div>
                <div className="checkout-payment-icon">
                  <Icon className="h-5 w-5 text-[#c6aa88]" />
                </div>
                <div className="checkout-payment-info">
                  <p className="checkout-payment-name">{method.name}</p>
                  <p className="checkout-payment-description">
                    {method.disabled ? 'Coming soon' : method.description}
                  </p>
                </div>
                {method.badge && (
                  <span className="checkout-payment-badge">{method.badge}</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-[#1f1e1c]/30 border border-[#c6aa88]/10 rounded-lg">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 mt-0.5 text-[#c6aa88]" />
            <div className="text-sm">
              <p className="font-medium text-[#f8f6f3] mb-1">
                Secure Payment
              </p>
              <p className="text-[#7a7672]">
                All transactions are encrypted and processed securely via Stripe.
                Your card details are never stored on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

PaymentMethodSection.displayName = 'PaymentMethodSection'
