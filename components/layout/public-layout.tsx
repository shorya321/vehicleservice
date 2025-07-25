import { PublicHeader } from './public-header'
import { Footer } from './footer'

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}