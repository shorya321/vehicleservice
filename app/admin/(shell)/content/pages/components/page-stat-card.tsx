import type { LucideIcon } from 'lucide-react'
import { AnimatedCard } from '@/components/ui/animated-card'
import { Card, CardContent } from '@/components/ui/card'

interface PageStatCardProps {
  label: string
  value: number
  hint: string
  icon: LucideIcon
  /** Tailwind classes for the icon disc, icon and figure, as on the blog posts list. */
  tone: { disc: string; icon: string; value: string }
  delay: number
}

/** Same stat tile as /admin/blog/posts. */
export function PageStatCard({ label, value, hint, icon: Icon, tone, delay }: PageStatCardProps) {
  return (
    <AnimatedCard delay={delay}>
      <Card className="admin-card-hover">
        <CardContent className="p-5">
          <div className="mb-3 flex items-start justify-between">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${tone.disc}`}>
              <Icon className={`h-4 w-4 ${tone.icon}`} />
            </div>
          </div>
          <div className="mb-1 flex items-baseline gap-2">
            <span className={`text-2xl font-bold tracking-tight sm:text-3xl ${tone.value}`}>{value}</span>
          </div>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </CardContent>
      </Card>
    </AnimatedCard>
  )
}
