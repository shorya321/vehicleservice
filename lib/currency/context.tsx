'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { setCurrencyInClientCookie } from './cookie'
import type { CurrencyInfo, ExchangeRatesMap } from './types'

interface CurrencyContextValue {
  currentCurrency: string
  exchangeRates: ExchangeRatesMap
  featuredCurrencies: CurrencyInfo[]
  allCurrencies: CurrencyInfo[]
  setCurrency: (code: string) => void
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

interface CurrencyProviderProps {
  initialCurrency: string
  exchangeRates: ExchangeRatesMap
  featuredCurrencies: CurrencyInfo[]
  allCurrencies: CurrencyInfo[]
  children: React.ReactNode
}

export function CurrencyProvider({
  initialCurrency,
  exchangeRates,
  featuredCurrencies,
  allCurrencies,
  children,
}: CurrencyProviderProps) {
  const [currentCurrency, setCurrentCurrency] = useState(initialCurrency)

  const setCurrency = useCallback((code: string) => {
    setCurrentCurrency(code)
    setCurrencyInClientCookie(code)
  }, [])

  return (
    <CurrencyContext.Provider
      value={{
        currentCurrency,
        exchangeRates,
        featuredCurrencies,
        allCurrencies,
        setCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
