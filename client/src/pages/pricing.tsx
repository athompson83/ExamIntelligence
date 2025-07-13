import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Check, 
  X, 
  Zap, 
  Users, 
  BarChart3, 
  Shield, 
  Smartphone, 
  Crown,
  Star,
  ArrowRight,
  Home,
  ChevronRight
} from 'lucide-react';
import { Link, useLocation } from 'wouter';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
  maxUsers: number;
  maxQuizzes: number;
  maxQuestions: number;
  maxStorage: number;
  features: {
    aiQuestionGeneration: boolean;
    liveProctoring: boolean;
    advancedAnalytics: boolean;
    customBranding: boolean;
    apiAccess: boolean;
    ssoIntegration: boolean;
    prioritySupport: boolean;
    mobileApp: boolean;
    bulkImport: boolean;
    whiteLabel: boolean;
  };
  isActive: boolean;
  sortOrder: number;
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: plans, isLoading } = useQuery<PricingPlan[]>({
    queryKey: ['/api/subscription-plans'],
    queryFn: () => apiRequest('/api/subscription-plans'),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: () => apiRequest('/api/auth/user'),
  });

  const handleSelectPlan = async (plan: PricingPlan) => {
    try {
      const response = await apiRequest('/api/create-subscription', {
        method: 'POST',
        body: JSON.stringify({
          planId: plan.id,
          billingCycle: billingCycle,
          priceId: billingCycle === 'monthly' ? plan.stripePriceIdMonthly : plan.stripePriceIdYearly,
        }),
      });

      if (response.clientSecret) {
        navigate(`/subscribe?client_secret=${response.clientSecret}&plan=${plan.name}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'aiQuestionGeneration': return <Zap className="h-4 w-4" />;
      case 'liveProctoring': return <Shield className="h-4 w-4" />;
      case 'advancedAnalytics': return <BarChart3 className="h-4 w-4" />;
      case 'mobileApp': return <Smartphone className="h-4 w-4" />;
      case 'prioritySupport': return <Crown className="h-4 w-4" />;
      default: return <Check className="h-4 w-4" />;
    }
  };

  const getFeatureLabel = (feature: string) => {
    switch (feature) {
      case 'aiQuestionGeneration': return 'AI Question Generation';
      case 'liveProctoring': return 'Live Proctoring';
      case 'advancedAnalytics': return 'Advanced Analytics';
      case 'customBranding': return 'Custom Branding';
      case 'apiAccess': return 'API Access';
      case 'ssoIntegration': return 'SSO Integration';
      case 'prioritySupport': return 'Priority Support';
      case 'mobileApp': return 'Mobile App';
      case 'bulkImport': return 'Bulk Import';
      case 'whiteLabel': return 'White Label';
      default: return feature;
    }
  };

  const isPlanRecommended = (plan: PricingPlan) => {
    return plan.name.toLowerCase() === 'premium';
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
        <span className="text-foreground">Pricing</span>
      </nav>

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Select the perfect plan for your educational needs. All plans include core features with varying limits and capabilities.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <Label htmlFor="billing-toggle" className={billingCycle === 'monthly' ? 'text-primary' : 'text-muted-foreground'}>
          Monthly
        </Label>
        <Switch
          id="billing-toggle"
          checked={billingCycle === 'yearly'}
          onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
        />
        <Label htmlFor="billing-toggle" className={billingCycle === 'yearly' ? 'text-primary' : 'text-muted-foreground'}>
          Yearly
          <Badge variant="secondary" className="ml-2">Save 20%</Badge>
        </Label>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans?.map((plan) => (
          <Card key={plan.id} className={`relative ${isPlanRecommended(plan) ? 'border-primary shadow-lg' : ''}`}>
            {isPlanRecommended(plan) && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  <Star className="h-3 w-3 mr-1" />
                  Recommended
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <p className="text-muted-foreground">{plan.description}</p>
              <div className="mt-4">
                <div className="text-4xl font-bold">
                  {formatPrice(billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly)}
                </div>
                <div className="text-sm text-muted-foreground">
                  per {billingCycle === 'monthly' ? 'month' : 'year'}
                </div>
                {billingCycle === 'yearly' && (
                  <div className="text-sm text-green-600 mt-1">
                    Save {formatPrice(plan.priceMonthly * 12 - plan.priceYearly)} annually
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Limits */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Users</span>
                  <span className="font-medium">{plan.maxUsers === -1 ? 'Unlimited' : plan.maxUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Quizzes</span>
                  <span className="font-medium">{plan.maxQuizzes === -1 ? 'Unlimited' : plan.maxQuizzes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Questions</span>
                  <span className="font-medium">{plan.maxQuestions === -1 ? 'Unlimited' : plan.maxQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Storage</span>
                  <span className="font-medium">{plan.maxStorage === -1 ? 'Unlimited' : `${plan.maxStorage} GB`}</span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <h4 className="font-semibold">Features</h4>
                {Object.entries(plan.features).map(([feature, enabled]) => (
                  <div key={feature} className="flex items-center space-x-2">
                    {enabled ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={`text-sm ${enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {getFeatureLabel(feature)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <Button 
                className="w-full"
                variant={isPlanRecommended(plan) ? "default" : "outline"}
                onClick={() => handleSelectPlan(plan)}
                disabled={!plan.isActive}
              >
                {plan.name === 'Free' ? 'Get Started' : 'Subscribe Now'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-20 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">Can I change my plan later?</h3>
              <p className="text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated and reflected in your next billing cycle.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">What happens to my data if I cancel?</h3>
              <p className="text-muted-foreground">
                Your data will be preserved for 30 days after cancellation. You can reactivate your account within this period to restore full access.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-muted-foreground">
                Yes, we offer a 30-day money-back guarantee for all paid plans. Contact our support team for assistance.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}