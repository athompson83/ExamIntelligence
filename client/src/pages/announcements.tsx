import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Megaphone, Pin, Eye, EyeOff, Calendar, Users, Send, Globe, User, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Types for announcements
interface Announcement {
  id: string;
  title: string;
  content: string;
  announcementType: "general" | "maintenance" | "update" | "emergency" | "academic";
  priority: "low" | "medium" | "high" | "urgent";
  targetAudience: "all" | "students" | "teachers" | "admins" | "custom";
  targetRoles: string[];
  targetAccounts: string[];
  isPinned: boolean;
  isPublished: boolean;
  publishAt: Date | null;
  expiresAt: Date | null;
  allowComments: boolean;
  requireAcknowledgment: boolean;
  attachments: string[];
  createdBy: string;
  accountId: string;
  viewCount: number;
  acknowledgmentCount: number;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: string;
    email: string;
    role: string;
  };
  acknowledgments?: AnnouncementAcknowledgment[];
}

interface AnnouncementAcknowledgment {
  id: string;
  announcementId: string;
  userId: string;
  acknowledgedAt: Date;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

interface AnnouncementView {
  id: string;
  announcementId: string;
  userId: string;
  viewedAt: Date;
  ipAddress: string | null;
}

// Form schemas
const announcementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(1, "Content is required").max(10000, "Content too long"),
  announcementType: z.enum(["general", "maintenance", "update", "emergency", "academic"]),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  targetAudience: z.enum(["all", "students", "teachers", "admins", "custom"]).default("all"),
  targetRoles: z.array(z.string()).default([]),
  targetAccounts: z.array(z.string()).default([]),
  isPinned: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  publishAt: z.date().nullable().default(null),
  expiresAt: z.date().nullable().default(null),
  allowComments: z.boolean().default(true),
  requireAcknowledgment: z.boolean().default(false),
});

type AnnouncementForm = z.infer<typeof announcementSchema>;

