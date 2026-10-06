import { serializeJsonLd, type JsonLdObject } from '@/lib/seo/json-ld'

interface JsonLdProps {
  data: JsonLdObject | JsonLdObject[]
}

/** Structured data for search engines. Content is escaped by `serializeJsonLd`. */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
