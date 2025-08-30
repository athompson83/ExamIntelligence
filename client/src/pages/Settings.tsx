import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
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
  BookOpen
} from "lucide-react";
import ExamReferencesManager from '@/components/ExamReferencesManager';
import { useForm } from "react-hook-form";
export default function Settings() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Simple tooltip mute state without hook
  const [isTooltipSystemMuted, setIsTooltipSystemMuted] = useState(() => {
    return localStorage.getItem('tooltipSystemMuted') === 'true';
  });
  
  const toggleTooltipMute = () => {
    const newMutedState = !isTooltipSystemMuted;
    setIsTooltipSystemMuted(newMutedState);
    localStorage.setItem('tooltipSystemMuted', newMutedState.toString());
    
    // Show toast notification
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

  const profileForm = useForm({
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      bio: "",
      timezone: "UTC",
      language: "en",
    },
  });

  const notificationForm = useForm({
    defaultValues: {
      emailNotifications: true,
      examAlerts: true,
      proctoringAlerts: true,
      systemUpdates: false,
      weeklyReports: true,
      instantMessages: true,
    },
  });

  const securityForm = useForm({
    defaultValues: {
      twoFactorAuth: false,
      sessionTimeout: "30",
      passwordExpiry: "90",
      ipWhitelist: "",
    },
  });

  const systemForm = useForm({
    defaultValues: {
      defaultTimeLimit: "60",
      autoSave: true,
      validationStrength: "medium",
      proctoringSettings: "standard",
      aiValidation: true,
      analyticsTracking: true,
    },
  });

  const onProfileSubmit = (data: any) => {
    toast({
      title: "Success",
      description: "Profile updated successfully",
    });
  };

  const onNotificationSubmit = (data: any) => {
    toast({
      title: "Success",
      description: "Notification preferences updated",
    });
  };

  const onSecuritySubmit = (data: any) => {
    toast({
      title: "Success",
      description: "Security settings updated",
    });
  };

  const onSystemSubmit = (data: any) => {
    toast({
      title: "Success",
      description: "System preferences updated",
    });
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
        {/* Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white break-words">Settings</h1>
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 mt-1">
              Manage your account preferences and application settings
            </p>
          </div>
        </div>

        {/* Settings Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 overflow-hidden">
          {/* Settings Navigation */}
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
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
                <Button
                  variant={activeTab === "notifications" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("notifications")}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>
                <Button
                  variant={activeTab === "security" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("security")}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Security
                </Button>
                <Button
                  variant={activeTab === "appearance" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("appearance")}
                >
                  <Palette className="h-4 w-4 mr-2" />
                  Appearance
                </Button>
                <Button
                  variant={activeTab === "interface" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("interface")}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Interface
                </Button>
                <Button
                  variant={activeTab === "exam-references" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("exam-references")}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Exam References
                </Button>
                {user?.role === 'admin' && (
                  <Button
                    variant={activeTab === "system" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("system")}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    System
                  </Button>
                )}
                {user?.role === 'super_admin' && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => window.location.href = "/super-admin-settings"}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Super Admin CRM
                  </Button>
                )}
              </nav>
            </CardContent>
          </Card>

          {/* Settings Panels */}
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 overflow-hidden">
                        <FormField
                          control={profileForm.control}
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
                          control={profileForm.control}
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

                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
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
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 overflow-hidden">
                        <FormField
                          control={profileForm.control}
                          name="timezone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Timezone</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
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
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Language</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
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
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button type="submit" className="bg-primary hover:bg-primary/90">
                        Save Changes
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
                            <FormItem className="flex items-center justify-between">
                              <div>
                                <FormLabel>Email Notifications</FormLabel>
                                <FormDescription>
                                  Receive notifications via email
                                </FormDescription>
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

                        <Separator />

                        <FormField
                          control={notificationForm.control}
                          name="examAlerts"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <div>
                                <FormLabel>Exam Alerts</FormLabel>
                                <FormDescription>
                                  Get notified about exam start times and deadlines
                                </FormDescription>
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

                        <FormField
                          control={notificationForm.control}
                          name="proctoringAlerts"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <div>
                                <FormLabel>Proctoring Alerts</FormLabel>
                                <FormDescription>
                                  Receive alerts for suspicious activities during exams
                                </FormDescription>
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

                        <FormField
                          control={notificationForm.control}
                          name="weeklyReports"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <div>
                                <FormLabel>Weekly Reports</FormLabel>
                                <FormDescription>
                                  Get weekly performance and analytics reports
                                </FormDescription>
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
                      </div>

                      <Button type="submit" className="bg-primary hover:bg-primary/90">
                        Save Preferences
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
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Two-Factor Authentication</FormLabel>
                              <FormDescription>
                                Add an extra layer of security to your account
                              </FormDescription>
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

                      <Separator />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 overflow-hidden">
                        <FormField
                          control={securityForm.control}
                          name="sessionTimeout"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Session Timeout (minutes)</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={securityForm.control}
                          name="passwordExpiry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password Expiry (days)</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
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
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="bg-primary hover:bg-primary/90">
                        Update Security
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
                      <h3 className="text-lg font-medium mb-4">Theme</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="cursor-pointer border-2 border-primary">
                          <CardContent className="p-4 text-center">
                            <Monitor className="h-8 w-8 mx-auto mb-2" />
                            <p className="font-medium">System</p>
                            <p className="text-sm text-gray-500">Auto</p>
                          </CardContent>
                        </Card>
                        <Card className="cursor-pointer border-2 border-transparent hover:border-gray-300">
                          <CardContent className="p-4 text-center">
                            <div className="h-8 w-8 bg-white border rounded mx-auto mb-2" />
                            <p className="font-medium">Light</p>
                            <p className="text-sm text-gray-500">Always light</p>
                          </CardContent>
                        </Card>
                        <Card className="cursor-pointer border-2 border-transparent hover:border-gray-300">
                          <CardContent className="p-4 text-center">
                            <div className="h-8 w-8 bg-gray-800 rounded mx-auto mb-2" />
                            <p className="font-medium">Dark</p>
                            <p className="text-sm text-gray-500">Always dark</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-4">Font Size</h3>
                      <Select defaultValue="medium">
                        <SelectTrigger className="w-48">
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
                      <h3 className="text-lg font-medium mb-4">Accessibility</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">High Contrast</p>
                            <p className="text-sm text-gray-500">Increase contrast for better visibility</p>
                          </div>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Reduce Motion</p>
                            <p className="text-sm text-gray-500">Minimize animations and transitions</p>
                          </div>
                          <Switch />
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
                      <h3 className="text-lg font-medium mb-4">AI Assistant</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">AI Tooltips</p>
                            <p className="text-sm text-gray-500">
                              Show helpful tooltips and guidance from the AI assistant
                            </p>
                            <div className="flex items-center mt-2 space-x-2">
                              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Alt</kbd>
                              <span className="text-xs">+</span>
                              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">T</kbd>
                              <span className="text-xs text-gray-500">Quick toggle</span>
                            </div>
                          </div>
                          <Switch
                            checked={!isTooltipSystemMuted}
                            onCheckedChange={toggleTooltipMute}
                          />
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Tooltip Status</p>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${isTooltipSystemMuted ? 'bg-red-500' : 'bg-green-500'}`} />
                            <span className="text-sm text-gray-600">
                              {isTooltipSystemMuted ? 'AI tooltips are disabled' : 'AI tooltips are active'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Floating Controls</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Show Floating Mute Button</p>
                            <p className="text-sm text-gray-500">
                              Display floating tooltip mute button in bottom-right corner
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Reset Options</h3>
                      <div className="space-y-4">
                        <Button 
                          variant="outline"
                          onClick={() => {
                            localStorage.removeItem('permanentlyDismissedTooltips');
                            toast({
                              title: "Tooltips Reset",
                              description: "All dismissed tooltips have been reset and will show again.",
                              duration: 3000,
                            });
                          }}
                        >
                          Reset All Dismissed Tooltips
                        </Button>
                        <p className="text-sm text-gray-500">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 overflow-hidden">
                        <FormField
                          control={systemForm.control}
                          name="defaultTimeLimit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default Time Limit (minutes)</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={systemForm.control}
                          name="validationStrength"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>AI Validation Strength</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <FormField
                          control={systemForm.control}
                          name="autoSave"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <div>
                                <FormLabel>Auto-save</FormLabel>
                                <FormDescription>
                                  Automatically save progress during exams
                                </FormDescription>
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

                        <FormField
                          control={systemForm.control}
                          name="aiValidation"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <div>
                                <FormLabel>AI Question Validation</FormLabel>
                                <FormDescription>
                                  Enable automatic question validation using AI
                                </FormDescription>
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

                        <FormField
                          control={systemForm.control}
                          name="analyticsTracking"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <div>
                                <FormLabel>Analytics Tracking</FormLabel>
                                <FormDescription>
                                  Collect usage analytics for improvement
                                </FormDescription>
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
                      </div>

                      <Button type="submit" className="bg-primary hover:bg-primary/90">
                        Save System Settings
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
