"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CustomPaginationProps {
  currentPage: number
  totalPages: number
  baseUrl?: string
  queryParams?: Record<string, any>
}

export function CustomPagination({
  currentPage,
  totalPages,
  baseUrl,
  queryParams = {},
}: CustomPaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Apply any additional query params
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value))
      }
    })
    
    params.set('page', page.toString())
    const url = baseUrl || pathname
    router.push(`${url}?${params.toString()}`)
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigateToPage(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>
      
      <div className="flex items-center gap-1">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let page: number
          if (totalPages <= 5) {
            page = i + 1
          } else if (currentPage <= 3) {
            page = i + 1
          } else if (currentPage >= totalPages - 2) {
            page = totalPages - 4 + i
          } else {
            page = currentPage - 2 + i
          }
          
          if (page < 1 || page > totalPages) return null
          
          return (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              className="w-10"
              onClick={() => navigateToPage(page)}
            >
              {page}
            </Button>
          )
        })}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigateToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}