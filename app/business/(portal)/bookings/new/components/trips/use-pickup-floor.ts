'use client';

/**
 * The earliest bookable pickup, kept current while the page is open.
 * SCOPE: Business module ONLY.
 *
 * Read in an effect rather than during render: reading the clock while rendering risks a
 * server/client hydration mismatch, and a value captured once goes stale on a tab left open.
 * Null until mounted, which leaves the pickers unbounded rather than guessing.
 */

import { useEffect, useState } from 'react';
import { pickupFloor, type PickupFloor } from '@/lib/business/trips/pickup-floor';

const REFRESH_MS = 60_000;

export function usePickupFloor(leadMinutes: number): PickupFloor | null {
  const [floor, setFloor] = useState<PickupFloor | null>(null);

  useEffect(() => {
    const update = () => {
      const next = pickupFloor(new Date(), leadMinutes);
      // Same date and time keeps the old object, so an unchanged floor re-renders nothing.
      setFloor((current) => (current && current.date === next.date && current.time === next.time ? current : next));
    };
    update();
    const timer = setInterval(update, REFRESH_MS);
    return () => clearInterval(timer);
  }, [leadMinutes]);

  return floor;
}
