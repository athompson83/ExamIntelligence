import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, MessageSquare, Phone, Settings, Shield, User, Users, GraduationCap, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Types for notification settings
interface NotificationSettings {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  inAppNotifications: boolean;
  digestFrequency: "realtime" | "daily" | "weekly" | "never";
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  preferences: {
    // Assignment notifications
    newAssignments: boolean;
    assignmentDue: boolean;
    assignmentCompleted: boolean;
    assignmentGraded: boolean;
    assignmentReminders: boolean;
    
    // Quiz notifications
    quizAssigned: boolean;
    quizCompleted: boolean;
    quizGraded: boolean;
    quizAttemptStarted: boolean;
    quizResults: boolean;
    
    // Learning notifications
    studyGuideReady: boolean;
    learningPlanUpdated: boolean;
    badgeEarned: boolean;
    certificateIssued: boolean;
    
    // Administrative notifications
    announcements: boolean;
    systemUpdates: boolean;
    maintenanceAlerts: boolean;
    securityAlerts: boolean;
    
    // Teaching/Admin specific
    studentProgress: boolean;
    flaggedQuestions: boolean;
    proctoringAlerts: boolean;
    bulkOperations: boolean;
    reportGeneration: boolean;
    
    // Student specific
    upcomingDeadlines: boolean;
    studyReminders: boolean;
    performanceInsights: boolean;
    socialUpdates: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface NotificationChannel {
  id: string;
  name: string;
  type: "email" | "push" | "sms" | "in_app";
  enabled: boolean;
  settings: {
    address?: string;
    deviceToken?: string;
    phoneNumber?: string;
  };
}

export default function NotificationSettingsPage() {
  const [activeTab, setActiveTab] = useState("preferences");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notification settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/notification-settings"],
    queryFn: () => apiRequest("GET", "/api/notification-settings"),
  });

  // Fetch notification channels
  const { data: channels } = useQuery({
    queryKey: ["/api/notification-channels"],
    queryFn: () => apiRequest("GET", "/api/notification-channels"),
  });

