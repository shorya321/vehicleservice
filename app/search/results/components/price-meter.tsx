const STEPS = [1, 2, 3, 4, 5] as const

interface PriceMeterProps {
  /** 1 to 5, from fleet-model's classLevels. */
  level: number
  className?: string
}

/**
 * Five bars for where a class sits in this search's price range. It is a
 * relative reading of the fares on the page, so it is labelled as a price
 * level, never as a quality grade.
 */
export function PriceMeter({ level, className = '' }: PriceMeterProps) {
  return (
    <span className={`price-meter ${className}`} role="img" aria-label={`Price level ${level} of 5`}>
      {STEPS.map((step) => (
        <i key={step} className={step <= level ? 'price-meter__bar price-meter__bar--on' : 'price-meter__bar'} />
      ))}
    </span>
  )
}
