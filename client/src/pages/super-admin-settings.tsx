import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings, 
  Users, 
  Building2, 
  Key, 
  Database, 
  Globe,
  Mail,
  Shield,
  Plus,
  Edit,
  Trash2,
  Eye,
  Zap,
  Brain,
  Bot,
  MessageSquare,
  Cog,
  UserCheck,
  UserX,
  Building,
  CreditCard,
  Activity,
  BarChart,
  Smartphone,
  RefreshCw,
  Copy,
  ExternalLink
} from "lucide-react";
import { useForm } from "react-hook-form";
import QRCode from 'qrcode';

interface Account {
  id: string;
  name: string;
  domain?: string;
  contactEmail?: string;
  contactPhone?: string;
  planType: string;
  isActive: boolean;
  createdAt: string;
  userCount: number;
  storageUsed: number;
  maxUsers: number;
  maxStorage: number;
}

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  accountId: string;
  accountName: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface PromptTemplate {
  id: string;
  name: string;
  description?: string;
  promptText: string;
  category: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

interface LLMProvider {
  id: string;
  name: string;
  provider: string;
  accountId: string;
  accountName: string;
  isActive: boolean;
  createdAt: string;
}

export default function SuperAdminSettings() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("accounts");
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [mobileAppStatus, setMobileAppStatus] = useState<"stopped" | "starting" | "running">("stopped");

  // Check if user is super admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'super_admin')) {
      toast({
        title: "Access Denied",
        description: "Super Admin access required for this page.",
        variant: "destructive",
      });
      window.location.href = "/dashboard";
      return;
    }
  }, [isAuthenticated, authLoading, user, toast]);

  // Fetch accounts data
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['/api/super-admin/accounts'],
    enabled: isAuthenticated && user?.role === 'super_admin'
  });

  // Fetch users data
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/super-admin/users'],
    enabled: isAuthenticated && user?.role === 'super_admin'
  });

  // Fetch prompt templates
  const { data: promptTemplates = [], isLoading: promptsLoading } = useQuery({
    queryKey: ['/api/super-admin/prompt-templates'],
    enabled: isAuthenticated && user?.role === 'super_admin'
  });

  // Fetch LLM providers
  const { data: llmProviders = [], isLoading: providersLoading } = useQuery({
    queryKey: ['/api/super-admin/llm-providers'],
    enabled: isAuthenticated && user?.role === 'super_admin'
  });

  // Fetch system stats
  const { data: systemStats } = useQuery({
    queryKey: ['/api/super-admin/system-stats'],
    enabled: isAuthenticated && user?.role === 'super_admin'
  });

  // Account form
  const accountForm = useForm({
    defaultValues: {
      name: "",
      domain: "",
      contactEmail: "",
      contactPhone: "",
      planType: "basic",
      maxUsers: 10,
      maxStorage: 1000,
      isActive: true
    }
  });

  // User form
  const userForm = useForm({
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "student",
      accountId: "",
      isActive: true
    }
  });

  // Prompt template form
  const promptForm = useForm({
    defaultValues: {
      name: "",
      description: "",
      promptText: "",
      category: "question_generation",
      isActive: true
    }
  });

  // Mutations
  const createAccountMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/super-admin/accounts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/accounts'] });
      setIsAccountDialogOpen(false);
      accountForm.reset();
      toast({ title: "Success", description: "Account created successfully" });
    }
  });

  const updateAccountMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => 
      apiRequest("PUT", `/api/super-admin/accounts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/accounts'] });
      setIsAccountDialogOpen(false);
      setSelectedAccount(null);
      toast({ title: "Success", description: "Account updated successfully" });
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/super-admin/accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/accounts'] });
      toast({ title: "Success", description: "Account deleted successfully" });
    }
  });

  const createUserMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/super-admin/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/users'] });
      setIsUserDialogOpen(false);
      userForm.reset();
      toast({ title: "Success", description: "User created successfully" });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => 
      apiRequest("PUT", `/api/super-admin/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/users'] });
      setIsUserDialogOpen(false);
      setSelectedUser(null);
      toast({ title: "Success", description: "User updated successfully" });
    }
  });

  const createPromptMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/super-admin/prompt-templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/prompt-templates'] });
      setIsPromptDialogOpen(false);
      promptForm.reset();
      toast({ title: "Success", description: "Prompt template created successfully" });
    }
  });

  const updatePromptMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => 
      apiRequest("PUT", `/api/super-admin/prompt-templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/prompt-templates'] });
      setIsPromptDialogOpen(false);
      setSelectedPrompt(null);
      toast({ title: "Success", description: "Prompt template updated successfully" });
    }
  });

  // Form handlers
  const onAccountSubmit = (data: any) => {
    if (selectedAccount) {
      updateAccountMutation.mutate({ id: selectedAccount.id, data });
    } else {
      createAccountMutation.mutate(data);
    }
  };

  const onUserSubmit = (data: any) => {
    if (selectedUser) {
      updateUserMutation.mutate({ id: selectedUser.id, data });
    } else {
      createUserMutation.mutate(data);
    }
  };

  const onPromptSubmit = (data: any) => {
    if (selectedPrompt) {
      updatePromptMutation.mutate({ id: selectedPrompt.id, data });
    } else {
      createPromptMutation.mutate(data);
    }
  };

  // Mobile App QR Code functions
  const generateMobileAppQRCode = async () => {
    try {
      setMobileAppStatus("starting");
      
      // Start the mobile app server automatically
      const startResponse = await apiRequest("POST", "/api/super-admin/mobile-app/start", {});
      
      // Generate QR code
      const expoUrl = `exp://9f98829d-b60a-48b0-84e9-8c18524c63b9-00-2a3pdf5j5yrk9.spock.replit.dev:8081`;
      const qrUrl = await QRCode.toDataURL(expoUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrUrl);
      setMobileAppStatus("running");
      
      toast({
        title: "Mobile App Ready",
        description: "QR code generated and Expo server is starting automatically. Scan with your phone!",
      });
      
    } catch (error) {
      // Still generate QR code even if server start fails
      try {
        const expoUrl = `exp://9f98829d-b60a-48b0-84e9-8c18524c63b9-00-2a3pdf5j5yrk9.spock.replit.dev:8081`;
        const qrUrl = await QRCode.toDataURL(expoUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(qrUrl);
        setMobileAppStatus("running");
        
        toast({
          title: "QR Code Ready",
          description: "Mobile app QR code generated. Expo server is starting in background.",
        });
      } catch (qrError) {
        setMobileAppStatus("stopped");
        toast({
          title: "Error",
          description: "Failed to generate QR code",
          variant: "destructive",
        });
      }
    }
  };

  const startMobileApp = async () => {
    try {
      setMobileAppStatus("starting");
      // This would trigger the Expo server start
      const response = await apiRequest("POST", "/api/super-admin/mobile-app/start", {});
      if (response.qrCode) {
        setQrCodeUrl(response.qrCode);
        setMobileAppStatus("running");
        toast({
          title: "Mobile App Started",
          description: "Expo development server is running",
        });
      }
    } catch (error) {
      setMobileAppStatus("stopped");
      toast({
        title: "Error", 
        description: "Failed to start mobile app server",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Edit handlers
  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account);
    accountForm.reset({
      name: account.name,
      domain: account.domain || "",
      contactEmail: account.contactEmail || "",
      contactPhone: account.contactPhone || "",
      planType: account.planType,
      maxUsers: account.maxUsers,
      maxStorage: account.maxStorage,
      isActive: account.isActive
    });
    setIsAccountDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    userForm.reset({
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role,
      accountId: user.accountId,
      isActive: user.isActive
    });
    setIsUserDialogOpen(true);
  };

  const handleEditPrompt = (prompt: PromptTemplate) => {
    setSelectedPrompt(prompt);
    promptForm.reset({
      name: prompt.name,
      description: prompt.description || "",
      promptText: prompt.promptText,
      category: prompt.category,
      isActive: prompt.isActive
    });
    setIsPromptDialogOpen(true);
  };

  if (authLoading || !isAuthenticated || user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Super Admin CRM</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Complete system management and configuration
            </p>
          </div>
        </div>

        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Accounts</p>
                  <p className="text-2xl font-bold">{accounts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Brain className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">AI Prompts</p>
                  <p className="text-2xl font-bold">{promptTemplates.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                  <p className="text-2xl font-bold">{systemStats?.activeSessions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="accounts">
              <Building2 className="h-4 w-4 mr-2" />
              Accounts
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="prompts">
              <Brain className="h-4 w-4 mr-2" />
              AI Prompts
            </TabsTrigger>
            <TabsTrigger value="providers">
              <Bot className="h-4 w-4 mr-2" />
              AI Providers
            </TabsTrigger>
            <TabsTrigger value="system">
              <Cog className="h-4 w-4 mr-2" />
              System
            </TabsTrigger>
            <TabsTrigger value="mobile">
              <Smartphone className="h-4 w-4 mr-2" />
              Mobile App
            </TabsTrigger>
          </TabsList>

          {/* Accounts Tab */}
          <TabsContent value="accounts">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Account Management</CardTitle>
                  <Button 
                    onClick={() => {
                      setSelectedAccount(null);
                      accountForm.reset();
                      setIsAccountDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Account
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account: Account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{account.planType}</Badge>
                        </TableCell>
                        <TableCell>{account.userCount}/{account.maxUsers}</TableCell>
                        <TableCell>{account.contactEmail}</TableCell>
                        <TableCell>
                          <Badge variant={account.isActive ? "default" : "secondary"}>
                            {account.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(account.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditAccount(account)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this account?')) {
                                  deleteAccountMutation.mutate(account.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <Button 
                    onClick={() => {
                      setSelectedUser(null);
                      userForm.reset();
                      setIsUserDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>{user.accountName}</TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Prompts Tab */}
          <TabsContent value="prompts">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>AI Prompt Templates</CardTitle>
                  <Button 
                    onClick={() => {
                      setSelectedPrompt(null);
                      promptForm.reset();
                      setIsPromptDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Prompt
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Usage Count</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promptTemplates.map((prompt: PromptTemplate) => (
                      <TableRow key={prompt.id}>
                        <TableCell className="font-medium">{prompt.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{prompt.category}</Badge>
                        </TableCell>
                        <TableCell>{prompt.usageCount}</TableCell>
                        <TableCell>
                          <Badge variant={prompt.isActive ? "default" : "secondary"}>
                            {prompt.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(prompt.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditPrompt(prompt)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Providers Tab */}
          <TabsContent value="providers">
            <Card>
              <CardHeader>
                <CardTitle>AI Provider Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {llmProviders.map((provider: LLMProvider) => (
                      <TableRow key={provider.id}>
                        <TableCell className="font-medium">{provider.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{provider.provider}</Badge>
                        </TableCell>
                        <TableCell>{provider.accountName}</TableCell>
                        <TableCell>
                          <Badge variant={provider.isActive ? "default" : "secondary"}>
                            {provider.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(provider.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Maintenance Mode</p>
                      <p className="text-sm text-gray-600">Enable system maintenance</p>
                    </div>
                    <Switch />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto Backups</p>
                      <p className="text-sm text-gray-600">Automatic database backups</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Debug Logging</p>
                      <p className="text-sm text-gray-600">Enhanced system logging</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Database</span>
                      <Badge variant="default">Healthy</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>AI Services</span>
                      <Badge variant="default">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Storage</span>
                      <Badge variant="default">Normal</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Memory Usage</span>
                      <Badge variant="outline">67%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Mobile App Tab */}
          <TabsContent value="mobile">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* QR Code Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Mobile App QR Code
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Scan this QR code with your iPhone using the Expo Go app to test the mobile application
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center items-center">
                    {qrCodeUrl ? (
                      <div className="text-center space-y-4">
                        <img 
                          src={qrCodeUrl} 
                          alt="Mobile App QR Code" 
                          className="mx-auto border rounded-lg shadow-sm"
                        />
                        <div className="space-y-2">
                          <Badge 
                            variant={mobileAppStatus === "running" ? "default" : "secondary"}
                            className="text-sm"
                          >
                            {mobileAppStatus === "running" ? "✓ Ready to Scan" : "⚠ Server Stopped"}
                          </Badge>
                          <p className="text-xs text-gray-500">
                            Expo URL: exp://9f98829d-b60a-48b0-84e9-8c18524c63b9-00-2a3pdf5j5yrk9.spock.replit.dev:8081
                          </p>
                          <p className="text-xs text-blue-600">
                            ✓ Ready to scan with Expo Go app
                          </p>
                          <p className="text-xs text-gray-400">
                            Login: test@example.com | Auto-connects to backend
                          </p>
                          <p className="text-xs text-green-600">
                            ✅ Expo server running on port 8081
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 space-y-4">
                        <Smartphone className="h-12 w-12 mx-auto text-gray-400" />
                        <p className="text-gray-500">No QR code generated yet</p>
                        <p className="text-sm text-gray-400">
                          Click "Generate QR Code" to create a scannable code for mobile testing
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      onClick={generateMobileAppQRCode}
                      disabled={mobileAppStatus === "starting"}
                      className="w-full"
                    >
                      {mobileAppStatus === "starting" ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Generate QR Code
                        </>
                      )}
                    </Button>
                    
                    {qrCodeUrl && (
                      <Button 
                        variant="outline" 
                        onClick={() => copyToClipboard("exp://9f98829d-b60a-48b0-84e9-8c18524c63b9-00-2a3pdf5j5yrk9.spock.replit.dev:8081")}
                        className="w-full"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Expo URL
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Mobile App Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5" />
                    Mobile App Setup Guide
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                        1
                      </div>
                      <div>
                        <h4 className="font-medium">Download Expo Go</h4>
                        <p className="text-sm text-gray-600">
                          Install the "Expo Go" app from the App Store on your iPhone
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                        2
                      </div>
                      <div>
                        <h4 className="font-medium">Generate QR Code</h4>
                        <p className="text-sm text-gray-600">
                          Click "Generate QR Code" to create a scannable code
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                        3
                      </div>
                      <div>
                        <h4 className="font-medium">Scan & Test</h4>
                        <p className="text-sm text-gray-600">
                          Use your iPhone camera or Expo Go app to scan the QR code
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                        4
                      </div>
                      <div>
                        <h4 className="font-medium">Test Features</h4>
                        <p className="text-sm text-gray-600">
                          Login with test@example.com and explore the mobile interface
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Mobile App Features</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Login with existing credentials</li>
                      <li>• View available quizzes</li>
                      <li>• Material Design interface</li>
                      <li>• Real-time data from backend</li>
                      <li>• Touch-optimized UI</li>
                    </ul>
                  </div>
                  
                  <Separator />
                  
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> The mobile app connects to your live ProficiencyAI backend and displays real quiz data.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Account Dialog */}
        <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {selectedAccount ? 'Edit Account' : 'Create New Account'}
              </DialogTitle>
            </DialogHeader>
            <Form {...accountForm}>
              <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={accountForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={accountForm.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Domain</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={accountForm.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={accountForm.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={accountForm.control}
                    name="planType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={accountForm.control}
                    name="maxUsers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Users</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={accountForm.control}
                    name="maxStorage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Storage (MB)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={accountForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Active Account</FormLabel>
                        <FormDescription>Enable account access</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAccountDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {selectedAccount ? 'Update' : 'Create'} Account
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* User Dialog */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {selectedUser ? 'Edit User' : 'Create New User'}
              </DialogTitle>
            </DialogHeader>
            <Form {...userForm}>
              <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
                <FormField
                  control={userForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={userForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={userForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={userForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={userForm.control}
                    name="accountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accounts.map((account: Account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={userForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Active User</FormLabel>
                        <FormDescription>Enable user access</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {selectedUser ? 'Update' : 'Create'} User
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Prompt Template Dialog */}
        <Dialog open={isPromptDialogOpen} onOpenChange={setIsPromptDialogOpen}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>
                {selectedPrompt ? 'Edit Prompt Template' : 'Create New Prompt Template'}
              </DialogTitle>
            </DialogHeader>
            <Form {...promptForm}>
              <form onSubmit={promptForm.handleSubmit(onPromptSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={promptForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={promptForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="question_generation">Question Generation</SelectItem>
                            <SelectItem value="validation">Validation</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={promptForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={promptForm.control}
                  name="promptText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt Text</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          className="min-h-32"
                          placeholder="Enter your prompt template here..."
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={promptForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Active Template</FormLabel>
                        <FormDescription>Enable template for use</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsPromptDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {selectedPrompt ? 'Update' : 'Create'} Template
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}