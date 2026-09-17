/**
 * Segment skeleton for /booking/*.
 *
 * Mirrors the confirmation page's shape: the statement on the left (status line, the day and time
 * at poster size, the reference row, the actions) and a column of transfer stubs on the right. The
 * stubs reuse .checkout-summary-card so the first frame is already on the right ground.
 */
function Bar({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-[4px] bg-[rgba(var(--gold-rgb),0.08)] ${className ?? ''}`} />
}

function StubSkeleton({ rows }: { rows: number }) {
  return (
    <div className="checkout-summary-card">
      <div className="checkout-stub-cap">
        <Bar className="h-2.5 w-28" />
      </div>
      <div className="confirm-sat__band space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Bar key={i} className={`h-4 ${i % 2 ? 'w-2/3' : 'w-full'}`} />
        ))}
      </div>
    </div>
  )
}

export default function BookingLoading() {
  return (
    <div className="confirm-sat">
      <div className="luxury-container confirm-sat__split">
        <div className="confirm-sat__left">
          <Bar className="h-3 w-40" />
          <Bar className="mt-7 h-16 w-3/4 max-w-md" />
          <Bar className="mt-3 h-16 w-1/2 max-w-xs" />
          <Bar className="mt-7 h-5 w-full max-w-sm" />
          <Bar className="mt-9 h-6 w-64" />
          <div className="mt-9 flex gap-3">
            <Bar className="h-[52px] w-44 rounded-[8px]" />
            <Bar className="h-12 w-40" />
          </div>
        </div>
        <div className="confirm-sat__right">
          <StubSkeleton rows={3} />
          <StubSkeleton rows={3} />
          <StubSkeleton rows={4} />
        </div>
      </div>
    </div>
  )
}
