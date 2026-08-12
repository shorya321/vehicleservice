import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { BlogPostForm } from "../components/blog-post-form"
import { getAllBlogCategories } from "../../categories/actions"
import { getAllBlogTags } from "../../tags/actions"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "New Blog Post | Admin",
  description: "Create a new blog post",
}

export default async function NewBlogPostPage() {
  const [categories, tags] = await Promise.all([
    getAllBlogCategories(),
    getAllBlogTags(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/blog/posts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Blog Post</h1>
          <p className="text-muted-foreground">
            Create a new blog post
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Post Details</CardTitle>
          <CardDescription>
            Write and configure your blog post
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BlogPostForm categories={categories} tags={tags} />
        </CardContent>
      </Card>
    </div>
  )
}
