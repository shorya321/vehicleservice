import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { BlogPostForm } from "../../components/blog-post-form"
import { getBlogPost } from "../../actions"
import { getAllBlogCategories } from "../../../categories/actions"
import { getAllBlogTags } from "../../../tags/actions"
import { createAdminClient } from "@/lib/supabase/admin"
import { getSeoSettings, rowToSeoMeta } from "@/lib/seo/server"
import { EMPTY_SEO_META, SEO_META_COLUMNS, type SeoMetaValues } from "@/lib/seo/types"
import { titleSuffix } from "@/lib/seo/build-metadata"
import { absoluteUrl } from "@/lib/seo/site-url"
import { getSiteSettings } from "@/lib/site-settings/server"
import { SeoPanel } from "@/components/admin/seo/seo-panel"
import { ContentSeoTabs } from "@/components/admin/cms/content-seo-tabs"
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
  const [post, categories, tags, { data: seoRow }, seoSettings, site] = await Promise.all([
    getBlogPost(id),
    getAllBlogCategories(),
    getAllBlogTags(),
    createAdminClient()
      .from("seo_meta")
      .select(SEO_META_COLUMNS)
      .eq("entity_type", "blog_post")
      .eq("entity_id", id)
      .maybeSingle(),
    getSeoSettings(),
    getSiteSettings(),
  ])

  if (!post) {
    notFound()
  }

  // Before the SEO tab, a post's meta title, description and keywords lived on the post
  // row, and the public page still falls back to them. Seed from those so the
  // tab shows what is live.
  const initialSeo: SeoMetaValues = seoRow
    ? rowToSeoMeta(seoRow)
    : {
        ...EMPTY_SEO_META,
        meta_title: post.meta_title ?? "",
        meta_description: post.meta_description ?? "",
        meta_keywords: post.meta_keywords ?? "",
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

      <ContentSeoTabs
        content={
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
        }
        seo={
          <SeoPanel
            entityType="blog_post"
            entityId={post.id}
            initialValues={initialSeo}
            pageUrl={absoluteUrl(`/blog/${post.slug}`)}
            fallbackTitle={`${post.title}${titleSuffix(seoSettings, site.brand_name)}`}
            fallbackDescription={post.excerpt || seoSettings.default_description}
          />
        }
      />
    </div>
  )
}
