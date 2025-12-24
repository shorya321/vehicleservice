/**
 * Dashboard Loading State
 * Route-level suspense fallback
 *
 * SCOPE: Business module ONLY
 */

import { DashboardFullSkeleton } from './components/dashboard-skeletons';

export default function DashboardLoading() {
  return <DashboardFullSkeleton />;
}
