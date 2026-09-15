import { JoinCommunityAnimator } from "./join-community-animator"
import { JoinCommunityPlate } from "./join-community-plate"

export function JoinCommunity() {
  return (
    <section
      aria-labelledby="membership-heading"
      className="editorial-section editorial-section--ground"
    >
      <div className="luxury-container">
        <JoinCommunityAnimator>
          <JoinCommunityPlate />
        </JoinCommunityAnimator>
      </div>
    </section>
  )
}
