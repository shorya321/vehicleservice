import type { LucideIcon } from 'lucide-react'

interface AboutTextCardProps {
  title: string
  body: string
  icon?: LucideIcon
}

/** A board card holding a short title and one or two lines, used by vetting and partner. */
export function AboutTextCard({ title, body, icon: Icon }: AboutTextCardProps) {
  return (
    <li className="blog-board-bezel">
      <div className="blog-board-core about-board-card">
        {Icon && (
          <span className="about-board-card__mark" aria-hidden="true">
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </span>
        )}
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
    </li>
  )
}
