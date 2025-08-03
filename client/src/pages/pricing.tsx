import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Check, 
  Star, 
  ArrowRight, 
  Users, 
  Bot, 
  Shield, 
  BarChart3, 
  Download,
  Crown,
  Building2,
  Zap
} from 'lucide-react';
import { PRICING_PLANS, calculateAnnualSavings } from '@shared/pricing';
import { useAuth } from '@/hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';

export default function Pricing() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAnnual, setIsAnnual] = useState(false);

  const createCheckoutSessionMutation = useMutation({
    mutationFn: async ({ priceId, isUpgrade }: { priceId: string; isUpgrade?: boolean }) => {
      const response = await apiRequest('POST', '/api/stripe/create-checkout-session', {
        priceId,
        isUpgrade
      });
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
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = async (planId: string, stripePriceId?: string) => {
    if (!stripePriceId) {
      if (planId === 'enterprise') {
        toast({
          title: "Contact Sales",
          description: "Please contact our sales team for Enterprise pricing.",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Stripe price ID not configured for this plan.",
        variant: "destructive",
      });
      return;
    }

    createCheckoutSessionMutation.mutate({ 
      priceId: stripePriceId,
      isUpgrade: !!user?.accountId
    });
  };

  const formatPrice = (price: number, isEnterprise = false) => {
    if (isEnterprise || price === 0) {
      return price === 0 ? 'Free' : 'Custom';
    }
    return `$${price.toLocaleString()}`;
  };

  const getFeatureIcon = (featureType: string) => {
    switch (featureType) {
      case 'ai': return <Bot className="h-4 w-4" />;
      case 'users': return <Users className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'analytics': return <BarChart3 className="h-4 w-4" />;
      case 'export': return <Download className="h-4 w-4" />;
      default: return <Check className="h-4 w-4" />;
    }
  };

  const getFeatureList = (plan: typeof PRICING_PLANS[0]) => {
    const features = [];
    
    // Quiz Creation
    if (plan.features.canCreateQuiz) {
      features.push({
        text: plan.features.maxActiveQuizzes === "unlimited" 
          ? "Unlimited active quizzes" 
          : `Up to ${plan.features.maxActiveQuizzes} active quizzes`,
        icon: 'default'
      });
    }

    // Test Bank
    if (plan.features.testBankQuestionLimit !== 0) {
      features.push({
        text: plan.features.testBankQuestionLimit === "unlimited"
          ? "Unlimited test bank questions"
          : `Up to ${plan.features.testBankQuestionLimit} test bank questions`,
        icon: 'default'
      });
    }

    // AI Features
    if (plan.features.aiGenerateQuotaPerMonth > 0) {
      features.push({
        text: plan.features.aiGenerateQuotaPerMonth === "unlimited"
          ? "Unlimited AI question generation"
          : `${plan.features.aiGenerateQuotaPerMonth} AI-generated questions/month`,
        icon: 'ai'
      });
    }

    if (plan.features.aiValidationQuotaPerMonth > 0) {
      features.push({
        text: plan.features.aiValidationQuotaPerMonth === "unlimited"
          ? "Unlimited AI validation"
          : `${plan.features.aiValidationQuotaPerMonth} AI validations/month`,
        icon: 'ai'
      });
    }

    // Advanced Features
    if (plan.features.canUseCAT) {
      features.push({ text: "Computer-Adaptive Testing (CAT)", icon: 'default' });
    }

    if (plan.features.canUseLTI) {
      features.push({ text: "LTI Integration (Canvas, Blackboard, Moodle)", icon: 'default' });
    }

    if (plan.features.canUseProctoring) {
      features.push({
        text: plan.features.proctoringSessionsPerMonth === "unlimited"
          ? "Unlimited proctoring sessions"
          : `${plan.features.proctoringSessionsPerMonth} proctoring sessions/month`,
        icon: 'security'
      });
    }

    // Analytics
    if (plan.features.advancedAnalytics) {
      features.push({ text: "Advanced analytics & item analysis", icon: 'analytics' });
    } else if (plan.features.basicReporting) {
      features.push({ text: "Basic reporting", icon: 'analytics' });
    }

    // Import/Export
    if (plan.features.canImportCSV && plan.features.canExportCSV) {
      features.push({ text: "CSV/Excel import & export", icon: 'export' });
    }

    // Enterprise Features
    if (plan.features.cohortManagement) {
      features.push({ text: "Cohort & group management", icon: 'users' });
    }

    if (plan.features.ssoIntegration) {
      features.push({ text: "SSO & SCIM provisioning", icon: 'security' });
    }

    if (plan.features.whiteLabel) {
      features.push({ text: "White-label & custom theming", icon: 'default' });
    }

    if (plan.features.dedicatedSupport) {
      features.push({ text: "Dedicated account manager", icon: 'default' });
    }

    if (plan.features.onPremDeployment) {
      features.push({ text: "On-premise deployment", icon: 'security' });
    }

    return features.slice(0, 8); // Limit to 8 features for display
  };

  return (
    <>
      <Helmet>
        <title>Pricing Plans - ProficiencyAI</title>
        <meta name="description" content="Choose the perfect ProficiencyAI plan for your educational assessment needs. From free starter plans to enterprise solutions with advanced AI-powered features." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header */}
        <div className="container mx-auto px-4 py-12">
          <div className="text-center space-y-6 mb-12">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Choose Your Plan
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Scale your educational assessment capabilities with our flexible pricing options. 
                Start free and upgrade as your needs grow.
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 bg-white dark:bg-gray-800 p-2 rounded-full shadow-sm border w-fit mx-auto">
              <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-blue-600' : 'text-gray-500'}`}>
                Monthly
              </span>
              <Switch
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
                className="data-[state=checked]:bg-blue-600"
              />
              <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-blue-600' : 'text-gray-500'}`}>
                Annual
              </span>
              {isAnnual && (
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 border-green-200">
                  Save 15%
                </Badge>
              )}
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
            {PRICING_PLANS.map((plan) => {
              const features = getFeatureList(plan);
              const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
              const savings = isAnnual ? calculateAnnualSavings(plan.monthlyPrice) : 0;
              
              return (
                <Card 
                  key={plan.id} 
                  className={`relative transition-all duration-300 hover:shadow-lg ${
                    plan.popular 
                      ? 'border-blue-500 shadow-blue-100 scale-105 lg:scale-110' 
                      : 'border-gray-200 hover:border-gray-300'
                  } ${plan.enterprise ? 'border-purple-500 shadow-purple-100' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white px-3 py-1">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  {plan.enterprise && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-purple-600 text-white px-3 py-1">
                        <Crown className="h-3 w-3 mr-1" />
                        Enterprise
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        {plan.id === 'institutional' && <Building2 className="h-5 w-5 text-orange-600" />}
                        {plan.id === 'professional' && <Zap className="h-5 w-5 text-blue-600" />}
                        <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="text-3xl font-bold">
                        {formatPrice(price, plan.enterprise)}
                        {!plan.enterprise && price > 0 && (
                          <span className="text-base font-normal text-gray-500">
                            /{isAnnual ? 'year' : 'month'}
                          </span>
                        )}
                      </div>
                      
                      {!plan.enterprise && isAnnual && plan.monthlyPrice > 0 && savings > 0 && (
                        <p className="text-sm text-green-600">
                          Save ${savings.toFixed(0)}/year
                        </p>
                      )}

                      {plan.id === 'institutional' && (
                        <p className="text-xs text-gray-500">Up to 100 seats included</p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="text-green-600 mt-0.5">
                            {getFeatureIcon(feature.icon)}
                          </div>
                          <span>{feature.text}</span>
                        </li>
                      ))}
                    </ul>

                    <Separator />

                    <Button
                      onClick={() => handleSubscribe(
                        plan.id, 
                        isAnnual ? plan.stripePriceIdAnnual : plan.stripePriceIdMonthly
                      )}
                      disabled={createCheckoutSessionMutation.isPending}
                      className={`w-full ${
                        plan.popular 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : plan.enterprise
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : 'bg-gray-900 hover:bg-gray-800'
                      }`}
                      variant={plan.id === 'starter' ? 'outline' : 'default'}
                    >
                      {plan.id === 'starter' ? 'Get Started Free' : 
                       plan.enterprise ? 'Contact Sales' : 
                       'Choose Plan'}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Feature Comparison Table */}
          <div className="mt-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Feature Comparison</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Compare all features across our pricing tiers
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="text-left p-4 font-semibold">Features</th>
                      {PRICING_PLANS.map(plan => (
                        <th key={plan.id} className="text-center p-4 font-semibold min-w-[120px]">
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    <tr>
                      <td className="p-4 font-medium">Active Quizzes</td>
                      {PRICING_PLANS.map(plan => (
                        <td key={plan.id} className="text-center p-4">
                          {plan.features.maxActiveQuizzes === "unlimited" ? "Unlimited" : plan.features.maxActiveQuizzes}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-gray-25 dark:bg-gray-750">
                      <td className="p-4 font-medium">AI Question Generation</td>
                      {PRICING_PLANS.map(plan => (
                        <td key={plan.id} className="text-center p-4">
                          {plan.features.aiGenerateQuotaPerMonth === "unlimited" 
                            ? "Unlimited" 
                            : `${plan.features.aiGenerateQuotaPerMonth}/month`}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-medium">Computer-Adaptive Testing</td>
                      {PRICING_PLANS.map(plan => (
                        <td key={plan.id} className="text-center p-4">
                          {plan.features.canUseCAT ? (
                            <Check className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-gray-25 dark:bg-gray-750">
                      <td className="p-4 font-medium">Live Proctoring</td>
                      {PRICING_PLANS.map(plan => (
                        <td key={plan.id} className="text-center p-4">
                          {plan.features.canUseProctoring ? (
                            <Check className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-medium">LTI Integration</td>
                      {PRICING_PLANS.map(plan => (
                        <td key={plan.id} className="text-center p-4">
                          {plan.features.canUseLTI ? (
                            <Check className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Can I change my plan at any time?</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately 
                    for upgrades, and at the end of your billing cycle for downgrades.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    We accept all major credit cards, debit cards, and ACH transfers through Stripe. 
                    Enterprise customers can also arrange for wire transfers and custom billing terms.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Is there a free trial available?</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Our Starter plan is completely free forever. For paid plans, we offer a 14-day 
                    free trial so you can test all premium features before committing.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}