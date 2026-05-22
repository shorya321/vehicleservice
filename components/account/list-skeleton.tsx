interface ListSkeletonProps {
  rows?: number
}

export function ListSkeleton({ rows = 3 }: ListSkeletonProps) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="account-item-card">
          <div className="flex items-start gap-4">
            <div className="skeleton w-10 h-10 rounded" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-2/5 rounded" />
              <div className="skeleton h-3 w-3/5 rounded" />
              <div className="skeleton h-3 w-1/4 rounded" />
            </div>
            <div className="skeleton h-5 w-16 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
