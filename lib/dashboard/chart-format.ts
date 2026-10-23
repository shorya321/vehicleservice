/** Axis and label helpers for the dashboard revenue chart. */

/** Short axis tick: 2500 -> "2.5k", 1500000 -> "1.5M". */
export function compactAmount(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${trimZero(value / 1_000_000)}M`
  if (abs >= 1_000) return `${trimZero(value / 1_000)}k`
  return String(Math.round(value))
}

function trimZero(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '')
}

/**
 * How many buckets fit before x-axis labels collide. Past this, only every
 * n-th label is drawn; every point keeps its hover tooltip, so no value is lost.
 */
const MAX_READABLE_LABELS = 12

export function labelStride(bucketCount: number): number {
  return Math.max(1, Math.ceil(bucketCount / MAX_READABLE_LABELS))
}

/**
 * The last bucket always gets a label, since it is the one an admin reads
 * first. A strided label too close to it is dropped so the two don't collide.
 */
export function showsLabel(index: number, lastIndex: number, stride: number): boolean {
  if (index === lastIndex) return true
  return index % stride === 0 && lastIndex - index >= stride
}
