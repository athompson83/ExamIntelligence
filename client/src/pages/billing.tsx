import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Download, 
  Calendar, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Crown,
  TrendingUp
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { PRICING_PLANS } from '@shared/pricing';
import { Helmet } from 'react-helmet-async';
import LoadingSpinner from '@/components/ui/loading-spinner';

interface SubscriptionData {
  subscription: {
    id: string;
    status: string;
    tier: string;
    billingCycle: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    stripePriceId: string;
  };
  account: {
    subscriptionTier: string;
    currentSeatCount: number;
    monthlyAiGenerated: number;
    monthlyAiValidations: number;
    monthlyProctoringHours: number;
  };
  usage: {
    aiQuestionsUsed: number;
    aiQuestionsLimit: number | "unlimited";
    aiValidationsUsed: number;
    aiValidationsLimit: number | "unlimited";
    proctoringHoursUsed: number;
    proctoringHoursLimit: number | "unlimited";
  };
}

interface Invoice {
  id: string;
  stripeInvoiceId: string;
  amount: number;
  currency: string;
  status: string;
  invoiceNumber: string;
  invoiceUrl: string;
  hostedInvoiceUrl: string;
  invoicePdf: string;
  dueDate: string;
  paidAt: string;
  periodStart: string;
  periodEnd: string;
  description: string;
  createdAt: string;
}

