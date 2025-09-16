import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Building, Users, Settings, CreditCard, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { apiRequest } from "@/lib/queryClient";

interface AccountSettings {
  id: string;
  name: string;
  description: string;
  subscriptionTier: string;
  billingCycle: string;
  maxUsers: number;
  currentSeatCount: number;
  monthlyQuizzes: number;
  monthlyAiGenerated: number;
  monthlyAiValidations: number;
  monthlyProctoringHours: number;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripeStatus: string;
  billingEmail: string;
  billingAddress: any;
  isActive: boolean;
  settings: {
    branding: {
      customLogo: string;
      primaryColor: string;
      secondaryColor: string;
      companyName: string;
      showPoweredBy: boolean;
    };
    features: {
      aiGenerationEnabled: boolean;
      proctoringEnabled: boolean;
      advancedAnalytics: boolean;
      exportEnabled: boolean;
      apiAccess: boolean;
      ssoEnabled: boolean;
      customIntegrations: boolean;
    };
    security: {
      enforcePasswordPolicy: boolean;
      requireMfa: boolean;
      sessionTimeout: number;
      ipWhitelist: string[];
      allowedDomains: string[];
    };
    notifications: {
      emailNotifications: boolean;
      smsNotifications: boolean;
      webhookUrl: string;
      notificationTypes: string[];
    };
  };
  usage: {
    currentPeriodQuizzes: number;
    currentPeriodAiGenerations: number;
    currentPeriodProctoringHours: number;
    storageUsedMB: number;
  };
  limits: {
    maxQuizzes: number;
    maxAiGenerations: number;
    maxProctoringHours: number;
    maxStorageMB: number;
  };
}

