'use client'

import { useCurrency } from '@/lib/currency/context'
import { formatPrice } from '@/lib/currency/format'
import { Info } from 'lucide-react'

interface BookingSummaryPricesProps {
  basePrice: number
  amenitiesPrice: number
  totalPrice: number
}

export function BookingSummaryPrices({ basePrice, amenitiesPrice, totalPrice }: BookingSummaryPricesProps) {
  const { currentCurrency, exchangeRates } = useCurrency()
  const formatUserPrice = (amount: number) => formatPrice(amount, currentCurrency, exchangeRates)
  const isConverted = currentCurrency !== 'AED'

  return (
    <>
      {/* Price Breakdown */}
      <div className="space-y-2 pb-5">
        <div className="flex justify-between text-sm">
          <span className="text-[#b8b4ae]">Base Fare</span>
          <span className="text-[#f8f6f3]">{formatUserPrice(basePrice)}</span>
        </div>
        {amenitiesPrice > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[#b8b4ae]">Additional Services</span>
            <span className="text-[#f8f6f3]">{formatUserPrice(amenitiesPrice)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-[#b8b4ae]">Meet & Greet</span>
          <span className="text-[#f8f6f3]">Free</span>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pt-5 border-t border-[rgba(198,170,136,0.15)]">
        <span className="text-[0.9375rem] text-[#f8f6f3]">Total</span>
        <span className="text-xl font-semibold bg-gradient-to-r from-[#e8d9c5] to-[#c6aa88] bg-clip-text text-transparent">
          {formatUserPrice(totalPrice)}
        </span>
      </div>

      {/* Currency Notice */}
      {isConverted && (
        <div className="flex items-start gap-2 pt-3 text-xs text-[#7a7672]">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>
            Price shown in {currentCurrency}. Payment will be processed in AED ({formatPrice(totalPrice, 'AED', exchangeRates)}).
          </span>
        </div>
      )}
    </>
  )
}