  // Fetch user role for conditional rendering
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: () => apiRequest("GET", "/api/auth/user"),
  });

  // Update notification settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<NotificationSettings>) =>
      apiRequest("PATCH", "/api/notification-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-settings"] });
      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update notification settings",
        variant: "destructive",
      });
    },
  });

  // Update notification channel mutation
  const updateChannelMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NotificationChannel> }) =>
      apiRequest("PATCH", `/api/notification-channels/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-channels"] });
      toast({
        title: "Channel Updated",
        description: "Notification channel settings have been updated",
      });
    },
  });

  // Test notification mutation
  const testNotificationMutation = useMutation({
    mutationFn: (channelType: string) =>
      apiRequest("POST", "/api/test-notification", { channelType }),
    onSuccess: () => {
      toast({
        title: "Test Sent",
        description: "Test notification has been sent",
      });
    },
  });

  const handlePreferenceChange = (key: string, value: boolean) => {
    if (!settings) return;
    
    updateSettingsMutation.mutate({
      preferences: {
        ...settings.preferences,
        [key]: value,
      },
    });
  };

  const handleChannelToggle = (channelType: string, enabled: boolean) => {
    updateSettingsMutation.mutate({
      [channelType]: enabled,
    });
  };

  const handleDigestFrequencyChange = (frequency: string) => {
    updateSettingsMutation.mutate({
      digestFrequency: frequency as "realtime" | "daily" | "weekly" | "never",
    });
  };

  const getNotificationCategories = () => {
    const userRole = user?.role || "student";
    
    const categories = [
      {
        id: "assignments",
        title: "Assignments",
        icon: <BookOpen className="h-5 w-5" />,
        description: "Assignment-related notifications",
        preferences: [
          { key: "newAssignments", label: "New assignments", roles: ["student"] },
          { key: "assignmentDue", label: "Assignment due reminders", roles: ["student"] },
          { key: "assignmentCompleted", label: "Assignment completions", roles: ["teacher", "admin"] },
          { key: "assignmentGraded", label: "Assignment graded", roles: ["student"] },
          { key: "assignmentReminders", label: "Reminder notifications", roles: ["student"] },
        ],
      },
      {
        id: "quizzes",
        title: "Quizzes & Exams",
        icon: <GraduationCap className="h-5 w-5" />,
        description: "Quiz and exam notifications",
        preferences: [
          { key: "quizAssigned", label: "Quiz assigned", roles: ["student"] },
          { key: "quizCompleted", label: "Quiz completed", roles: ["teacher", "admin"] },
          { key: "quizGraded", label: "Quiz graded", roles: ["student"] },
          { key: "quizAttemptStarted", label: "Quiz attempt started", roles: ["teacher", "admin"] },
          { key: "quizResults", label: "Quiz results available", roles: ["student"] },
        ],
      },
      {
        id: "learning",
        title: "Learning & Progress",
        icon: <User className="h-5 w-5" />,
        description: "Learning-related notifications",
        preferences: [
          { key: "studyGuideReady", label: "Study guide ready", roles: ["student"] },
          { key: "learningPlanUpdated", label: "Learning plan updated", roles: ["student"] },
          { key: "badgeEarned", label: "Badge earned", roles: ["student"] },
          { key: "certificateIssued", label: "Certificate issued", roles: ["student"] },
          { key: "performanceInsights", label: "Performance insights", roles: ["student"] },
          { key: "studyReminders", label: "Study reminders", roles: ["student"] },
        ],
      },
      {
        id: "administrative",
        title: "Administrative",
        icon: <Shield className="h-5 w-5" />,
        description: "System and administrative notifications",
        preferences: [
          { key: "announcements", label: "Announcements", roles: ["all"] },
          { key: "systemUpdates", label: "System updates", roles: ["all"] },
          { key: "maintenanceAlerts", label: "Maintenance alerts", roles: ["all"] },
          { key: "securityAlerts", label: "Security alerts", roles: ["all"] },
        ],
      },
    ];

    // Add teacher/admin specific categories
    if (["teacher", "admin", "super_admin"].includes(userRole)) {
      categories.push({
        id: "teaching",
        title: "Teaching & Management",
        icon: <Users className="h-5 w-5" />,
        description: "Teaching and management notifications",
        preferences: [
          { key: "studentProgress", label: "Student progress updates", roles: ["teacher", "admin"] },
          { key: "flaggedQuestions", label: "Flagged questions", roles: ["teacher", "admin"] },
          { key: "proctoringAlerts", label: "Proctoring alerts", roles: ["teacher", "admin"] },
          { key: "bulkOperations", label: "Bulk operation completion", roles: ["teacher", "admin"] },
          { key: "reportGeneration", label: "Report generation", roles: ["teacher", "admin"] },
        ],
      });
    }

    return categories.filter(category => 
      category.preferences.some(pref => 
        pref.roles.includes("all") || pref.roles.includes(userRole)
      )
    );
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "email": return <Mail className="h-4 w-4" />;
      case "push": return <Bell className="h-4 w-4" />;
      case "sms": return <Phone className="h-4 w-4" />;
      case "in_app": return <MessageSquare className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading notification settings...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification Settings</h1>
          <p className="text-muted-foreground">
            Manage how and when you receive notifications
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => testNotificationMutation.mutate("email")}
          disabled={testNotificationMutation.isPending}
        >
          <Bell className="h-4 w-4 mr-2" />
          Test Notifications
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-6">
          {/* Notification Categories */}
          <div className="grid gap-6">
            {getNotificationCategories().map((category) => {
              const userRole = user?.role || "student";
              const filteredPreferences = category.preferences.filter(pref =>
                pref.roles.includes("all") || pref.roles.includes(userRole)
              );

              return (
                <Card key={category.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      {category.icon}
                      <div>
                        <CardTitle>{category.title}</CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {filteredPreferences.map((preference) => (
                        <div key={preference.key} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{preference.label}</p>
                          </div>
                          <Switch
                            checked={settings?.preferences?.[preference.key] || false}
                            onCheckedChange={(checked) => handlePreferenceChange(preference.key, checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="channels" className="space-y-6">
          {/* Notification Channels */}
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
                <CardDescription>
                  Configure how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings?.emailNotifications || false}
                    onCheckedChange={(checked) => handleChannelToggle("emailNotifications", checked)}
                  />
                </div>

                <Separator />

                {/* Push Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive browser push notifications
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings?.pushNotifications || false}
                    onCheckedChange={(checked) => handleChannelToggle("pushNotifications", checked)}
                  />
                </div>

                <Separator />

                {/* In-App Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium">In-App Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Show notifications within the application
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings?.inAppNotifications || false}
                    onCheckedChange={(checked) => handleChannelToggle("inAppNotifications", checked)}
                  />
                </div>

                <Separator />

                {/* SMS Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via text message
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings?.smsNotifications || false}
                    onCheckedChange={(checked) => handleChannelToggle("smsNotifications", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Digest Frequency */}
            <Card>
              <CardHeader>
                <CardTitle>Digest Frequency</CardTitle>
                <CardDescription>
                  How often you want to receive notification summaries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={settings?.digestFrequency || "daily"}
                  onValueChange={handleDigestFrequencyChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="daily">Daily digest</SelectItem>
                    <SelectItem value="weekly">Weekly digest</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          {/* Quiet Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Quiet Hours</CardTitle>
              <CardDescription>
                Set times when you don't want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">Enable quiet hours</p>
                <Switch
                  checked={settings?.quietHours?.enabled || false}
                  onCheckedChange={(checked) => 
                    updateSettingsMutation.mutate({
                      quietHours: {
                        ...settings?.quietHours,
                        enabled: checked,
                      },
                    })
                  }
                />
              </div>

              {settings?.quietHours?.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Start time</label>
                    <Select
                      value={settings?.quietHours?.startTime || "22:00"}
                      onValueChange={(time) =>
                        updateSettingsMutation.mutate({
                          quietHours: {
                            ...settings?.quietHours,
                            startTime: time,
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0');
                          return (
                            <SelectItem key={hour} value={`${hour}:00`}>
                              {hour}:00
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">End time</label>
                    <Select
                      value={settings?.quietHours?.endTime || "08:00"}
                      onValueChange={(time) =>
                        updateSettingsMutation.mutate({
                          quietHours: {
                            ...settings?.quietHours,
                            endTime: time,
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0');
                          return (
                            <SelectItem key={hour} value={`${hour}:00`}>
                              {hour}:00
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle>Deadline Reminders</CardTitle>
              <CardDescription>
                Configure when to receive deadline reminders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Upcoming deadlines (24 hours)</p>
                  <Switch
                    checked={settings?.preferences?.upcomingDeadlines || false}
                    onCheckedChange={(checked) => handlePreferenceChange("upcomingDeadlines", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-medium">Study reminders</p>
                  <Switch
                    checked={settings?.preferences?.studyReminders || false}
                    onCheckedChange={(checked) => handlePreferenceChange("studyReminders", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}