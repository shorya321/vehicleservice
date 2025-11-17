'use client'

import { UseFormReturn } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Info } from 'lucide-react'

interface TermsConditionsSectionProps {
  form: UseFormReturn<any>
}

/**
 * Terms and Conditions Section Component
 *
 * Displays and manages:
 * - Terms and conditions acceptance checkbox
 * - Cancellation policy information
 * - Required agreement validation
 *
 * @component
 */
export function TermsConditionsSection({ form }: TermsConditionsSectionProps) {
  const { watch, setValue, formState: { errors } } = form
  const agreeToTerms = watch('agreeToTerms')

  return (
    <motion.div
      className="luxury-card backdrop-blur-md bg-luxury-darkGray/80 border border-luxury-gold/20 rounded-lg p-6 md:p-8 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="space-y-4">
        {/* Terms Checkbox */}
        <div className="flex items-start space-x-3">
          <Checkbox
            id="terms"
            checked={agreeToTerms}
            onCheckedChange={(checked) => setValue('agreeToTerms', checked as boolean)}
            className="mt-1 border-luxury-gold/30 data-[state=checked]:bg-luxury-gold data-[state=checked]:border-luxury-gold"
          />
          <div className="space-y-1">
            <Label htmlFor="terms" className="text-sm font-medium cursor-pointer text-luxury-pearl">
              I agree to the Terms and Conditions *
            </Label>
            <p className="text-sm text-luxury-lightGray">
              By booking, you agree to our terms of service and cancellation policy
            </p>
          </div>
        </div>
        {errors.agreeToTerms && (
          <p className="text-sm text-red-500">{errors.agreeToTerms.message as string}</p>
        )}

        {/* Cancellation Policy Info */}
        <div className="backdrop-blur-sm bg-luxury-gold/10 border border-luxury-gold/30 rounded-lg p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 mt-0.5" style={{ color: "#C6AA88" }} aria-hidden="true" />
            <div className="text-sm">
              <p className="font-medium text-luxury-pearl mb-1">
                Free Cancellation
              </p>
              <p className="text-luxury-lightGray">
                Cancel up to 24 hours before pickup for a full refund
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

TermsConditionsSection.displayName = 'TermsConditionsSection'
