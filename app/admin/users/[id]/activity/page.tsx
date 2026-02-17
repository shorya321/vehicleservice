import { notFound } from "next/navigation"
import { getUser, getUserActivityLogs } from "../../actions"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Clock, User, Activity } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface UserActivityPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function UserActivityPage({ params }: UserActivityPageProps) {
  const { id } = await params
  const user = await getUser(id)

  if (!user) {
    notFound()
  }

  const activityLogs = await getUserActivityLogs(id)

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/users">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Activity Log
              </h1>
              <p className="text-muted-foreground">
                {user.full_name || user.email}
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              All actions performed by or on this user account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No activity logs found
                </div>
              ) : (
                activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
                  >
                    <div className="rounded-full bg-muted p-2">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{formatAction(log.action)}</p>
                        <Badge variant="outline" className="text-xs">
                          {log.action}
                        </Badge>
                      </div>
                      {log.details && (
                        <p className="text-sm text-muted-foreground">
                          {formatDetails(log.details)}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(log.created_at), "PPp")}
                        </div>
                        {log.ip_address && (
                          <span>IP: {log.ip_address}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
  )
}

function formatAction(action: string): string {
  const actionMap: Record<string, string> = {
    'user_created': 'User account created',
    'user_updated': 'Profile updated',
    'status_changed': 'Status changed',
    'status_changed_bulk': 'Status changed via bulk action',
    'password_reset': 'Password reset requested',
    'login': 'Logged in',
    'logout': 'Logged out',
    'role_changed': 'Role changed',
    'email_verified': 'Email verified',
    'two_factor_enabled': '2FA enabled',
    'two_factor_disabled': '2FA disabled',
  }
  
  return actionMap[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function formatDetails(details: any): string {
  if (typeof details === 'string') {
    return details
  }
  
  if (details.new_status) {
    return `Changed to ${details.new_status}`
  }
  
  if (details.new_role) {
    return `Changed from ${details.old_role} to ${details.new_role}`
  }
  
  if (details.changed_by) {
    return `By admin user`
  }
  
  return JSON.stringify(details)
}