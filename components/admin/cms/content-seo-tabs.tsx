'use client'

import { FileText, HelpCircle, Search } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ContentSeoTabsProps {
  content: React.ReactNode
  seo: React.ReactNode
  /** Optional tab between Content and SEO. Only blog posts pass it today. */
  faq?: React.ReactNode
}

const TRIGGER = 'gap-2 border border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/10'

/** Content, SEO and the optional FAQ are separate forms with separate saves, side by side. */
export function ContentSeoTabs({ content, seo, faq }: ContentSeoTabsProps) {
  return (
    <Tabs defaultValue="content">
      <TabsList className="h-auto gap-1 border bg-card p-1">
        <TabsTrigger value="content" className={TRIGGER}>
          <FileText className="h-4 w-4" />
          Content
        </TabsTrigger>
        {/* FAQ sits with the content it belongs to; SEO stays last as the finishing step. */}
        {faq && (
          <TabsTrigger value="faq" className={TRIGGER}>
            <HelpCircle className="h-4 w-4" />
            FAQ
          </TabsTrigger>
        )}
        <TabsTrigger value="seo" className={TRIGGER}>
          <Search className="h-4 w-4" />
          SEO
        </TabsTrigger>
      </TabsList>
      {/* forceMount keeps unsaved edits in a form while the other tab is open. */}
      <TabsContent value="content" forceMount className="mt-6 data-[state=inactive]:hidden">
        {content}
      </TabsContent>
      {faq && (
        <TabsContent value="faq" forceMount className="mt-6 data-[state=inactive]:hidden">
          {faq}
        </TabsContent>
      )}
      <TabsContent value="seo" forceMount className="mt-6 data-[state=inactive]:hidden">
        {seo}
      </TabsContent>
    </Tabs>
  )
}
