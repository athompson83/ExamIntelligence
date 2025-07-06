import { useState } from "react";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, MessageSquare, HelpCircle, CheckCircle, XCircle, Eye, EyeOff, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Types for question feedback
interface QuestionFeedback {
  id: string;
  questionId: string;
  feedbackType: "correct" | "incorrect" | "general" | "hint";
  feedbackText: string;
  showTiming: "immediate" | "after_answer" | "after_quiz" | "never";
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  question?: {
    id: string;
    questionText: string;
    questionType: string;
    testbankName?: string;
  };
}

interface AnswerOptionFeedback {
  id: string;
  answerOptionId: string;
  explanationText: string;
  showWhenSelected: boolean;
  showInReview: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  answerOption?: {
    id: string;
    optionText: string;
    isCorrect: boolean;
    questionId: string;
  };
}

// Form schemas
const questionFeedbackSchema = z.object({
  questionId: z.string().min(1, "Question is required"),
  feedbackType: z.enum(["correct", "incorrect", "general", "hint"]),
  feedbackText: z.string().min(1, "Feedback text is required").max(5000, "Feedback text too long"),
  showTiming: z.enum(["immediate", "after_answer", "after_quiz", "never"]).default("after_answer"),
  isActive: z.boolean().default(true),
});

const answerOptionFeedbackSchema = z.object({
  answerOptionId: z.string().min(1, "Answer option is required"),
  explanationText: z.string().min(1, "Explanation text is required").max(2000, "Explanation text too long"),
  showWhenSelected: z.boolean().default(true),
  showInReview: z.boolean().default(true),
});

type QuestionFeedbackForm = z.infer<typeof questionFeedbackSchema>;
type AnswerOptionFeedbackForm = z.infer<typeof answerOptionFeedbackSchema>;

