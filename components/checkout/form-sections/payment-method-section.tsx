'use client'

import { UseFormReturn } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CreditCard } from 'lucide-react'

interface PaymentMethodSectionProps {
  form: UseFormReturn<any>
}

/**
 * Payment Method Section Component
 *
 * Displays available payment options:
 * - Credit/Debit Card (secure online payment)
 *
 * Currently supports card payment only, with potential for future expansion
 * to include additional payment methods.
 *
 * @component
 */
export function PaymentMethodSection({ form }: PaymentMethodSectionProps) {
  const { watch, setValue } = form
  const paymentMethod = watch('paymentMethod')

  return (
    <motion.div
      className="luxury-card backdrop-blur-md bg-luxury-darkGray/80 border border-luxury-gold/20 rounded-lg p-6 md:p-8 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <h2 className="font-serif text-3xl text-luxury-pearl mb-6">Payment Method</h2>

      <RadioGroup
        value={paymentMethod}
        onValueChange={(value) => setValue('paymentMethod', value as 'card')}
      >
        <div className="flex items-center space-x-3 p-4 backdrop-blur-sm bg-luxury-black/30 border border-luxury-gold/20 rounded-lg cursor-pointer hover:bg-luxury-gold/10 transition-colors">
          <RadioGroupItem value="card" id="card" />
          <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
            <CreditCard className="h-5 w-5" style={{ color: "#C6AA88" }} aria-hidden="true" />
            <div>
              <p className="font-medium text-luxury-pearl">Pay by Card</p>
              <p className="text-sm text-luxury-lightGray">Secure online payment</p>
            </div>
          </Label>
        </div>
      </RadioGroup>
    </motion.div>
  )
}

PaymentMethodSection.displayName = 'PaymentMethodSection'
