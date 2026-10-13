'use client'

import { useState } from 'react'
import type { FaqContent, FaqTopic } from '@/lib/cms/templates/faq/schema'
import { FaqHero } from './faq-hero'
import { FaqRail, type FaqRailTopic } from './faq-rail'
import { FaqItem } from './faq-item'
import { matchesTerm } from './highlight'

interface FaqExplorerProps {
  hero: FaqContent['hero']
  topics: FaqTopic[]
  /** Anchor id per topic, same order as `topics`. */
  topicIds: string[]
  /** Anchor of the help panel, or null when it is hidden. */
  helpHref: string | null
}

/** Hero search, topic rail and grouped questions; the search filters in place. */
export function FaqExplorer({ hero, topics, topicIds, helpHref }: FaqExplorerProps) {
  const [rawTerm, setRawTerm] = useState('')
  const term = rawTerm.trim()

  const total = topics.reduce((sum, topic) => sum + topic.items.length, 0)
  const groups = topics
    .map((topic, index) => ({
      id: topicIds[index],
      topic,
      items: topic.items.map((item, itemIndex) => ({ item, key: `${topicIds[index]}-${itemIndex}` })).filter(({ item }) => matchesTerm(item, term)),
    }))
    .filter((group) => group.items.length > 0)
  const shown = groups.reduce((sum, group) => sum + group.items.length, 0)
  const railTopics: FaqRailTopic[] = topics.map((topic, index) => ({ id: topicIds[index], name: topic.name, count: topic.items.length }))

  return (
    <>
      <FaqHero
        content={hero}
        topics={railTopics}
        term={rawTerm}
        onTermChange={setRawTerm}
        countLabel={term ? `${shown} of ${total}` : `${total} answers`}
      />
      <div className="luxury-container faq-page__board">
        <FaqRail topics={railTopics} helpHref={helpHref} />
        <div className="faq-page__groups">
          {groups.map((group) => (
            <section key={group.id} id={group.id} aria-labelledby={`${group.id}-heading`} className="faq-page__group">
              <div className="faq-page__group-head">
                <h2 id={`${group.id}-heading`}>{group.topic.name}</h2>
                {group.topic.blurb && <p>{group.topic.blurb}</p>}
              </div>
              <div className="faq-board__list">
                {group.items.map(({ item, key }) => (
                  <FaqItem key={key} id={key} question={item.question} answer={item.answer} term={term} />
                ))}
              </div>
            </section>
          ))}
          {groups.length === 0 && (
            <p className="faq-page__empty">
              No answer mentions &quot;{term}&quot;. Try a shorter word{helpHref ? <>, or <a href={helpHref}>ask the team</a></> : null}.
            </p>
          )}
        </div>
      </div>
    </>
  )
}
