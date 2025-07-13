import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Puzzle, 
  Settings as SettingsIcon, 
  Shield, 
  Clock,
  Shuffle,
  Eye,
  Save,
  Play,
  Search,
  Filter
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertQuizSchema } from "@shared/schema";
import { z } from "zod";

const quizFormSchema = insertQuizSchema.extend({
  selectedQuestions: z.array(z.string()).optional(),
});

type QuizFormData = z.infer<typeof quizFormSchema>;

export default function QuizBuilder() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedTestbanks, setSelectedTestbanks] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [questionFilter, setQuestionFilter] = useState("");
  const [currentStep, setCurrentStep] = useState("basic");

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

  const { data: testbanks } = useQuery({
    queryKey: ["/api/testbanks"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: questions } = useQuery({
    queryKey: ["/api/questions", selectedTestbanks.join(",")],
    enabled: isAuthenticated && selectedTestbanks.length > 0,
    retry: false,
  });

  const form = useForm<QuizFormData>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      title: "",
      description: "",
      timeLimit: 60,
      isPasswordProtected: false,
      password: "",
      isIpLocked: false,
      shuffleAnswers: true,
      allowMultipleAttempts: false,
      showCalculator: false,
      navigationLocked: false,
      isAdaptive: false,
      isProctoringEnabled: false,
      status: "draft",
    },
  });

  const createQuizMutation = useMutation({
    mutationFn: async (data: QuizFormData) => {
      const quizData = {
        ...data,
        selectedQuestions: undefined, // Remove this from the quiz data
      };
      
      const response = await apiRequest("POST", "/api/quizzes", quizData);
      const quiz = await response.json();
      
      // Add questions to the quiz
      if (selectedQuestions.length > 0) {
        await Promise.all(
          selectedQuestions.map((questionId, index) =>
            apiRequest("POST", "/api/quiz-questions", {
              quizId: quiz.id,
              questionId,
              order: index + 1,
              points: 1,
            })
          )
        );
      }
      
      return quiz;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quiz created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      form.reset();
      setSelectedQuestions([]);
      setSelectedTestbanks([]);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to create quiz",
        variant: "destructive",
      });
    },
  });

  const filteredQuestions = questions?.filter((question: any) => {
    if (!questionFilter) return true;
    return question.questionText.toLowerCase().includes(questionFilter.toLowerCase()) ||
           question.tags?.some((tag: string) => tag.toLowerCase().includes(questionFilter.toLowerCase()));
  });

  const onSubmit = (data: QuizFormData) => {
    if (selectedQuestions.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one question for the quiz",
        variant: "destructive",
      });
      return;
    }
    
    createQuizMutation.mutate(data);
  };

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const addAllQuestions = () => {
    if (filteredQuestions) {
      const questionIds = filteredQuestions.map((q: any) => q.id);
      setSelectedQuestions(questionIds);
    }
  };

  const clearAllQuestions = () => {
    setSelectedQuestions([]);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quiz Builder</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Create comprehensive assessments with advanced features
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="adaptive-badge">
              <Puzzle className="h-3 w-3 mr-1" />
              Advanced Builder
            </Badge>
          </div>
        </div>

        {/* Progress Indicator */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant={currentStep === "basic" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentStep("basic")}
                >
                  1. Basic Info
                </Button>
                <Button
                  variant={currentStep === "questions" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentStep("questions")}
                >
                  2. Questions
                </Button>
                <Button
                  variant={currentStep === "settings" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentStep("settings")}
                >
                  3. Settings
                </Button>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {selectedQuestions.length} questions selected
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quiz Builder Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={currentStep} onValueChange={setCurrentStep}>
              <TabsContent value="basic">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Puzzle className="h-5 w-5 mr-2" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quiz Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter quiz title" {...field} />
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
                              placeholder="Describe the quiz objectives and instructions"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="timeLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time Limit (minutes)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="60"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="questions">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Testbank Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Select Testbanks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {testbanks?.map((testbank: any) => (
                          <div
                            key={testbank.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedTestbanks.includes(testbank.id)
                                ? "border-primary bg-primary/5"
                                : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                            onClick={() => {
                              setSelectedTestbanks(prev => 
                                prev.includes(testbank.id)
                                  ? prev.filter(id => id !== testbank.id)
                                  : [...prev, testbank.id]
                              );
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{testbank.title}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {testbank.questionCount || 0} questions
                                </p>
                              </div>
                              {selectedTestbanks.includes(testbank.id) && (
                                <Badge className="bg-primary text-white">Selected</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Question Selection */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Select Questions</CardTitle>
                        <div className="flex items-center space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addAllQuestions}
                            disabled={!filteredQuestions?.length}
                          >
                            Add All
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={clearAllQuestions}
                            disabled={selectedQuestions.length === 0}
                          >
                            Clear All
                          </Button>
                        </div>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search questions..."
                          value={questionFilter}
                          onChange={(e) => setQuestionFilter(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {filteredQuestions && filteredQuestions.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {filteredQuestions.map((question: any) => (
                            <div
                              key={question.id}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedQuestions.includes(question.id)
                                  ? "border-secondary bg-secondary/5"
                                  : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                              }`}
                              onClick={() => toggleQuestionSelection(question.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium line-clamp-2">
                                    {question.questionText}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <Badge variant="outline" className="text-xs">
                                      {question.questionType.replace("_", " ")}
                                    </Badge>
                                    {question.difficultyScore && (
                                      <Badge 
                                        className={`text-xs ${
                                          question.difficultyScore <= 3
                                            ? "difficulty-easy"
                                            : question.difficultyScore <= 7
                                            ? "difficulty-medium"
                                            : "difficulty-hard"
                                        }`}
                                      >
                                        Difficulty: {question.difficultyScore}/10
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {selectedQuestions.includes(question.id) && (
                                  <Badge className="bg-secondary text-white ml-2">
                                    Selected
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : selectedTestbanks.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">
                          Select testbanks to view questions
                        </p>
                      ) : (
                        <p className="text-center text-gray-500 py-8">
                          No questions found in selected testbanks
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="settings">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quiz Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <SettingsIcon className="h-5 w-5 mr-2" />
                        Quiz Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <FormLabel>Shuffle Answer Options</FormLabel>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Randomize the order of answer choices
                          </p>
                        </div>
                        <FormField
                          control={form.control}
                          name="shuffleAnswers"
                          render={({ field }) => (
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          )}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <FormLabel>Allow Multiple Attempts</FormLabel>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Students can retake the quiz
                          </p>
                        </div>
                        <FormField
                          control={form.control}
                          name="allowMultipleAttempts"
                          render={({ field }) => (
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          )}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <FormLabel>Show Calculator</FormLabel>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Provide an on-screen calculator
                          </p>
                        </div>
                        <FormField
                          control={form.control}
                          name="showCalculator"
                          render={({ field }) => (
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          )}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <FormLabel>Navigation Lock</FormLabel>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Prevent going back to previous questions
                          </p>
                        </div>
                        <FormField
                          control={form.control}
                          name="navigationLocked"
                          render={({ field }) => (
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          )}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <FormLabel>Adaptive Testing</FormLabel>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Adjust difficulty based on responses
                          </p>
                        </div>
                        <FormField
                          control={form.control}
                          name="isAdaptive"
                          render={({ field }) => (
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Security Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Shield className="h-5 w-5 mr-2" />
                        Security Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <FormLabel>Password Protection</FormLabel>
                          <FormField
                            control={form.control}
                            name="isPasswordProtected"
                            render={({ field }) => (
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            )}
                          />
                        </div>
                        {form.watch("isPasswordProtected") && (
                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="Enter quiz password"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <FormLabel>IP Address Locking</FormLabel>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Restrict access to specific IP addresses
                          </p>
                        </div>
                        <FormField
                          control={form.control}
                          name="isIpLocked"
                          render={({ field }) => (
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          )}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <FormLabel>Live Proctoring</FormLabel>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Enable camera monitoring and alerts
                          </p>
                        </div>
                        <FormField
                          control={form.control}
                          name="isProctoringEnabled"
                          render={({ field }) => (
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Estimated completion time: {selectedQuestions.length * 2} minutes
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => form.reset()}
                    >
                      Reset
                    </Button>
                    <Button
                      type="submit"
                      disabled={createQuizMutation.isPending || selectedQuestions.length === 0}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {createQuizMutation.isPending ? "Creating..." : "Create Quiz"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </Layout>
  );
}
