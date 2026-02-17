import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { BlogPostForm } from "../../components/blog-post-form"
import { getBlogPost } from "../../actions"
import { getAllBlogCategories } from "../../../categories/actions"
import { getAllBlogTags } from "../../../tags/actions"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Edit Blog Post | Admin",
  description: "Update blog post details",
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditBlogPostPage({ params }: PageProps) {
  const { id } = await params
  const [post, categories, tags] = await Promise.all([
    getBlogPost(id),
    getAllBlogCategories(),
    getAllBlogTags(),
  ])

  if (!post) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/blog/posts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Blog Post</h1>
          <p className="text-muted-foreground">
            Update &ldquo;{post.title}&rdquo;
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Post Details</CardTitle>
          <CardDescription>
            Update your blog post content and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BlogPostForm post={post} categories={categories} tags={tags} />
        </CardContent>
      </Card>
    </div>
  )
}
