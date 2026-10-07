'use client'

import { FileText, Search } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ContentSeoTabsProps {
  content: React.ReactNode
  seo: React.ReactNode
}

const TRIGGER = 'gap-2 border border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/10'

/** Content and SEO are separate forms with separate saves, side by side. */
export function ContentSeoTabs({ content, seo }: ContentSeoTabsProps) {
  return (
    <Tabs defaultValue="content">
      <TabsList className="h-auto gap-1 border bg-card p-1">
        <TabsTrigger value="content" className={TRIGGER}>
          <FileText className="h-4 w-4" />
          Content
        </TabsTrigger>
        <TabsTrigger value="seo" className={TRIGGER}>
          <Search className="h-4 w-4" />
          SEO
        </TabsTrigger>
      </TabsList>
      {/* forceMount keeps unsaved edits in a form while the other tab is open. */}
      <TabsContent value="content" forceMount className="mt-6 data-[state=inactive]:hidden">
        {content}
      </TabsContent>
      <TabsContent value="seo" forceMount className="mt-6 data-[state=inactive]:hidden">
        {seo}
      </TabsContent>
    </Tabs>
  )
}
