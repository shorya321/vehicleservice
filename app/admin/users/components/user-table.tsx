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
  Shield
} from "lucide-react"
import Link from "next/link"
import { DeleteUserDialog } from "./delete-user-dialog"
import { updateUserStatus, sendPasswordResetEmail } from "../actions"
import { useRouter } from "next/navigation"

interface UserTableProps {
  users: User[]
  currentUserId?: string
}

export function UserTable({ users, currentUserId }: UserTableProps) {
  const router = useRouter()
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null)

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
    } else {
      // You could add a toast notification here
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

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
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
                    {new Date(user.created_at).toLocaleDateString()}
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
                        <DropdownMenuItem
                          onClick={() => handleSendPasswordReset(user.email)}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Send Password Reset
                        </DropdownMenuItem>
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

      <DeleteUserDialog
        userId={deleteUserId}
        open={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
      />
    </>
  )
}