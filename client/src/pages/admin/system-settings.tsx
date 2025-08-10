import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Key, 
  CreditCard, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Save,
  RefreshCw,
  Shield,
  Database,
  Mail,
  Lock,
  CheckCircle,
  ArrowLeft,
  ChevronRight,
  Home
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';
import LoadingSpinner from '@/components/ui/loading-spinner';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
  description: string;
  updatedBy: string;
  updatedAt: string;
}

interface StripeConfig {
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
}

export default function SystemSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('stripe');

  const handleBackClick = () => {
    setLocation('/admin');
  };

  // Fetch system settings
  const { data: settings, isLoading } = useQuery<SystemSetting[]>({
    queryKey: ['/api/admin/system-settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/system-settings');
      return response.json();
    },
  });

  // Update settings mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value, isSecret, description }: {
      key: string;
      value: string;
      isSecret: boolean;
      description?: string;
    }) => {
      const response = await apiRequest('PUT', '/api/admin/system-settings', {
        key,
        value,
        isSecret,
        description
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system-settings'] });
      toast({
        title: "Setting Updated",
        description: "System setting has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update setting",
        variant: "destructive",
      });
    },
  });

  // Test Stripe connection mutation
  const testStripeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/test-stripe');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Stripe Connection Test",
        description: data.success ? "Stripe connection successful!" : "Stripe connection failed",
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Stripe Test Failed",
        description: error.message || "Failed to test Stripe connection",
        variant: "destructive",
      });
    },
  });

  const getSettingByKey = (key: string): SystemSetting | undefined => {
    return settings?.find(setting => setting.key === key);
  };

  const handleUpdateSetting = async (key: string, value: string, isSecret = false, description = '') => {
    updateSettingMutation.mutate({ key, value, isSecret, description });
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const StripeSettingsForm = () => {
    const [stripeSettings, setStripeSettings] = useState<StripeConfig>({
      STRIPE_SECRET_KEY: getSettingByKey('STRIPE_SECRET_KEY')?.value || '',
      STRIPE_WEBHOOK_SECRET: getSettingByKey('STRIPE_WEBHOOK_SECRET')?.value || '',
      STRIPE_PUBLISHABLE_KEY: getSettingByKey('STRIPE_PUBLISHABLE_KEY')?.value || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      const updates = [
        {
          key: 'STRIPE_SECRET_KEY',
          value: stripeSettings.STRIPE_SECRET_KEY || '',
          isSecret: true,
          description: 'Stripe secret key for payment processing'
        },
        {
          key: 'STRIPE_WEBHOOK_SECRET',
          value: stripeSettings.STRIPE_WEBHOOK_SECRET || '',
          isSecret: true,
          description: 'Stripe webhook secret for verifying webhook signatures'
        },
        {
          key: 'STRIPE_PUBLISHABLE_KEY',
          value: stripeSettings.STRIPE_PUBLISHABLE_KEY || '',
          isSecret: false,
          description: 'Stripe publishable key for frontend integration'
        }
      ];

      for (const update of updates) {
        if (update.value) {
          await handleUpdateSetting(update.key, update.value, update.isSecret, update.description);
        }
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stripe-secret">Stripe Secret Key</Label>
            <div className="relative">
              <Input
                id="stripe-secret"
                type={showSecrets['STRIPE_SECRET_KEY'] ? 'text' : 'password'}
                value={stripeSettings.STRIPE_SECRET_KEY}
                onChange={(e) => setStripeSettings(prev => ({ ...prev, STRIPE_SECRET_KEY: e.target.value }))}
                placeholder="sk_test_..."
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => toggleSecretVisibility('STRIPE_SECRET_KEY')}
              >
                {showSecrets['STRIPE_SECRET_KEY'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Your Stripe secret key (starts with sk_). Get this from your Stripe dashboard.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stripe-webhook">Stripe Webhook Secret</Label>
            <div className="relative">
              <Input
                id="stripe-webhook"
                type={showSecrets['STRIPE_WEBHOOK_SECRET'] ? 'text' : 'password'}
                value={stripeSettings.STRIPE_WEBHOOK_SECRET}
                onChange={(e) => setStripeSettings(prev => ({ ...prev, STRIPE_WEBHOOK_SECRET: e.target.value }))}
                placeholder="whsec_..."
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => toggleSecretVisibility('STRIPE_WEBHOOK_SECRET')}
              >
                {showSecrets['STRIPE_WEBHOOK_SECRET'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Webhook secret for verifying Stripe webhook signatures. Set up webhooks in your Stripe dashboard.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stripe-publishable">Stripe Publishable Key</Label>
            <Input
              id="stripe-publishable"
              type="text"
              value={stripeSettings.STRIPE_PUBLISHABLE_KEY}
              onChange={(e) => setStripeSettings(prev => ({ ...prev, STRIPE_PUBLISHABLE_KEY: e.target.value }))}
              placeholder="pk_test_..."
            />
            <p className="text-sm text-muted-foreground">
              Your Stripe publishable key (starts with pk_). This is safe to be public.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            type="submit" 
            disabled={updateSettingMutation.isPending}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Stripe Settings
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => testStripeMutation.mutate()}
            disabled={testStripeMutation.isPending || !stripeSettings.STRIPE_SECRET_KEY}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${testStripeMutation.isPending ? 'animate-spin' : ''}`} />
            Test Connection
          </Button>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Note:</strong> Secret keys are encrypted and stored securely. 
            They're never displayed in logs or exposed to unauthorized users.
          </AlertDescription>
        </Alert>
      </form>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>System Settings - ProficiencyAI Admin</title>
        <meta name="description" content="Configure system-wide settings including Stripe integration, API keys, and other platform configurations." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Mobile Back Button & Breadcrumbs */}
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            {/* Breadcrumbs - hidden on mobile, visible on larger screens */}
            <nav className="hidden lg:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <button
                onClick={() => setLocation('/dashboard')}
                className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </button>
              <ChevronRight className="h-4 w-4" />
              <button
                onClick={() => setLocation('/admin')}
                className="hover:text-gray-700 dark:hover:text-gray-200"
              >
                Admin
              </button>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-900 dark:text-white font-medium">System Settings</span>
            </nav>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Settings className="h-8 w-8" />
              System Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Configure system-wide settings, API keys, and integration credentials
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="stripe" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Stripe
              </TabsTrigger>
              <TabsTrigger value="database" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Database
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stripe">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Stripe Payment Integration
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Configure Stripe for subscription billing and payment processing
                  </p>
                </CardHeader>
                <CardContent>
                  <StripeSettingsForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="database">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Configuration
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Database connection and backup settings
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Database URL</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            value="*****" 
                            disabled 
                            type="password"
                            className="flex-1"
                          />
                          <Badge variant="secondary">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Connection Pool</Label>
                        <Input value="PostgreSQL (Neon)" disabled />
                      </div>
                    </div>
                    
                    <Alert>
                      <Database className="h-4 w-4" />
                      <AlertDescription>
                        Database configuration is managed through environment variables for security.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Configuration
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Configure email providers and notification settings
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sendgrid-key">SendGrid API Key</Label>
                      <div className="relative">
                        <Input
                          id="sendgrid-key"
                          type={showSecrets['SENDGRID_API_KEY'] ? 'text' : 'password'}
                          value={getSettingByKey('SENDGRID_API_KEY')?.value || ''}
                          onChange={(e) => handleUpdateSetting('SENDGRID_API_KEY', e.target.value, true, 'SendGrid API key for email notifications')}
                          placeholder="SG...."
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => toggleSecretVisibility('SENDGRID_API_KEY')}
                        >
                          {showSecrets['SENDGRID_API_KEY'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="from-email">From Email Address</Label>
                      <Input
                        id="from-email"
                        type="email"
                        value={getSettingByKey('FROM_EMAIL')?.value || ''}
                        onChange={(e) => handleUpdateSetting('FROM_EMAIL', e.target.value, false, 'Default from email address for notifications')}
                        placeholder="noreply@proficiencyai.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Configure security keys and authentication settings
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="jwt-secret">JWT Secret Key</Label>
                      <div className="relative">
                        <Input
                          id="jwt-secret"
                          type={showSecrets['JWT_SECRET'] ? 'text' : 'password'}
                          value={getSettingByKey('JWT_SECRET')?.value || ''}
                          onChange={(e) => handleUpdateSetting('JWT_SECRET', e.target.value, true, 'JWT secret key for token signing')}
                          placeholder="Enter JWT secret..."
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => toggleSecretVisibility('JWT_SECRET')}
                        >
                          {showSecrets['JWT_SECRET'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="session-secret">Session Secret</Label>
                      <div className="relative">
                        <Input
                          id="session-secret"
                          type={showSecrets['SESSION_SECRET'] ? 'text' : 'password'}
                          value={getSettingByKey('SESSION_SECRET')?.value || ''}
                          onChange={(e) => handleUpdateSetting('SESSION_SECRET', e.target.value, true, 'Session secret for session management')}
                          placeholder="Enter session secret..."
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => toggleSecretVisibility('SESSION_SECRET')}
                        >
                          {showSecrets['SESSION_SECRET'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Important:</strong> Changing security keys will invalidate all existing sessions and tokens.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* All Settings Overview */}
          <Card>
            <CardHeader>
              <CardTitle>All System Settings</CardTitle>
              <p className="text-muted-foreground">
                Complete overview of all configured system settings
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {settings?.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{setting.key}</span>
                        {setting.isSecret && <Badge variant="secondary">Secret</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Last updated: {new Date(setting.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {setting.isSecret ? (
                        <span className="text-sm text-muted-foreground">••••••••</span>
                      ) : (
                        <span className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {setting.value || 'Not set'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}