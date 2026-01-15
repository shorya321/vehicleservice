/**
 * Admin Layout
 * Applies business-style fonts (Plus Jakarta Sans + Inter) to admin dashboard
 */

import '@/app/business/globals.css';

export default function AdminLayout({
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
