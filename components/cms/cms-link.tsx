import * as React from 'react'
import Link from 'next/link'

// `import * as React` is for jest: ts-jest compiles JSX with the classic
// runtime, which needs React in scope.

interface CmsLinkProps {
  href: string
  className?: string
  children: React.ReactNode
}

/**
 * A link whose target an admin typed. Site paths go through next/link for
 * client navigation; in-page anchors, mail and phone links and external URLs
 * stay plain anchors, with external ones opened safely in a new tab.
 */
export function CmsLink({ href, className, children }: CmsLinkProps): React.JSX.Element {
  if (href.startsWith('/')) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    )
  }

  const external = href.startsWith('https://')

  return (
    <a
      href={href}
      className={className}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  )
}
