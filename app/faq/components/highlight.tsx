import type { ReactNode } from 'react'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Wraps each case-insensitive match of `term` in a <mark>. Plain text when no term. */
export function Highlight({ text, term }: { text: string; term: string }): ReactNode {
  if (!term) {
    return text
  }
  const parts = text.split(new RegExp(`(${escapeRegExp(term)})`, 'gi'))
  return parts.map((part, index) =>
    index % 2 === 1 ? <mark key={index} className="faq-page__mark">{part}</mark> : part
  )
}

/** Whether a question or its answer mentions the term. */
export function matchesTerm(item: { question: string; answer: string }, term: string): boolean {
  if (!term) {
    return true
  }
  const needle = term.toLowerCase()
  return item.question.toLowerCase().includes(needle) || item.answer.toLowerCase().includes(needle)
}
