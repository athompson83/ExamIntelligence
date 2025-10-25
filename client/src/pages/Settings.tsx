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
  User as UserIcon, 
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
  Save,
  Check,
  Moon,
  Sun
} from "lucide-react";
import ExamReferencesManager from '@/components/ExamReferencesManager';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { User } from "@/types";

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
  const [theme, setTheme] = useState("light");
  
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
      firstName: (user as User)?.firstName || "",
      lastName: (user as User)?.lastName || "",
      email: (user as User)?.email || "",
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
      await apiRequest("/api/settings/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
        className: "bg-gradient-to-r from-green-600 to-green-500 text-white border-0",
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
      await apiRequest("/api/settings/notifications", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notification preferences updated successfully",
        className: "bg-gradient-to-r from-green-600 to-green-500 text-white border-0",
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
      await apiRequest("/api/settings/security", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Security settings updated successfully",
        className: "bg-gradient-to-r from-green-600 to-green-500 text-white border-0",
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
      await apiRequest("/api/settings/system", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "System preferences updated successfully",
        className: "bg-gradient-to-r from-green-600 to-green-500 text-white border-0",
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
        <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center shadow-lg">
            <SettingsIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account and preferences</p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-gray-100 dark:bg-gray-800 p-2 rounded-2xl h-auto">
            <TabsTrigger 
              value="profile" 
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
              data-testid="nav-profile"
            >
              <UserIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notifications"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
              data-testid="nav-notifications"
            >
              <Bell className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger 
              value="security"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
              data-testid="nav-security"
            >
              <Shield className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger 
              value="appearance"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
              data-testid="nav-appearance"
            >
              <Palette className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            {(user as User)?.role === 'admin' && (
              <TabsTrigger 
                value="system"
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                data-testid="nav-system"
              >
                <Database className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">System</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                <Card className="rounded-2xl shadow-lg border-0 overflow-hidden hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-b p-6">
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <CardTitle className="text-xl font-semibold">Personal Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">First Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="h-14 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all duration-300"
                                placeholder="Enter your first name"
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
                            <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Last Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="h-14 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all duration-300"
                                placeholder="Enter your last name"
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
                          <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="email"
                              className="h-14 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all duration-300"
                              placeholder="your.email@example.com"
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
                          <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bio</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              className="min-h-[100px] rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all duration-300"
                              placeholder="Tell us about yourself..."
                              data-testid="textarea-bio"
                            />
                          </FormControl>
                          <FormDescription>
                            Brief description for your profile. Maximum 500 characters.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-lg border-0 overflow-hidden hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-b p-6">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <CardTitle className="text-xl font-semibold">Preferences</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="timezone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Timezone</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-14 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900" data-testid="select-timezone">
                                  <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-2xl shadow-2xl">
                                <SelectItem value="UTC" className="rounded-xl">UTC</SelectItem>
                                <SelectItem value="EST" className="rounded-xl">Eastern Time</SelectItem>
                                <SelectItem value="PST" className="rounded-xl">Pacific Time</SelectItem>
                                <SelectItem value="CST" className="rounded-xl">Central Time</SelectItem>
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
                            <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Language</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-14 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900" data-testid="select-language">
                                  <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-2xl shadow-2xl">
                                <SelectItem value="en" className="rounded-xl">English</SelectItem>
                                <SelectItem value="es" className="rounded-xl">Spanish</SelectItem>
                                <SelectItem value="fr" className="rounded-xl">French</SelectItem>
                                <SelectItem value="de" className="rounded-xl">German</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Button
                  type="submit"
                  disabled={profileMutation.isPending}
                  className="w-full md:w-auto h-12 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-xl hover:scale-105 transition-all duration-300 text-white font-semibold shadow-lg"
                  data-testid="button-saveProfile"
                >
                  {profileMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Form {...notificationForm}>
              <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                <Card className="rounded-2xl shadow-lg border-0 overflow-hidden hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950 dark:to-teal-950 border-b p-6">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <CardTitle className="text-xl font-semibold">Email Notifications</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <FormField
                      control={notificationForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-xl p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                          <div className="space-y-1">
                            <FormLabel className="text-base font-medium">Email Notifications</FormLabel>
                            <FormDescription>Receive notifications via email</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-emailNotifications" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={notificationForm.control}
                      name="examAlerts"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-xl p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                          <div className="space-y-1">
                            <FormLabel className="text-base font-medium">Exam Alerts</FormLabel>
                            <FormDescription>Get notified about upcoming exams</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-examAlerts" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={notificationForm.control}
                      name="proctoringAlerts"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-xl p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                          <div className="space-y-1">
                            <FormLabel className="text-base font-medium">Proctoring Alerts</FormLabel>
                            <FormDescription>Real-time proctoring notifications</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-proctoringAlerts" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-lg border-0 overflow-hidden hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border-b p-6">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <CardTitle className="text-xl font-semibold">System Notifications</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <FormField
                      control={notificationForm.control}
                      name="systemUpdates"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-xl p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                          <div className="space-y-1">
                            <FormLabel className="text-base font-medium">System Updates</FormLabel>
                            <FormDescription>Platform updates and announcements</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-systemUpdates" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={notificationForm.control}
                      name="weeklyReports"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-xl p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                          <div className="space-y-1">
                            <FormLabel className="text-base font-medium">Weekly Reports</FormLabel>
                            <FormDescription>Summary of your weekly activity</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-weeklyReports" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={notificationForm.control}
                      name="instantMessages"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-xl p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                          <div className="space-y-1">
                            <FormLabel className="text-base font-medium">Instant Messages</FormLabel>
                            <FormDescription>Direct messages from team members</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-instantMessages" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Button
                  type="submit"
                  disabled={notificationMutation.isPending}
                  className="w-full md:w-auto h-12 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-xl hover:scale-105 transition-all duration-300 text-white font-semibold shadow-lg"
                  data-testid="button-saveNotifications"
                >
                  {notificationMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Form {...securityForm}>
              <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
                <Card className="rounded-2xl shadow-lg border-0 overflow-hidden hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 border-b p-6">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <CardTitle className="text-xl font-semibold">Authentication</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <FormField
                      control={securityForm.control}
                      name="twoFactorAuth"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-xl p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                          <div className="space-y-1">
                            <FormLabel className="text-base font-medium">Two-Factor Authentication</FormLabel>
                            <FormDescription>Add an extra layer of security</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-twoFactorAuth" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-lg border-0 overflow-hidden hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-b p-6">
                    <div className="flex items-center gap-3">
                      <Key className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      <CardTitle className="text-xl font-semibold">Session Management</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <FormField
                      control={securityForm.control}
                      name="sessionTimeout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Session Timeout (minutes)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              min="5"
                              max="1440"
                              className="h-14 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all duration-300"
                              data-testid="input-sessionTimeout"
                            />
                          </FormControl>
                          <FormDescription>
                            How long before your session expires (5-1440 minutes)
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
                          <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Password Expiry (days)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              min="30"
                              max="365"
                              className="h-14 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all duration-300"
                              data-testid="input-passwordExpiry"
                            />
                          </FormControl>
                          <FormDescription>
                            Days until password reset is required (30-365 days)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={securityForm.control}
                      name="ipWhitelist"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">IP Whitelist</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Enter IP addresses, one per line"
                              className="min-h-[100px] rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all duration-300"
                              data-testid="textarea-ipWhitelist"
                            />
                          </FormControl>
                          <FormDescription>
                            Restrict access to specific IP addresses (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Button
                  type="submit"
                  disabled={securityMutation.isPending}
                  className="w-full md:w-auto h-12 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-xl hover:scale-105 transition-all duration-300 text-white font-semibold shadow-lg"
                  data-testid="button-saveSecurity"
                >
                  {securityMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Update Security
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card className="rounded-2xl shadow-lg border-0 overflow-hidden hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950 border-b p-6">
                <div className="flex items-center gap-3">
                  <Palette className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  <CardTitle className="text-xl font-semibold">Theme</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                      theme === 'light' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-lg scale-105' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-md'
                    }`}
                    data-testid="theme-light"
                  >
                    <Sun className="h-8 w-8 mx-auto mb-3 text-yellow-500" />
                    <p className="font-semibold">Light</p>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                      theme === 'dark' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-lg scale-105' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-md'
                    }`}
                    data-testid="theme-dark"
                  >
                    <Moon className="h-8 w-8 mx-auto mb-3 text-indigo-500" />
                    <p className="font-semibold">Dark</p>
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                      theme === 'system' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-lg scale-105' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-md'
                    }`}
                    data-testid="theme-system"
                  >
                    <Monitor className="h-8 w-8 mx-auto mb-3 text-gray-500" />
                    <p className="font-semibold">System</p>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-lg border-0 overflow-hidden hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950 dark:to-rose-950 border-b p-6">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                  <CardTitle className="text-xl font-semibold">AI Assistant</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between rounded-xl p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  <div className="space-y-1">
                    <div className="text-base font-medium">AI Tooltips</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Show contextual AI assistance hints</p>
                  </div>
                  <Switch
                    checked={!isTooltipSystemMuted}
                    onCheckedChange={toggleTooltipMute}
                    data-testid="switch-aiTooltips"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab (Admin Only) */}
          {(user as User)?.role === 'admin' && (
            <TabsContent value="system" className="space-y-6">
              <Form {...systemForm}>
                <form onSubmit={systemForm.handleSubmit(onSystemSubmit)} className="space-y-6">
                  <Card className="rounded-2xl shadow-lg border-0 overflow-hidden hover:shadow-xl transition-all duration-300">
                    <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 border-b p-6">
                      <div className="flex items-center gap-3">
                        <Database className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                        <CardTitle className="text-xl font-semibold">Default Settings</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <FormField
                        control={systemForm.control}
                        name="defaultTimeLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Default Time Limit (minutes)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                min="1"
                                className="h-14 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all duration-300"
                                data-testid="input-defaultTimeLimit"
                              />
                            </FormControl>
                            <FormDescription>
                              Default time limit for new quizzes
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={systemForm.control}
                        name="autoSave"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-xl p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                            <div className="space-y-1">
                              <FormLabel className="text-base font-medium">Auto-Save</FormLabel>
                              <FormDescription>Automatically save progress</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-autoSave" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={systemForm.control}
                        name="validationStrength"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Validation Strength</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-14 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900" data-testid="select-validationStrength">
                                  <SelectValue placeholder="Select strength" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-2xl shadow-2xl">
                                <SelectItem value="low" className="rounded-xl">Low</SelectItem>
                                <SelectItem value="medium" className="rounded-xl">Medium</SelectItem>
                                <SelectItem value="high" className="rounded-xl">High</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl shadow-lg border-0 overflow-hidden hover:shadow-xl transition-all duration-300">
                    <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950 border-b p-6">
                      <div className="flex items-center gap-3">
                        <Monitor className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                        <CardTitle className="text-xl font-semibold">Advanced Features</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <FormField
                        control={systemForm.control}
                        name="aiValidation"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-xl p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                            <div className="space-y-1">
                              <FormLabel className="text-base font-medium">AI Validation</FormLabel>
                              <FormDescription>Use AI for answer validation</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-aiValidation" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={systemForm.control}
                        name="analyticsTracking"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-xl p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                            <div className="space-y-1">
                              <FormLabel className="text-base font-medium">Analytics Tracking</FormLabel>
                              <FormDescription>Track detailed analytics data</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-analyticsTracking" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Button
                    type="submit"
                    disabled={systemMutation.isPending}
                    className="w-full md:w-auto h-12 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-xl hover:scale-105 transition-all duration-300 text-white font-semibold shadow-lg"
                    data-testid="button-saveSystem"
                  >
                    {systemMutation.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          )}
        </Tabs>

        {/* Exam References Section */}
        <Card className="rounded-2xl shadow-lg border-0 overflow-hidden hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 border-b p-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-xl font-semibold">Exam Reference Materials</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ExamReferencesManager />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
