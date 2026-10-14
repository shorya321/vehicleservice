'use client'

import { createContext, useContext, useState, useCallback, useSyncExternalStore } from 'react'
import { getCurrencyFromClientCookie, setCurrencyInClientCookie } from './cookie'
import type { CurrencyInfo, ExchangeRatesMap } from './types'

interface CurrencyContextValue {
  currentCurrency: string
  exchangeRates: ExchangeRatesMap
  featuredCurrencies: CurrencyInfo[]
  allCurrencies: CurrencyInfo[]
  setCurrency: (code: string) => void
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

// The cookie has no change event, so setCurrency notifies subscribers itself
const cookieListeners = new Set<() => void>()

function subscribeToCurrencyCookie(listener: () => void): () => void {
  cookieListeners.add(listener)
  return () => {
    cookieListeners.delete(listener)
  }
}

function notifyCurrencyCookieChange(): void {
  cookieListeners.forEach((listener) => listener())
}

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
  // A pick made on this page. Kept in state too so switching still works when
  // the browser refuses the cookie.
  const [pickedCurrency, setPickedCurrency] = useState<string | null>(null)

  // Back/forward navigation can replay a cached server render that carries an
  // older currency than the one picked since. The cookie holds the latest
  // choice, so read it on the client; the server snapshot keeps hydration exact.
  const getCookieSnapshot = useCallback((): string => {
    const cookieCurrency = getCurrencyFromClientCookie()
    return cookieCurrency && allCurrencies.some((c) => c.code === cookieCurrency)
      ? cookieCurrency
      : initialCurrency
  }, [allCurrencies, initialCurrency])

  const cookieCurrency = useSyncExternalStore(
    subscribeToCurrencyCookie,
    getCookieSnapshot,
    () => initialCurrency
  )
  const currentCurrency = pickedCurrency ?? cookieCurrency

  const setCurrency = useCallback((code: string) => {
    if (!allCurrencies.some((c) => c.code === code)) return
    setPickedCurrency(code)
    setCurrencyInClientCookie(code)
    notifyCurrencyCookieChange()
  }, [allCurrencies])

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
