import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Users, Shield, Settings, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { apiRequest } from "@/lib/queryClient";

interface RolePermissions {
  id: string;
  role: string;
  permissions: {
    canCreateQuizzes: boolean;
    canEditQuizzes: boolean;
    canDeleteQuizzes: boolean;
    canManageUsers: boolean;
    canViewAnalytics: boolean;
    canExportData: boolean;
    canManageIntegrations: boolean;
    canAccessProctoringTools: boolean;
    canManageTestbanks: boolean;
    canUseAIGeneration: boolean;
    maxQuizzesPerMonth: number;
    maxUsersManaged: number;
    maxAIGenerationsPerMonth: number;
    maxProctoringHours: number;
  };
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TierSettings {
  id: string;
  tier: string;
  displayName: string;
  features: {
    maxUsers: number;
    maxQuizzes: number;
    aiGenerationsPerMonth: number;
    proctoringHours: number;
    advancedAnalytics: boolean;
    customBranding: boolean;
    prioritySupport: boolean;
    apiAccess: boolean;
    ssoIntegration: boolean;
    whiteLabeling: boolean;
    customIntegrations: boolean;
    dedicatedSupport: boolean;
  };
  pricing: {
    monthlyPrice: number;
    annualPrice: number;
    setupFee: number;
  };
  isActive: boolean;
  sortOrder: number;
}

export default function RoleSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("roles");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedTier, setSelectedTier] = useState<string>("");

  // Fetch role permissions
  const { data: rolePermissions, isLoading: rolesLoading } = useQuery({
    queryKey: ["/api/admin/role-permissions"],
  });

  // Fetch tier settings
  const { data: tierSettings, isLoading: tiersLoading } = useQuery({
    queryKey: ["/api/admin/tier-settings"],
  });

  // Update role permissions mutation
  const updateRolePermissionsMutation = useMutation({
    mutationFn: (data: { role: string; permissions: any }) =>
      apiRequest("PUT", "/api/admin/role-permissions", data),
    onSuccess: () => {
      toast({
        title: "Role Permissions Updated",
        description: "Role permissions have been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/role-permissions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update role permissions.",
        variant: "destructive",
      });
    },
  });

  // Update tier settings mutation
  const updateTierSettingsMutation = useMutation({
    mutationFn: (data: { tier: string; settings: any }) =>
      apiRequest("PUT", "/api/admin/tier-settings", data),
    onSuccess: () => {
      toast({
        title: "Tier Settings Updated",
        description: "Tier settings have been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tier-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update tier settings.",
        variant: "destructive",
      });
    },
  });

  const handleRolePermissionUpdate = (role: string, permissions: any) => {
    updateRolePermissionsMutation.mutate({ role, permissions });
  };

  const handleTierSettingUpdate = (tier: string, settings: any) => {
    updateTierSettingsMutation.mutate({ tier, settings });
  };

  const roleIcons = {
    super_admin: Crown,
    admin: Shield,
    teacher: Users,
    student: Users,
  };

  const tierColors = {
    starter: "bg-gray-100 text-gray-800",
    basic: "bg-blue-100 text-blue-800",
    professional: "bg-purple-100 text-purple-800",
    institutional: "bg-green-100 text-green-800",
    enterprise: "bg-yellow-100 text-yellow-800",
  };

  if (rolesLoading || tiersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 md:ml-64">
        <TopBar />
        <main className="p-4 md:p-6 pb-32 md:pb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Role & Tier Management</h1>
              <p className="text-gray-600">Configure role-based permissions and subscription tier settings</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Role Permissions
              </TabsTrigger>
              <TabsTrigger value="tiers" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Subscription Tiers
              </TabsTrigger>
            </TabsList>

            {/* Role Permissions Tab */}
            <TabsContent value="roles" className="space-y-6">
              <div className="grid gap-6">
                {rolePermissions && Array.isArray(rolePermissions) ? rolePermissions.map((role: RolePermissions) => {
                  const IconComponent = roleIcons[role.role as keyof typeof roleIcons] || Users;
                  
                  return (
                    <Card key={role.id} className="border-l-4 border-l-primary">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <IconComponent className="h-6 w-6 text-primary" />
                            <div>
                              <CardTitle className="capitalize text-lg">
                                {role.role.replace('_', ' ')} Role
                              </CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {role.description}
                              </p>
                            </div>
                          </div>
                          <Badge variant={role.isActive ? "default" : "secondary"}>
                            {role.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Core Permissions */}
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm">Core Permissions</h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor={`${role.id}-create-quizzes`} className="text-sm">
                                  Create Quizzes
                                </Label>
                                <Switch
                                  id={`${role.id}-create-quizzes`}
                                  checked={role.permissions.canCreateQuizzes}
                                  onCheckedChange={(checked) => {
                                    const updated = {
                                      ...role.permissions,
                                      canCreateQuizzes: checked
                                    };
                                    handleRolePermissionUpdate(role.role, updated);
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label htmlFor={`${role.id}-edit-quizzes`} className="text-sm">
                                  Edit Quizzes
                                </Label>
                                <Switch
                                  id={`${role.id}-edit-quizzes`}
                                  checked={role.permissions.canEditQuizzes}
                                  onCheckedChange={(checked) => {
                                    const updated = {
                                      ...role.permissions,
                                      canEditQuizzes: checked
                                    };
                                    handleRolePermissionUpdate(role.role, updated);
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label htmlFor={`${role.id}-delete-quizzes`} className="text-sm">
                                  Delete Quizzes
                                </Label>
                                <Switch
                                  id={`${role.id}-delete-quizzes`}
                                  checked={role.permissions.canDeleteQuizzes}
                                  onCheckedChange={(checked) => {
                                    const updated = {
                                      ...role.permissions,
                                      canDeleteQuizzes: checked
                                    };
                                    handleRolePermissionUpdate(role.role, updated);
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Advanced Permissions */}
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm">Advanced Permissions</h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor={`${role.id}-manage-users`} className="text-sm">
                                  Manage Users
                                </Label>
                                <Switch
                                  id={`${role.id}-manage-users`}
                                  checked={role.permissions.canManageUsers}
                                  onCheckedChange={(checked) => {
                                    const updated = {
                                      ...role.permissions,
                                      canManageUsers: checked
                                    };
                                    handleRolePermissionUpdate(role.role, updated);
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label htmlFor={`${role.id}-view-analytics`} className="text-sm">
                                  View Analytics
                                </Label>
                                <Switch
                                  id={`${role.id}-view-analytics`}
                                  checked={role.permissions.canViewAnalytics}
                                  onCheckedChange={(checked) => {
                                    const updated = {
                                      ...role.permissions,
                                      canViewAnalytics: checked
                                    };
                                    handleRolePermissionUpdate(role.role, updated);
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label htmlFor={`${role.id}-ai-generation`} className="text-sm">
                                  AI Generation
                                </Label>
                                <Switch
                                  id={`${role.id}-ai-generation`}
                                  checked={role.permissions.canUseAIGeneration}
                                  onCheckedChange={(checked) => {
                                    const updated = {
                                      ...role.permissions,
                                      canUseAIGeneration: checked
                                    };
                                    handleRolePermissionUpdate(role.role, updated);
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Usage Limits */}
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm">Usage Limits</h4>
                            <div className="space-y-2">
                              <div>
                                <Label htmlFor={`${role.id}-max-quizzes`} className="text-sm">
                                  Max Quizzes/Month
                                </Label>
                                <Input
                                  id={`${role.id}-max-quizzes`}
                                  type="number"
                                  value={role.permissions.maxQuizzesPerMonth}
                                  onChange={(e) => {
                                    const updated = {
                                      ...role.permissions,
                                      maxQuizzesPerMonth: parseInt(e.target.value) || 0
                                    };
                                    handleRolePermissionUpdate(role.role, updated);
                                  }}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`${role.id}-max-ai`} className="text-sm">
                                  Max AI Generations/Month
                                </Label>
                                <Input
                                  id={`${role.id}-max-ai`}
                                  type="number"
                                  value={role.permissions.maxAIGenerationsPerMonth}
                                  onChange={(e) => {
                                    const updated = {
                                      ...role.permissions,
                                      maxAIGenerationsPerMonth: parseInt(e.target.value) || 0
                                    };
                                    handleRolePermissionUpdate(role.role, updated);
                                  }}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }) : <div className="text-center py-8 text-gray-500">No role permissions configured</div>}
              </div>
            </TabsContent>

            {/* Subscription Tiers Tab */}
            <TabsContent value="tiers" className="space-y-6">
              <div className="grid gap-6">
                {tierSettings && Array.isArray(tierSettings) ? tierSettings.map((tier: TierSettings) => (
                  <Card key={tier.id} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {tier.displayName}
                            <Badge className={tierColors[tier.tier as keyof typeof tierColors] || "bg-gray-100 text-gray-800"}>
                              {tier.tier}
                            </Badge>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            ${tier.pricing.monthlyPrice}/month • ${tier.pricing.annualPrice}/year
                          </p>
                        </div>
                        <Badge variant={tier.isActive ? "default" : "secondary"}>
                          {tier.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Limits */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">Usage Limits</h4>
                          <div className="space-y-2">
                            <div>
                              <Label className="text-sm">Max Users</Label>
                              <Input
                                type="number"
                                value={tier.features.maxUsers}
                                onChange={(e) => {
                                  const updated = {
                                    ...tier.features,
                                    maxUsers: parseInt(e.target.value) || 0
                                  };
                                  handleTierSettingUpdate(tier.tier, { features: updated });
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Max Quizzes</Label>
                              <Input
                                type="number"
                                value={tier.features.maxQuizzes}
                                onChange={(e) => {
                                  const updated = {
                                    ...tier.features,
                                    maxQuizzes: parseInt(e.target.value) || 0
                                  };
                                  handleTierSettingUpdate(tier.tier, { features: updated });
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">AI Generations/Month</Label>
                              <Input
                                type="number"
                                value={tier.features.aiGenerationsPerMonth}
                                onChange={(e) => {
                                  const updated = {
                                    ...tier.features,
                                    aiGenerationsPerMonth: parseInt(e.target.value) || 0
                                  };
                                  handleTierSettingUpdate(tier.tier, { features: updated });
                                }}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Features */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">Features</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">Advanced Analytics</Label>
                              <Switch
                                checked={tier.features.advancedAnalytics}
                                onCheckedChange={(checked) => {
                                  const updated = {
                                    ...tier.features,
                                    advancedAnalytics: checked
                                  };
                                  handleTierSettingUpdate(tier.tier, { features: updated });
                                }}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">Custom Branding</Label>
                              <Switch
                                checked={tier.features.customBranding}
                                onCheckedChange={(checked) => {
                                  const updated = {
                                    ...tier.features,
                                    customBranding: checked
                                  };
                                  handleTierSettingUpdate(tier.tier, { features: updated });
                                }}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">SSO Integration</Label>
                              <Switch
                                checked={tier.features.ssoIntegration}
                                onCheckedChange={(checked) => {
                                  const updated = {
                                    ...tier.features,
                                    ssoIntegration: checked
                                  };
                                  handleTierSettingUpdate(tier.tier, { features: updated });
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">Pricing</h4>
                          <div className="space-y-2">
                            <div>
                              <Label className="text-sm">Monthly Price ($)</Label>
                              <Input
                                type="number"
                                value={tier.pricing.monthlyPrice}
                                onChange={(e) => {
                                  const updated = {
                                    ...tier.pricing,
                                    monthlyPrice: parseFloat(e.target.value) || 0
                                  };
                                  handleTierSettingUpdate(tier.tier, { pricing: updated });
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Annual Price ($)</Label>
                              <Input
                                type="number"
                                value={tier.pricing.annualPrice}
                                onChange={(e) => {
                                  const updated = {
                                    ...tier.pricing,
                                    annualPrice: parseFloat(e.target.value) || 0
                                  };
                                  handleTierSettingUpdate(tier.tier, { pricing: updated });
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Setup Fee ($)</Label>
                              <Input
                                type="number"
                                value={tier.pricing.setupFee}
                                onChange={(e) => {
                                  const updated = {
                                    ...tier.pricing,
                                    setupFee: parseFloat(e.target.value) || 0
                                  };
                                  handleTierSettingUpdate(tier.tier, { pricing: updated });
                                }}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) : <div className="text-center py-8 text-gray-500">No tier settings configured</div>}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}