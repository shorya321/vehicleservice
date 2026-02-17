import { Metadata } from 'next'
import Link from 'next/link'
import { CategoryForm } from '../components/category-form'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Add Vehicle Category - Admin',
  description: 'Create a new vehicle category',
}

export default function NewCategoryPage() {
  return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
          >
            <Link href="/admin/vehicle-categories">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add Vehicle Category</h1>
            <p className="text-muted-foreground">
              Create a new category for vehicle classification
            </p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Category Details</CardTitle>
            <CardDescription>
              Enter the information for the new vehicle category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryForm />
          </CardContent>
        </Card>
      </div>
  )
}