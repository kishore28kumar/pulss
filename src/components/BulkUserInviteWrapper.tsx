import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useQuery } from '@tanstack/react-query'
import { BulkUserInvite } from './BulkUserInvite'
import { UserPlus, Lock } from '@phosphor-icons/react'
import { useAuth } from '@/lib/useAuth'

interface BulkUserInviteWrapperProps {
  apiBaseUrl?: string
}

export const BulkUserInviteWrapper: React.FC<BulkUserInviteWrapperProps> = ({ 
  apiBaseUrl = '/api' 
}) => {
  const { user, profile } = useAuth()
  
  // Fetch feature flags to check if bulk invite is enabled
  const { data: featureFlags, isLoading } = useQuery({
    queryKey: ['feature-flags', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) throw new Error('No tenant ID')
      
      const response = await fetch(`${apiBaseUrl}/tenants/${profile.tenant_id}/feature-flags`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch feature flags')
      return response.json()
    },
    enabled: !!profile?.tenant_id
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Check if bulk invite is enabled
  const isBulkInviteEnabled = featureFlags?.bulk_invite_enabled === true

  if (!isBulkInviteEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Bulk User Invites
          </CardTitle>
          <CardDescription>
            This feature is currently disabled for your tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  The bulk user invite feature is not currently enabled for your account.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please contact your super administrator to enable this feature.
                  Once enabled, you'll be able to invite multiple users at once via email list or CSV upload.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Bulk User Invites
          </h2>
          <p className="text-muted-foreground">
            Invite multiple users at once and manage pending invitations
          </p>
        </div>
      </div>
      
      <BulkUserInvite 
        tenantId={profile?.tenant_id || ''} 
        apiBaseUrl={apiBaseUrl}
      />
    </div>
  )
}
