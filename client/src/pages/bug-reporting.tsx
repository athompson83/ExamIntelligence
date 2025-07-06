import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, Bug, AlertTriangle, Lightbulb, Plus, MessageSquare, Calendar, User, FileImage, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Breadcrumb } from "@/components/ui/breadcrumb";

// Types for bug reports
interface BugReport {
  id: string;
  title: string;
  description: string;
  reportType: "bug" | "feature_request" | "improvement" | "question";
  severity: "low" | "medium" | "high" | "critical";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed" | "duplicate";
  category: string;
  browserInfo: string | null;
  deviceInfo: string | null;
  stepsToReproduce: string | null;
  expectedBehavior: string | null;
  actualBehavior: string | null;
  attachments: string[];
  reportedBy: string;
  assignedTo: string | null;
  resolvedBy: string | null;
  resolution: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  tags: string[];
  votes: number;
  comments: BugComment[];
  reporter?: {
    id: string;
    email: string;
    role: string;
  };
}

interface BugComment {
  id: string;
  bugReportId: string;
  userId: string;
  comment: string;
  isInternal: boolean;
  createdAt: Date;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Form schemas
const bugReportSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().min(1, "Description is required").max(5000, "Description too long"),
  reportType: z.enum(["bug", "feature_request", "improvement", "question"]),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  category: z.string().min(1, "Category is required"),
  stepsToReproduce: z.string().optional(),
  expectedBehavior: z.string().optional(),
  actualBehavior: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

const commentSchema = z.object({
  comment: z.string().min(1, "Comment is required").max(2000, "Comment too long"),
  isInternal: z.boolean().default(false),
});

type BugReportForm = z.infer<typeof bugReportSchema>;
type CommentForm = z.infer<typeof commentSchema>;

export default function BugReportingPage() {
  const [activeTab, setActiveTab] = useState("my-reports");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BugReportForm>({
    resolver: zodResolver(bugReportSchema),
    defaultValues: {
      reportType: "bug",
      severity: "medium",
      priority: "medium",
      tags: [],
    },
  });

  const commentForm = useForm<CommentForm>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      isInternal: false,
    },
  });

  // Fetch user's bug reports
  const { data: myReports, isLoading: loadingMyReports } = useQuery({
    queryKey: ["/api/bug-reports", "my"],
    queryFn: () => apiRequest("GET", "/api/bug-reports/my"),
  });

  // Fetch all bug reports (for admins/teachers)
  const { data: allReports, isLoading: loadingAllReports } = useQuery({
    queryKey: ["/api/bug-reports", "all"],
    queryFn: () => apiRequest("GET", "/api/bug-reports"),
  });

  // Fetch current user info
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: () => apiRequest("GET", "/api/auth/user"),
  });

  // Create bug report mutation
  const createReportMutation = useMutation({
    mutationFn: (data: BugReportForm) =>
      apiRequest("POST", "/api/bug-reports", {
        ...data,
        browserInfo: navigator.userAgent,
        deviceInfo: `${navigator.platform} - ${screen.width}x${screen.height}`,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bug-reports"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Report Submitted",
        description: "Your bug report has been submitted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit bug report",
        variant: "destructive",
      });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: ({ reportId, data }: { reportId: string; data: CommentForm }) =>
      apiRequest("POST", `/api/bug-reports/${reportId}/comments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bug-reports"] });
      setIsCommentDialogOpen(false);
      commentForm.reset();
      toast({
        title: "Comment Added",
        description: "Your comment has been added successfully",
      });
    },
  });

  // Update report status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/bug-reports/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bug-reports"] });
      toast({
        title: "Status Updated",
        description: "Report status has been updated",
      });
    },
  });

  // Vote on report mutation
  const voteMutation = useMutation({
    mutationFn: (reportId: string) =>
      apiRequest("POST", `/api/bug-reports/${reportId}/vote`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bug-reports"] });
      toast({
        title: "Vote Recorded",
        description: "Your vote has been recorded",
      });
    },
  });

  const handleSubmit = (data: BugReportForm) => {
    createReportMutation.mutate(data);
  };

  const handleAddComment = (data: CommentForm) => {
    if (!selectedReport) return;
    addCommentMutation.mutate({ reportId: selectedReport.id, data });
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case "bug": return <Bug className="h-4 w-4 text-red-500" />;
      case "feature_request": return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case "improvement": return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved": return "default";
      case "closed": return "secondary";
      case "in_progress": return "default";
      case "duplicate": return "outline";
      default: return "secondary";
    }
  };

  const filteredReports = (reports: BugReport[] | undefined) => {
    if (!reports) return [];
    
    return reports.filter(report => {
      const matchesStatus = filterStatus === "all" || report.status === filterStatus;
      const matchesType = filterType === "all" || report.reportType === filterType;
      return matchesStatus && matchesType;
    });
  };

  const categories = [
    "Authentication",
    "Quiz Builder",
    "Question Management",
    "Analytics",
    "Proctoring",
    "User Interface",
    "Performance",
    "Mobile App",
    "Accessibility",
    "Security",
    "Other"
  ];

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[{ label: "Bug Reporting & Feedback" }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bug Reporting & Feedback</h1>
          <p className="text-muted-foreground">
            Report issues, request features, and track development progress
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Submit Report
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-reports">My Reports</TabsTrigger>
          <TabsTrigger value="all-reports">All Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="my-reports" className="space-y-6">
          {/* Filters */}
          <div className="flex gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bug">Bug</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
                <SelectItem value="improvement">Improvement</SelectItem>
                <SelectItem value="question">Question</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* My Reports List */}
          <div className="grid gap-4">
            {loadingMyReports ? (
              <div className="text-center py-8">Loading your reports...</div>
            ) : filteredReports(myReports).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Bug className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No reports found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Submit your first bug report or feature request to help improve the platform.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Submit First Report
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredReports(myReports).map((report: BugReport) => (
                <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedReport(report)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getReportTypeIcon(report.reportType)}
                        <div>
                          <h3 className="font-semibold">{report.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {report.category} • {new Date(report.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(report.severity)}>
                          {report.severity}
                        </Badge>
                        <Badge variant={getStatusColor(report.status)}>
                          {report.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {report.description}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{report.comments?.length || 0} comments</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{report.votes} votes</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="all-reports" className="space-y-6">
          {isAdmin ? (
            <div className="grid gap-4">
              {loadingAllReports ? (
                <div className="text-center py-8">Loading all reports...</div>
              ) : filteredReports(allReports).length === 0 ? (
                <div className="text-center py-8">No reports found matching your filters.</div>
              ) : (
                filteredReports(allReports).map((report: BugReport) => (
                  <Card key={report.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getReportTypeIcon(report.reportType)}
                          <div>
                            <h3 className="font-semibold">{report.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              Reported by {report.reporter?.email} • {report.category} • {new Date(report.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(report.severity)}>
                            {report.severity}
                          </Badge>
                          <Select
                            value={report.status}
                            onValueChange={(status) => updateStatusMutation.mutate({ id: report.id, status })}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                              <SelectItem value="duplicate">Duplicate</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {report.description}
                      </p>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setIsCommentDialogOpen(true);
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Add Comment
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => voteMutation.mutate(report.id)}
                        >
                          👍 {report.votes}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
                <p className="text-muted-foreground text-center">
                  Only administrators can view all reports. Please use the "My Reports" tab to view your submissions.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Bug Report Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Open Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {allReports?.filter((r: BugReport) => r.status === "open").length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {allReports?.filter((r: BugReport) => r.status === "in_progress").length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resolved This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {allReports?.filter((r: BugReport) => 
                    r.status === "resolved" && 
                    r.resolvedAt && 
                    new Date(r.resolvedAt).getMonth() === new Date().getMonth()
                  ).length || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Report Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Submit Bug Report or Feature Request</DialogTitle>
            <DialogDescription>
              Help us improve the platform by reporting issues or suggesting new features
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reportType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bug">Bug Report</SelectItem>
                          <SelectItem value="feature_request">Feature Request</SelectItem>
                          <SelectItem value="improvement">Improvement</SelectItem>
                          <SelectItem value="question">Question</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description of the issue or request" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detailed description of the issue or feature request"
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
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity</FormLabel>
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
                          <SelectItem value="critical">Critical</SelectItem>
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

              {form.watch("reportType") === "bug" && (
                <>
                  <FormField
                    control={form.control}
                    name="stepsToReproduce"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Steps to Reproduce</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="1. Go to... 2. Click on... 3. See error..."
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
                      name="expectedBehavior"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Behavior</FormLabel>
                          <FormControl>
                            <Textarea placeholder="What should happen?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="actualBehavior"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Actual Behavior</FormLabel>
                          <FormControl>
                            <Textarea placeholder="What actually happens?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

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
                  disabled={createReportMutation.isPending}
                >
                  Submit Report
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Comment Dialog */}
      <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
            <DialogDescription>
              Add a comment to this report
            </DialogDescription>
          </DialogHeader>
          <Form {...commentForm}>
            <form onSubmit={commentForm.handleSubmit(handleAddComment)} className="space-y-4">
              <FormField
                control={commentForm.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comment</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add your comment..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isAdmin && (
                <FormField
                  control={commentForm.control}
                  name="isInternal"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Internal Comment</FormLabel>
                        <FormDescription>
                          Only visible to administrators
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCommentDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={addCommentMutation.isPending}
                >
                  Add Comment
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}