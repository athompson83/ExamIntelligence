import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { QuestionGroupBuilder } from "@/components/quiz/QuestionGroupBuilder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Settings, Clock, Users, Shield, Zap, Eye, Edit, Trash2, Play, Calendar, Lock, Shuffle, Timer, Camera, AlertTriangle, Search, BookOpen, Target, BarChart3, Home } from "lucide-react";
import { format } from "date-fns";
import type { Quiz, Question, QuestionGroup } from "@shared/schema";

interface Quiz {
  id: string;
  title: string;
  description: string;
  instructions: string;
  timeLimit: number;
  shuffleAnswers: boolean;
  shuffleQuestions: boolean;
  allowMultipleAttempts: boolean;
  maxAttempts: number;
  passwordProtected: boolean;
  password: string;
  ipLocking: boolean;
  adaptiveTesting: boolean;
  proctoring: boolean;
  proctoringSettings: {
    requireCamera: boolean;
    requireMicrophone: boolean;
    lockdownBrowser: boolean;
    preventTabSwitching: boolean;
  };
  availableFrom: string;
  availableUntil: string;
  showCorrectAnswers: boolean;
  showCorrectAnswersAfter: string;
  pointsPerQuestion: number;
  passingScore: number;
  gradingType: string;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  questionCount: number;
}

interface QuizFormData {
  title: string;
  description: string;
  instructions: string;
  timeLimit: number;
  shuffleAnswers: boolean;
  shuffleQuestions: boolean;
  allowMultipleAttempts: boolean;
  maxAttempts: number;
  passwordProtected: boolean;
  password: string;
  ipLocking: boolean;
  adaptiveTesting: boolean;
  proctoring: boolean;
  proctoringSettings: {
    requireCamera: boolean;
    requireMicrophone: boolean;
    lockdownBrowser: boolean;
    preventTabSwitching: boolean;
  };
  availableFrom: string;
  availableUntil: string;
  showCorrectAnswers: boolean;
  showCorrectAnswersAfter: string;
  pointsPerQuestion: number;
  passingScore: number;
  gradingType: string;
}