export default function AnnouncementsPage() {
  const [activeTab, setActiveTab] = useState("published");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AnnouncementForm>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      announcementType: "general",
      priority: "medium",
      targetAudience: "all",
      targetRoles: [],
      targetAccounts: [],
      isPinned: false,
      isPublished: true,
      publishAt: null,
      expiresAt: null,
      allowComments: true,
      requireAcknowledgment: false,
    },
  });

  // Fetch announcements
  const { data: announcements, isLoading } = useQuery({
    queryKey: ["/api/announcements"],
    queryFn: () => apiRequest("GET", "/api/announcements"),
  });

  // Fetch user's announcements
  const { data: myAnnouncements } = useQuery({
    queryKey: ["/api/announcements", "my"],
    queryFn: () => apiRequest("GET", "/api/announcements/my"),
  });

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: () => apiRequest("GET", "/api/auth/user"),
  });

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: (data: AnnouncementForm) =>
      apiRequest("POST", "/api/announcements", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      setIsCreateDialogOpen(false);
      setEditingAnnouncement(null);
      form.reset();
      toast({
        title: "Announcement Created",
        description: "Your announcement has been published successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create announcement",
        variant: "destructive",
      });
    },
  });

  // Update announcement mutation
  const updateAnnouncementMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AnnouncementForm> }) =>
      apiRequest("PATCH", `/api/announcements/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      setIsCreateDialogOpen(false);
      setEditingAnnouncement(null);
      form.reset();
      toast({
        title: "Announcement Updated",
        description: "Announcement has been updated successfully",
      });
    },
  });

  // Delete announcement mutation
  const deleteAnnouncementMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/announcements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({
        title: "Announcement Deleted",
        description: "Announcement has been deleted successfully",
      });
    },
  });

  // Pin/unpin announcement mutation
  const togglePinMutation = useMutation({
    mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) =>
      apiRequest("PATCH", `/api/announcements/${id}/pin`, { isPinned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({
        title: "Announcement Updated",
        description: "Pin status has been updated",
      });
    },
  });

  // Acknowledge announcement mutation
  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/announcements/${id}/acknowledge`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({
        title: "Acknowledged",
        description: "Announcement has been acknowledged",
      });
    },
  });

  const handleSubmit = (data: AnnouncementForm) => {
    if (editingAnnouncement) {
      updateAnnouncementMutation.mutate({ id: editingAnnouncement.id, data });
    } else {
      createAnnouncementMutation.mutate(data);
    }
  };

  const openCreateDialog = () => {
    setEditingAnnouncement(null);
    form.reset();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    form.reset({
      title: announcement.title,
      content: announcement.content,
      announcementType: announcement.announcementType,
      priority: announcement.priority,
      targetAudience: announcement.targetAudience,
      targetRoles: announcement.targetRoles,
      targetAccounts: announcement.targetAccounts,
      isPinned: announcement.isPinned,
      isPublished: announcement.isPublished,
      publishAt: announcement.publishAt ? new Date(announcement.publishAt) : null,
      expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt) : null,
      allowComments: announcement.allowComments,
      requireAcknowledgment: announcement.requireAcknowledgment,
    });
    setIsCreateDialogOpen(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "emergency": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "maintenance": return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "update": return <Send className="h-4 w-4 text-blue-500" />;
      case "academic": return <Users className="h-4 w-4 text-green-500" />;
      default: return <Megaphone className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case "all": return <Globe className="h-4 w-4" />;
      case "students": return <User className="h-4 w-4" />;
      case "teachers": return <Users className="h-4 w-4" />;
      case "admins": return <Users className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const filteredAnnouncements = (announcementList: Announcement[] | undefined) => {
    if (!announcementList) return [];
    
    return announcementList.filter(announcement => {
      const matchesType = filterType === "all" || announcement.announcementType === filterType;
      const matchesPriority = filterPriority === "all" || announcement.priority === filterPriority;
      return matchesType && matchesPriority;
    });
  };

  const canCreateAnnouncements = user?.role === "teacher" || user?.role === "admin" || user?.role === "super_admin";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">
            {canCreateAnnouncements 
              ? "Create and manage announcements for your users"
              : "View important announcements and updates"
            }
          </p>
        </div>
        {canCreateAnnouncements && (
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="published">Published</TabsTrigger>
          {canCreateAnnouncements && <TabsTrigger value="my-announcements">My Announcements</TabsTrigger>}
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
        </TabsList>

        <TabsContent value="published" className="space-y-6">
          {/* Filters */}
          <div className="flex gap-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Published Announcements */}
          <div className="grid gap-4">
            {isLoading ? (
              <div className="text-center py-8">Loading announcements...</div>
            ) : filteredAnnouncements(announcements).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No announcements found</h3>
                  <p className="text-muted-foreground text-center">
                    There are no published announcements matching your filters.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredAnnouncements(announcements)
                .sort((a, b) => {
                  // Sort by pinned first, then by creation date
                  if (a.isPinned && !b.isPinned) return -1;
                  if (!a.isPinned && b.isPinned) return 1;
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                })
                .map((announcement: Announcement) => (
                  <Card key={announcement.id} className={announcement.isPinned ? "border-primary" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {announcement.isPinned && <Pin className="h-4 w-4 text-primary" />}
                          {getTypeIcon(announcement.announcementType)}
                          <div>
                            <h3 className="font-semibold">{announcement.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              By {announcement.author?.email} • {new Date(announcement.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getPriorityColor(announcement.priority)}>
                            {announcement.priority}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getAudienceIcon(announcement.targetAudience)}
                            {announcement.targetAudience}
                          </Badge>
                          {announcement.requireAcknowledgment && (
                            <Badge variant="secondary">Requires Acknowledgment</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4 line-clamp-3">{announcement.content}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{announcement.viewCount} views</span>
                        </div>
                        {announcement.requireAcknowledgment && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{announcement.acknowledgmentCount} acknowledged</span>
                          </div>
                        )}
                        {announcement.expiresAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Expires {new Date(announcement.expiresAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        {announcement.requireAcknowledgment && !announcement.acknowledgments?.some(ack => ack.userId === user?.id) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => acknowledgeMutation.mutate(announcement.id)}
                          >
                            Acknowledge
                          </Button>
                        )}
                        
                        {canCreateAnnouncements && announcement.createdBy === user?.id && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(announcement)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => togglePinMutation.mutate({ id: announcement.id, isPinned: !announcement.isPinned })}
                            >
                              <Pin className="h-4 w-4 mr-2" />
                              {announcement.isPinned ? "Unpin" : "Pin"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>

        {canCreateAnnouncements && (
          <TabsContent value="my-announcements" className="space-y-6">
            {/* My Announcements */}
            <div className="grid gap-4">
              {myAnnouncements && myAnnouncements.length > 0 ? (
                myAnnouncements.map((announcement: Announcement) => (
                  <Card key={announcement.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(announcement.announcementType)}
                          <div>
                            <h3 className="font-semibold">{announcement.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              Created {new Date(announcement.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={announcement.isPublished ? "default" : "secondary"}>
                            {announcement.isPublished ? "Published" : "Draft"}
                          </Badge>
                          <Badge variant={getPriorityColor(announcement.priority)}>
                            {announcement.priority}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4 line-clamp-2">{announcement.content}</p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(announcement)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No announcements created</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      You haven't created any announcements yet.
                    </p>
                    <Button onClick={openCreateDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Announcement
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}

        <TabsContent value="drafts" className="space-y-6">
          {/* Draft Announcements */}
          <div className="grid gap-4">
            {myAnnouncements?.filter((a: Announcement) => !a.isPublished).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <EyeOff className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No drafts found</h3>
                  <p className="text-muted-foreground text-center">
                    You don't have any draft announcements.
                  </p>
                </CardContent>
              </Card>
            ) : (
              myAnnouncements?.filter((a: Announcement) => !a.isPublished).map((announcement: Announcement) => (
                <Card key={announcement.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(announcement.announcementType)}
                        <div>
                          <h3 className="font-semibold">{announcement.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Draft created {new Date(announcement.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">Draft</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4 line-clamp-2">{announcement.content}</p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(announcement)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Draft
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateAnnouncementMutation.mutate({ 
                          id: announcement.id, 
                          data: { isPublished: true } 
                        })}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Publish
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Announcement Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? "Edit Announcement" : "Create New Announcement"}
            </DialogTitle>
            <DialogDescription>
              Share important information with your users
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Announcement title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="announcementType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="update">Update</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                          <SelectItem value="academic">Academic</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write your announcement content here..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="targetAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Audience</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="students">Students Only</SelectItem>
                          <SelectItem value="teachers">Teachers Only</SelectItem>
                          <SelectItem value="admins">Admins Only</SelectItem>
                          <SelectItem value="custom">Custom Selection</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expires At (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          value={field.value ? field.value.toISOString().slice(0, 16) : ""}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormDescription>Leave empty for no expiration</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <h3 className="font-medium">Settings</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="isPinned"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Pin Announcement</FormLabel>
                          <FormDescription>Show at the top of the list</FormDescription>
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
                    control={form.control}
                    name="requireAcknowledgment"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Require Acknowledgment</FormLabel>
                          <FormDescription>Users must acknowledge reading</FormDescription>
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
                    control={form.control}
                    name="allowComments"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Allow Comments</FormLabel>
                          <FormDescription>Users can comment on this announcement</FormDescription>
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
                    control={form.control}
                    name="isPublished"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Publish Immediately</FormLabel>
                          <FormDescription>Make visible to users now</FormDescription>
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
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending}
                >
                  {editingAnnouncement ? "Update" : "Create"} Announcement
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}