export default function Billing() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'usage'>('overview');

  // Fetch subscription data
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useQuery<SubscriptionData>({
    queryKey: ['/api/billing/subscription'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/billing/subscription');
      return response.json();
    },
  });

  // Fetch invoices
  const { data: invoices, isLoading: isLoadingInvoices } = useQuery<Invoice[]>({
    queryKey: ['/api/billing/invoices'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/billing/invoices');
      return response.json();
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/billing/cancel-subscription');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing/subscription'] });
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will remain active until the end of your current billing period.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  // Reactivate subscription mutation
  const reactivateSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/billing/reactivate-subscription');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing/subscription'] });
      toast({
        title: "Subscription Reactivated",
        description: "Your subscription has been reactivated and will continue as normal.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reactivate subscription",
        variant: "destructive",
      });
    },
  });

  // Update payment method mutation
  const updatePaymentMethodMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/billing/update-payment-method');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment method",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'past_due':
      case 'unpaid':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'canceled':
        return <XCircle className="h-5 w-5 text-gray-600" />;
      default:
        return <RefreshCw className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      past_due: 'destructive',
      unpaid: 'destructive',
      canceled: 'secondary',
      trialing: 'secondary',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getCurrentPlan = () => {
    if (!subscriptionData) return null;
    return PRICING_PLANS.find(plan => plan.id === subscriptionData.subscription.tier);
  };

  const getUsagePercentage = (used: number, limit: number | "unlimited") => {
    if (limit === "unlimited") return 0;
    return Math.min((used / limit) * 100, 100);
  };

  if (isLoadingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const currentPlan = getCurrentPlan();

  return (
    <>
      <Helmet>
        <title>Billing & Subscription - ProficiencyAI</title>
        <meta name="description" content="Manage your ProficiencyAI subscription, view invoices, and track usage across all your assessment tools." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Billing & Subscription
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your subscription, view usage, and access billing history
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-white dark:bg-gray-800 p-1 rounded-lg border">
            {[
              { id: 'overview', label: 'Overview', icon: CreditCard },
              { id: 'invoices', label: 'Invoices', icon: Download },
              { id: 'usage', label: 'Usage', icon: TrendingUp },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && subscriptionData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Current Plan */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-600" />
                      Current Subscription
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold">{currentPlan?.name || 'Unknown Plan'}</h3>
                        <p className="text-gray-600 dark:text-gray-400">{currentPlan?.description}</p>
                      </div>
                      <div className="text-right">
                        {getStatusIcon(subscriptionData.subscription.status)}
                        {getStatusBadge(subscriptionData.subscription.status)}
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Billing Cycle</p>
                        <p className="font-medium">{subscriptionData.subscription.billingCycle}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Current Period</p>
                        <p className="font-medium">
                          {formatDate(subscriptionData.subscription.currentPeriodStart)} - {formatDate(subscriptionData.subscription.currentPeriodEnd)}
                        </p>
                      </div>
                    </div>

                    {subscriptionData.subscription.cancelAtPeriodEnd && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Your subscription is set to cancel at the end of the current billing period on {formatDate(subscriptionData.subscription.currentPeriodEnd)}.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={() => updatePaymentMethodMutation.mutate()}
                        disabled={updatePaymentMethodMutation.isPending}
                        variant="outline"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Update Payment Method
                      </Button>

                      {subscriptionData.subscription.cancelAtPeriodEnd ? (
                        <Button
                          onClick={() => reactivateSubscriptionMutation.mutate()}
                          disabled={reactivateSubscriptionMutation.isPending}
                        >
                          Reactivate Subscription
                        </Button>
                      ) : (
                        <Button
                          onClick={() => cancelSubscriptionMutation.mutate()}
                          disabled={cancelSubscriptionMutation.isPending}
                          variant="destructive"
                        >
                          Cancel Subscription
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Account Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Active Seats</span>
                      <span className="font-medium">{subscriptionData.account.currentSeatCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Plan Type</span>
                      <span className="font-medium">{currentPlan?.name}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Need Help?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Contact our support team for billing questions or plan changes.
                    </p>
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Contact Support
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <Card>
              <CardHeader>
                <CardTitle>Invoice History</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingInvoices ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : invoices && invoices.length > 0 ? (
                  <div className="space-y-4">
                    {invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">#{invoice.invoiceNumber}</span>
                            {getStatusBadge(invoice.status)}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(invoice.createdAt)} • {invoice.description}
                          </p>
                          <p className="text-sm text-gray-500">
                            Period: {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                          </p>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="text-lg font-semibold">
                            {formatCurrency(invoice.amount, invoice.currency)}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(invoice.hostedInvoiceUrl, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(invoice.invoicePdf, '_blank')}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              PDF
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No invoices found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Usage Tab */}
          {activeTab === 'usage' && subscriptionData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AI Question Generation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Used this month</span>
                      <span>
                        {subscriptionData.usage.aiQuestionsUsed}
                        {subscriptionData.usage.aiQuestionsLimit !== "unlimited" && 
                          ` / ${subscriptionData.usage.aiQuestionsLimit}`}
                      </span>
                    </div>
                    {subscriptionData.usage.aiQuestionsLimit !== "unlimited" && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${getUsagePercentage(
                              subscriptionData.usage.aiQuestionsUsed, 
                              subscriptionData.usage.aiQuestionsLimit
                            )}%` 
                          }}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AI Validations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Used this month</span>
                      <span>
                        {subscriptionData.usage.aiValidationsUsed}
                        {subscriptionData.usage.aiValidationsLimit !== "unlimited" && 
                          ` / ${subscriptionData.usage.aiValidationsLimit}`}
                      </span>
                    </div>
                    {subscriptionData.usage.aiValidationsLimit !== "unlimited" && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ 
                            width: `${getUsagePercentage(
                              subscriptionData.usage.aiValidationsUsed, 
                              subscriptionData.usage.aiValidationsLimit
                            )}%` 
                          }}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Proctoring Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Used this month</span>
                      <span>
                        {subscriptionData.usage.proctoringHoursUsed}
                        {subscriptionData.usage.proctoringHoursLimit !== "unlimited" && 
                          ` / ${subscriptionData.usage.proctoringHoursLimit}`}
                      </span>
                    </div>
                    {subscriptionData.usage.proctoringHoursLimit !== "unlimited" && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ 
                            width: `${getUsagePercentage(
                              subscriptionData.usage.proctoringHoursUsed, 
                              subscriptionData.usage.proctoringHoursLimit
                            )}%` 
                          }}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}