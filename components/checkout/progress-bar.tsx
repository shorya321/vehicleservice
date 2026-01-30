'use client'

import { Check, Search, Car, CreditCard, CheckCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  currentStep: number
}

const steps = [
  { number: 1, label: 'Search', icon: Search },
  { number: 2, label: 'Select', icon: Car },
  { number: 3, label: 'Checkout', icon: CreditCard },
  { number: 4, label: 'Payment', icon: CreditCard }
]

export function ProgressBar({ currentStep }: ProgressBarProps) {
  return (
    <div
      className="bg-[#0a0a0b]/80 backdrop-blur-md border-b border-[#c6aa88]/10"
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={4}
      aria-label={`Booking progress: Step ${currentStep} of 4`}
    >
      <span className="sr-only">
        Step {currentStep} of 4: {steps[currentStep - 1]?.label || 'Complete'}
      </span>
      <div className="luxury-container py-6">
        <div className="checkout-progress-bar">
          {steps.map((step) => {
            const Icon = step.icon
            const isCompleted = step.number < currentStep
            const isActive = step.number === currentStep

            return (
              <div
                key={step.number}
                className={cn(
                  'checkout-progress-step',
                  isCompleted && 'completed',
                  isActive && 'active'
                )}
              >
                <motion.div
                  className="checkout-progress-icon"
                  initial={{ scale: 1 }}
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ duration: 0.3 }}
                  aria-label={`Step ${step.number}: ${step.label}${isActive ? ' (current)' : ''}`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 text-[#050506]" aria-hidden="true" />
                  ) : (
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        isActive ? "text-[#c6aa88]" : "text-[#7a7672]"
                      )}
                      aria-hidden="true"
                    />
                  )}
                </motion.div>
                <span className="checkout-progress-label hidden sm:block">
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
