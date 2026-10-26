import { Clock, MapPin, Receipt } from "lucide-react"
import { HeroMap } from "@/components/home/hero/hero-map"
import { AuthLogo } from "./auth-logo"
import { PANEL_COPY, type CustomerAuthScreen } from "./customer-auth-content"

const CHIPS = [
  { icon: Clock, figure: "60 min", label: "free waiting" },
  { icon: Receipt, figure: null, label: "Fixed fare at booking" },
  { icon: MapPin, figure: null, label: "Flights tracked" },
] as const

interface CustomerAuthPanelProps {
  screen: CustomerAuthScreen
}

/**
 * The left half of the customer auth split screen: the home page street map
 * with the logo on top, the screen's story in the middle and the hero chips at
 * the bottom. Below the desktop breakpoint the copy hides and only the map
 * stays, as a band behind the top of the form column.
 */
export function CustomerAuthPanel({ screen }: CustomerAuthPanelProps): React.JSX.Element {
  const copy = PANEL_COPY[screen]

  return (
    <aside aria-label="Account benefits" className="cauth-panel">
      <div className="cauth-panel-map" aria-hidden="true">
        <HeroMap centreFade={false} />
        <div className="cauth-panel-wash" />
      </div>

      <div className="cauth-panel-inner">
        <div className="cauth-panel-top">
          <AuthLogo variant="horizontal" />
        </div>

        <div className="cauth-panel-mid">
          <div className="editorial-eyebrow editorial-eyebrow--pill cauth-panel-eyebrow">
            <i aria-hidden="true" />
            {copy.eyebrow}
          </div>
          <h2 className="cauth-panel-title">
            {copy.title} <em>{copy.accent}</em>
          </h2>
          <p className="cauth-panel-body">{copy.body}</p>

          <ol className="cauth-beats">
            {copy.beats.map((beat) => (
              <li key={beat.index}>
                <span className="cauth-beat-index">{beat.index}</span>
                <div>
                  <p className="cauth-beat-title">{beat.title}</p>
                  <p className="cauth-beat-body">{beat.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="cauth-panel-bottom">
          <ul className="cauth-chips">
            {CHIPS.map(({ icon: Icon, figure, label }) => (
              <li key={label} className="cauth-chip">
                <span className="cauth-chip-icon"><Icon aria-hidden="true" /></span>
                {figure && <strong className="cauth-chip-figure">{figure}</strong>}
                {label}
              </li>
            ))}
          </ul>
          <p className="cauth-panel-caption">Dubai airport and city transfers</p>
        </div>
      </div>
    </aside>
  )
}
