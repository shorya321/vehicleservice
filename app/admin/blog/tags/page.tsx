import { Metadata } from "next"
import { getBlogTags } from "./actions"
import { TagsManager } from "./components/tags-manager"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tag } from "lucide-react"
import { AnimatedCard } from "@/components/ui/animated-card"

export const metadata: Metadata = {
  title: "Blog Tags | Admin",
  description: "Manage blog tags",
}

export default async function BlogTagsPage() {
  const tags = await getBlogTags()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Blog Tags</h1>
        <p className="text-muted-foreground">
          Manage tags for organizing blog content
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AnimatedCard delay={0.1}>
          <Card className="admin-card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Total Tags</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                  <Tag className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-400">{tags.length}</span>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>
        <AnimatedCard delay={0.2}>
          <Card className="admin-card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Tags In Use</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20">
                  <Tag className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">
                  {tags.filter(t => (t.post_count || 0) > 0).length}
                </span>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tags</CardTitle>
          <CardDescription>Create, edit, and delete blog tags</CardDescription>
        </CardHeader>
        <CardContent>
          <TagsManager initialTags={tags} />
        </CardContent>
      </Card>
    </div>
  )
}
