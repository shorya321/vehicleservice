import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { BlogCategoryForm } from "../../components/category-form"
import { getBlogCategory } from "../../actions"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Edit Blog Category | Admin",
  description: "Update blog category details",
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditBlogCategoryPage({ params }: PageProps) {
  const { id } = await params
  const category = await getBlogCategory(id)

  if (!category) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/blog/categories">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Category</h1>
          <p className="text-muted-foreground">
            Update &ldquo;{category.name}&rdquo;
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
          <CardDescription>Update the category settings</CardDescription>
        </CardHeader>
        <CardContent>
          <BlogCategoryForm category={category} />
        </CardContent>
      </Card>
    </div>
  )
}
