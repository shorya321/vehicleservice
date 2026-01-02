'use client'

import { Check, Search, Car, FileText, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressStep {
  label: string
  icon: React.ReactNode
  completed: boolean
  active: boolean
}

const steps: ProgressStep[] = [
  { label: 'Search', icon: <Search className="w-3.5 h-3.5" />, completed: true, active: false },
  { label: 'Vehicle', icon: <Car className="w-3.5 h-3.5" />, completed: true, active: false },
  { label: 'Details', icon: <FileText className="w-3.5 h-3.5" />, completed: true, active: false },
  { label: 'Payment', icon: <CreditCard className="w-3.5 h-3.5" />, completed: false, active: true },
]

export function PaymentProgress() {
  return (
    <div className="py-6 md:py-8">
      <div className="flex justify-center gap-1 max-w-[600px] mx-auto">
        {steps.map((step, index) => (
          <div key={step.label} className="flex-1 flex flex-col items-center relative">
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "absolute top-4 left-[calc(50%+20px)] w-[calc(100%-40px)] h-0.5",
                  step.completed
                    ? "bg-gradient-to-r from-[#c6aa88] to-[#a68b5b]"
                    : step.active
                    ? "bg-gradient-to-r from-[#c6aa88] to-[#2a2826]"
                    : "bg-[#2a2826]"
                )}
              />
            )}

            {/* Step Icon */}
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center relative z-10 transition-all duration-300",
                step.completed
                  ? "bg-gradient-to-br from-[#c6aa88] to-[#a68b5b] border-2 border-[#c6aa88]"
                  : step.active
                  ? "bg-[#161514] border-2 border-[#c6aa88] shadow-[0_0_0_4px_rgba(198,170,136,0.2)]"
                  : "bg-[#161514] border-2 border-[#2a2826]"
              )}
            >
              {step.completed ? (
                <Check className="w-3.5 h-3.5 text-[#050506]" strokeWidth={3} />
              ) : (
                <span className={cn(
                  step.active ? "text-[#c6aa88]" : "text-[#7a7672]"
                )}>
                  {step.icon}
                </span>
              )}
            </div>

            {/* Step Label */}
            <span
              className={cn(
                "mt-2 text-[0.6875rem] font-medium tracking-[0.1em] uppercase",
                step.completed || step.active
                  ? "text-[#c6aa88]"
                  : "text-[#7a7672]"
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
