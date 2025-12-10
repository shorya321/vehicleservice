/**
 * Step Indicator Component
 * Visual progress indicator for multi-step wizard
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between px-4 py-6 bg-muted/50 rounded-xl border border-border">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={step} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-all duration-300',
                  isCompleted && 'bg-primary border-primary text-primary-foreground',
                  isCurrent && 'border-primary text-primary',
                  !isCompleted && !isCurrent && 'border-muted-foreground/30 text-muted-foreground/50'
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : <span className="font-semibold">{index + 1}</span>}
              </div>
              <span
                className={cn(
                  'mt-2 text-sm font-medium transition-colors duration-300',
                  isCompleted && 'text-primary',
                  isCurrent && 'text-foreground',
                  !isCompleted && !isCurrent && 'text-muted-foreground/50'
                )}
              >
                {step}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 mx-4 transition-all duration-500 rounded-full',
                  isCompleted ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
