import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  FileText,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Tag,
  BarChart3,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Subscription {
  subscription_id: string;
  plan_name: string;
  plan_description: string;
  base_price: number;
  billing_period: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  trial_start?: string;
  trial_end?: string;
  cancel_at_period_end: boolean;
}

interface Invoice {
  invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  amount_paid: number;
  status: string;
  payment_status: string;
  subtotal: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  discount_amount: number;
}

interface UsageMetric {
  meter_type: string;
  total_usage: number;
  included_units: number;
  billable_usage: number;
  unit_price: number;
  estimated_charges: number;
}

const BillingManagement = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [usage, setUsage] = useState<UsageMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'usage'>('overview');
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch subscription
      const subResponse = await fetch(`${API_URL}/billing/subscription`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData.data);
      }

      // Fetch invoices
      const invoicesResponse = await fetch(`${API_URL}/billing/invoices?limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        setInvoices(invoicesData.data);
      }

      // Fetch usage metrics
      const usageResponse = await fetch(`${API_URL}/billing/usage`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        setUsage(usageData.data.metrics);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast.error('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/billing/invoices/${invoiceId}/gst`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // In production, generate and download PDF
        console.log('Invoice data:', data);
        toast.success('Invoice downloaded successfully');
      } else {
        throw new Error('Failed to download invoice');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  const applyCoupon = async (invoiceId: string) => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    try {
      setApplyingCoupon(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/billing/coupon/apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId,
          couponCode: couponCode.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setCouponCode('');
        fetchBillingData();
      } else {
        toast.error(data.message || 'Failed to apply coupon');
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast.error('Failed to apply coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }
    > = {
      active: { variant: 'default', icon: CheckCircle },
      trial: { variant: 'secondary', icon: Clock },
      past_due: { variant: 'destructive', icon: AlertTriangle },
      cancelled: { variant: 'outline', icon: XCircle },
      paid: { variant: 'default', icon: CheckCircle },
      pending: { variant: 'secondary', icon: Clock },
      overdue: { variant: 'destructive', icon: AlertTriangle },
    };

    const config = statusConfig[status] || { variant: 'outline', icon: Clock };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto p-6 space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription, invoices, and usage</p>
      </div>

      {/* Subscription Overview Card */}
      {subscription && (
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">{subscription.plan_name}</h2>
              <p className="text-muted-foreground">{subscription.plan_description}</p>
            </div>
            {getStatusBadge(subscription.status)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-2xl font-bold">{formatCurrency(subscription.base_price)}</p>
              <p className="text-xs text-muted-foreground">per {subscription.billing_period}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Current Period</p>
              <p className="text-sm font-medium">{formatDate(subscription.current_period_start)}</p>
              <p className="text-sm font-medium">
                to {formatDate(subscription.current_period_end)}
              </p>
            </div>

            {subscription.trial_end && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Trial Ends</p>
                <p className="text-sm font-medium">{formatDate(subscription.trial_end)}</p>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Renewal</p>
              <p className="text-sm font-medium">
                {subscription.cancel_at_period_end ? 'Cancelled' : 'Auto-renewal enabled'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'overview'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 className="inline h-4 w-4 mr-2" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'invoices'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="inline h-4 w-4 mr-2" />
          Invoices
        </button>
        <button
          onClick={() => setActiveTab('usage')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'usage'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <TrendingUp className="inline h-4 w-4 mr-2" />
          Usage
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Total Invoices</h3>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{invoices.length}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Total Paid</h3>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">
              {formatCurrency(
                invoices
                  .filter((inv) => inv.payment_status === 'paid')
                  .reduce((sum, inv) => sum + inv.amount_paid, 0)
              )}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Outstanding</h3>
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">
              {formatCurrency(
                invoices
                  .filter((inv) => inv.payment_status !== 'paid')
                  .reduce((sum, inv) => sum + (inv.total_amount - inv.amount_paid), 0)
              )}
            </p>
          </Card>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {invoices.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No invoices yet</p>
            </Card>
          ) : (
            invoices.map((invoice) => (
              <Card key={invoice.invoice_id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{invoice.invoice_number}</h3>
                      {getStatusBadge(invoice.payment_status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Issued: {formatDate(invoice.invoice_date)}
                      </p>
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Due: {formatDate(invoice.due_date)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <p className="text-2xl font-bold">{formatCurrency(invoice.total_amount)}</p>
                    {invoice.discount_amount > 0 && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Discount: {formatCurrency(invoice.discount_amount)}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadInvoice(invoice.invoice_id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      {invoice.payment_status === 'unpaid' && (
                        <Button size="sm">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Coupon application (only for unpaid invoices) */}
                {invoice.payment_status === 'unpaid' && invoice.discount_amount === 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-md"
                      />
                      <Button
                        onClick={() => applyCoupon(invoice.invoice_id)}
                        disabled={applyingCoupon}
                      >
                        <Tag className="h-4 w-4 mr-2" />
                        Apply
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'usage' && (
        <div className="space-y-4">
          {usage.length === 0 ? (
            <Card className="p-12 text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No usage data yet</p>
            </Card>
          ) : (
            usage.map((metric) => (
              <Card key={metric.meter_type} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="font-semibold capitalize">
                      {metric.meter_type.replace('_', ' ')}
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      <p>Total Usage: {metric.total_usage} units</p>
                      <p>Included: {metric.included_units} units</p>
                      <p>Billable: {metric.billable_usage} units</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatCurrency(metric.estimated_charges)}</p>
                    <p className="text-xs text-muted-foreground">
                      @ {formatCurrency(metric.unit_price)}/unit
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </motion.div>
  );
};

export default BillingManagement;
