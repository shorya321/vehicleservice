import Link from 'next/link'
import { SearchX, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  searchParams: {
    from?: string
    to?: string
    date?: string
    passengers?: string
  }
}

export function EmptyState({ searchParams }: EmptyStateProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <SearchX className="h-10 w-10 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">No vehicles available</h2>
          <p className="text-muted-foreground">
            We couldn&apos;t find any available vehicles for your selected route and date. 
            This could be because the route is not currently serviced or all vehicles are booked.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Try one of these options:</p>
          <div className="flex flex-col gap-2">
            <Button asChild variant="default">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Search Different Route
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/contact">
                Contact Support
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}