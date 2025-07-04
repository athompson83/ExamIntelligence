import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Settings, Users, Shield, Clock, Shuffle, Eye, Save } from "lucide-react";
import { Testbank, Question, Quiz } from "@/types";

const quizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  timeLimit: z.number().optional(),
  maxAttempts: z.number().min(1).default(1),
  shuffleQuestions: z.boolean().default(false),
  shuffleAnswers: z.boolean().default(false),
  passwordProtected: z.boolean().default(false),
  password: z.string().optional(),
  ipLocking: z.boolean().default(false),
  proctoringEnabled: z.boolean().default(false),
  adaptiveTesting: z.boolean().default(false),
  scheduleStartTime: z.string().optional(),
  scheduleEndTime: z.string().optional(),
});

type QuizFormData = z.infer<typeof quizSchema>;

interface QuizBuilderProps {
  quiz?: Quiz;
  onSave: (quiz: Quiz) => void;
  onCancel: () => void;
}

export function QuizBuilder({ quiz, onSave, onCancel }: QuizBuilderProps) {
  const [selectedTestbanks, setSelectedTestbanks] = useState<number[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: testbanks } = useQuery<Testbank[]>({
    queryKey: ["/api/testbanks"],
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: quiz?.title || "",
      description: quiz?.description || "",
      timeLimit: quiz?.timeLimit || undefined,
      maxAttempts: quiz?.maxAttempts || 1,
      shuffleQuestions: quiz?.shuffleQuestions || false,
      shuffleAnswers: quiz?.shuffleAnswers || false,
      passwordProtected: quiz?.passwordProtected || false,
      password: quiz?.password || "",
      ipLocking: quiz?.ipLocking || false,
      proctoringEnabled: quiz?.proctoringEnabled || false,
      adaptiveTesting: quiz?.adaptiveTesting || false,
      scheduleStartTime: quiz?.scheduleStartTime ? new Date(quiz.scheduleStartTime).toISOString().slice(0, 16) : "",
      scheduleEndTime: quiz?.scheduleEndTime ? new Date(quiz.scheduleEndTime).toISOString().slice(0, 16) : "",
    },
  });

  const passwordProtected = watch("passwordProtected");

  const createQuizMutation = useMutation({
    mutationFn: async (data: QuizFormData) => {
      const response = await apiRequest("POST", "/api/quizzes", {
        ...data,
        scheduleStartTime: data.scheduleStartTime ? new Date(data.scheduleStartTime) : null,
        scheduleEndTime: data.scheduleEndTime ? new Date(data.scheduleEndTime) : null,
        selectedQuestions: selectedQuestions.map(q => q.id),
      });
      return response.json();
    },
    onSuccess: (newQuiz) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      toast({
        title: "Success",
        description: "Quiz created successfully",
      });
      onSave(newQuiz);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create quiz",
        variant: "destructive",
      });
    },
  });

  const updateQuizMutation = useMutation({
    mutationFn: async (data: QuizFormData) => {
      const response = await apiRequest("PUT", `/api/quizzes/${quiz!.id}`, {
        ...data,
        scheduleStartTime: data.scheduleStartTime ? new Date(data.scheduleStartTime) : null,
        scheduleEndTime: data.scheduleEndTime ? new Date(data.scheduleEndTime) : null,
      });
      return response.json();
    },
    onSuccess: (updatedQuiz) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      toast({
        title: "Success",
        description: "Quiz updated successfully",
      });
      onSave(updatedQuiz);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update quiz",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: QuizFormData) => {
    if (selectedQuestions.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one question for the quiz",
        variant: "destructive",
      });
      return;
    }

    if (quiz) {
      updateQuizMutation.mutate(data);
    } else {
      createQuizMutation.mutate(data);
    }
  };

  const handleTestbankSelect = async (testbankId: number) => {
    if (selectedTestbanks.includes(testbankId)) {
      setSelectedTestbanks(prev => prev.filter(id => id !== testbankId));
      // Remove questions from this testbank
      setSelectedQuestions(prev => prev.filter(q => q.testbankId !== testbankId));
    } else {
      setSelectedTestbanks(prev => [...prev, testbankId]);
      // Fetch questions from this testbank
      try {
        const response = await apiRequest("GET", `/api/testbanks/${testbankId}/questions`);
        const questions: Question[] = await response.json();
        setSelectedQuestions(prev => [...prev, ...questions]);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load questions from testbank",
          variant: "destructive",
        });
      }
    }
  };

  const removeQuestion = (questionId: number) => {
    setSelectedQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {quiz ? "Edit Quiz" : "Create New Quiz"}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Quiz Title *</Label>
                  <Input
                    id="title"
                    {...register("title")}
                    placeholder="Enter quiz title"
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title.message}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Enter quiz description"
                    rows={3}
                  />
                </div>

                {/* Scheduling */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduleStartTime">Start Time</Label>
                    <Input
                      id="scheduleStartTime"
                      type="datetime-local"
                      {...register("scheduleStartTime")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="scheduleEndTime">End Time</Label>
                    <Input
                      id="scheduleEndTime"
                      type="datetime-local"
                      {...register("scheduleEndTime")}
                    />
                  </div>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="questions" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Available Testbanks */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Available Testbanks</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {testbanks?.map((testbank) => (
                      <Card
                        key={testbank.id}
                        className={`cursor-pointer transition-all ${
                          selectedTestbanks.includes(testbank.id)
                            ? 'ring-2 ring-primary bg-primary/5'
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => handleTestbankSelect(testbank.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{testbank.title}</h4>
                            {selectedTestbanks.includes(testbank.id) && (
                              <Badge variant="default">Selected</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {testbank.description || "No description"}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {testbank.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Selected Questions */}
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Selected Questions ({selectedQuestions.length})
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedQuestions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Plus className="mx-auto h-12 w-12 mb-2" />
                        <p>Select testbanks to add questions</p>
                      </div>
                    ) : (
                      selectedQuestions.map((question) => (
                        <Card key={question.id} className="relative">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium line-clamp-2">
                                  {question.questionText}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {question.questionType.replace('_', ' ')}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {question.points} pts
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeQuestion(question.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Time Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Time Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                      <Input
                        id="timeLimit"
                        type="number"
                        min="0"
                        {...register("timeLimit", { valueAsNumber: true })}
                        placeholder="No time limit"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxAttempts">Maximum Attempts</Label>
                      <Input
                        id="maxAttempts"
                        type="number"
                        min="1"
                        {...register("maxAttempts", { valueAsNumber: true })}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Randomization */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shuffle className="h-5 w-5" />
                      Randomization
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="shuffleQuestions"
                        {...register("shuffleQuestions")}
                        onCheckedChange={(checked) => setValue("shuffleQuestions", checked)}
                      />
                      <Label htmlFor="shuffleQuestions">Shuffle Questions</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="shuffleAnswers"
                        {...register("shuffleAnswers")}
                        onCheckedChange={(checked) => setValue("shuffleAnswers", checked)}
                      />
                      <Label htmlFor="shuffleAnswers">Shuffle Answer Options</Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Advanced Features */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Advanced Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="adaptiveTesting"
                        {...register("adaptiveTesting")}
                        onCheckedChange={(checked) => setValue("adaptiveTesting", checked)}
                      />
                      <Label htmlFor="adaptiveTesting">
                        Enable Adaptive Testing
                        <span className="block text-xs text-muted-foreground">
                          Adjust question difficulty based on student performance
                        </span>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="proctoringEnabled"
                        {...register("proctoringEnabled")}
                        onCheckedChange={(checked) => setValue("proctoringEnabled", checked)}
                      />
                      <Label htmlFor="proctoringEnabled">
                        Enable Proctoring
                        <span className="block text-xs text-muted-foreground">
                          Monitor students during the exam
                        </span>
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Password Protection */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="passwordProtected"
                        {...register("passwordProtected")}
                        onCheckedChange={(checked) => setValue("passwordProtected", checked)}
                      />
                      <Label htmlFor="passwordProtected">Password Protection</Label>
                    </div>
                    
                    {passwordProtected && (
                      <div className="space-y-2">
                        <Label htmlFor="password">Quiz Password</Label>
                        <Input
                          id="password"
                          type="password"
                          {...register("password")}
                          placeholder="Enter quiz password"
                        />
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* IP Locking */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="ipLocking"
                        {...register("ipLocking")}
                        onCheckedChange={(checked) => setValue("ipLocking", checked)}
                      />
                      <Label htmlFor="ipLocking">
                        IP Address Locking
                        <span className="block text-xs text-muted-foreground">
                          Restrict access to specific IP addresses
                        </span>
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={createQuizMutation.isPending || updateQuizMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="h-4 w-4 mr-2" />
              {createQuizMutation.isPending || updateQuizMutation.isPending
                ? "Saving..."
                : quiz ? "Update Quiz" : "Create Quiz"
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
