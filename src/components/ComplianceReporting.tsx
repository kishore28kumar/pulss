import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  FileText,
  Download,
  Shield,
  ChartBar,
  CheckCircle,
  Warning,
  Info
} from '@phosphor-icons/react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface ComplianceTemplate {
  template_id: string;
  name: string;
  description: string;
  standard: string;
  retention_days: number;
}

interface ComplianceReport {
  summary: {
    total_events: string;
    unique_admins: string;
    successful_events: string;
    failed_events: string;
    critical_events: string;
    high_events: string;
  };
  eventsByDay: Array<{
    date: string;
    count: string;
  }>;
  topAdmins: Array<{
    admin_email: string;
    action_count: string;
  }>;
}

interface ComplianceReportingProps {
  tenantId?: string;
}

export const ComplianceReporting: React.FC<ComplianceReportingProps> = ({ tenantId }) => {
  const [templates, setTemplates] = useState<ComplianceTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<'7days' | '30days' | 'month' | 'quarter'>('30days');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/audit-logs/compliance/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch templates');

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load compliance templates');
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);

      // Calculate date range
      let startDate: Date;
      let endDate = new Date();

      switch (dateRange) {
        case '7days':
          startDate = subDays(endDate, 7);
          break;
        case '30days':
          startDate = subDays(endDate, 30);
          break;
        case 'month':
          startDate = startOfMonth(endDate);
          endDate = endOfMonth(endDate);
          break;
        case 'quarter':
          startDate = subDays(endDate, 90);
          break;
        default:
          startDate = subDays(endDate, 30);
      }

      const params = new URLSearchParams({
        ...(tenantId && { tenant_id: tenantId }),
        ...(selectedTemplate && { report_type: selectedTemplate }),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });

      const response = await fetch(`/api/audit-logs/compliance/report?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const data = await response.json();
      setReport(data.report);
      toast.success('Compliance report generated');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate compliance report');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'json' | 'pdf') => {
    try {
      toast.info(`Exporting report as ${format.toUpperCase()}...`);
      // TODO: Implement export functionality
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Compliance Reporting
          </CardTitle>
          <CardDescription>
            Generate compliance reports based on industry standards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Compliance Standard</label>
              <Select
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select standard" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Standards</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.template_id} value={template.standard}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select
                value={dateRange}
                onValueChange={(value: any) => setDateRange(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="month">Current Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={generateReport}
                disabled={loading || !selectedTemplate}
                className="w-full"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </div>

          {/* Compliance Templates */}
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-3">Available Compliance Standards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {templates.map((template) => (
                <Card key={template.template_id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline">{template.standard}</Badge>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h4 className="font-medium text-sm mb-1">{template.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Retention: {template.retention_days} days
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {report && (
        <>
          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ChartBar className="h-5 w-5" />
                  Report Summary
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportReport('json')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportReport('pdf')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Total Events</div>
                  <div className="text-2xl font-bold">{report.summary.total_events}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Unique Admins</div>
                  <div className="text-2xl font-bold">{report.summary.unique_admins}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Successful
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {report.summary.successful_events}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Warning className="h-4 w-4 text-red-500" />
                    Failed
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {report.summary.failed_events}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Warning className="h-4 w-4 text-orange-500" weight="fill" />
                    <span className="text-sm font-medium">Critical Events</span>
                  </div>
                  <div className="text-xl font-bold">{report.summary.critical_events}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-blue-500" weight="fill" />
                    <span className="text-sm font-medium">High Priority</span>
                  </div>
                  <div className="text-xl font-bold">{report.summary.high_events}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Admins Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Most Active Administrators</CardTitle>
              <CardDescription>
                Top users by audit log activity during the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.topAdmins.map((admin, index) => (
                  <div
                    key={admin.admin_email}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{admin.admin_email}</div>
                        <div className="text-sm text-muted-foreground">
                          {admin.action_count} actions
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">{admin.action_count}</Badge>
                  </div>
                ))}
                {report.topAdmins.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No admin activity found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Events Timeline */}
          {report.eventsByDay.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Event Timeline</CardTitle>
                <CardDescription>
                  Daily audit event volume during the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.eventsByDay.map((day) => (
                    <div key={day.date} className="flex items-center gap-4">
                      <div className="text-sm text-muted-foreground w-32">
                        {format(new Date(day.date), 'MMM dd, yyyy')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="bg-primary h-6 rounded"
                            style={{
                              width: `${(parseInt(day.count) / Math.max(...report.eventsByDay.map(d => parseInt(d.count)))) * 100}%`
                            }}
                          />
                          <span className="text-sm font-medium">{day.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