export default function AccountSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState<AccountSettings | null>(null);

  // Fetch account settings
  const { data: accountData, isLoading } = useQuery({
    queryKey: ["/api/admin/account-settings"],
  });

  // Update account settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<AccountSettings>) =>
      apiRequest("PUT", "/api/admin/account-settings", data),
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Account settings have been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/account-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update account settings.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (accountData) {
      setSettings(accountData);
    }
  }, [accountData]);

  const handleSettingsUpdate = (updates: Partial<AccountSettings>) => {
    if (settings) {
      const updatedSettings = { ...settings, ...updates };
      setSettings(updatedSettings);
      updateSettingsMutation.mutate(updates);
    }
  };

  const handleNestedUpdate = (section: string, subsection: string, updates: any) => {
    if (settings) {
      const updatedSettings = {
        ...settings,
        [section]: {
          ...settings[section as keyof AccountSettings],
          [subsection]: {
            ...(settings[section as keyof AccountSettings] as any)[subsection],
            ...updates
          }
        }
      };
      setSettings(updatedSettings);
      updateSettingsMutation.mutate({
        [section]: updatedSettings[section as keyof AccountSettings]
      });
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const usagePercentages = {
    quizzes: Math.round((settings.usage.currentPeriodQuizzes / settings.limits.maxQuizzes) * 100),
    aiGenerations: Math.round((settings.usage.currentPeriodAiGenerations / settings.limits.maxAiGenerations) * 100),
    proctoringHours: Math.round((settings.usage.currentPeriodProctoringHours / settings.limits.maxProctoringHours) * 100),
    storage: Math.round((settings.usage.storageUsedMB / settings.limits.maxStorageMB) * 100),
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 md:ml-64">
        <TopBar />
        
        <main className="p-4 md:p-6 pt-24 md:pt-24 pb-32 md:pb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Account Settings</h1>
              <p className="text-gray-600">Manage your account configuration and preferences</p>
            </div>
            <Badge variant={settings.isActive ? "default" : "secondary"} className="text-sm">
              {settings.subscriptionTier.toUpperCase()} Plan
            </Badge>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="branding" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Branding
              </TabsTrigger>
              <TabsTrigger value="features" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Features
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="usage" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Usage & Billing
              </TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="organization-name">Organization Name</Label>
                      <Input
                        id="organization-name"
                        value={settings.name}
                        onChange={(e) => handleSettingsUpdate({ name: e.target.value })}
                        placeholder="Enter organization name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billing-email">Billing Email</Label>
                      <Input
                        id="billing-email"
                        type="email"
                        value={settings.billingEmail || ""}
                        onChange={(e) => handleSettingsUpdate({ billingEmail: e.target.value })}
                        placeholder="billing@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={settings.description || ""}
                      onChange={(e) => handleSettingsUpdate({ description: e.target.value })}
                      placeholder="Organization description..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="max-users">Maximum Users</Label>
                      <Input
                        id="max-users"
                        type="number"
                        value={settings.maxUsers}
                        onChange={(e) => handleSettingsUpdate({ maxUsers: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="current-seats">Current Seat Count</Label>
                      <Input
                        id="current-seats"
                        type="number"
                        value={settings.currentSeatCount}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Branding Settings */}
            <TabsContent value="branding" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Brand Customization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company-name">Company Name</Label>
                      <Input
                        id="company-name"
                        value={settings.settings.branding.companyName || ""}
                        onChange={(e) => handleNestedUpdate('settings', 'branding', { companyName: e.target.value })}
                        placeholder="Your Company Name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="custom-logo">Custom Logo URL</Label>
                      <Input
                        id="custom-logo"
                        value={settings.settings.branding.customLogo || ""}
                        onChange={(e) => handleNestedUpdate('settings', 'branding', { customLogo: e.target.value })}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="primary-color">Primary Color</Label>
                      <Input
                        id="primary-color"
                        type="color"
                        value={settings.settings.branding.primaryColor || "#3b82f6"}
                        onChange={(e) => handleNestedUpdate('settings', 'branding', { primaryColor: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="secondary-color">Secondary Color</Label>
                      <Input
                        id="secondary-color"
                        type="color"
                        value={settings.settings.branding.secondaryColor || "#64748b"}
                        onChange={(e) => handleNestedUpdate('settings', 'branding', { secondaryColor: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-powered-by">Show "Powered by ProficiencyAI"</Label>
                      <p className="text-sm text-muted-foreground">Display branding attribution</p>
                    </div>
                    <Switch
                      id="show-powered-by"
                      checked={settings.settings.branding.showPoweredBy}
                      onCheckedChange={(checked) => handleNestedUpdate('settings', 'branding', { showPoweredBy: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Features Settings */}
            <TabsContent value="features" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Feature Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Core Features</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>AI Question Generation</Label>
                            <p className="text-sm text-muted-foreground">Enable AI-powered question creation</p>
                          </div>
                          <Switch
                            checked={settings.settings.features.aiGenerationEnabled}
                            onCheckedChange={(checked) => handleNestedUpdate('settings', 'features', { aiGenerationEnabled: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Live Proctoring</Label>
                            <p className="text-sm text-muted-foreground">Enable proctoring and security features</p>
                          </div>
                          <Switch
                            checked={settings.settings.features.proctoringEnabled}
                            onCheckedChange={(checked) => handleNestedUpdate('settings', 'features', { proctoringEnabled: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Advanced Analytics</Label>
                            <p className="text-sm text-muted-foreground">Access detailed performance analytics</p>
                          </div>
                          <Switch
                            checked={settings.settings.features.advancedAnalytics}
                            onCheckedChange={(checked) => handleNestedUpdate('settings', 'features', { advancedAnalytics: checked })}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium">Integration Features</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>API Access</Label>
                            <p className="text-sm text-muted-foreground">Enable REST API access</p>
                          </div>
                          <Switch
                            checked={settings.settings.features.apiAccess}
                            onCheckedChange={(checked) => handleNestedUpdate('settings', 'features', { apiAccess: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>SSO Integration</Label>
                            <p className="text-sm text-muted-foreground">Single Sign-On capabilities</p>
                          </div>
                          <Switch
                            checked={settings.settings.features.ssoEnabled}
                            onCheckedChange={(checked) => handleNestedUpdate('settings', 'features', { ssoEnabled: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Data Export</Label>
                            <p className="text-sm text-muted-foreground">Allow data export functionality</p>
                          </div>
                          <Switch
                            checked={settings.settings.features.exportEnabled}
                            onCheckedChange={(checked) => handleNestedUpdate('settings', 'features', { exportEnabled: checked })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Access Control</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Enforce Password Policy</Label>
                            <p className="text-sm text-muted-foreground">Require strong passwords</p>
                          </div>
                          <Switch
                            checked={settings.settings.security.enforcePasswordPolicy}
                            onCheckedChange={(checked) => handleNestedUpdate('settings', 'security', { enforcePasswordPolicy: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Require Multi-Factor Auth</Label>
                            <p className="text-sm text-muted-foreground">Mandate MFA for all users</p>
                          </div>
                          <Switch
                            checked={settings.settings.security.requireMfa}
                            onCheckedChange={(checked) => handleNestedUpdate('settings', 'security', { requireMfa: checked })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                          <Input
                            id="session-timeout"
                            type="number"
                            value={settings.settings.security.sessionTimeout}
                            onChange={(e) => handleNestedUpdate('settings', 'security', { sessionTimeout: parseInt(e.target.value) || 60 })}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium">Network Security</h4>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="ip-whitelist">IP Whitelist</Label>
                          <Textarea
                            id="ip-whitelist"
                            value={settings.settings.security.ipWhitelist?.join('\n') || ""}
                            onChange={(e) => handleNestedUpdate('settings', 'security', { 
                              ipWhitelist: e.target.value.split('\n').filter(ip => ip.trim()) 
                            })}
                            placeholder="192.168.1.1&#10;10.0.0.0/8"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="allowed-domains">Allowed Email Domains</Label>
                          <Textarea
                            id="allowed-domains"
                            value={settings.settings.security.allowedDomains?.join('\n') || ""}
                            onChange={(e) => handleNestedUpdate('settings', 'security', { 
                              allowedDomains: e.target.value.split('\n').filter(domain => domain.trim()) 
                            })}
                            placeholder="company.com&#10;university.edu"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Usage & Billing */}
            <TabsContent value="usage" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Quizzes</p>
                        <p className="text-lg font-semibold">
                          {settings.usage.currentPeriodQuizzes} / {settings.limits.maxQuizzes}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{usagePercentages.quizzes}%</p>
                        <div className="w-16 h-2 bg-muted rounded-full mt-1">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${Math.min(usagePercentages.quizzes, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">AI Generations</p>
                        <p className="text-lg font-semibold">
                          {settings.usage.currentPeriodAiGenerations} / {settings.limits.maxAiGenerations}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{usagePercentages.aiGenerations}%</p>
                        <div className="w-16 h-2 bg-muted rounded-full mt-1">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${Math.min(usagePercentages.aiGenerations, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Proctoring Hours</p>
                        <p className="text-lg font-semibold">
                          {settings.usage.currentPeriodProctoringHours} / {settings.limits.maxProctoringHours}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{usagePercentages.proctoringHours}%</p>
                        <div className="w-16 h-2 bg-muted rounded-full mt-1">
                          <div 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ width: `${Math.min(usagePercentages.proctoringHours, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Storage</p>
                        <p className="text-lg font-semibold">
                          {Math.round(settings.usage.storageUsedMB / 1024 * 10) / 10} GB
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{usagePercentages.storage}%</p>
                        <div className="w-16 h-2 bg-muted rounded-full mt-1">
                          <div 
                            className="h-full bg-yellow-500 rounded-full" 
                            style={{ width: `${Math.min(usagePercentages.storage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Subscription Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Current Plan</Label>
                      <p className="text-lg font-semibold capitalize">{settings.subscriptionTier}</p>
                    </div>
                    <div>
                      <Label>Billing Cycle</Label>
                      <p className="text-lg font-semibold capitalize">{settings.billingCycle}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Badge variant={settings.stripeStatus === 'active' ? 'default' : 'secondary'}>
                        {settings.stripeStatus}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <Button variant="outline">
                      View Billing History
                    </Button>
                    <Button variant="outline">
                      Upgrade Plan
                    </Button>
                    <Button variant="outline">
                      Download Invoice
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}