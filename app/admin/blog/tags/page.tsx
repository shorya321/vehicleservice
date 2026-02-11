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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tags</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tags.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tags In Use</CardTitle>
            <Tag className="h-4 w-4 text-[var(--admin-success)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tags.filter(t => (t.post_count || 0) > 0).length}
            </div>
          </CardContent>
        </Card>
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
