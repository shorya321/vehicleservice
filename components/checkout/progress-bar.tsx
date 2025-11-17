'use client'

import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  currentStep: number
}

const steps = [
  { number: 1, label: 'Search' },
  { number: 2, label: 'Select Vehicle' },
  { number: 3, label: 'Checkout' },
  { number: 4, label: 'Confirmation' }
]

export function ProgressBar({ currentStep }: ProgressBarProps) {
  return (
    <div
      className="backdrop-blur-md bg-luxury-darkGray/50 border-b border-luxury-gold/10"
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={4}
      aria-label={`Booking progress: Step ${currentStep} of 4`}
    >
      <span className="sr-only">
        Step {currentStep} of 4: {steps[currentStep - 1]?.label || 'Complete'}
      </span>
      <div className="luxury-container py-8">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex items-center">
                <motion.div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all",
                    step.number < currentStep
                      ? "bg-luxury-gold text-luxury-black shadow-gold"
                      : step.number === currentStep
                      ? "bg-luxury-gold text-luxury-black ring-4 ring-luxury-gold/20 shadow-gold"
                      : "bg-luxury-darkGray/30 text-luxury-lightGray/60"
                  )}
                  initial={{ scale: step.number === currentStep ? 1 : 1 }}
                  animate={{ scale: step.number === currentStep ? 1.1 : 1 }}
                  transition={{ duration: 0.3 }}
                  aria-label={`Step ${step.number}: ${step.label}${step.number === currentStep ? ' (current)' : ''}`}
                >
                  {step.number < currentStep ? (
                    <Check className="h-6 w-6" aria-hidden="true" />
                  ) : (
                    step.number
                  )}
                </motion.div>
                <div className="ml-4 hidden md:block">
                  <p
                    className={cn(
                      "text-sm font-sans font-medium tracking-wider transition-colors",
                      step.number <= currentStep
                        ? "text-luxury-pearl"
                        : "text-luxury-lightGray/60"
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div
                    className={cn(
                      "h-1 rounded transition-all duration-500",
                      step.number < currentStep
                        ? "bg-luxury-gold shadow-sm shadow-luxury-gold/50"
                        : "bg-luxury-darkGray/30"
                    )}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
