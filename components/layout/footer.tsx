import Link from 'next/link'
import { Car } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center space-x-2">
              <Car className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">VehicleService</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your reliable partner for airport transfers and city rides.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/search" className="hover:text-primary transition-colors">
                  Search Transfers
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-primary transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/popular-routes" className="hover:text-primary transition-colors">
                  Popular Routes
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* For Vendors */}
          <div>
            <h3 className="font-semibold mb-3">For Vendors</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/vendor/login" className="hover:text-primary transition-colors">
                  Vendor Login
                </Link>
              </li>
              <li>
                <Link href="/customer/apply-vendor" className="hover:text-primary transition-colors">
                  Become a Vendor
                </Link>
              </li>
              <li>
                <Link href="/vendor/benefits" className="hover:text-primary transition-colors">
                  Vendor Benefits
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-3">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/faq" className="hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cancellation" className="hover:text-primary transition-colors">
                  Cancellation Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} VehicleService. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}