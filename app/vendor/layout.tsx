/**
 * Vendor Layout
 * Applies business-style fonts (Plus Jakarta Sans + Inter) to vendor dashboard
 */

import '@/app/business/globals.css';

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="font-[family-name:var(--business-font-body)]">
      {children}
    </div>
  );
}
