"use client"

import { createContext, useContext, ReactNode } from "react"

export interface VendorData {
  user?: {
    email?: string
    profile?: {
      full_name?: string
    }
  }
  vendorApplication?: {
    business_name?: string
  }
}

const VendorDataContext = createContext<VendorData>({})

export function VendorDataProvider({
  children,
  data,
}: {
  children: ReactNode
  data: VendorData
}) {
  return (
    <VendorDataContext.Provider value={data}>
      {children}
    </VendorDataContext.Provider>
  )
}

export function useVendorData() {
  return useContext(VendorDataContext)
}
