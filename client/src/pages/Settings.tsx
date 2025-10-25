import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Database,
  Key,
  Mail,
  Monitor,
  Smartphone,
  MessageCircle,
  BookOpen,
  Loader2,
  Save
} from "lucide-react";
import ExamReferencesManager from '@/components/ExamReferencesManager';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
  timezone: z.string(),
  language: z.string(),
});

const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  examAlerts: z.boolean(),
  proctoringAlerts: z.boolean(),
  systemUpdates: z.boolean(),
  weeklyReports: z.boolean(),
  instantMessages: z.boolean(),
});

const securitySchema = z.object({
  twoFactorAuth: z.boolean(),
  sessionTimeout: z.string().refine((val) => parseInt(val) >= 5 && parseInt(val) <= 1440, {
    message: "Session timeout must be between 5 and 1440 minutes",
  }),
  passwordExpiry: z.string().refine((val) => parseInt(val) >= 30 && parseInt(val) <= 365, {
    message: "Password expiry must be between 30 and 365 days",
  }),
  ipWhitelist: z.string().optional(),
});

const systemSchema = z.object({
  defaultTimeLimit: z.string().refine((val) => parseInt(val) > 0, {
    message: "Time limit must be greater than 0",
  }),
  autoSave: z.boolean(),
  validationStrength: z.enum(["low", "medium", "high"]),
  proctoringSettings: z.string(),
  aiValidation: z.boolean(),
  analyticsTracking: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type NotificationFormData = z.infer<typeof notificationSchema>;
type SecurityFormData = z.infer<typeof securitySchema>;
type SystemFormData = z.infer<typeof systemSchema>;

export default function Settings() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  
  const [isTooltipSystemMuted, setIsTooltipSystemMuted] = useState(() => {
    return localStorage.getItem('tooltipSystemMuted') === 'true';
  });
  
  const toggleTooltipMute = () => {
    const newMutedState = !isTooltipSystemMuted;
    setIsTooltipSystemMuted(newMutedState);
    localStorage.setItem('tooltipSystemMuted', newMutedState.toString());
    
    toast({
      title: newMutedState ? 'AI Tooltips Disabled' : 'AI Tooltips Enabled',
      description: newMutedState 
        ? 'You will no longer receive AI assistant tooltips. Use Alt+T to toggle them back on.' 
        : 'AI assistant tooltips are now active. Press Alt+T to disable them anytime.',
      duration: 3000,
    });
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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
  }, [isAuthenticated, authLoading, toast]);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      bio: "",
      timezone: "UTC",
      language: "en",
    },
  });

  const notificationForm = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      examAlerts: true,
      proctoringAlerts: true,
      systemUpdates: false,
      weeklyReports: true,
      instantMessages: true,
    },
  });

  const securityForm = useForm<SecurityFormData>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      twoFactorAuth: false,
      sessionTimeout: "30",
      passwordExpiry: "90",
      ipWhitelist: "",
    },
  });

  const systemForm = useForm<SystemFormData>({
    resolver: zodResolver(systemSchema),
    defaultValues: {
      defaultTimeLimit: "60",
      autoSave: true,
      validationStrength: "medium",
      proctoringSettings: "standard",
      aiValidation: true,
      analyticsTracking: true,
    },
  });

  const profileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      await apiRequest("PUT", "/api/settings/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const notificationMutation = useMutation({
    mutationFn: async (data: NotificationFormData) => {
      await apiRequest("PUT", "/api/settings/notifications", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notification preferences updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update notification preferences",
        variant: "destructive",
      });
    },
  });

  const securityMutation = useMutation({
    mutationFn: async (data: SecurityFormData) => {
      await apiRequest("PUT", "/api/settings/security", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Security settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update security settings",
        variant: "destructive",
      });
    },
  });

  const systemMutation = useMutation({
    mutationFn: async (data: SystemFormData) => {
      await apiRequest("PUT", "/api/settings/system", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "System preferences updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update system preferences",
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    profileMutation.mutate(data);
  };

  const onNotificationSubmit = (data: NotificationFormData) => {
    notificationMutation.mutate(data);
  };

  const onSecuritySubmit = (data: SecurityFormData) => {
    securityMutation.mutate(data);
  };

  const onSystemSubmit = (data: SystemFormData) => {
    systemMutation.mutate(data);
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white break-words">Settings</h1>
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 mt-1">
              Manage your account preferences and application settings
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 overflow-hidden">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <nav className="space-y-2">
                <Button
                  variant={activeTab === "profile" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("profile")}
                  data-testid="nav-profile"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
                <Button
                  variant={activeTab === "notifications" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("notifications")}
                  data-testid="nav-notifications"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>
                <Button
                  variant={activeTab === "security" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("security")}
                  data-testid="nav-security"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Security
                </Button>
                <Button
                  variant={activeTab === "appearance" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("appearance")}
                  data-testid="nav-appearance"
                >
                  <Palette className="h-4 w-4 mr-2" />
                  Appearance
                </Button>
                <Button
                  variant={activeTab === "interface" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("interface")}
                  data-testid="nav-interface"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Interface
                </Button>
                <Button
                  variant={activeTab === "exam-references" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("exam-references")}
                  data-testid="nav-exam-references"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Exam References
                </Button>
                {user?.role === 'admin' && (
                  <Button
                    variant={activeTab === "system" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("system")}
                    data-testid="nav-system"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    System
                  </Button>
                )}
              </nav>
            </CardContent>
          </Card>

          <div className="lg:col-span-3">
            {activeTab === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Profile Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  disabled={profileMutation.isPending}
                                  className="h-12"
                                  data-testid="input-firstName"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  disabled={profileMutation.isPending}
                                  className="h-12"
                                  data-testid="input-lastName"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                {...field} 
                                disabled={profileMutation.isPending}
                                className="h-12"
                                data-testid="input-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell us about yourself..."
                                {...field}
                                disabled={profileMutation.isPending}
                                className="min-h-24"
                                data-testid="textarea-bio"
                              />
                            </FormControl>
                            <FormDescription>
                              Maximum 500 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="timezone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Timezone</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                disabled={profileMutation.isPending}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-12" data-testid="select-timezone">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="UTC">UTC</SelectItem>
                                  <SelectItem value="EST">Eastern Time</SelectItem>
                                  <SelectItem value="PST">Pacific Time</SelectItem>
                                  <SelectItem value="GMT">Greenwich Mean Time</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Language</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                disabled={profileMutation.isPending}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-12" data-testid="select-language">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="en">English</SelectItem>
                                  <SelectItem value="es">Spanish</SelectItem>
                                  <SelectItem value="fr">French</SelectItem>
                                  <SelectItem value="de">German</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={profileMutation.isPending}
                        className="h-12 px-6"
                        data-testid="button-saveProfile"
                        aria-busy={profileMutation.isPending}
                      >
                        {profileMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...notificationForm}>
                    <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                      <div className="space-y-4">
                        <FormField
                          control={notificationForm.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>Email Notifications</FormLabel>
                                <FormDescription>
                                  Receive notifications via email
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={notificationMutation.isPending}
                                  data-testid="switch-emailNotifications"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={notificationForm.control}
                          name="examAlerts"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>Exam Alerts</FormLabel>
                                <FormDescription>
                                  Get notified about exam start times and deadlines
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={notificationMutation.isPending}
                                  data-testid="switch-examAlerts"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={notificationForm.control}
                          name="proctoringAlerts"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>Proctoring Alerts</FormLabel>
                                <FormDescription>
                                  Receive alerts for suspicious activities during exams
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={notificationMutation.isPending}
                                  data-testid="switch-proctoringAlerts"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={notificationForm.control}
                          name="weeklyReports"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>Weekly Reports</FormLabel>
                                <FormDescription>
                                  Get weekly performance and analytics reports
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={notificationMutation.isPending}
                                  data-testid="switch-weeklyReports"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={notificationMutation.isPending}
                        className="h-12 px-6"
                        data-testid="button-saveNotifications"
                        aria-busy={notificationMutation.isPending}
                      >
                        {notificationMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Preferences
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {activeTab === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...securityForm}>
                    <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
                      <FormField
                        control={securityForm.control}
                        name="twoFactorAuth"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Two-Factor Authentication</FormLabel>
                              <FormDescription>
                                Add an extra layer of security to your account
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={securityMutation.isPending}
                                data-testid="switch-twoFactorAuth"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={securityForm.control}
                          name="sessionTimeout"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Session Timeout (minutes) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  disabled={securityMutation.isPending}
                                  className="h-12"
                                  data-testid="input-sessionTimeout"
                                />
                              </FormControl>
                              <FormDescription>
                                Between 5 and 1440 minutes
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={securityForm.control}
                          name="passwordExpiry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password Expiry (days) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  disabled={securityMutation.isPending}
                                  className="h-12"
                                  data-testid="input-passwordExpiry"
                                />
                              </FormControl>
                              <FormDescription>
                                Between 30 and 365 days
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={securityForm.control}
                        name="ipWhitelist"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IP Whitelist</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter allowed IP addresses, one per line"
                                {...field}
                                disabled={securityMutation.isPending}
                                className="min-h-24"
                                data-testid="textarea-ipWhitelist"
                              />
                            </FormControl>
                            <FormDescription>
                              Optional: Restrict access to specific IP addresses
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        disabled={securityMutation.isPending}
                        className="h-12 px-6"
                        data-testid="button-saveSecurity"
                        aria-busy={securityMutation.isPending}
                      >
                        {securityMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Update Security
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {activeTab === "appearance" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Palette className="h-5 w-5 mr-2" />
                    Appearance Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Theme</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="cursor-pointer border-2 border-primary" data-testid="theme-system">
                          <CardContent className="p-4 text-center">
                            <Monitor className="h-8 w-8 mx-auto mb-2" />
                            <p className="font-medium">System</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Auto</p>
                          </CardContent>
                        </Card>
                        <Card className="cursor-pointer border-2 border-transparent hover:border-gray-300" data-testid="theme-light">
                          <CardContent className="p-4 text-center">
                            <div className="h-8 w-8 bg-white border rounded mx-auto mb-2" />
                            <p className="font-medium">Light</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Always light</p>
                          </CardContent>
                        </Card>
                        <Card className="cursor-pointer border-2 border-transparent hover:border-gray-300" data-testid="theme-dark">
                          <CardContent className="p-4 text-center">
                            <div className="h-8 w-8 bg-gray-800 rounded mx-auto mb-2" />
                            <p className="font-medium">Dark</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Always dark</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Font Size</h3>
                      <Select defaultValue="medium">
                        <SelectTrigger className="w-48 h-12" data-testid="select-fontSize">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Accessibility</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <p className="font-medium">High Contrast</p>
                            <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
                          </div>
                          <Switch data-testid="switch-highContrast" />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <p className="font-medium">Reduce Motion</p>
                            <p className="text-sm text-muted-foreground">Minimize animations and transitions</p>
                          </div>
                          <Switch data-testid="switch-reduceMotion" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "interface" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Interface Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">AI Assistant</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <p className="font-medium">AI Tooltips</p>
                            <p className="text-sm text-muted-foreground">
                              Show helpful tooltips and guidance from the AI assistant
                            </p>
                            <div className="flex items-center mt-2 space-x-2">
                              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">Alt</kbd>
                              <span className="text-xs">+</span>
                              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">T</kbd>
                              <span className="text-xs text-muted-foreground">Quick toggle</span>
                            </div>
                          </div>
                          <Switch
                            checked={!isTooltipSystemMuted}
                            onCheckedChange={toggleTooltipMute}
                            data-testid="switch-aiTooltips"
                          />
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Tooltip Status</p>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${isTooltipSystemMuted ? 'bg-red-500' : 'bg-green-500'}`} />
                            <span className="text-sm text-muted-foreground">
                              {isTooltipSystemMuted ? 'AI tooltips are disabled' : 'AI tooltips are active'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Floating Controls</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <p className="font-medium">Show Floating Mute Button</p>
                            <p className="text-sm text-muted-foreground">
                              Display floating tooltip mute button in bottom-right corner
                            </p>
                          </div>
                          <Switch defaultChecked data-testid="switch-floatingButton" />
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Reset Options</h3>
                      <div className="space-y-4">
                        <Button 
                          variant="outline"
                          className="h-12 px-6"
                          onClick={() => {
                            localStorage.removeItem('permanentlyDismissedTooltips');
                            toast({
                              title: "Tooltips Reset",
                              description: "All dismissed tooltips have been reset and will show again.",
                              duration: 3000,
                            });
                          }}
                          data-testid="button-resetTooltips"
                        >
                          Reset All Dismissed Tooltips
                        </Button>
                        <p className="text-sm text-muted-foreground">
                          This will make all previously dismissed tooltips appear again
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "system" && user?.role === 'admin' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    System Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...systemForm}>
                    <form onSubmit={systemForm.handleSubmit(onSystemSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={systemForm.control}
                          name="defaultTimeLimit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default Time Limit (minutes) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  disabled={systemMutation.isPending}
                                  className="h-12"
                                  data-testid="input-defaultTimeLimit"
                                />
                              </FormControl>
                              <FormDescription>
                                Must be greater than 0
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={systemForm.control}
                          name="validationStrength"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>AI Validation Strength</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                disabled={systemMutation.isPending}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-12" data-testid="select-validationStrength">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <FormField
                          control={systemForm.control}
                          name="autoSave"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>Auto-save</FormLabel>
                                <FormDescription>
                                  Automatically save progress during exams
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={systemMutation.isPending}
                                  data-testid="switch-autoSave"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={systemForm.control}
                          name="aiValidation"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>AI Question Validation</FormLabel>
                                <FormDescription>
                                  Enable automatic question validation using AI
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={systemMutation.isPending}
                                  data-testid="switch-aiValidation"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={systemForm.control}
                          name="analyticsTracking"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>Analytics Tracking</FormLabel>
                                <FormDescription>
                                  Collect usage analytics for improvement
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={systemMutation.isPending}
                                  data-testid="switch-analyticsTracking"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={systemMutation.isPending}
                        className="h-12 px-6"
                        data-testid="button-saveSystem"
                        aria-busy={systemMutation.isPending}
                      >
                        {systemMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save System Settings
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {activeTab === "exam-references" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Exam References
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ExamReferencesManager />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