export default function QuestionFeedbackPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [isAnswerDialogOpen, setIsAnswerDialogOpen] = useState(false);
  const [editingQuestionFeedback, setEditingQuestionFeedback] = useState<QuestionFeedback | null>(null);
  const [editingAnswerFeedback, setEditingAnswerFeedback] = useState<AnswerOptionFeedback | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Question feedback form
  const questionForm = useForm<QuestionFeedbackForm>({
    resolver: zodResolver(questionFeedbackSchema),
    defaultValues: {
      feedbackType: "general",
      showTiming: "after_answer",
      isActive: true,
    },
  });

  // Answer option feedback form
  const answerForm = useForm<AnswerOptionFeedbackForm>({
    resolver: zodResolver(answerOptionFeedbackSchema),
    defaultValues: {
      showWhenSelected: true,
      showInReview: true,
    },
  });

  // Fetch question feedback
  const { data: questionFeedbacks, isLoading: loadingQuestionFeedbacks } = useQuery({
    queryKey: ["/api/question-feedback"],
    queryFn: () => apiRequest("GET", "/api/question-feedback"),
  });

  // Fetch answer option feedback
  const { data: answerFeedbacks, isLoading: loadingAnswerFeedbacks } = useQuery({
    queryKey: ["/api/answer-option-feedback"],
    queryFn: () => apiRequest("GET", "/api/answer-option-feedback"),
  });

  // Fetch questions for dropdown
  const { data: questions } = useQuery({
    queryKey: ["/api/questions", "all"],
    queryFn: () => apiRequest("GET", "/api/questions"),
  });

  // Fetch answer options for dropdown
  const { data: answerOptions } = useQuery({
    queryKey: ["/api/answer-options", "all"],
    queryFn: () => apiRequest("GET", "/api/answer-options"),
  });

  // Create question feedback mutation
  const createQuestionFeedbackMutation = useMutation({
    mutationFn: (data: QuestionFeedbackForm) =>
      apiRequest("POST", "/api/question-feedback", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/question-feedback"] });
      setIsQuestionDialogOpen(false);
      questionForm.reset();
      toast({
        title: "Success",
        description: "Question feedback created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create question feedback",
        variant: "destructive",
      });
    },
  });

  // Update question feedback mutation
  const updateQuestionFeedbackMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<QuestionFeedbackForm> }) =>
      apiRequest("PATCH", `/api/question-feedback/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/question-feedback"] });
      setIsQuestionDialogOpen(false);
      setEditingQuestionFeedback(null);
      questionForm.reset();
      toast({
        title: "Success",
        description: "Question feedback updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update question feedback",
        variant: "destructive",
      });
    },
  });

  // Delete question feedback mutation
  const deleteQuestionFeedbackMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/question-feedback/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/question-feedback"] });
      toast({
        title: "Success",
        description: "Question feedback deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete question feedback",
        variant: "destructive",
      });
    },
  });

  // Create answer option feedback mutation
  const createAnswerFeedbackMutation = useMutation({
    mutationFn: (data: AnswerOptionFeedbackForm) =>
      apiRequest("POST", "/api/answer-option-feedback", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/answer-option-feedback"] });
      setIsAnswerDialogOpen(false);
      answerForm.reset();
      toast({
        title: "Success",
        description: "Answer explanation created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create answer explanation",
        variant: "destructive",
      });
    },
  });

  // Handle form submissions
  const handleQuestionFeedbackSubmit = (data: QuestionFeedbackForm) => {
    if (editingQuestionFeedback) {
      updateQuestionFeedbackMutation.mutate({ id: editingQuestionFeedback.id, data });
    } else {
      createQuestionFeedbackMutation.mutate(data);
    }
  };

  const handleAnswerFeedbackSubmit = (data: AnswerOptionFeedbackForm) => {
    createAnswerFeedbackMutation.mutate(data);
  };

  // Filter and search logic
  const filteredQuestionFeedbacks = questionFeedbacks?.filter((feedback: QuestionFeedback) => {
    const matchesSearch = feedback.feedbackText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.question?.questionText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || feedback.feedbackType === filterType;
    return matchesSearch && matchesType;
  }) || [];

  const openEditDialog = (feedback: QuestionFeedback) => {
    setEditingQuestionFeedback(feedback);
    questionForm.reset({
      questionId: feedback.questionId,
      feedbackType: feedback.feedbackType,
      feedbackText: feedback.feedbackText,
      showTiming: feedback.showTiming,
      isActive: feedback.isActive,
    });
    setIsQuestionDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingQuestionFeedback(null);
    questionForm.reset();
    setIsQuestionDialogOpen(true);
  };

  const getFeedbackTypeIcon = (type: string) => {
    switch (type) {
      case "correct": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "incorrect": return <XCircle className="h-4 w-4 text-red-500" />;
      case "hint": return <HelpCircle className="h-4 w-4 text-blue-500" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTimingIcon = (timing: string) => {
    switch (timing) {
      case "immediate": return <Eye className="h-4 w-4 text-green-500" />;
      case "never": return <EyeOff className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Question Feedback & Explanations</h1>
          <p className="text-muted-foreground">
            Manage feedback and explanations for questions and answer options
          </p>
        </div>
      </div>

      <Tabs defaultValue="question-feedback" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="question-feedback">Question Feedback</TabsTrigger>
          <TabsTrigger value="answer-explanations">Answer Explanations</TabsTrigger>
        </TabsList>

        <TabsContent value="question-feedback" className="space-y-6">
          {/* Question Feedback Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search feedback by text or question..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="correct">Correct</SelectItem>
                  <SelectItem value="incorrect">Incorrect</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="hint">Hint</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Feedback
              </Button>
            </div>
          </div>

          {/* Question Feedback List */}
          <div className="grid gap-4">
            {loadingQuestionFeedbacks ? (
              <div className="text-center py-8">Loading feedback...</div>
            ) : filteredQuestionFeedbacks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No feedback found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Start by creating feedback for your questions to help students learn better.
                  </p>
                  <Button onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Feedback
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredQuestionFeedbacks.map((feedback: QuestionFeedback) => (
                <Card key={feedback.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getFeedbackTypeIcon(feedback.feedbackType)}
                        <Badge variant="secondary" className="capitalize">
                          {feedback.feedbackType}
                        </Badge>
                        <Badge 
                          variant={feedback.isActive ? "default" : "outline"}
                          className="capitalize"
                        >
                          {feedback.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          {getTimingIcon(feedback.showTiming)}
                          <span className="capitalize">{feedback.showTiming.replace("_", " ")}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(feedback)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteQuestionFeedbackMutation.mutate(feedback.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-1">Question:</h4>
                        <p className="text-sm text-muted-foreground">
                          {feedback.question?.questionText || "Question not found"}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-1">Feedback:</h4>
                        <p className="text-sm">{feedback.feedbackText}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="answer-explanations" className="space-y-6">
          {/* Answer Explanations Controls */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Answer Option Explanations</h2>
            <Button onClick={() => setIsAnswerDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Explanation
            </Button>
          </div>

          {/* Answer Explanations List */}
          <div className="grid gap-4">
            {loadingAnswerFeedbacks ? (
              <div className="text-center py-8">Loading explanations...</div>
            ) : (answerFeedbacks || []).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <HelpCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No explanations found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Add explanations for answer options to help students understand their choices.
                  </p>
                  <Button onClick={() => setIsAnswerDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Explanation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              (answerFeedbacks || []).map((explanation: AnswerOptionFeedback) => (
                <Card key={explanation.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={explanation.answerOption?.isCorrect ? "default" : "secondary"}
                        >
                          {explanation.answerOption?.isCorrect ? "Correct" : "Incorrect"}
                        </Badge>
                        <Badge variant="outline">
                          {explanation.showWhenSelected ? "Show When Selected" : "Hidden"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-1">Answer Option:</h4>
                        <p className="text-sm text-muted-foreground">
                          {explanation.answerOption?.optionText || "Answer option not found"}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-1">Explanation:</h4>
                        <p className="text-sm">{explanation.explanationText}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Question Feedback Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingQuestionFeedback ? "Edit Question Feedback" : "Create Question Feedback"}
            </DialogTitle>
            <DialogDescription>
              Provide helpful feedback for students based on their answers
            </DialogDescription>
          </DialogHeader>
          <Form {...questionForm}>
            <form onSubmit={questionForm.handleSubmit(handleQuestionFeedbackSubmit)} className="space-y-4">
              <FormField
                control={questionForm.control}
                name="questionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a question" />
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
                  control={questionForm.control}
                  name="feedbackType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feedback Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="correct">Correct Answer</SelectItem>
                          <SelectItem value="incorrect">Incorrect Answer</SelectItem>
                          <SelectItem value="general">General Feedback</SelectItem>
                          <SelectItem value="hint">Hint</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={questionForm.control}
                  name="showTiming"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Show Timing</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="immediate">Immediately</SelectItem>
                          <SelectItem value="after_answer">After Answer</SelectItem>
                          <SelectItem value="after_quiz">After Quiz</SelectItem>
                          <SelectItem value="never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={questionForm.control}
                name="feedbackText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feedback Text</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter helpful feedback for students..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide constructive feedback to help students learn
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={questionForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Enable this feedback to show to students
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsQuestionDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createQuestionFeedbackMutation.isPending || updateQuestionFeedbackMutation.isPending}
                >
                  {editingQuestionFeedback ? "Update" : "Create"} Feedback
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Answer Option Feedback Dialog */}
      <Dialog open={isAnswerDialogOpen} onOpenChange={setIsAnswerDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Answer Explanation</DialogTitle>
            <DialogDescription>
              Add explanations for answer options to help students understand
            </DialogDescription>
          </DialogHeader>
          <Form {...answerForm}>
            <form onSubmit={answerForm.handleSubmit(handleAnswerFeedbackSubmit)} className="space-y-4">
              <FormField
                control={answerForm.control}
                name="answerOptionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Answer Option</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an answer option" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(answerOptions || []).map((option: any) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.optionText} {option.isCorrect && "(Correct)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={answerForm.control}
                name="explanationText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Explanation</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why this answer option is correct or incorrect..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Help students understand the reasoning behind this answer
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormField
                  control={answerForm.control}
                  name="showWhenSelected"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Show When Selected</FormLabel>
                        <FormDescription>
                          Display this explanation when student selects this option
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
                  control={answerForm.control}
                  name="showInReview"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Show in Review</FormLabel>
                        <FormDescription>
                          Include this explanation in the quiz review section
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAnswerDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createAnswerFeedbackMutation.isPending}
                >
                  Create Explanation
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}