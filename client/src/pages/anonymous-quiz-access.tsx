import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Copy, Plus, Edit, Trash2, Link2, Users, Eye, EyeOff, Shield, Clock, QrCode, Settings, Globe, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Types for anonymous quiz access
interface AnonymousQuizLink {
  id: string;
  quizId: string;
  accessToken: string;
  linkName: string;
  maxAttempts: number;
  currentAttempts: number;
  browserLockdown: boolean;
  allowPrint: boolean;
  allowCopyPaste: boolean;
  allowNavigation: boolean;
  ipRestrictions: string[];
  timeLimit: number | null;
  validFrom: Date | null;
  validUntil: Date | null;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  quiz?: {
    id: string;
    title: string;
    description: string;
  };
}

interface AnonymousQuizAttempt {
  id: string;
  linkId: string;
  quizId: string;
  sessionId: string;
  guestName: string | null;
  guestEmail: string | null;
  startedAt: Date;
  completedAt: Date | null;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  timeSpent: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  browserFingerprint: string | null;
  violationCount: number;
  status: "in_progress" | "completed" | "abandoned" | "flagged";
  createdAt: Date;
}

// Form schemas
const anonymousLinkSchema = z.object({
  quizId: z.string().min(1, "Quiz is required"),
  linkName: z.string().min(1, "Link name is required").max(100, "Link name too long"),
  maxAttempts: z.number().min(1, "Must allow at least 1 attempt").max(10, "Maximum 10 attempts allowed"),
  browserLockdown: z.boolean().default(false),
  allowPrint: z.boolean().default(false),
  allowCopyPaste: z.boolean().default(false),
  allowNavigation: z.boolean().default(false),
  ipRestrictions: z.array(z.string()).default([]),
  timeLimit: z.number().nullable().default(null),
  validFrom: z.date().nullable().default(null),
  validUntil: z.date().nullable().default(null),
  isActive: z.boolean().default(true),
});

type AnonymousLinkForm = z.infer<typeof anonymousLinkSchema>;

