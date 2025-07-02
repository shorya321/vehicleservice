"use client"

import { useState } from "react"
import { User } from "@/lib/types/user"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
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
  Trash, 
  UserCheck, 
  UserX,
  Mail,
  ShieldCheck,
  ShieldOff,
  FileDown,
  History,
  Upload
} from "lucide-react"
import Link from "next/link"
import { DeleteUserDialog } from "./delete-user-dialog"
import { BulkActionsBar } from "./bulk-actions-bar"
import { updateUserStatus, sendPasswordResetEmail, toggleUser2FA, sendVerificationEmail } from "../actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface UserTableProps {
  users: User[]
  currentUserId?: string
  onExport?: () => void
}

export function UserTableWithBulk({ users, currentUserId, onExport }: UserTableProps) {
  const router = useRouter()
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default"
      case "vendor":
        return "secondary"
      case "driver":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "inactive":
        return "secondary"
      case "suspended":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    setLoadingStatus(userId)
    try {
      const result = await updateUserStatus(userId, newStatus)
      if (result.error) {
        console.error("Failed to update status:", result.error)
      }
      router.refresh()
    } finally {
      setLoadingStatus(null)
    }
  }

  const handleSendPasswordReset = async (email: string) => {
    const result = await sendPasswordResetEmail(email)
    if (result.error) {
      console.error("Failed to send password reset:", result.error)
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const selectableUsers = users
        .filter(user => user.id !== currentUserId)
        .map(user => user.id)
      setSelectedUsers(new Set(selectableUsers))
    } else {
      setSelectedUsers(new Set())
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers)
    if (checked) {
      newSelected.add(userId)
    } else {
      newSelected.delete(userId)
    }
    setSelectedUsers(newSelected)
  }

  const isAllSelected = users.length > 0 && 
    users.filter(user => user.id !== currentUserId).length === selectedUsers.size

  const isIndeterminate = selectedUsers.size > 0 && !isAllSelected

  return (
    <>
      <div className="space-y-4">
        {selectedUsers.size > 0 && (
          <BulkActionsBar
            selectedCount={selectedUsers.size}
            selectedUserIds={Array.from(selectedUsers)}
            onClearSelection={() => setSelectedUsers(new Set())}
          />
        )}
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    className="translate-y-[2px]"
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Last Sign In</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={(checked) => 
                          handleSelectUser(user.id, checked as boolean)
                        }
                        aria-label="Select user"
                        disabled={user.id === currentUserId}
                        className="translate-y-[2px]"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>
                            {getInitials(user.full_name, user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {user.full_name || "No name"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {user.email}
                          </span>
                          {user.phone && (
                            <span className="text-xs text-muted-foreground">
                              {user.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(user.status)}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.email_verified ? (
                          <Badge variant="outline" className="text-xs">
                            <Mail className="mr-1 h-3 w-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <Mail className="mr-1 h-3 w-3" />
                            Unverified
                          </Badge>
                        )}
                        {user.two_factor_enabled && (
                          <Badge variant="outline" className="text-xs">
                            <ShieldCheck className="mr-1 h-3 w-3" />
                            2FA
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {user.last_sign_in_at 
                            ? new Date(user.last_sign_in_at).toLocaleDateString()
                            : 'Never'
                          }
                        </span>
                        {user.sign_in_count > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {user.sign_in_count} sign-ins
                          </span>
                        )}
                      </div>
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
                            <Link href={`/admin/users/${user.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/${user.id}/activity`}>
                              <History className="mr-2 h-4 w-4" />
                              View Activity
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/${user.id}/photo`}>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Photo
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleSendPasswordReset(user.email)}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Send Password Reset
                          </DropdownMenuItem>
                          {!user.email_verified && (
                            <DropdownMenuItem
                              onClick={async () => {
                                const result = await sendVerificationEmail(user.id)
                                if (result.error) {
                                  toast.error(result.error)
                                } else {
                                  toast.success("Verification email sent successfully")
                                  router.refresh()
                                }
                              }}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Send Verification Email
                            </DropdownMenuItem>
                          )}
                          {user.two_factor_enabled ? (
                            <DropdownMenuItem
                              onClick={async () => {
                                const result = await toggleUser2FA(user.id, false)
                                if (!result.error) {
                                  router.refresh()
                                }
                              }}
                            >
                              <ShieldOff className="mr-2 h-4 w-4" />
                              Disable 2FA
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={async () => {
                                const result = await toggleUser2FA(user.id, true)
                                if (!result.error) {
                                  router.refresh()
                                }
                              }}
                            >
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Enable 2FA
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {user.status !== 'active' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(user.id, 'active')}
                              disabled={loadingStatus === user.id}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          {user.status !== 'suspended' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(user.id, 'suspended')}
                              disabled={loadingStatus === user.id}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteUserId(user.id)}
                            disabled={user.id === currentUserId}
                          >
                            <Trash className="mr-2 h-4 w-4" />
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
      </div>

      <DeleteUserDialog
        userId={deleteUserId}
        open={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
      />
    </>
  )
}