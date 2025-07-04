import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Shield, 
  Key, 
  Settings, 
  Save, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  CheckCircle,
  Database,
  Mail,
  CreditCard,
  Bot
} from "lucide-react";

interface AdminSettings {
  openaiApiKey: string;
  sendgridApiKey: string;
  stripeSecretKey: string;
  stripePublicKey: string;
  systemSettings: {
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    maxUsersPerOrg: number;
    maxTestbanksPerUser: number;
    maxQuestionsPerTestbank: number;
  };
  notificationSettings: {
    emailNotifications: boolean;
    systemAlerts: boolean;
    performanceReports: boolean;
  };
}

export default function AdminSettings() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<AdminSettings>({
    openaiApiKey: '',
    sendgridApiKey: '',
    stripeSecretKey: '',
    stripePublicKey: '',
    systemSettings: {
      maintenanceMode: false,
      registrationEnabled: true,
      maxUsersPerOrg: 100,
      maxTestbanksPerUser: 50,
      maxQuestionsPerTestbank: 1000,
    },
    notificationSettings: {
      emailNotifications: true,
      systemAlerts: true,
      performanceReports: false,
    }
  });

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({
    openaiApiKey: false,
    sendgridApiKey: false,
    stripeSecretKey: false,
    stripePublicKey: false,
  });

  const [testResults, setTestResults] = useState<Record<string, string>>({});

  // Check if user is super admin
  useEffect(() => {
    if (!authLoading && (!user || (user as any)?.email !== 'admin@example.com')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      window.location.href = '/';
    }
  }, [user, authLoading, toast]);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/admin/settings'],
    enabled: !!user,
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: AdminSettings) => {
      await apiRequest("PUT", "/api/admin/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: "Settings Saved",
        description: "Admin settings have been updated successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    },
  });

  const testApiKeyMutation = useMutation({
    mutationFn: async ({ service, key }: { service: string; key: string }) => {
      const response = await apiRequest("POST", "/api/admin/test-api-key", { service, key });
      return response.json();
    },
    onSuccess: (data, variables) => {
      setTestResults(prev => ({
        ...prev,
        [variables.service]: data.success ? 'success' : 'error'
      }));
      toast({
        title: data.success ? "Test Successful" : "Test Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error, variables) => {
      setTestResults(prev => ({
        ...prev,
        [variables.service]: 'error'
      }));
      toast({
        title: "Test Failed",
        description: "Failed to test API key.",
        variant: "destructive",
      });
    },
  });

  // Load settings when data is available
  useEffect(() => {
    if (settings) {
      setFormData(settings as AdminSettings);
    }
  }, [settings]);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [category, subField] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [category]: {
          ...(prev[category as keyof AdminSettings] as any),
          [subField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const toggleKeyVisibility = (key: string) => {
    setShowKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    saveSettingsMutation.mutate(formData);
  };

  const testApiKey = (service: string, key: string) => {
    if (!key.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key before testing.",
        variant: "destructive",
      });
      return;
    }
    testApiKeyMutation.mutate({ service, key });
  };

  if (authLoading || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Shield className="mr-3 h-8 w-8 text-red-600" />
            Super Admin Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure system-wide settings and API integrations
          </p>
        </div>
        <Badge variant="destructive" className="text-sm">
          Admin Only
        </Badge>
      </div>

      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> This page contains sensitive configuration settings. 
          API keys are encrypted and stored securely. Only you can access this page.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="space-y-6">
          <div className="grid gap-6">
            {/* OpenAI API Key */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="mr-2 h-5 w-5" />
                  OpenAI API Key
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      type={showKeys.openaiApiKey ? "text" : "password"}
                      placeholder="sk-..."
                      value={formData.openaiApiKey}
                      onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => toggleKeyVisibility('openaiApiKey')}
                    >
                      {showKeys.openaiApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => testApiKey('openai', formData.openaiApiKey)}
                    disabled={testApiKeyMutation.isPending}
                  >
                    {testResults.openai === 'success' && <CheckCircle className="mr-2 h-4 w-4 text-green-600" />}
                    Test
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Required for AI-powered question validation, study guides, and improvement plans.
                </p>
              </CardContent>
            </Card>

            {/* SendGrid API Key */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="mr-2 h-5 w-5" />
                  SendGrid API Key
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      type={showKeys.sendgridApiKey ? "text" : "password"}
                      placeholder="SG...."
                      value={formData.sendgridApiKey}
                      onChange={(e) => handleInputChange('sendgridApiKey', e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => toggleKeyVisibility('sendgridApiKey')}
                    >
                      {showKeys.sendgridApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => testApiKey('sendgrid', formData.sendgridApiKey)}
                    disabled={testApiKeyMutation.isPending}
                  >
                    {testResults.sendgrid === 'success' && <CheckCircle className="mr-2 h-4 w-4 text-green-600" />}
                    Test
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Required for sending email notifications and alerts.
                </p>
              </CardContent>
            </Card>

            {/* Stripe API Keys */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Stripe API Keys
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Secret Key</Label>
                  <div className="flex gap-2 mt-1">
                    <div className="flex-1 relative">
                      <Input
                        type={showKeys.stripeSecretKey ? "text" : "password"}
                        placeholder="sk_..."
                        value={formData.stripeSecretKey}
                        onChange={(e) => handleInputChange('stripeSecretKey', e.target.value)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => toggleKeyVisibility('stripeSecretKey')}
                      >
                        {showKeys.stripeSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => testApiKey('stripe', formData.stripeSecretKey)}
                      disabled={testApiKeyMutation.isPending}
                    >
                      {testResults.stripe === 'success' && <CheckCircle className="mr-2 h-4 w-4 text-green-600" />}
                      Test
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Public Key</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type={showKeys.stripePublicKey ? "text" : "password"}
                      placeholder="pk_..."
                      value={formData.stripePublicKey}
                      onChange={(e) => handleInputChange('stripePublicKey', e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleKeyVisibility('stripePublicKey')}
                    >
                      {showKeys.stripePublicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Required for payment processing and subscriptions.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Temporarily disable access for system maintenance
                    </p>
                  </div>
                  <Switch
                    id="maintenanceMode"
                    checked={formData.systemSettings.maintenanceMode}
                    onCheckedChange={(checked) => handleInputChange('systemSettings.maintenanceMode', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="registrationEnabled">User Registration</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow new users to register accounts
                    </p>
                  </div>
                  <Switch
                    id="registrationEnabled"
                    checked={formData.systemSettings.registrationEnabled}
                    onCheckedChange={(checked) => handleInputChange('systemSettings.registrationEnabled', checked)}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="maxUsersPerOrg">Max Users per Organization</Label>
                    <Input
                      id="maxUsersPerOrg"
                      type="number"
                      min="1"
                      max="10000"
                      value={formData.systemSettings.maxUsersPerOrg}
                      onChange={(e) => handleInputChange('systemSettings.maxUsersPerOrg', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxTestbanksPerUser">Max Testbanks per User</Label>
                    <Input
                      id="maxTestbanksPerUser"
                      type="number"
                      min="1"
                      max="1000"
                      value={formData.systemSettings.maxTestbanksPerUser}
                      onChange={(e) => handleInputChange('systemSettings.maxTestbanksPerUser', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxQuestionsPerTestbank">Max Questions per Testbank</Label>
                    <Input
                      id="maxQuestionsPerTestbank"
                      type="number"
                      min="1"
                      max="10000"
                      value={formData.systemSettings.maxQuestionsPerTestbank}
                      onChange={(e) => handleInputChange('systemSettings.maxQuestionsPerTestbank', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send system notifications via email
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={formData.notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => handleInputChange('notificationSettings.emailNotifications', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="systemAlerts">System Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts for system issues and errors
                    </p>
                  </div>
                  <Switch
                    id="systemAlerts"
                    checked={formData.notificationSettings.systemAlerts}
                    onCheckedChange={(checked) => handleInputChange('notificationSettings.systemAlerts', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="performanceReports">Performance Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Weekly performance and usage reports
                    </p>
                  </div>
                  <Switch
                    id="performanceReports"
                    checked={formData.notificationSettings.performanceReports}
                    onCheckedChange={(checked) => handleInputChange('notificationSettings.performanceReports', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Button 
          onClick={handleSave} 
          disabled={saveSettingsMutation.isPending}
          className="min-w-32"
        >
          <Save className="mr-2 h-4 w-4" />
          {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}