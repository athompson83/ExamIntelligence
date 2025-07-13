import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  CreditCard, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  FileText, 
  BarChart3,
  Settings,
  AlertCircle,
  CheckCircle,
  Home,
  ChevronRight,
  Crown,
  Zap
} from 'lucide-react';
import { Link, useLocation } from 'wouter';

interface BillingInfo {
  currentPlan: {
    name: string;
    price: number;
    billingCycle: string;
    status: string;
    nextBillingDate: string;
    features: any;
  };
  usage: {
    users: { current: number; limit: number };
    quizzes: { current: number; limit: number };
    questions: { current: number; limit: number };
    storage: { current: number; limit: number };
  };
  billingHistory: Array<{
    id: string;
    amount: number;
    status: string;
    date: string;
    invoiceUrl?: string;
  }>;
}

export default function BillingPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: billingInfo, isLoading } = useQuery<BillingInfo>({
    queryKey: ['/api/billing'],
    queryFn: () => apiRequest('/api/billing'),
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: () => apiRequest('/api/billing/cancel-subscription', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing'] });
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const downloadInvoiceMutation = useMutation({
    mutationFn: (invoiceId: string) => apiRequest(`/api/billing/invoice/${invoiceId}/download`),
    onSuccess: (data) => {
      // Handle invoice download
      window.open(data.invoiceUrl, '_blank');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to download invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: 'Active', variant: 'default' as const, icon: CheckCircle },
      canceled: { label: 'Cancelled', variant: 'destructive' as const, icon: AlertCircle },
      past_due: { label: 'Past Due', variant: 'destructive' as const, icon: AlertCircle },
      trialing: { label: 'Trial', variant: 'secondary' as const, icon: Clock },
    };

    const config = statusMap[status as keyof typeof statusMap] || { 
      label: status, 
      variant: 'secondary' as const, 
      icon: AlertCircle 
    };

    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getUsageColor = (current: number, limit: number) => {
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Billing</span>
      </nav>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Billing & Subscription</h1>
            <p className="text-muted-foreground">Manage your subscription and billing information</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/pricing')}>
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold">{billingInfo?.currentPlan.name}</h3>
                  {getStatusBadge(billingInfo?.currentPlan.status || 'active')}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{formatPrice(billingInfo?.currentPlan.price || 0)} / {billingInfo?.currentPlan.billingCycle}</span>
                  <span>•</span>
                  <span>Next billing: {new Date(billingInfo?.currentPlan.nextBillingDate || '').toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/pricing')}>
                  Change Plan
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      Cancel Subscription
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancel Subscription</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your current billing period.
                      </p>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline">Keep Subscription</Button>
                        <Button 
                          variant="destructive"
                          onClick={() => cancelSubscriptionMutation.mutate()}
                          disabled={cancelSubscriptionMutation.isPending}
                        >
                          {cancelSubscriptionMutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Usage Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Users</span>
                  <span className="text-sm font-medium">
                    {billingInfo?.usage.users.current} / {billingInfo?.usage.users.limit === -1 ? '∞' : billingInfo?.usage.users.limit}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(billingInfo?.usage.users.current || 0, billingInfo?.usage.users.limit || 1)} 
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Quizzes</span>
                  <span className="text-sm font-medium">
                    {billingInfo?.usage.quizzes.current} / {billingInfo?.usage.quizzes.limit === -1 ? '∞' : billingInfo?.usage.quizzes.limit}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(billingInfo?.usage.quizzes.current || 0, billingInfo?.usage.quizzes.limit || 1)} 
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Questions</span>
                  <span className="text-sm font-medium">
                    {billingInfo?.usage.questions.current} / {billingInfo?.usage.questions.limit === -1 ? '∞' : billingInfo?.usage.questions.limit}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(billingInfo?.usage.questions.current || 0, billingInfo?.usage.questions.limit || 1)} 
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Storage</span>
                  <span className="text-sm font-medium">
                    {billingInfo?.usage.storage.current} MB / {billingInfo?.usage.storage.limit === -1 ? '∞' : `${billingInfo?.usage.storage.limit} MB`}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(billingInfo?.usage.storage.current || 0, billingInfo?.usage.storage.limit || 1)} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Billing History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingInfo?.billingHistory.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                    <TableCell>{formatPrice(invoice.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => downloadInvoiceMutation.mutate(invoice.id)}
                        disabled={downloadInvoiceMutation.isPending}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}