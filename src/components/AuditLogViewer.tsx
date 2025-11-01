import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Shield,
  Search,
  Filter,
  Download,
  Eye,
  User,
  Settings,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Activity
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { format, subDays, subHours } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { AuditLog, FeatureFlags } from '@/types'
import { toast } from 'sonner'

interface AuditLogViewerProps {
  tenantId: string
  role: 'admin' | 'super_admin'
}

interface AuditFilters {
  action?: string
  resource_type?: string
  user_id?: string
  date_range: 'today' | '7days' | '30days' | 'custom'
  search_query?: string
}

const ACTION_TYPES = [
  'create', 'update', 'delete', 'login', 'logout', 
  'export', 'privacy_action', 'prescription_review'
]

const RESOURCE_TYPES = [
  'product', 'order', 'customer', 'prescription', 
  'privacy_settings', 'user_account', 'system_settings'
]

const ACTION_COLORS = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  login: 'bg-gray-100 text-gray-800',
  logout: 'bg-gray-100 text-gray-800',
  export: 'bg-purple-100 text-purple-800',
  privacy_action: 'bg-orange-100 text-orange-800',
  prescription_review: 'bg-yellow-100 text-yellow-800'
}

const RISK_LEVELS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ tenantId, role }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<AuditFilters>({ date_range: '7days' })
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null)
  const [totalLogs, setTotalLogs] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(50)

  useEffect(() => {
    loadFeatureFlags()
  }, [tenantId])

  useEffect(() => {
    if (featureFlags?.audit_logging_enabled) {
      loadAuditLogs()
    }
  }, [featureFlags, filters, page])

  const loadFeatureFlags = async () => {
    try {
      const { data: flags } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('tenant_id', tenantId)
        .single()

      setFeatureFlags(flags)
    } catch (error) {
      console.error('Error loading feature flags:', error)
    }
  }

  const loadAuditLogs = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })

      // Apply tenant filter for regular admins
      if (role === 'admin') {
        query = query.eq('tenant_id', tenantId)
      }

      // Apply date range filter
      const now = new Date()
      let startDate: Date
      switch (filters.date_range) {
        case 'today':
          startDate = subDays(now, 1)
          break
        case '7days':
          startDate = subDays(now, 7)
          break
        case '30days':
          startDate = subDays(now, 30)
          break
        default:
          startDate = subDays(now, 7)
      }
      query = query.gte('created_at', startDate.toISOString())

      // Apply other filters
      if (filters.action) {
        query = query.eq('action', filters.action)
      }
      if (filters.resource_type) {
        query = query.eq('resource_type', filters.resource_type)
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id)
      }
      if (filters.search_query) {
        query = query.or(`resource_type.ilike.%${filters.search_query}%,action.ilike.%${filters.search_query}%`)
      }

      // Pagination and ordering
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1)

      if (error) throw error

      setAuditLogs(data || [])
      setTotalLogs(count || 0)
    } catch (error) {
      console.error('Error loading audit logs:', error)
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  const exportAuditLogs = async () => {
    try {
      let query = supabase.from('audit_logs').select('*')

      if (role === 'admin') {
        query = query.eq('tenant_id', tenantId)
      }

      // Apply same filters as current view
      const now = new Date()
      let startDate: Date
      switch (filters.date_range) {
        case 'today':
          startDate = subDays(now, 1)
          break
        case '7days':
          startDate = subDays(now, 7)
          break
        case '30days':
          startDate = subDays(now, 30)
          break
        default:
          startDate = subDays(now, 7)
      }
      query = query.gte('created_at', startDate.toISOString())

      if (filters.action) query = query.eq('action', filters.action)
      if (filters.resource_type) query = query.eq('resource_type', filters.resource_type)
      if (filters.user_id) query = query.eq('user_id', filters.user_id)

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      // Convert to CSV
      const csvContent = [
        ['Timestamp', 'Action', 'Resource Type', 'Resource ID', 'User ID', 'IP Address', 'Changes'].join(','),
        ...data.map(log => [
          format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
          log.action,
          log.resource_type,
          log.resource_id || '',
          log.user_id || '',
          log.ip_address || '',
          JSON.stringify(log.new_values || {}).replace(/,/g, ';')
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
      a.click()
      URL.revokeObjectURL(url)

      toast.success('Audit logs exported successfully')
    } catch (error) {
      console.error('Error exporting audit logs:', error)
      toast.error('Failed to export audit logs')
    }
  }

  const getRiskLevel = (log: AuditLog): 'low' | 'medium' | 'high' => {
    if (log.action === 'delete' || log.resource_type === 'prescription') return 'high'
    if (log.action === 'privacy_action' || log.resource_type === 'user_account') return 'medium'
    return 'low'
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <CheckCircle className="h-4 w-4" />
      case 'update':
        return <Settings className="h-4 w-4" />
      case 'delete':
        return <AlertTriangle className="h-4 w-4" />
      case 'login':
      case 'logout':
        return <User className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  if (!featureFlags?.audit_logging_enabled) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-semibold mb-2">Audit Logging</p>
          <p className="text-muted-foreground">Audit logging is not enabled for this tenant</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all system activities and changes for compliance and security
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportAuditLogs} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{totalLogs}</p>
            <p className="text-xs text-muted-foreground">Total Events</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-2" />
            <p className="text-2xl font-bold">
              {auditLogs.filter(log => getRiskLevel(log) === 'high').length}
            </p>
            <p className="text-xs text-muted-foreground">High Risk</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <User className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">
              {new Set(auditLogs.map(log => log.user_id).filter(Boolean)).size}
            </p>
            <p className="text-xs text-muted-foreground">Active Users</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold">
              {auditLogs.filter(log => 
                new Date(log.created_at).getTime() > subHours(new Date(), 1).getTime()
              ).length}
            </p>
            <p className="text-xs text-muted-foreground">Last Hour</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select
                value={filters.date_range}
                onValueChange={(value) => setFilters(prev => ({ ...prev, date_range: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Action</label>
              <Select
                value={filters.action || 'all'}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  action: value === 'all' ? undefined : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {ACTION_TYPES.map(action => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Resource Type</label>
              <Select
                value={filters.resource_type || 'all'}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  resource_type: value === 'all' ? undefined : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All resources</SelectItem>
                  {RESOURCE_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={filters.search_query || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search_query: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Activity</span>
            <Badge variant="secondary">{totalLogs} total events</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">No audit logs found</p>
              <p className="text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {auditLogs.map((log, index) => {
                  const riskLevel = getRiskLevel(log)
                  const actionColor = ACTION_COLORS[log.action as keyof typeof ACTION_COLORS] || 'bg-gray-100 text-gray-800'
                  const riskColor = RISK_LEVELS[riskLevel]

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className={`p-2 rounded-full ${actionColor.split(' ')[0]}`}>
                                {getActionIcon(log.action)}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className={actionColor} variant="secondary">
                                    {log.action}
                                  </Badge>
                                  <Badge variant="outline">
                                    {log.resource_type}
                                  </Badge>
                                  <Badge className={riskColor} variant="secondary">
                                    {riskLevel} risk
                                  </Badge>
                                </div>
                                
                                <div className="text-sm space-y-1">
                                  <p className="text-muted-foreground">
                                    <span className="font-medium">Resource ID:</span> {log.resource_id || 'N/A'}
                                  </p>
                                  <p className="text-muted-foreground">
                                    <span className="font-medium">User:</span> {log.user_id || 'System'}
                                  </p>
                                  {log.ip_address && (
                                    <p className="text-muted-foreground">
                                      <span className="font-medium">IP:</span> {log.ip_address}
                                    </p>
                                  )}
                                  {log.new_values && Object.keys(log.new_values).length > 0 && (
                                    <details className="mt-2">
                                      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-primary">
                                        View changes
                                      </summary>
                                      <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                                        {JSON.stringify(log.new_values, null, 2)}
                                      </pre>
                                    </details>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right text-sm text-muted-foreground">
                              <p>{format(new Date(log.created_at), 'MMM d, yyyy')}</p>
                              <p>{format(new Date(log.created_at), 'h:mm a')}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalLogs > perPage && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, totalLogs)} of {totalLogs} entries
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(prev => prev + 1)}
              disabled={page * perPage >= totalLogs}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditLogViewer