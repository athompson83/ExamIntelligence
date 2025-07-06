import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Flag, AlertCircle, MessageSquare, Bot, User, CheckCircle, XCircle, Clock, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Types for question flags
interface QuestionFlag {
  id: string;
  questionId: string;
  flaggedBy: string;
  flagType: "unclear" | "incorrect" | "typo" | "inappropriate" | "duplicate" | "other";
  reason: string;
  description: string;
  status: "pending" | "under_review" | "resolved" | "dismissed" | "escalated";
  priority: "low" | "medium" | "high" | "critical";
  resolvedBy: string | null;
  resolution: string | null;
  aiReview: {
    reviewStatus: "pending" | "completed" | "failed";
    analysis: string | null;
    recommendations: string | null;
    confidence: number | null;
    flaggedIssues: string[];
    reviewedAt: Date | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  question?: {
    id: string;
    questionText: string;
    questionType: string;
    difficulty: number;
    testbankName?: string;
  };
  flagger?: {
    id: string;
    email: string;
    role: string;
  };
  resolver?: {
    id: string;
    email: string;
    role: string;
  };
}

interface AIReviewResult {
  analysis: string;
  recommendations: string;
  confidence: number;
  flaggedIssues: string[];
  suggestedActions: string[];
}

// Form schemas
const flagQuestionSchema = z.object({
  questionId: z.string().min(1, "Question is required"),
  flagType: z.enum(["unclear", "incorrect", "typo", "inappropriate", "duplicate", "other"]),
  reason: z.string().min(1, "Reason is required").max(200, "Reason too long"),
  description: z.string().min(1, "Description is required").max(2000, "Description too long"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
});

const resolveSchema = z.object({
  resolution: z.string().min(1, "Resolution is required").max(2000, "Resolution too long"),
  status: z.enum(["resolved", "dismissed", "escalated"]),
});

type FlagQuestionForm = z.infer<typeof flagQuestionSchema>;
type ResolveForm = z.infer<typeof resolveSchema>;

export default function QuestionFlaggingPage() {
  const [activeTab, setActiveTab] = useState("my-flags");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<QuestionFlag | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const flagForm = useForm<FlagQuestionForm>({
    resolver: zodResolver(flagQuestionSchema),
    defaultValues: {
      flagType: "unclear",
      priority: "medium",
    },
  });

  const resolveForm = useForm<ResolveForm>({
    resolver: zodResolver(resolveSchema),
    defaultValues: {
      status: "resolved",
    },
  });

  // Fetch user's flags
  const { data: myFlags, isLoading: loadingMyFlags } = useQuery({
    queryKey: ["/api/question-flags", "my"],
    queryFn: () => apiRequest("GET", "/api/question-flags/my"),
  });

  // Fetch all flags (for teachers/admins)
  const { data: allFlags, isLoading: loadingAllFlags } = useQuery({
    queryKey: ["/api/question-flags", "all"],
    queryFn: () => apiRequest("GET", "/api/question-flags"),
  });

  // Fetch questions for flagging
  const { data: questions } = useQuery({
    queryKey: ["/api/questions", "all"],
    queryFn: () => apiRequest("GET", "/api/questions"),
  });

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: () => apiRequest("GET", "/api/auth/user"),
  });

  // Create flag mutation
  const createFlagMutation = useMutation({
    mutationFn: (data: FlagQuestionForm) =>
      apiRequest("POST", "/api/question-flags", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/question-flags"] });
      setIsCreateDialogOpen(false);
      flagForm.reset();
      toast({
        title: "Question Flagged",
        description: "Question has been flagged for review. AI analysis will begin shortly.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to flag question",
        variant: "destructive",
      });
    },
  });

  // Resolve flag mutation
  const resolveFlagMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResolveForm }) =>
      apiRequest("PATCH", `/api/question-flags/${id}/resolve`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/question-flags"] });
      setIsResolveDialogOpen(false);
      setSelectedFlag(null);
      resolveForm.reset();
      toast({
        title: "Flag Resolved",
        description: "Question flag has been resolved successfully",
      });
    },
  });

  // Trigger AI review mutation
  const triggerAIReviewMutation = useMutation({
    mutationFn: (flagId: string) =>
      apiRequest("POST", `/api/question-flags/${flagId}/ai-review`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/question-flags"] });
      toast({
        title: "AI Review Started",
        description: "AI analysis has been initiated for this flag",
      });
    },
  });

  const handleSubmit = (data: FlagQuestionForm) => {
    createFlagMutation.mutate(data);
  };

  const handleResolve = (data: ResolveForm) => {
    if (!selectedFlag) return;
    resolveFlagMutation.mutate({ id: selectedFlag.id, data });
  };

  const openResolveDialog = (flag: QuestionFlag) => {
    setSelectedFlag(flag);
    resolveForm.reset();
    setIsResolveDialogOpen(true);
  };

  const getFlagTypeIcon = (type: string) => {
    switch (type) {
      case "incorrect": return <XCircle className="h-4 w-4 text-red-500" />;
      case "unclear": return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "typo": return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "inappropriate": return <Flag className="h-4 w-4 text-red-600" />;
      case "duplicate": return <CheckCircle className="h-4 w-4 text-purple-500" />;
      default: return <Flag className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved": return "default";
      case "dismissed": return "secondary";
      case "under_review": return "default";
      case "escalated": return "destructive";
      default: return "outline";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  const getAIReviewStatus = (aiReview: QuestionFlag["aiReview"]) => {
    if (!aiReview) return { icon: <Clock className="h-4 w-4" />, text: "Pending", color: "secondary" };
    
    switch (aiReview.reviewStatus) {
      case "completed":
        return { 
          icon: <Bot className="h-4 w-4" />, 
          text: `AI Review (${Math.round(aiReview.confidence || 0)}% confidence)`, 
          color: "default" 
        };
      case "failed":
        return { icon: <XCircle className="h-4 w-4" />, text: "Review Failed", color: "destructive" };
      default:
        return { icon: <Clock className="h-4 w-4" />, text: "AI Reviewing", color: "outline" };
    }
  };

  const filteredFlags = (flagList: QuestionFlag[] | undefined) => {
    if (!flagList) return [];
    
    return flagList.filter(flag => {
      const matchesSearch = flag.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           flag.question?.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           flag.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || flag.status === filterStatus;
      const matchesType = filterType === "all" || flag.flagType === filterType;
      return matchesSearch && matchesStatus && matchesType;
    });
  };

  const isTeacherOrAdmin = user?.role === "teacher" || user?.role === "admin" || user?.role === "super_admin";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Question Flagging System</h1>
          <p className="text-muted-foreground">
            {isTeacherOrAdmin 
              ? "Review and manage flagged questions with AI-powered analysis"
              : "Report issues with quiz questions for instructor review"
            }
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Flag className="h-4 w-4 mr-2" />
          Flag Question
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-flags">My Flags</TabsTrigger>
          {isTeacherOrAdmin && <TabsTrigger value="all-flags">All Flags</TabsTrigger>}
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="my-flags" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search flags by reason or question text..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="unclear">Unclear</SelectItem>
                <SelectItem value="incorrect">Incorrect</SelectItem>
                <SelectItem value="typo">Typo</SelectItem>
                <SelectItem value="inappropriate">Inappropriate</SelectItem>
                <SelectItem value="duplicate">Duplicate</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* My Flags List */}
          <div className="grid gap-4">
            {loadingMyFlags ? (
              <div className="text-center py-8">Loading your flags...</div>
            ) : filteredFlags(myFlags).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Flag className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No flags found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    You haven't flagged any questions yet. Report issues to help improve question quality.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Flag className="h-4 w-4 mr-2" />
                    Flag First Question
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredFlags(myFlags).map((flag: QuestionFlag) => {
                const aiStatus = getAIReviewStatus(flag.aiReview);
                
                return (
                  <Card key={flag.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getFlagTypeIcon(flag.flagType)}
                          <div>
                            <h3 className="font-semibold">{flag.reason}</h3>
                            <p className="text-sm text-muted-foreground">
                              {flag.flagType.replace("_", " ")} • {new Date(flag.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getPriorityColor(flag.priority)}>
                            {flag.priority}
                          </Badge>
                          <Badge variant={getStatusColor(flag.status)}>
                            {flag.status.replace("_", " ")}
                          </Badge>
                          <Badge variant={aiStatus.color as any} className="flex items-center gap-1">
                            {aiStatus.icon}
                            {aiStatus.text}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm mb-1">Question:</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {flag.question?.questionText || "Question not found"}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-1">Description:</h4>
                          <p className="text-sm">{flag.description}</p>
                        </div>
                        
                        {flag.aiReview?.analysis && (
                          <div>
                            <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
                              <Bot className="h-4 w-4" />
                              AI Analysis:
                            </h4>
                            <p className="text-sm bg-muted p-3 rounded-lg">{flag.aiReview.analysis}</p>
                            {flag.aiReview.recommendations && (
                              <div className="mt-2">
                                <h5 className="font-medium text-sm mb-1">Recommendations:</h5>
                                <p className="text-sm text-muted-foreground">{flag.aiReview.recommendations}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {flag.resolution && (
                          <div>
                            <h4 className="font-medium text-sm mb-1">Resolution:</h4>
                            <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">{flag.resolution}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Resolved by {flag.resolver?.email} on {flag.resolvedAt && new Date(flag.resolvedAt).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {isTeacherOrAdmin && (
          <TabsContent value="all-flags" className="space-y-6">
            {/* All Flags for Teachers/Admins */}
            <div className="grid gap-4">
              {loadingAllFlags ? (
                <div className="text-center py-8">Loading all flags...</div>
              ) : filteredFlags(allFlags).length === 0 ? (
                <div className="text-center py-8">No flags found matching your filters.</div>
              ) : (
                filteredFlags(allFlags).map((flag: QuestionFlag) => {
                  const aiStatus = getAIReviewStatus(flag.aiReview);
                  
                  return (
                    <Card key={flag.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {getFlagTypeIcon(flag.flagType)}
                            <div>
                              <h3 className="font-semibold">{flag.reason}</h3>
                              <p className="text-sm text-muted-foreground">
                                Flagged by {flag.flagger?.email} • {flag.flagType.replace("_", " ")} • {new Date(flag.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getPriorityColor(flag.priority)}>
                              {flag.priority}
                            </Badge>
                            <Badge variant={getStatusColor(flag.status)}>
                              {flag.status.replace("_", " ")}
                            </Badge>
                            <Badge variant={aiStatus.color as any} className="flex items-center gap-1">
                              {aiStatus.icon}
                              {aiStatus.text}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-sm mb-1">Question:</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {flag.question?.questionText || "Question not found"}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm mb-1">Issue Description:</h4>
                            <p className="text-sm">{flag.description}</p>
                          </div>
                          
                          {flag.aiReview?.analysis && (
                            <div>
                              <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
                                <Bot className="h-4 w-4" />
                                AI Analysis:
                              </h4>
                              <p className="text-sm bg-muted p-3 rounded-lg">{flag.aiReview.analysis}</p>
                              {flag.aiReview.recommendations && (
                                <div className="mt-2">
                                  <h5 className="font-medium text-sm mb-1">Recommendations:</h5>
                                  <p className="text-sm text-muted-foreground">{flag.aiReview.recommendations}</p>
                                </div>
                              )}
                              {flag.aiReview.flaggedIssues.length > 0 && (
                                <div className="mt-2">
                                  <h5 className="font-medium text-sm mb-1">AI Identified Issues:</h5>
                                  <div className="flex flex-wrap gap-1">
                                    {flag.aiReview.flaggedIssues.map((issue, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {issue}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-2 border-t">
                            {flag.status === "pending" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openResolveDialog(flag)}
                                >
                                  Resolve Flag
                                </Button>
                                {!flag.aiReview?.reviewStatus || flag.aiReview.reviewStatus === "failed" ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => triggerAIReviewMutation.mutate(flag.id)}
                                  >
                                    <Bot className="h-4 w-4 mr-2" />
                                    Run AI Review
                                  </Button>
                                ) : null}
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        )}

        <TabsContent value="analytics" className="space-y-6">
          {/* Flag Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Flags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {allFlags?.length || myFlags?.length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {(allFlags || myFlags)?.filter((f: QuestionFlag) => f.status === "pending").length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Reviewed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {(allFlags || myFlags)?.filter((f: QuestionFlag) => f.aiReview?.reviewStatus === "completed").length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resolved This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {(allFlags || myFlags)?.filter((f: QuestionFlag) => 
                    f.status === "resolved" && 
                    f.resolvedAt && 
                    new Date(f.resolvedAt).getMonth() === new Date().getMonth()
                  ).length || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Flag Question Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Flag Question for Review</DialogTitle>
            <DialogDescription>
              Report an issue with a quiz question for instructor review
            </DialogDescription>
          </DialogHeader>
          <Form {...flagForm}>
            <form onSubmit={flagForm.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={flagForm.control}
                name="questionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select the question to flag" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(questions || []).map((question: any) => (
                          <SelectItem key={question.id} value={question.id}>
                            {question.questionText.substring(0, 100)}...
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={flagForm.control}
                  name="flagType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unclear">Unclear/Confusing</SelectItem>
                          <SelectItem value="incorrect">Incorrect Answer</SelectItem>
                          <SelectItem value="typo">Typo/Grammar</SelectItem>
                          <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                          <SelectItem value="duplicate">Duplicate Question</SelectItem>
                          <SelectItem value="other">Other Issue</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={flagForm.control}
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
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={flagForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brief Reason</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief summary of the issue" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={flagForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide a detailed description of the issue you've identified..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Be specific about what's wrong and why it's problematic
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  disabled={createFlagMutation.isPending}
                >
                  Flag Question
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Resolve Flag Dialog */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Question Flag</DialogTitle>
            <DialogDescription>
              Provide resolution for this flagged question
            </DialogDescription>
          </DialogHeader>
          <Form {...resolveForm}>
            <form onSubmit={resolveForm.handleSubmit(handleResolve)} className="space-y-4">
              <FormField
                control={resolveForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resolution Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="resolved">Resolved - Issue Fixed</SelectItem>
                        <SelectItem value="dismissed">Dismissed - No Issue Found</SelectItem>
                        <SelectItem value="escalated">Escalated - Needs Further Review</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={resolveForm.control}
                name="resolution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resolution Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain how the issue was resolved or why it was dismissed..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsResolveDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={resolveFlagMutation.isPending}
                >
                  Resolve Flag
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}