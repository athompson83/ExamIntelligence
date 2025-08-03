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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
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
  ExternalLink,
  CheckCircle,
  Link,
  Download,
  ArrowRightLeft
} from "lucide-react";
import { useForm } from "react-hook-form";
import QRCode from 'qrcode';
import LLMProviderManagement from "@/components/LLMProviderManagement";
import LandingPageEditor from "@/components/LandingPageEditor";

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
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface PromptTemplate {
  id: string;
  name: string;
  description?: string;
  content: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SuperAdminSettings() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [activeTab, setActiveTab] = useState("accounts");
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [mobileAppStatus, setMobileAppStatus] = useState<"stopped" | "starting" | "running">("stopped");

  // Form configurations
  const accountForm = useForm();
  const userForm = useForm();
  const promptForm = useForm();

  // Data queries
  const { data: accounts = [] } = useQuery({
    queryKey: ["/api/super-admin/accounts"],
    enabled: isAuthenticated && user?.role === 'super_admin'
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/super-admin/users"],
    enabled: isAuthenticated && user?.role === 'super_admin'
  });

  const { data: prompts = [] } = useQuery({
    queryKey: ["/api/super-admin/prompts"],
    enabled: isAuthenticated && user?.role === 'super_admin'
  });

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
                  <p className="text-2xl font-bold">{Array.isArray(accounts) ? accounts.length : 0}</p>
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
                  <p className="text-2xl font-bold">{Array.isArray(users) ? users.length : 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Prompt Templates</p>
                  <p className="text-2xl font-bold">{Array.isArray(prompts) ? prompts.length : 0}</p>
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
                  <p className="text-2xl font-bold">--</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "accounts", label: "Account Management", icon: Building },
              { id: "users", label: "User Management", icon: Users },
              { id: "prompts", label: "AI Prompt Templates", icon: MessageSquare },
              { id: "mobile", label: "Mobile App Testing", icon: Smartphone },
              { id: "landing", label: "Landing Page Editor", icon: Globe },
              { id: "ai", label: "AI Providers", icon: Brain },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "accounts" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Account Management</h2>
              <Button onClick={() => setIsAccountDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(accounts) && accounts.map((account: Account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.name}</TableCell>
                        <TableCell>{account.domain || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={account.planType === 'premium' ? 'default' : 'secondary'}>
                            {account.planType}
                          </Badge>
                        </TableCell>
                        <TableCell>{account.userCount || 0}</TableCell>
                        <TableCell>
                          <Badge variant={account.isActive ? 'default' : 'destructive'}>
                            {account.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedAccount(account);
                                setIsAccountDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "ai" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">AI Provider Management</h2>
            <LLMProviderManagement />
          </div>
        )}

        {activeTab === "landing" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Landing Page Editor</h2>
            <LandingPageEditor />
          </div>
        )}

        {activeTab === "mobile" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Mobile App Testing</h2>
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-medium">Mobile Development Tools</h3>
                  <p className="text-gray-600">Access mobile testing and development options</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-2">Mobile Web Interface</h4>
                      <p className="text-sm text-green-700 mb-3">
                        Test the touch-optimized web interface on mobile devices.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => window.open('/mobile', '_blank')}
                        className="w-full"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Mobile Interface
                      </Button>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2">Expo Go Testing</h4>
                      <p className="text-sm text-blue-700 mb-3">
                        Download Expo Go app to test React Native components.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => window.open('https://expo.dev/client', '_blank')}
                        className="w-full"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Download Expo Go
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Account Dialog */}
        <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {selectedAccount ? 'Edit Account' : 'Create New Account'}
              </DialogTitle>
            </DialogHeader>
            <Form {...accountForm}>
              <form className="space-y-4">
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

      </div>
    </Layout>
  );
}