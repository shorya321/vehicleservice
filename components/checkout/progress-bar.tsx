import { Check } from 'lucide-react'
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
    <div className="bg-muted/30 border-b">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors",
                    step.number < currentStep
                      ? "bg-primary text-primary-foreground"
                      : step.number === currentStep
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {step.number < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <div className="ml-3">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      step.number <= currentStep
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 ml-4">
                  <div
                    className={cn(
                      "h-1 rounded",
                      step.number < currentStep
                        ? "bg-primary"
                        : "bg-muted"
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