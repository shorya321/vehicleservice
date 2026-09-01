import { formatPrice } from '@/lib/currency/format'
import type { ExchangeRatesMap } from '@/lib/currency/types'

/**
 * Search results show quoted fares, not metered amounts, so a zero fraction is
 * noise: fifteen cards means fifteen ".00"s down the page.
 *
 * This is display-only and deliberately local to the results view.
 * `lib/currency/format.ts` also feeds checkout, invoices and email, where the
 * cents are load-bearing, so it is left alone.
 *
 * `formatAmount` builds "<number> <CODE>" with the en-US locale, where "." is
 * always the decimal separator and "," the group separator. Only an all-zero
 * fraction is stripped: "1,200.00 AED" becomes "1,200 AED", "100.50 AED" is
 * untouched, and a zero-decimal currency like JPY has no fraction to match.
 */
export function formatResultPrice(
  amount: number,
  targetCurrency: string,
  rates: ExchangeRatesMap
): string {
  return formatPrice(amount, targetCurrency, rates).replace(/\.0+(?=\s|$)/, '')
}
