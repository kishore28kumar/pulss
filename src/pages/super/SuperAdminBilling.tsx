import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  FileText,
  Tag,
  Users,
  DollarSign,
  TrendingUp,
  Settings,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Shield,
  BarChart3,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Plan {
  plan_id: string;
  name: string;
  description: string;
  billing_period: string;
  base_price: number;
  features: any;
  limits: any;
  trial_days: number;
  is_active: boolean;
  is_public: boolean;
}

interface Coupon {
  coupon_id: string;
  code: string;
  name: string;
  description: string;
  discount_type: string;
  discount_value: number;
  valid_from: string;
  valid_until: string;
  max_redemptions: number;
  redemptions_count: number;
  is_active: boolean;
}

interface TenantSubscription {
  tenant_id: string;
  name: string;
  subscription_status: string;
  plan_name: string;
  base_price: number;
  billing_period: string;
  current_period_end: string;
}

interface BillingAnalytics {
  revenue: {
    total: number;
    paid_invoices: number;
  };
  subscriptions: Array<{ status: string; count: number }>;
  plan_revenue: Array<{
    name: string;
    subscriptions: number;
    estimated_revenue: number;
  }>;
  top_coupons: Array<{
    code: string;
    name: string;
    redemptions: number;
    total_discount: number;
  }>;
}

const SuperAdminBilling = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'plans' | 'coupons' | 'tenants' | 'features'
  >('overview');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [tenants, setTenants] = useState<TenantSubscription[]>([]);
  const [analytics, setAnalytics] = useState<BillingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showCouponDialog, setShowCouponDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (activeTab === 'overview') {
        const response = await fetch(`${API_URL}/billing/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data.data);
        }
      } else if (activeTab === 'plans') {
        const response = await fetch(`${API_URL}/billing/plans`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setPlans(data.data);
        }
      } else if (activeTab === 'coupons') {
        const response = await fetch(`${API_URL}/billing/admin/coupons`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setCoupons(data.data);
        }
      } else if (activeTab === 'tenants') {
        const response = await fetch(`${API_URL}/billing/admin/tenants/subscriptions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setTenants(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const createOrUpdatePlan = async (planData: Partial<Plan>) => {
    try {
      const token = localStorage.getItem('token');
      const url = editingPlan
        ? `${API_URL}/billing/admin/plans/${editingPlan.plan_id}`
        : `${API_URL}/billing/admin/plans`;
      const method = editingPlan ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });

      if (response.ok) {
        toast.success(`Plan ${editingPlan ? 'updated' : 'created'} successfully`);
        setShowPlanDialog(false);
        setEditingPlan(null);
        fetchData();
      } else {
        throw new Error('Failed to save plan');
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Failed to save plan');
    }
  };

  const createOrUpdateCoupon = async (couponData: Partial<Coupon>) => {
    try {
      const token = localStorage.getItem('token');
      const url = editingCoupon
        ? `${API_URL}/billing/admin/coupons/${editingCoupon.coupon_id}`
        : `${API_URL}/billing/admin/coupons`;
      const method = editingCoupon ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(couponData),
      });

      if (response.ok) {
        toast.success(`Coupon ${editingCoupon ? 'updated' : 'created'} successfully`);
        setShowCouponDialog(false);
        setEditingCoupon(null);
        fetchData();
      } else {
        throw new Error('Failed to save coupon');
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast.error('Failed to save coupon');
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/billing/admin/plans/${planId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Plan deleted successfully');
        fetchData();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete plan');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Failed to delete plan');
    }
  };

  const toggleCoupon = async (couponId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/billing/admin/coupons/${couponId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (response.ok) {
        toast.success(`Coupon ${!isActive ? 'activated' : 'deactivated'}`);
        fetchData();
      } else {
        throw new Error('Failed to toggle coupon');
      }
    } catch (error) {
      console.error('Error toggling coupon:', error);
      toast.error('Failed to update coupon');
    }
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
        <h1 className="text-3xl font-bold mb-2">Billing Management</h1>
        <p className="text-muted-foreground">
          Manage subscription plans, coupons, and tenant billing
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'plans', label: 'Plans', icon: CreditCard },
          { key: 'coupons', label: 'Coupons', icon: Tag },
          { key: 'tenants', label: 'Tenants', icon: Users },
          { key: 'features', label: 'Features', icon: Shield },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === key
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="inline h-4 w-4 mr-2" />
            {label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          {/* Revenue Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Total Revenue</h3>
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold">{formatCurrency(analytics.revenue.total)}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {analytics.revenue.paid_invoices} paid invoices
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Active Subscriptions</h3>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold">
                {analytics.subscriptions.find((s) => s.status === 'active')?.count || 0}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {analytics.subscriptions.find((s) => s.status === 'trial')?.count || 0} trials
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Top Coupon Savings</h3>
                <Tag className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold">
                {formatCurrency(
                  analytics.top_coupons.reduce((sum, c) => sum + (c.total_discount || 0), 0)
                )}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {analytics.top_coupons.reduce((sum, c) => sum + (c.redemptions || 0), 0)}{' '}
                redemptions
              </p>
            </Card>
          </div>

          {/* Plan Revenue */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Revenue by Plan</h3>
            <div className="space-y-3">
              {analytics.plan_revenue.map((plan) => (
                <div key={plan.name} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {plan.subscriptions} subscriptions
                    </p>
                  </div>
                  <p className="text-lg font-bold">{formatCurrency(plan.estimated_revenue)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowPlanDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={plan.plan_id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-3xl font-bold">{formatCurrency(plan.base_price)}</p>
                  <p className="text-sm text-muted-foreground">per {plan.billing_period}</p>
                  {plan.trial_days > 0 && (
                    <p className="text-sm text-green-600">{plan.trial_days} days free trial</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingPlan(plan);
                      setShowPlanDialog(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deletePlan(plan.plan_id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Coupons Tab */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowCouponDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Coupon
            </Button>
          </div>

          {coupons.map((coupon) => (
            <Card key={coupon.coupon_id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold">{coupon.code}</h3>
                    <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{coupon.name}</p>
                  <div className="flex gap-4 text-sm">
                    <p>
                      <span className="font-medium">Discount:</span>{' '}
                      {coupon.discount_type === 'percentage'
                        ? `${coupon.discount_value}%`
                        : formatCurrency(coupon.discount_value)}
                    </p>
                    <p>
                      <span className="font-medium">Used:</span> {coupon.redemptions_count}
                      {coupon.max_redemptions && `/${coupon.max_redemptions}`}
                    </p>
                    <p>
                      <span className="font-medium">Valid until:</span>{' '}
                      {formatDate(coupon.valid_until)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingCoupon(coupon);
                      setShowCouponDialog(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={coupon.is_active ? 'destructive' : 'default'}
                    onClick={() => toggleCoupon(coupon.coupon_id, coupon.is_active)}
                  >
                    {coupon.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tenants Tab */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          {tenants.map((tenant) => (
            <Card key={tenant.tenant_id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="font-semibold">{tenant.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Plan: {tenant.plan_name} ({formatCurrency(tenant.base_price)}/
                    {tenant.billing_period})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Renewal: {formatDate(tenant.current_period_end)}
                  </p>
                </div>
                <Badge>{tenant.subscription_status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Features Tab */}
      {activeTab === 'features' && (
        <Card className="p-6">
          <p className="text-muted-foreground text-center py-12">
            Feature permission management will be implemented here
          </p>
        </Card>
      )}
    </motion.div>
  );
};

export default SuperAdminBilling;
