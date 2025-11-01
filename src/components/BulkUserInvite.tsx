import React, { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Papa from 'papaparse'
import { 
  UserPlus, 
  Upload, 
  Download, 
  Trash, 
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  FileText,
  Users,
  ArrowClockwise
} from '@phosphor-icons/react'
import { UserInvite, BulkInviteBatch, InviteStats } from '@/types'

interface BulkUserInviteProps {
  tenantId: string
  apiBaseUrl?: string
  onInviteSuccess?: () => void
}

interface InviteFormData {
  email: string
  role: 'admin' | 'customer'
  name?: string
  phone?: string
}

export const BulkUserInvite: React.FC<BulkUserInviteProps> = ({ 
  tenantId, 
  apiBaseUrl = '/api',
  onInviteSuccess 
}) => {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [emailList, setEmailList] = useState('')
  const [selectedRole, setSelectedRole] = useState<'admin' | 'customer'>('customer')
  const [csvData, setCsvData] = useState<InviteFormData[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [activeTab, setActiveTab] = useState('manual')

  // Fetch invite statistics
  const { data: stats, isLoading: statsLoading } = useQuery<InviteStats>({
    queryKey: ['invite-stats', tenantId],
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}/invites/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch invite stats')
      return response.json()
    }
  })

  // Fetch invites with pagination
  const { data: invitesData, isLoading: invitesLoading } = useQuery({
    queryKey: ['invites', tenantId, 'pending'],
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}/invites?status=pending&limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch invites')
      return response.json()
    }
  })

  // Fetch recent batches
  const { data: batchesData } = useQuery({
    queryKey: ['invite-batches', tenantId],
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}/invites/batches?limit=5`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch batches')
      return response.json()
    }
  })

  // Create bulk invites mutation
  const createBulkInvitesMutation = useMutation({
    mutationFn: async (invites: InviteFormData[]) => {
      const response = await fetch(`${apiBaseUrl}/invites/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          invites,
          method: activeTab === 'csv' ? 'csv' : 'manual'
        })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create invites')
      }
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invites', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['invite-stats', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['invite-batches', tenantId] })
      
      toast.success('Invites sent successfully!', {
        description: `${data.summary.successful} invites sent, ${data.summary.failed} failed, ${data.summary.skipped} skipped`
      })
      
      // Reset form
      setEmailList('')
      setCsvData([])
      setShowPreview(false)
      
      if (onInviteSuccess) onInviteSuccess()
    },
    onError: (error: Error) => {
      toast.error('Failed to send invites', {
        description: error.message
      })
    }
  })

  // Resend invite mutation
  const resendInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const response = await fetch(`${apiBaseUrl}/invites/${inviteId}/resend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to resend invite')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites', tenantId] })
      toast.success('Invite resent successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to resend invite', {
        description: error.message
      })
    }
  })

  // Cancel invite mutation
  const cancelInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const response = await fetch(`${apiBaseUrl}/invites/${inviteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to cancel invite')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['invite-stats', tenantId] })
      toast.success('Invite cancelled successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to cancel invite', {
        description: error.message
      })
    }
  })

  const handleEmailListSubmit = () => {
    const emails = emailList
      .split(/[\n,;]/)
      .map(e => e.trim())
      .filter(e => e && e.includes('@'))
    
    if (emails.length === 0) {
      toast.error('No valid emails found')
      return
    }

    const invites: InviteFormData[] = emails.map(email => ({
      email,
      role: selectedRole
    }))

    createBulkInvitesMutation.mutate(invites)
  }

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validInvites: InviteFormData[] = []
        const errors: string[] = []

        results.data.forEach((row: any, index: number) => {
          if (!row.email || !row.email.includes('@')) {
            errors.push(`Row ${index + 1}: Invalid email`)
            return
          }

          validInvites.push({
            email: row.email.trim(),
            role: (row.role?.toLowerCase() === 'admin' ? 'admin' : 'customer') as 'admin' | 'customer',
            name: row.name?.trim(),
            phone: row.phone?.trim()
          })
        })

        if (errors.length > 0) {
          toast.warning('Some rows have errors', {
            description: errors.slice(0, 3).join(', ') + (errors.length > 3 ? '...' : '')
          })
        }

        if (validInvites.length > 0) {
          setCsvData(validInvites)
          setShowPreview(true)
          toast.success(`Loaded ${validInvites.length} valid invites`)
        } else {
          toast.error('No valid invites found in CSV')
        }
      },
      error: (error) => {
        toast.error('Failed to parse CSV', {
          description: error.message
        })
      }
    })
  }

  const handleCsvSubmit = () => {
    if (csvData.length === 0) {
      toast.error('No invites to send')
      return
    }

    createBulkInvitesMutation.mutate(csvData)
  }

  const downloadCsvTemplate = () => {
    const template = 'email,role,name,phone\nexample@email.com,customer,John Doe,1234567890\nadmin@email.com,admin,Admin User,9876543210'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'bulk_invite_template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'cancelled':
        return <Ban className="h-4 w-4 text-gray-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Invites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accepted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.accepted || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.expired || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Invite Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Send Bulk Invites
          </CardTitle>
          <CardDescription>
            Invite multiple users at once via email list or CSV upload
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Email List</TabsTrigger>
              <TabsTrigger value="csv">CSV Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">User Role</Label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as 'admin' | 'customer')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailList">Email Addresses</Label>
                <Textarea
                  id="emailList"
                  placeholder="Enter email addresses (one per line, or comma/semicolon separated)&#10;example1@email.com&#10;example2@email.com&#10;example3@email.com"
                  value={emailList}
                  onChange={(e) => setEmailList(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Enter one email per line, or separate with commas/semicolons
                </p>
              </div>

              <Button
                onClick={handleEmailListSubmit}
                disabled={!emailList.trim() || createBulkInvitesMutation.isPending}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {createBulkInvitesMutation.isPending ? 'Sending...' : 'Send Invites'}
              </Button>
            </TabsContent>

            <TabsContent value="csv" className="space-y-4">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Upload a CSV file with columns: email, role, name (optional), phone (optional)
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={downloadCsvTemplate}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>

                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="hidden"
                />
              </div>

              {csvData.length > 0 && (
                <>
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Preview ({csvData.length} invites)</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCsvData([])
                          setShowPreview(false)
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {csvData.slice(0, 10).map((invite, index) => (
                        <div key={index} className="text-sm flex items-center gap-2 p-2 bg-muted rounded">
                          <Badge variant="outline">{invite.role}</Badge>
                          <span className="font-mono">{invite.email}</span>
                          {invite.name && <span className="text-muted-foreground">- {invite.name}</span>}
                        </div>
                      ))}
                      {csvData.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center pt-2">
                          ... and {csvData.length - 10} more
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleCsvSubmit}
                    disabled={createBulkInvitesMutation.isPending}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {createBulkInvitesMutation.isPending ? 'Sending...' : `Send ${csvData.length} Invites`}
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Pending Invites List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pending Invites
          </CardTitle>
          <CardDescription>
            Manage and track pending user invitations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitesLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : invitesData?.invites?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending invites
            </div>
          ) : (
            <div className="space-y-2">
              {invitesData?.invites?.map((invite: UserInvite) => (
                <div
                  key={invite.invite_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(invite.status)}
                      <span className="font-medium">{invite.email}</span>
                      <Badge variant="outline" className={getStatusColor(invite.status)}>
                        {invite.status}
                      </Badge>
                      <Badge variant="secondary">{invite.role}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Sent {new Date(invite.created_at).toLocaleDateString()} • 
                      Expires {new Date(invite.expires_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {invite.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resendInviteMutation.mutate(invite.invite_id)}
                        disabled={resendInviteMutation.isPending}
                      >
                        <ArrowClockwise className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelInviteMutation.mutate(invite.invite_id)}
                        disabled={cancelInviteMutation.isPending}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Batches */}
      {batchesData?.batches?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Invite Batches</CardTitle>
            <CardDescription>
              History of bulk invite operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {batchesData.batches.map((batch: BulkInviteBatch) => (
                <div
                  key={batch.batch_id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{batch.method}</Badge>
                      <span className="text-sm font-medium">
                        {batch.total_invites} invites
                      </span>
                      <Badge variant="secondary" className={getStatusColor(batch.status)}>
                        {batch.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(batch.created_at).toLocaleString()} • 
                      Success: {batch.successful_invites} • 
                      Failed: {batch.failed_invites}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
