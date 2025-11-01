import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Clock, 
  User, 
  Shield, 
  Key,
  Warning,
  CheckCircle,
  XCircle,
  FileText
} from '@phosphor-icons/react';

interface AuditLog {
  audit_id: string;
  tenant_id: string;
  admin_id: string;
  role_id: string;
  action: string;
  target_admin_id: string;
  changes: any;
  performed_by: string;
  performed_by_name: string;
  target_admin_name: string;
  role_name: string;
  role_display_name: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

const ACTION_LABELS: Record<string, { label: string; icon: any; variant: any }> = {
  role_created: { 
    label: 'Role Created', 
    icon: Shield, 
    variant: 'default' as const
  },
  role_updated: { 
    label: 'Role Updated', 
    icon: Shield, 
    variant: 'secondary' as const
  },
  role_deleted: { 
    label: 'Role Deleted', 
    icon: XCircle, 
    variant: 'destructive' as const
  },
  role_assigned: { 
    label: 'Role Assigned', 
    icon: CheckCircle, 
    variant: 'default' as const
  },
  role_revoked: { 
    label: 'Role Revoked', 
    icon: XCircle, 
    variant: 'secondary' as const
  },
  permission_added: { 
    label: 'Permission Added', 
    icon: Key, 
    variant: 'default' as const
  },
  permission_removed: { 
    label: 'Permission Removed', 
    icon: Key, 
    variant: 'destructive' as const
  },
  permission_updated: { 
    label: 'Permissions Updated', 
    icon: Key, 
    variant: 'secondary' as const
  },
  feature_flag_updated: { 
    label: 'Feature Flag Updated', 
    icon: Warning, 
    variant: 'secondary' as const
  }
};

export const RoleAuditLogs: React.FC = () => {
  const [actionFilter, setActionFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [limit, setLimit] = useState<number>(50);

  // Fetch audit logs
  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['role-audit-logs', actionFilter, startDate, endDate, limit],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (actionFilter) params.append('action', actionFilter);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      params.append('limit', limit.toString());
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rbac/audit-logs?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      
      return response.json();
    }
  });

  const handleReset = () => {
    setActionFilter('');
    setStartDate('');
    setEndDate('');
    setLimit(50);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" weight="fill" />
            Audit Logs
          </CardTitle>
          <CardDescription>
            View all role and permission changes in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="action-filter">Action Type</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger id="action-filter">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  {Object.entries(ACTION_LABELS).map(([action, { label }]) => (
                    <SelectItem key={action} value={action}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="limit">Limit</Label>
              <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v))}>
                <SelectTrigger id="limit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <Button variant="outline" size="sm" onClick={handleReset}>
              Reset Filters
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="py-8 text-center">Loading audit logs...</div>
          ) : !logs || logs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log: AuditLog) => {
                const actionConfig = ACTION_LABELS[log.action] || {
                  label: log.action,
                  icon: FileText,
                  variant: 'secondary' as const
                };
                const Icon = actionConfig.icon;

                return (
                  <Card key={log.audit_id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-primary" weight="fill" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={actionConfig.variant}>
                              {actionConfig.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {format(new Date(log.created_at), 'PPp')}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{log.performed_by_name || 'Unknown'}</span>
                              {log.action.includes('assigned') || log.action.includes('revoked') ? (
                                <>
                                  <span className="text-muted-foreground">
                                    {log.action.includes('assigned') ? 'assigned' : 'revoked'}
                                  </span>
                                  <Badge variant="outline">{log.role_display_name || log.role_name}</Badge>
                                  <span className="text-muted-foreground">
                                    {log.action.includes('assigned') ? 'to' : 'from'}
                                  </span>
                                  <span className="font-medium">{log.target_admin_name || 'Unknown'}</span>
                                </>
                              ) : log.action.includes('role') ? (
                                <>
                                  <span className="text-muted-foreground">
                                    {log.action.replace('role_', '')}
                                  </span>
                                  <Badge variant="outline">{log.role_display_name || log.role_name}</Badge>
                                </>
                              ) : null}
                            </div>

                            {log.changes && Object.keys(log.changes).length > 0 && (
                              <details className="text-xs mt-2">
                                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                  View changes
                                </summary>
                                <pre className="mt-2 p-2 rounded bg-muted overflow-x-auto">
                                  {JSON.stringify(log.changes, null, 2)}
                                </pre>
                              </details>
                            )}

                            {log.ip_address && (
                              <div className="text-xs text-muted-foreground">
                                IP: {log.ip_address}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Card */}
      {logs && logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold">{logs.length}</div>
                <div className="text-sm text-muted-foreground">Total Events</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {new Set(logs.map((l: AuditLog) => l.performed_by)).size}
                </div>
                <div className="text-sm text-muted-foreground">Unique Actors</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {logs.filter((l: AuditLog) => l.action.includes('assigned')).length}
                </div>
                <div className="text-sm text-muted-foreground">Assignments</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {logs.filter((l: AuditLog) => l.action.includes('permission')).length}
                </div>
                <div className="text-sm text-muted-foreground">Permission Changes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
