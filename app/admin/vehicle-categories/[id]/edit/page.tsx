import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AdminLayout } from '@/components/layout/admin-layout'
import { CategoryForm } from '../../components/category-form'
import { getCategory, deleteCategory, getCategoryUsageCount } from '../../actions'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { DeleteButton } from './delete-button'

export const metadata: Metadata = {
  title: 'Edit Vehicle Category - Admin',
  description: 'Edit vehicle category details',
}

interface EditCategoryPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params
  const { data: category, error } = await getCategory(id)
  
  if (error || !category) {
    notFound()
  }

  const usageCount = await getCategoryUsageCount(id)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              asChild
            >
              <Link href="/admin/vehicle-categories">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit Vehicle Category</h1>
              <p className="text-muted-foreground">
                Update category information
              </p>
            </div>
          </div>
          
          <DeleteButton 
            categoryId={id} 
            categoryName={category.name}
            usageCount={usageCount}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Category Details</CardTitle>
              <CardDescription>
                Update the information for this vehicle category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryForm initialData={category} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Usage</CardTitle>
              <CardDescription>
                Statistics for this category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Vehicles Using Category</dt>
                  <dd className="mt-1 text-2xl font-semibold">{usageCount}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Category ID</dt>
                  <dd className="mt-1 font-mono text-sm">{category.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Sort Order</dt>
                  <dd className="mt-1 text-lg font-medium">{category.sort_order || 0}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}