export default function QuizBuilder() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [formData, setFormData] = useState<QuizFormData>({
    title: "",
    description: "",
    instructions: "",
    timeLimit: 60,
    shuffleAnswers: false,
    shuffleQuestions: false,
    allowMultipleAttempts: false,
    maxAttempts: 1,
    passwordProtected: false,
    password: "",
    ipLocking: false,
    adaptiveTesting: false,
    proctoring: false,
    proctoringSettings: {
      requireCamera: false,
      requireMicrophone: false,
      lockdownBrowser: false,
      preventTabSwitching: false,
    },
    availableFrom: "",
    availableUntil: "",
    showCorrectAnswers: false,
    showCorrectAnswersAfter: "immediately",
    pointsPerQuestion: 1,
    passingScore: 70,
    gradingType: "percentage",
  });

  const { data: quizzes, isLoading: quizzesLoading } = useQuery({
    queryKey: ['/api/quizzes'],
    enabled: isAuthenticated,
  });

  const createQuizMutation = useMutation({
    mutationFn: async (data: QuizFormData) => {
      await apiRequest("POST", "/api/quizzes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Quiz created successfully",
      });
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

  const updateQuizMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<QuizFormData> }) => {
      await apiRequest("PUT", `/api/quizzes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes'] });
      setIsCreateDialogOpen(false);
      setEditingQuiz(null);
      resetForm();
      toast({
        title: "Success",
        description: "Quiz updated successfully",
      });
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
        description: "Failed to update quiz",
        variant: "destructive",
      });
    },
  });

  const deleteQuizMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/quizzes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes'] });
      toast({
        title: "Success",
        description: "Quiz deleted successfully",
      });
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
        description: "Failed to delete quiz",
        variant: "destructive",
      });
    },
  });

  const publishQuizMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/quizzes/${id}/publish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes'] });
      toast({
        title: "Success",
        description: "Quiz published successfully",
      });
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
        description: "Failed to publish quiz",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      instructions: "",
      timeLimit: 60,
      shuffleAnswers: false,
      shuffleQuestions: false,
      allowMultipleAttempts: false,
      maxAttempts: 1,
      passwordProtected: false,
      password: "",
      ipLocking: false,
      adaptiveTesting: false,
      proctoring: false,
      proctoringSettings: {
        requireCamera: false,
        requireMicrophone: false,
        lockdownBrowser: false,
        preventTabSwitching: false,
      },
      availableFrom: "",
      availableUntil: "",
      showCorrectAnswers: false,
      showCorrectAnswersAfter: "immediately",
      pointsPerQuestion: 1,
      passingScore: 70,
      gradingType: "percentage",
    });
  };

  const handleEdit = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setFormData({
      title: quiz.title,
      description: quiz.description,
      instructions: quiz.instructions,
      timeLimit: quiz.timeLimit,
      shuffleAnswers: quiz.shuffleAnswers,
      shuffleQuestions: quiz.shuffleQuestions,
      allowMultipleAttempts: quiz.allowMultipleAttempts,
      maxAttempts: quiz.maxAttempts,
      passwordProtected: quiz.passwordProtected,
      password: quiz.password,
      ipLocking: quiz.ipLocking,
      adaptiveTesting: quiz.adaptiveTesting,
      proctoring: quiz.proctoring,
      proctoringSettings: quiz.proctoringSettings,
      availableFrom: quiz.availableFrom,
      availableUntil: quiz.availableUntil,
      showCorrectAnswers: quiz.showCorrectAnswers,
      showCorrectAnswersAfter: quiz.showCorrectAnswersAfter,
      pointsPerQuestion: quiz.pointsPerQuestion,
      passingScore: quiz.passingScore,
      gradingType: quiz.gradingType,
    });
    setIsCreateDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingQuiz) {
      updateQuizMutation.mutate({ id: editingQuiz.id, data: formData });
    } else {
      createQuizMutation.mutate(formData);
    }
  };

  const filteredQuizzes = quizzes?.filter((quiz: Quiz) =>
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading || quizzesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 md:ml-64">
        <TopBar />
        
        <main className="p-4 md:p-6 pb-32 md:pb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Quiz Builder</h1>
              <p className="text-gray-600">Create and manage your assessments</p>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => {
                    setEditingQuiz(null);
                    resetForm();
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Quiz
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="basic">Basic Info</TabsTrigger>
                      <TabsTrigger value="settings">Settings</TabsTrigger>
                      <TabsTrigger value="security">Security</TabsTrigger>
                      <TabsTrigger value="grading">Grading</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label htmlFor="title">Quiz Title</Label>
                          <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            placeholder="Enter quiz title"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Brief description of the quiz"
                          />
                        </div>
                        <div>
                          <Label htmlFor="instructions">Student Instructions</Label>
                          <Textarea
                            id="instructions"
                            value={formData.instructions}
                            onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                            placeholder="Instructions for students taking this quiz"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="availableFrom">Available From</Label>
                            <Input
                              id="availableFrom"
                              type="datetime-local"
                              value={formData.availableFrom}
                              onChange={(e) => setFormData({...formData, availableFrom: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="availableUntil">Available Until</Label>
                            <Input
                              id="availableUntil"
                              type="datetime-local"
                              value={formData.availableUntil}
                              onChange={(e) => setFormData({...formData, availableUntil: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="settings" className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                          <Input
                            id="timeLimit"
                            type="number"
                            value={formData.timeLimit}
                            onChange={(e) => setFormData({...formData, timeLimit: parseInt(e.target.value)})}
                            min="1"
                          />
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="shuffleQuestions"
                              checked={formData.shuffleQuestions}
                              onCheckedChange={(checked) => setFormData({...formData, shuffleQuestions: checked})}
                            />
                            <Label htmlFor="shuffleQuestions">Shuffle Questions</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="shuffleAnswers"
                              checked={formData.shuffleAnswers}
                              onCheckedChange={(checked) => setFormData({...formData, shuffleAnswers: checked})}
                            />
                            <Label htmlFor="shuffleAnswers">Shuffle Answer Options</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="allowMultipleAttempts"
                              checked={formData.allowMultipleAttempts}
                              onCheckedChange={(checked) => setFormData({...formData, allowMultipleAttempts: checked})}
                            />
                            <Label htmlFor="allowMultipleAttempts">Allow Multiple Attempts</Label>
                          </div>
                          {formData.allowMultipleAttempts && (
                            <div>
                              <Label htmlFor="maxAttempts">Maximum Attempts</Label>
                              <Input
                                id="maxAttempts"
                                type="number"
                                value={formData.maxAttempts}
                                onChange={(e) => setFormData({...formData, maxAttempts: parseInt(e.target.value)})}
                                min="1"
                              />
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="adaptiveTesting"
                              checked={formData.adaptiveTesting}
                              onCheckedChange={(checked) => setFormData({...formData, adaptiveTesting: checked})}
                            />
                            <Label htmlFor="adaptiveTesting">Adaptive Testing (AI-powered)</Label>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="security" className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="passwordProtected"
                            checked={formData.passwordProtected}
                            onCheckedChange={(checked) => setFormData({...formData, passwordProtected: checked})}
                          />
                          <Label htmlFor="passwordProtected">Password Protected</Label>
                        </div>
                        {formData.passwordProtected && (
                          <div>
                            <Label htmlFor="password">Quiz Password</Label>
                            <Input
                              id="password"
                              type="password"
                              value={formData.password}
                              onChange={(e) => setFormData({...formData, password: e.target.value})}
                              placeholder="Enter quiz password"
                            />
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="ipLocking"
                            checked={formData.ipLocking}
                            onCheckedChange={(checked) => setFormData({...formData, ipLocking: checked})}
                          />
                          <Label htmlFor="ipLocking">IP Address Locking</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="proctoring"
                            checked={formData.proctoring}
                            onCheckedChange={(checked) => setFormData({...formData, proctoring: checked})}
                          />
                          <Label htmlFor="proctoring">Enable Live Proctoring</Label>
                        </div>
                        {formData.proctoring && (
                          <div className="ml-6 space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="requireCamera"
                                checked={formData.proctoringSettings.requireCamera}
                                onCheckedChange={(checked) => setFormData({
                                  ...formData,
                                  proctoringSettings: {
                                    ...formData.proctoringSettings,
                                    requireCamera: checked as boolean
                                  }
                                })}
                              />
                              <Label htmlFor="requireCamera">Require Camera</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="requireMicrophone"
                                checked={formData.proctoringSettings.requireMicrophone}
                                onCheckedChange={(checked) => setFormData({
                                  ...formData,
                                  proctoringSettings: {
                                    ...formData.proctoringSettings,
                                    requireMicrophone: checked as boolean
                                  }
                                })}
                              />
                              <Label htmlFor="requireMicrophone">Require Microphone</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="lockdownBrowser"
                                checked={formData.proctoringSettings.lockdownBrowser}
                                onCheckedChange={(checked) => setFormData({
                                  ...formData,
                                  proctoringSettings: {
                                    ...formData.proctoringSettings,
                                    lockdownBrowser: checked as boolean
                                  }
                                })}
                              />
                              <Label htmlFor="lockdownBrowser">Lockdown Browser Mode</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="preventTabSwitching"
                                checked={formData.proctoringSettings.preventTabSwitching}
                                onCheckedChange={(checked) => setFormData({
                                  ...formData,
                                  proctoringSettings: {
                                    ...formData.proctoringSettings,
                                    preventTabSwitching: checked as boolean
                                  }
                                })}
                              />
                              <Label htmlFor="preventTabSwitching">Prevent Tab Switching</Label>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="grading" className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label htmlFor="gradingType">Grading Type</Label>
                          <Select 
                            value={formData.gradingType} 
                            onValueChange={(value) => setFormData({...formData, gradingType: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select grading type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="points">Points</SelectItem>
                              <SelectItem value="letter">Letter Grade</SelectItem>
                              <SelectItem value="passfail">Pass/Fail</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="pointsPerQuestion">Points Per Question</Label>
                          <Input
                            id="pointsPerQuestion"
                            type="number"
                            value={formData.pointsPerQuestion}
                            onChange={(e) => setFormData({...formData, pointsPerQuestion: parseInt(e.target.value)})}
                            min="1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="passingScore">Passing Score (%)</Label>
                          <Input
                            id="passingScore"
                            type="number"
                            value={formData.passingScore}
                            onChange={(e) => setFormData({...formData, passingScore: parseInt(e.target.value)})}
                            min="0"
                            max="100"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showCorrectAnswers"
                            checked={formData.showCorrectAnswers}
                            onCheckedChange={(checked) => setFormData({...formData, showCorrectAnswers: checked})}
                          />
                          <Label htmlFor="showCorrectAnswers">Show Correct Answers</Label>
                        </div>
                        {formData.showCorrectAnswers && (
                          <div>
                            <Label htmlFor="showCorrectAnswersAfter">Show Correct Answers After</Label>
                            <Select 
                              value={formData.showCorrectAnswersAfter} 
                              onValueChange={(value) => setFormData({...formData, showCorrectAnswersAfter: value})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select when to show answers" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="immediately">Immediately</SelectItem>
                                <SelectItem value="after_submission">After Submission</SelectItem>
                                <SelectItem value="after_due_date">After Due Date</SelectItem>
                                <SelectItem value="never">Never</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={createQuizMutation.isPending || updateQuizMutation.isPending}
                    >
                      {editingQuiz ? 'Update Quiz' : 'Create Quiz'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Quizzes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz: Quiz) => (
              <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <BookOpen className="h-5 w-5 text-primary mr-2" />
                      <div>
                        <CardTitle className="text-lg">{quiz.title}</CardTitle>
                        <CardDescription>{quiz.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(quiz)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteQuizMutation.mutate(quiz.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Quiz Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center">
                        <Timer className="h-4 w-4 mr-2 text-gray-500" />
                        {quiz.timeLimit} min
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-gray-500" />
                        {quiz.questionCount || 0} questions
                      </div>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-1">
                      {quiz.proctoring && (
                        <Badge variant="secondary">
                          <Camera className="h-3 w-3 mr-1" />
                          Proctored
                        </Badge>
                      )}
                      {quiz.passwordProtected && (
                        <Badge variant="secondary">
                          <Lock className="h-3 w-3 mr-1" />
                          Password
                        </Badge>
                      )}
                      {quiz.shuffleQuestions && (
                        <Badge variant="secondary">
                          <Shuffle className="h-3 w-3 mr-1" />
                          Shuffle
                        </Badge>
                      )}
                      {quiz.adaptiveTesting && (
                        <Badge variant="secondary">
                          <Zap className="h-3 w-3 mr-1" />
                          Adaptive
                        </Badge>
                      )}
                    </div>

                    <Separator />

                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <Badge variant={quiz.isPublished ? "default" : "secondary"}>
                        {quiz.isPublished ? "Published" : "Draft"}
                      </Badge>
                      <div className="text-sm text-gray-600">
                        {format(new Date(quiz.createdAt), 'MMM d, yyyy')}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = `/quizzes/${quiz.id}/questions`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Questions
                      </Button>
                      {!quiz.isPublished && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => publishQuizMutation.mutate(quiz.id)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Publish
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredQuizzes.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'No quizzes match your search criteria.' : 'Create your first quiz to get started.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Quiz
                </Button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}