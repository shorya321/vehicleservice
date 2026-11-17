export interface FleetPerk {
  title: string
  detail: string
}

/**
 * Three short facts beside the fleet heading. Each page passes its own, and
 * every one restates a commitment that page already makes elsewhere (the
 * header copy, the cards or the steps below), never a new promise.
 */
export function FleetPerks({ perks }: { perks: readonly FleetPerk[] }) {
  return (
    <ul className="results-perks">
      {perks.map((perk) => (
        <li key={perk.title} className="results-perks__item">
          <span className="results-perks__title">{perk.title}</span>
          <span className="results-perks__detail">{perk.detail}</span>
        </li>
      ))}
    </ul>
  )
}
