/** SCOPE: Business module ONLY. Copy of the admin/vendor helper. */
import {
  labelFromAnchor,
  type AnchorSnapshot,
  type ClickSnapshot,
} from './classify-navigation'

/** Controls that can sit inside a link row and cancel its navigation. */
const NESTED_CONTROL_SELECTOR = 'button, input, select, textarea, label, [role="button"], [role="checkbox"], [role="menuitem"]'

export function snapshotClick(event: MouseEvent): ClickSnapshot {
  return {
    button: event.button,
    metaKey: event.metaKey,
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
  }
}

export function snapshotAnchor(anchor: HTMLAnchorElement, target: Element): AnchorSnapshot {
  const nested = target.closest(NESTED_CONTROL_SELECTOR)
  return {
    href: anchor.href,
    target: anchor.getAttribute('target'),
    download: anchor.hasAttribute('download'),
    optOut: anchor.closest('[data-no-progress]') !== null,
    insideNestedControl: nested !== null && anchor.contains(nested) && nested !== anchor,
  }
}

/** Pathname of an href resolved against the current page, or null if unparseable. */
export function resolvePathname(href: string): string | null {
  try {
    return new URL(href, window.location.href).pathname
  } catch {
    return null
  }
}

export function anchorOwnLabel(anchor: HTMLAnchorElement): string | null {
  return labelFromAnchor({
    dataLabel: anchor.dataset.navLabel ?? null,
    ariaLabel: anchor.getAttribute('aria-label'),
    text: anchor.textContent,
  })
}
