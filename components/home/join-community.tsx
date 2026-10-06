import { JoinCommunityAnimator } from "./join-community-animator"
import { JoinCommunityPlate } from "./join-community-plate"
import type { HomeContent } from "@/lib/cms/templates/home/schema"

export function JoinCommunity({ content }: { content: HomeContent["account"] }) {
  return (
    <section
      aria-labelledby="membership-heading"
      className="editorial-section editorial-section--ground"
    >
      <div className="luxury-container">
        <JoinCommunityAnimator>
          <JoinCommunityPlate content={content} />
        </JoinCommunityAnimator>
      </div>
    </section>
  )
}
