'use client'

import { CheckCircle } from 'lucide-react'

export function GuaranteeCard() {
  return (
    <div className="flex gap-3 p-4 bg-[rgba(198,170,136,0.05)] border border-[rgba(198,170,136,0.1)] rounded-xl">
      <div className="w-9 h-9 flex items-center justify-center bg-[rgba(198,170,136,0.15)] rounded-lg flex-shrink-0">
        <CheckCircle className="w-[18px] h-[18px] stroke-[#c6aa88]" />
      </div>
      <div>
        <h5 className="text-[0.8125rem] font-medium text-[#f8f6f3] mb-0.5">
          100% Satisfaction Guarantee
        </h5>
        <p className="text-[0.6875rem] text-[#7a7672] leading-snug">
          Free cancellation up to 24 hours before pickup. Full refund if we fail to deliver.
        </p>
      </div>
    </div>
  )
}
