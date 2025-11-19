import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export const metadata = {
  title: 'Business Not Found',
  description: 'The business you are looking for could not be found',
}

export default function BusinessNotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-6">
            <AlertCircle className="h-16 w-16 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Business Not Found
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-300">
            The business you are trying to access could not be found at this domain.
          </p>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-left space-y-3 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Possible reasons:</strong>
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-disc list-inside">
              <li>The business subdomain or custom domain is incorrect</li>
              <li>The business account has not been set up yet</li>
              <li>The custom domain verification is pending</li>
              <li>The business account may have been deactivated</li>
            </ul>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please check the URL and try again, or contact the business directly for the correct access URL.
          </p>
        </div>

        <div className="space-y-3">
          <Link href={process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}>
            <Button className="w-full" size="lg">
              Go to Main Platform
            </Button>
          </Link>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  )
}
