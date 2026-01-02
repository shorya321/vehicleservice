'use client'

export function AcceptedCards() {
  return (
    <div className="flex justify-center gap-3 mt-6">
      {/* Visa */}
      <div className="w-12 h-8 flex items-center justify-center bg-[rgba(42,40,38,0.5)] border border-[rgba(198,170,136,0.1)] rounded-md opacity-70 hover:opacity-100 hover:border-[rgba(198,170,136,0.3)] transition-all">
        <svg width="32" height="20" viewBox="0 0 32 20">
          <rect width="32" height="20" rx="3" fill="#1A1F71"/>
          <path d="M13 14h-2l1.5-9h2.5l-2 9zm7-9l-2 5.5-.5-2.5-.5-2c0-.5-.5-1-1.5-1h-3l-.1.2c1.5.4 3 1 3.5 1.5l2.5 7.3h2.5l4-9h-2.4zm-5.5 9h-2.3l1.4-9h2.3l-1.4 9zm13.5-6.2c0-.6-.4-1-1.3-1.3-.5-.2-1.3-.4-2-.4s-1.2.2-1.2.6c0 .3.4.5 1 .7l.6.2c1.3.3 2 .8 2 1.7 0 1.3-1.3 2.2-3.2 2.2-1 0-2-.2-2.5-.4l.4-1.3h.2c.7.3 1.3.4 2 .4.6 0 1.3-.2 1.3-.7 0-.3-.3-.5-1-.7l-.7-.2c-1.3-.3-2-.8-2-1.6 0-1.2 1.2-2.1 3-2.1 1 0 1.7.2 2.2.4l-.3 1.2-.5-.2z" fill="white"/>
        </svg>
      </div>

      {/* Mastercard */}
      <div className="w-12 h-8 flex items-center justify-center bg-[rgba(42,40,38,0.5)] border border-[rgba(198,170,136,0.1)] rounded-md opacity-70 hover:opacity-100 hover:border-[rgba(198,170,136,0.3)] transition-all">
        <svg width="32" height="20" viewBox="0 0 32 20">
          <rect width="32" height="20" rx="3" fill="#000"/>
          <circle cx="12" cy="10" r="6" fill="#EB001B"/>
          <circle cx="20" cy="10" r="6" fill="#F79E1B"/>
          <path d="M16 5.3a6 6 0 0 0-2.1 4.7 6 6 0 0 0 2.1 4.7 6 6 0 0 0 2.1-4.7 6 6 0 0 0-2.1-4.7z" fill="#FF5F00"/>
        </svg>
      </div>

      {/* Amex */}
      <div className="w-12 h-8 flex items-center justify-center bg-[rgba(42,40,38,0.5)] border border-[rgba(198,170,136,0.1)] rounded-md opacity-70 hover:opacity-100 hover:border-[rgba(198,170,136,0.3)] transition-all">
        <svg width="32" height="20" viewBox="0 0 32 20">
          <rect width="32" height="20" rx="3" fill="#006FCF"/>
          <text x="16" y="13" fontSize="7" fill="white" textAnchor="middle" fontWeight="bold">AMEX</text>
        </svg>
      </div>

      {/* Stripe */}
      <div className="w-12 h-8 flex items-center justify-center bg-[rgba(42,40,38,0.5)] border border-[rgba(198,170,136,0.1)] rounded-md opacity-70 hover:opacity-100 hover:border-[rgba(198,170,136,0.3)] transition-all">
        <svg width="32" height="20" viewBox="0 0 32 20">
          <rect width="32" height="20" rx="3" fill="#635BFF"/>
          <text x="16" y="13" fontSize="6" fill="white" textAnchor="middle" fontWeight="bold">STRIPE</text>
        </svg>
      </div>
    </div>
  )
}
