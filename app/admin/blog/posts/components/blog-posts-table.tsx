'use client'

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Star,
  Archive,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { BlogPostWithRelations, deleteBlogPost, toggleBlogPostFeatured, toggleBlogPostStatus } from "../actions"

interface BlogPostsTableProps {
  posts: BlogPostWithRelations[]
}

function getStatusBadgeVariant(status: string | null) {
  switch (status) {
    case 'published': return 'default'
    case 'draft': return 'secondary'
    case 'archived': return 'outline'
    default: return 'secondary'
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function BlogPostsTable({ posts }: BlogPostsTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await deleteBlogPost(deletingId)
      toast.success("Blog post deleted successfully")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete post")
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: string | null) => {
    setTogglingId(id)
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published'
      await toggleBlogPostStatus(id, newStatus as 'draft' | 'published')
      toast.success(`Post ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`)
      router.refresh()
    } catch (error) {
      toast.error("Failed to update post status")
    } finally {
      setTogglingId(null)
    }
  }

  const handleToggleFeatured = async (id: string, isFeatured: boolean) => {
    try {
      await toggleBlogPostFeatured(id, isFeatured)
      toast.success(`Post ${isFeatured ? 'featured' : 'unfeatured'} successfully`)
      router.refresh()
    } catch (error) {
      toast.error("Failed to update featured status")
    }
  }

  const handleArchive = async (id: string) => {
    try {
      await toggleBlogPostStatus(id, 'archived')
      toast.success("Post archived successfully")
      router.refresh()
    } catch (error) {
      toast.error("Failed to archive post")
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Featured</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No blog posts found
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium max-w-[250px]">
                    <div>
                      <p className="truncate">{post.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{post.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {post.category ? (
                      <Badge variant="secondary">{post.category.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {post.author?.full_name || post.author?.email || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(post.status)}>
                      {post.status || 'draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm text-muted-foreground">
                      {post.is_featured ? 'Yes' : 'No'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Eye className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{post.view_count || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{formatDate(post.published_at)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/blog/posts/${post.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Post
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(post.id, post.status)}
                          disabled={togglingId === post.id}
                        >
                          <Star className="mr-2 h-4 w-4" />
                          {post.status === 'published' ? 'Unpublish' : 'Publish'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleFeatured(post.id, !post.is_featured)}
                        >
                          <Star className="mr-2 h-4 w-4" />
                          {post.is_featured ? 'Remove Featured' : 'Mark as Featured'}
                        </DropdownMenuItem>
                        {post.status !== 'archived' && (
                          <DropdownMenuItem
                            onClick={() => handleArchive(post.id)}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeletingId(post.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this blog post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