export default function AnonymousQuizAccessPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<AnonymousQuizLink | null>(null);
  const [selectedLinkForStats, setSelectedLinkForStats] = useState<AnonymousQuizLink | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AnonymousLinkForm>({
    resolver: zodResolver(anonymousLinkSchema),
    defaultValues: {
      maxAttempts: 1,
      browserLockdown: false,
      allowPrint: false,
      allowCopyPaste: false,
      allowNavigation: false,
      ipRestrictions: [],
      timeLimit: null,
      validFrom: null,
      validUntil: null,
      isActive: true,
    },
  });

  // Fetch anonymous quiz links
  const { data: anonymousLinks, isLoading: loadingLinks } = useQuery({
    queryKey: ["/api/anonymous-quiz-links"],
    queryFn: () => apiRequest("GET", "/api/anonymous-quiz-links"),
  });

  // Fetch quiz attempts for selected link
  const { data: linkAttempts } = useQuery({
    queryKey: ["/api/anonymous-quiz-attempts", selectedLinkForStats?.id],
    queryFn: () => apiRequest("GET", `/api/anonymous-quiz-attempts/${selectedLinkForStats?.id}`),
    enabled: !!selectedLinkForStats,
  });

  // Fetch available quizzes
  const { data: quizzes } = useQuery({
    queryKey: ["/api/quizzes", "published"],
    queryFn: () => apiRequest("GET", "/api/quizzes?status=published"),
  });

  // Create anonymous link mutation
  const createLinkMutation = useMutation({
    mutationFn: (data: AnonymousLinkForm) =>
      apiRequest("POST", "/api/anonymous-quiz-links", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/anonymous-quiz-links"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Anonymous quiz link created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create anonymous quiz link",
        variant: "destructive",
      });
    },
  });

  // Update anonymous link mutation
  const updateLinkMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AnonymousLinkForm> }) =>
      apiRequest("PATCH", `/api/anonymous-quiz-links/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/anonymous-quiz-links"] });
      setIsCreateDialogOpen(false);
      setEditingLink(null);
      form.reset();
      toast({
        title: "Success",
        description: "Anonymous quiz link updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update anonymous quiz link",
        variant: "destructive",
      });
    },
  });

  // Delete anonymous link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/anonymous-quiz-links/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/anonymous-quiz-links"] });
      toast({
        title: "Success",
        description: "Anonymous quiz link deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete anonymous quiz link",
        variant: "destructive",
      });
    },
  });

  // Generate QR code mutation
  const generateQRMutation = useMutation({
    mutationFn: (linkUrl: string) =>
      apiRequest("POST", "/api/generate-qr", { url: linkUrl }),
    onSuccess: (data) => {
      // Handle QR code generation success
      toast({
        title: "Success",
        description: "QR code generated successfully",
      });
    },
  });

  // Handle form submission
  const handleSubmit = (data: AnonymousLinkForm) => {
    if (editingLink) {
      updateLinkMutation.mutate({ id: editingLink.id, data });
    } else {
      createLinkMutation.mutate(data);
    }
  };

  // Copy link to clipboard
  const copyLinkToClipboard = async (accessToken: string) => {
    const fullUrl = `${window.location.origin}/take-quiz/${accessToken}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedToken(accessToken);
      setTimeout(() => setCopiedToken(null), 2000);
      toast({
        title: "Copied!",
        description: "Quiz link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  // Filter and search logic
  const filteredLinks = (anonymousLinks || []).filter((link: AnonymousQuizLink) => {
    const matchesSearch = link.linkName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.quiz?.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && link.isActive) ||
                         (filterStatus === "inactive" && !link.isActive) ||
                         (filterStatus === "expired" && link.validUntil && new Date(link.validUntil) < new Date());
    return matchesSearch && matchesStatus;
  });

  const openCreateDialog = () => {
    setEditingLink(null);
    form.reset();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (link: AnonymousQuizLink) => {
    setEditingLink(link);
    form.reset({
      quizId: link.quizId,
      linkName: link.linkName,
      maxAttempts: link.maxAttempts,
      browserLockdown: link.browserLockdown,
      allowPrint: link.allowPrint,
      allowCopyPaste: link.allowCopyPaste,
      allowNavigation: link.allowNavigation,
      ipRestrictions: link.ipRestrictions,
      timeLimit: link.timeLimit,
      validFrom: link.validFrom ? new Date(link.validFrom) : null,
      validUntil: link.validUntil ? new Date(link.validUntil) : null,
      isActive: link.isActive,
    });
    setIsCreateDialogOpen(true);
  };

  const getStatusBadge = (link: AnonymousQuizLink) => {
    if (!link.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (link.validUntil && new Date(link.validUntil) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (link.currentAttempts >= link.maxAttempts) {
      return <Badge variant="outline">Limit Reached</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const getSecurityLevel = (link: AnonymousQuizLink) => {
    let securityScore = 0;
    if (link.browserLockdown) securityScore += 2;
    if (!link.allowPrint) securityScore += 1;
    if (!link.allowCopyPaste) securityScore += 1;
    if (!link.allowNavigation) securityScore += 1;
    if (link.ipRestrictions.length > 0) securityScore += 2;
    if (link.timeLimit) securityScore += 1;

    if (securityScore >= 6) return { level: "High", color: "text-green-600", icon: "🛡️" };
    if (securityScore >= 3) return { level: "Medium", color: "text-yellow-600", icon: "⚠️" };
    return { level: "Low", color: "text-red-600", icon: "🔓" };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Anonymous Quiz Access</h1>
          <p className="text-muted-foreground">
            Create secure links for quiz access without requiring user accounts
          </p>
        </div>
      </div>

      <Tabs defaultValue="links" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="links">Quiz Links</TabsTrigger>
          <TabsTrigger value="attempts">Attempt Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="links" className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by link name or quiz title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Links</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create Link
              </Button>
            </div>
          </div>

          {/* Links List */}
          <div className="grid gap-4">
            {loadingLinks ? (
              <div className="text-center py-8">Loading anonymous quiz links...</div>
            ) : filteredLinks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Link2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No quiz links found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create anonymous quiz links to allow access without requiring user accounts.
                  </p>
                  <Button onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Link
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredLinks.map((link: AnonymousQuizLink) => {
                const security = getSecurityLevel(link);
                const fullUrl = `${window.location.origin}/take-quiz/${link.accessToken}`;
                
                return (
                  <Card key={link.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="h-5 w-5 text-blue-500" />
                          <div>
                            <h3 className="font-semibold">{link.linkName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {link.quiz?.title || "Quiz not found"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(link)}
                          <Badge variant="outline" className={security.color}>
                            {security.icon} {security.level}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Link URL */}
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <code className="flex-1 text-sm font-mono truncate">
                          {fullUrl}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyLinkToClipboard(link.accessToken)}
                          className={copiedToken === link.accessToken ? "text-green-600" : ""}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span>{link.currentAttempts}/{link.maxAttempts} attempts</span>
                        </div>
                        {link.timeLimit && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <span>{link.timeLimit} minutes</span>
                          </div>
                        )}
                        {link.ipRestrictions.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-purple-500" />
                            <span>{link.ipRestrictions.length} IP restrictions</span>
                          </div>
                        )}
                        {link.validUntil && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-red-500" />
                            <span>Expires {new Date(link.validUntil).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Security Features */}
                      {(link.browserLockdown || !link.allowPrint || !link.allowCopyPaste || !link.allowNavigation) && (
                        <div className="flex flex-wrap gap-1">
                          {link.browserLockdown && (
                            <Badge variant="secondary" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              Browser Lockdown
                            </Badge>
                          )}
                          {!link.allowPrint && (
                            <Badge variant="secondary" className="text-xs">No Print</Badge>
                          )}
                          {!link.allowCopyPaste && (
                            <Badge variant="secondary" className="text-xs">No Copy/Paste</Badge>
                          )}
                          {!link.allowNavigation && (
                            <Badge variant="secondary" className="text-xs">No Navigation</Badge>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(link)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLinkForStats(link)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          View Attempts
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateQRMutation.mutate(fullUrl)}
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          QR Code
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteLinkMutation.mutate(link.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="attempts" className="space-y-6">
          {/* Attempt Analytics */}
          {selectedLinkForStats ? (
            <Card>
              <CardHeader>
                <CardTitle>Attempt Statistics: {selectedLinkForStats.linkName}</CardTitle>
                <CardDescription>
                  Analysis of attempts for this anonymous quiz link
                </CardDescription>
              </CardHeader>
              <CardContent>
                {linkAttempts && (linkAttempts as AnonymousQuizAttempt[]).length > 0 ? (
                  <div className="space-y-4">
                    {(linkAttempts as AnonymousQuizAttempt[]).map((attempt) => (
                      <div key={attempt.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {attempt.guestName || "Anonymous"} 
                            {attempt.guestEmail && ` (${attempt.guestEmail})`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Started: {new Date(attempt.startedAt).toLocaleString()}
                          </p>
                          {attempt.completedAt && (
                            <p className="text-sm text-muted-foreground">
                              Score: {attempt.percentage}% ({attempt.score}/{attempt.maxScore})
                            </p>
                          )}
                        </div>
                        <Badge 
                          variant={
                            attempt.status === "completed" ? "default" :
                            attempt.status === "flagged" ? "destructive" : "secondary"
                          }
                        >
                          {attempt.status.replace("_", " ")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No attempts found for this link yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Link</h3>
                <p className="text-muted-foreground text-center">
                  Choose a quiz link from the Links tab to view attempt analytics.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Link Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingLink ? "Edit Anonymous Quiz Link" : "Create Anonymous Quiz Link"}
            </DialogTitle>
            <DialogDescription>
              Configure secure access settings for anonymous quiz taking
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Basic Settings */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quizId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quiz</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a quiz" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(quizzes || []).map((quiz: any) => (
                            <SelectItem key={quiz.id} value={quiz.id}>
                              {quiz.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="linkName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Student Assessment Link" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Access Control */}
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="maxAttempts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Attempts</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="10" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Limit (minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          placeholder="No limit"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormDescription>Leave empty for no time limit</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>Enable this link</FormDescription>
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

              {/* Security Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Security Settings</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="browserLockdown"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Browser Lockdown</FormLabel>
                          <FormDescription>Prevent leaving the quiz page</FormDescription>
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
                    name="allowPrint"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Allow Printing</FormLabel>
                          <FormDescription>Enable print functionality</FormDescription>
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
                    name="allowCopyPaste"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Allow Copy/Paste</FormLabel>
                          <FormDescription>Enable clipboard operations</FormDescription>
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
                    name="allowNavigation"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Allow Navigation</FormLabel>
                          <FormDescription>Enable browser navigation</FormDescription>
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

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="validFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid From</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          value={field.value ? field.value.toISOString().slice(0, 16) : ""}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormDescription>Leave empty for immediate access</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid Until</FormLabel>
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
                  disabled={createLinkMutation.isPending || updateLinkMutation.isPending}
                >
                  {editingLink ? "Update" : "Create"} Link
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}