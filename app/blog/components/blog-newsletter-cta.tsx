'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'

export function BlogNewsletterCta() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (email.trim()) {
      setSubmitted(true)
    }
  }

  return (
    <section className="bg-[var(--black-void)] blog-newsletter-section">
      <div className="luxury-container">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center max-w-4xl mx-auto">
          {/* Left — copy */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-6 h-px bg-[var(--gold)]" />
              <span className="t-label-accent">Newsletter</span>
            </div>
            <h2 className="t-headline mb-3">Stay informed</h2>
            <p className="t-meta max-w-md">
              Curated travel insights and exclusive offers, delivered weekly. No spam.
            </p>
          </div>

          {/* Right — form */}
          <div>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="flex gap-3">
                <input
                  type="email"
                  required
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 bg-[var(--black-warm)] border border-[var(--gold)]/20 rounded-[4px] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] focus:ring-[3px] focus:ring-[var(--gold)]/10 transition-all duration-200"
                />
                <button
                  type="submit"
                  className="px-6 py-3 text-[0.8125rem] font-semibold tracking-[0.08em] uppercase bg-[var(--gold)] text-[var(--onyx)] rounded-[4px] hover:bg-[var(--gold-deep)] transition-colors duration-300 whitespace-nowrap"
                >
                  Subscribe
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-3 text-[var(--gold)]">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">Subscribed. Welcome aboard.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
