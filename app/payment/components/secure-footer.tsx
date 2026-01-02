'use client'

import { Lock, Shield, CheckCircle, MessageCircle } from 'lucide-react'

const badges = [
  { icon: Lock, label: 'SSL Encrypted' },
  { icon: Shield, label: 'Secure Payment' },
  { icon: CheckCircle, label: 'PCI DSS Compliant' },
  { icon: MessageCircle, label: '24/7 Support' },
]

export function SecureFooter() {
  return (
    <footer className="bg-[#0a0a0b] border-t border-[rgba(198,170,136,0.1)] py-6 md:py-8">
      <div className="max-w-[1400px] mx-auto px-6 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12 flex-wrap">
          {badges.map((badge) => (
            <span
              key={badge.label}
              className="flex items-center gap-2 text-xs text-[#7a7672]"
            >
              <badge.icon className="w-5 h-5 stroke-[#c6aa88]" />
              {badge.label}
            </span>
          ))}
        </div>
      </div>
    </footer>
  )
}
