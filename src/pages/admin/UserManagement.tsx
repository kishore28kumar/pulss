import React from 'react'
import { BulkUserInviteWrapper } from '@/components/BulkUserInviteWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/useAuth'
import { Users } from '@phosphor-icons/react'

export const UserManagement: React.FC = () => {
  const { profile } = useAuth()

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage users and send bulk invitations
          </p>
        </div>
      </div>

      <BulkUserInviteWrapper />
    </div>
  )
}

export default UserManagement
