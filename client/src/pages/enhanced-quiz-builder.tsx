import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/top-bar";
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
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Plus, Settings, Clock, Users, Shield, Zap, Eye, Edit, Trash2, Play, Calendar, Lock, 
  Shuffle, Timer, Camera, AlertTriangle, Search, BookOpen, Target, BarChart3, Home,
  Save, Copy, FileText, Globe, MessageSquare, Monitor, Keyboard, Brain, Award,
  CheckCircle, XCircle, AlertCircle, Info, Move3D, GripVertical, ArrowUpDown
} from "lucide-react";
import { format } from "date-fns";

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
  
  // Enhanced CAT Settings
  adaptiveTesting: boolean;
  catModel: string;
  catSettings: {
    initialDifficulty: number;
    targetSEM: number;
    maxQuestions: number;
    minQuestions: number;
    terminationCriteria: string;
  };
  
  // Enhanced Proctoring Settings
  proctoring: boolean;
  proctoringSettings: {
    requireCamera: boolean;
    requireMicrophone: boolean;
    lockdownBrowser: boolean;
    preventTabSwitching: boolean;
    recordSession: boolean;
    flagSuspiciousActivity: boolean;
    faceDetection: boolean;
    eyeTracking: boolean;
    roomScan: boolean;
    idVerification: boolean;
    allowedApplications: string[];
    blockedWebsites: string[];
  };
  
  // Attempt and Time Management
  attemptSettings: {
    maxAttempts: number;
    attemptGap: number; // minutes between attempts
    keepHighestScore: boolean;
    allowReviewBetweenAttempts: boolean;
    timeExtensions: {
      enabled: boolean;
      percentage: number; // % of additional time
      eligibleStudents: string[];
    };
  };
  
  // Navigation and Display
  navigationSettings: {
    allowBacktrack: boolean;
    showProgressBar: boolean;
    showQuestionNumbers: boolean;
    showTimeRemaining: boolean;
    oneQuestionPerPage: boolean;
    allowSaveAndContinue: boolean;
  };
  
  // Calculator and Tools
  allowCalculator: boolean;
  calculatorType: string; // 'basic', 'scientific', 'graphing'
  allowedTools: string[];
  
  // Accessibility Features
  accessibilitySettings: {
    allowScreenReader: boolean;
    fontSize: string;
    highContrast: boolean;
    colorBlindSupport: boolean;
    keyboardNavigation: boolean;
  };
  
  // Emoji-based Mood and Learning Difficulty
  moodSettings: {
    selectedMood: string;
    learningDifficulty: string;
    emotionalTone: string;
    motivationalLevel: string;
  };
  
  // Existing fields
  availableFrom: string;
  availableUntil: string;
  showCorrectAnswers: boolean;
  showCorrectAnswersAfter: string;
  pointsPerQuestion: number;
  passingGrade: number;
  gradeToShow: string;
  status: string;
  enableQuestionFeedback: boolean;
  enableLearningPrescription: boolean;
  showAnswerReasoning: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  difficultyLevel: number;
  bloomsLevel: string;
  points: string;
  tags: string[];
  testbankId: string;
}

interface QuestionGroup {
  id: string;
  quizId: string;
  name: string;
  description?: string;
  pickCount: number;
  totalQuestions: number;
  pointsPerQuestion: string;
  useCAT: boolean;
  difficultyWeight: string;
  bloomsWeight: string;
  displayOrder: number;
}

export default function EnhancedQuizBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Quiz state
  const [quiz, setQuiz] = useState<Partial<Quiz>>({
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
    
    // Enhanced CAT Settings
    adaptiveTesting: false,
    catModel: "rasch",
    catSettings: {
      initialDifficulty: 0,
      targetSEM: 0.32,
      maxQuestions: 50,
      minQuestions: 5,
      terminationCriteria: "fixed_sem"
    },
    
    // Enhanced Proctoring Settings
    proctoring: false,
    proctoringSettings: {
      requireCamera: false,
      requireMicrophone: false,
      lockdownBrowser: false,
      preventTabSwitching: false,
      recordSession: false,
      flagSuspiciousActivity: false,
      faceDetection: false,
      eyeTracking: false,
      roomScan: false,
      idVerification: false,
      allowedApplications: [],
      blockedWebsites: []
    },
    
    // Attempt and Time Management
    attemptSettings: {
      maxAttempts: 1,
      attemptGap: 0,
      keepHighestScore: true,
      allowReviewBetweenAttempts: false,
      timeExtensions: {
        enabled: false,
        percentage: 50,
        eligibleStudents: []
      }
    },
    
    // Navigation and Display
    navigationSettings: {
      allowBacktrack: true,
      showProgressBar: true,
      showQuestionNumbers: true,
      showTimeRemaining: true,
      oneQuestionPerPage: false,
      allowSaveAndContinue: true
    },
    
    // Calculator and Tools
    allowCalculator: false,
    calculatorType: "basic",
    allowedTools: [],
    
    // Accessibility Features
    accessibilitySettings: {
      allowScreenReader: true,
      fontSize: "normal",
      highContrast: false,
      colorBlindSupport: false,
      keyboardNavigation: true
    },
    
    // Emoji-based Mood and Learning Difficulty
    moodSettings: {
      selectedMood: "😊", // Happy/Positive
      learningDifficulty: "🎯", // Medium/Focused
      emotionalTone: "💪", // Encouraging
      motivationalLevel: "🌟" // Inspiring
    },
    
    // Existing fields
    showCorrectAnswers: false,
    showCorrectAnswersAfter: "immediately",
    pointsPerQuestion: 1,
    passingGrade: 70,
    gradeToShow: "percentage",
    status: "draft",
    enableQuestionFeedback: true,
    enableLearningPrescription: true,
    showAnswerReasoning: false,
  });

  const [activeTab, setActiveTab] = useState("details");
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTestbankFilter, setSelectedTestbankFilter] = useState("");

  // Fetch available questions
  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ["/api/questions"],
    retry: false,
  });

  // Fetch testbanks
  const { data: testbanks = [], isLoading: testbanksLoading } = useQuery({
    queryKey: ["/api/testbanks"],
    retry: false,
  });

  // Create quiz mutation
  const createQuizMutation = useMutation({
    mutationFn: async (quizData: Partial<Quiz>) => {
      const response = await apiRequest("POST", "/api/quizzes", quizData);
      return response.json();
    },
    onSuccess: (newQuiz) => {
      toast({
        title: "Quiz Created",
        description: "Your quiz has been created successfully.",
      });
      setQuiz(newQuiz);
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
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
        description: "Failed to create quiz. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create question group mutation
  const createQuestionGroupMutation = useMutation({
    mutationFn: async (groupData: Partial<QuestionGroup>) => {
      const response = await apiRequest("POST", "/api/question-groups", groupData);
      return response.json();
    },
    onSuccess: (newGroup) => {
      setQuestionGroups(prev => [...prev, newGroup]);
      toast({
        title: "Question Group Created",
        description: "Your question group has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create question group.",
        variant: "destructive",
      });
    },
  });

  const handleCreateQuiz = () => {
    if (!quiz.title?.trim()) {
      toast({
        title: "Error",
        description: "Quiz title is required.",
        variant: "destructive",
      });
      return;
    }
    createQuizMutation.mutate(quiz);
  };

  const handleAddQuestionGroup = (groupData: Partial<QuestionGroup>) => {
    if (!quiz.id) {
      toast({
        title: "Error",
        description: "Please save the quiz first before adding question groups.",
        variant: "destructive",
      });
      return;
    }
    createQuestionGroupMutation.mutate({
      ...groupData,
      quizId: quiz.id,
    });
  };

  const handleUpdateQuestionGroup = (groupId: string, updates: Partial<QuestionGroup>) => {
    setQuestionGroups(prev => 
      prev.map(group => 
        group.id === groupId ? { ...group, ...updates } : group
      )
    );
  };

  const handleDeleteQuestionGroup = (groupId: string) => {
    setQuestionGroups(prev => prev.filter(group => group.id !== groupId));
  };

  const handleAssignQuestions = (groupId: string, questionIds: string[]) => {
    // This would make API call to assign questions to group
    toast({
      title: "Questions Assigned",
      description: `${questionIds.length} questions assigned to group.`,
    });
  };

  const availableQuestions = questions
    .filter((q: Question) => q.testbankId)
    .filter((q: Question) => {
      const matchesSearch = !searchTerm || 
        q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesTestbank = !selectedTestbankFilter || q.testbankId === selectedTestbankFilter;
      
      return matchesSearch && matchesTestbank;
    });

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 space-y-6">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Enhanced Quiz Builder</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-primary" />
                Enhanced Quiz Builder
              </h1>
              <p className="text-muted-foreground mt-2">
                Create sophisticated assessments with advanced features including question groups, CAT, and comprehensive proctoring
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={handleCreateQuiz} disabled={createQuizMutation.isPending}>
                <Play className="h-4 w-4 mr-2" />
                {createQuizMutation.isPending ? "Creating..." : "Create Quiz"}
              </Button>
            </div>
          </div>

          {/* Quiz Builder Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="questions" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Questions
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Groups
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="proctoring" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Proctoring
              </TabsTrigger>
              <TabsTrigger value="grading" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Grading
              </TabsTrigger>
              <TabsTrigger value="navigation" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Navigation
              </TabsTrigger>
            </TabsList>

            {/* Quiz Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quiz Information</CardTitle>
                  <CardDescription>
                    Basic information about your quiz
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Quiz Title *</Label>
                      <Input
                        id="title"
                        value={quiz.title || ""}
                        onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter quiz title..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={quiz.status || "draft"} 
                        onValueChange={(value) => setQuiz(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={quiz.description || ""}
                      onChange={(e) => setQuiz(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the purpose and scope of this quiz..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="instructions">Student Instructions</Label>
                    <Textarea
                      id="instructions"
                      value={quiz.instructions || ""}
                      onChange={(e) => setQuiz(prev => ({ ...prev, instructions: e.target.value }))}
                      placeholder="Instructions for students taking this quiz..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                      <Input
                        id="timeLimit"
                        type="number"
                        min="1"
                        value={quiz.timeLimit || 60}
                        onChange={(e) => setQuiz(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 60 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="passingGrade">Passing Grade (%)</Label>
                      <Input
                        id="passingGrade"
                        type="number"
                        min="0"
                        max="100"
                        value={quiz.passingGrade || 70}
                        onChange={(e) => setQuiz(prev => ({ ...prev, passingGrade: parseInt(e.target.value) || 70 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="gradeToShow">Grade Display</Label>
                      <Select 
                        value={quiz.gradeToShow || "percentage"} 
                        onValueChange={(value) => setQuiz(prev => ({ ...prev, gradeToShow: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="points">Points</SelectItem>
                          <SelectItem value="letter">Letter Grade</SelectItem>
                          <SelectItem value="gpa">GPA Scale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Availability Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Availability
                  </CardTitle>
                  <CardDescription>
                    Control when students can access this quiz
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="availableFrom">Available From</Label>
                      <Input
                        id="availableFrom"
                        type="datetime-local"
                        value={quiz.availableFrom || ""}
                        onChange={(e) => setQuiz(prev => ({ ...prev, availableFrom: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="availableUntil">Available Until</Label>
                      <Input
                        id="availableUntil"
                        type="datetime-local"
                        value={quiz.availableUntil || ""}
                        onChange={(e) => setQuiz(prev => ({ ...prev, availableUntil: e.target.value }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emoji-based Mood and Learning Difficulty Selector */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Learning Experience & Mood
                  </CardTitle>
                  <CardDescription>
                    Set the emotional tone and learning difficulty using intuitive emoji selectors
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-6">
                    {/* Mood Selector */}
                    <div>
                      <Label className="text-base font-medium mb-4 block">Student Mood & Atmosphere</Label>
                      <p className="text-sm text-muted-foreground mb-3">Choose the emotional tone for this assessment</p>
                      <div className="grid grid-cols-6 gap-3">
                        {[
                          { emoji: "😊", label: "Happy", description: "Positive & encouraging" },
                          { emoji: "😌", label: "Calm", description: "Relaxed & peaceful" },
                          { emoji: "🤔", label: "Thoughtful", description: "Contemplative & focused" },
                          { emoji: "💪", label: "Confident", description: "Strong & empowered" },
                          { emoji: "🎯", label: "Focused", description: "Targeted & precise" },
                          { emoji: "🌟", label: "Inspired", description: "Motivated & excited" }
                        ].map((mood) => (
                          <div
                            key={mood.emoji}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                              quiz.moodSettings?.selectedMood === mood.emoji
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setQuiz(prev => ({
                              ...prev,
                              moodSettings: {
                                ...prev.moodSettings,
                                selectedMood: mood.emoji
                              }
                            }))}
                          >
                            <div className="text-2xl text-center mb-2">{mood.emoji}</div>
                            <div className="text-xs font-medium text-center">{mood.label}</div>
                            <div className="text-xs text-muted-foreground text-center mt-1">{mood.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Learning Difficulty Selector */}
                    <div>
                      <Label className="text-base font-medium mb-4 block">Learning Difficulty Level</Label>
                      <p className="text-sm text-muted-foreground mb-3">Select the cognitive challenge level</p>
                      <div className="grid grid-cols-5 gap-3">
                        {[
                          { emoji: "🌱", label: "Beginner", description: "Just getting started", color: "green" },
                          { emoji: "📚", label: "Learning", description: "Building knowledge", color: "blue" },
                          { emoji: "🎯", label: "Focused", description: "Applying skills", color: "purple" },
                          { emoji: "🚀", label: "Advanced", description: "Complex challenges", color: "orange" },
                          { emoji: "⚡", label: "Expert", description: "Mastery level", color: "red" }
                        ].map((difficulty, index) => (
                          <div
                            key={difficulty.emoji}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                              quiz.moodSettings?.learningDifficulty === difficulty.emoji
                                ? `border-${difficulty.color}-500 bg-${difficulty.color}-50 dark:bg-${difficulty.color}-950`
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setQuiz(prev => ({
                              ...prev,
                              moodSettings: {
                                ...prev.moodSettings,
                                learningDifficulty: difficulty.emoji
                              }
                            }))}
                          >
                            <div className="text-3xl text-center mb-2">{difficulty.emoji}</div>
                            <div className="text-sm font-medium text-center">{difficulty.label}</div>
                            <div className="text-xs text-muted-foreground text-center mt-1">{difficulty.description}</div>
                            <div className="mt-2">
                              <div className={`w-full bg-gray-200 rounded-full h-2`}>
                                <div
                                  className={`bg-${difficulty.color}-500 h-2 rounded-full transition-all`}
                                  style={{ width: `${(index + 1) * 20}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Emotional Tone Selector */}
                    <div>
                      <Label className="text-base font-medium mb-4 block">Emotional Support & Tone</Label>
                      <p className="text-sm text-muted-foreground mb-3">Choose how the system should emotionally support students</p>
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { emoji: "🤝", label: "Supportive", description: "Encouraging guidance" },
                          { emoji: "💪", label: "Empowering", description: "Building confidence" },
                          { emoji: "🎓", label: "Academic", description: "Professional tone" },
                          { emoji: "🌈", label: "Uplifting", description: "Positive energy" }
                        ].map((tone) => (
                          <div
                            key={tone.emoji}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                              quiz.moodSettings?.emotionalTone === tone.emoji
                                ? "border-purple-500 bg-purple-50 dark:bg-purple-950"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setQuiz(prev => ({
                              ...prev,
                              moodSettings: {
                                ...prev.moodSettings,
                                emotionalTone: tone.emoji
                              }
                            }))}
                          >
                            <div className="text-2xl text-center mb-2">{tone.emoji}</div>
                            <div className="text-sm font-medium text-center">{tone.label}</div>
                            <div className="text-xs text-muted-foreground text-center mt-1">{tone.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Motivational Level Selector */}
                    <div>
                      <Label className="text-base font-medium mb-4 block">Motivational Energy Level</Label>
                      <p className="text-sm text-muted-foreground mb-3">Set the motivational intensity for the learning experience</p>
                      <div className="grid grid-cols-5 gap-3">
                        {[
                          { emoji: "😴", label: "Gentle", description: "Soft encouragement", intensity: 1 },
                          { emoji: "🌸", label: "Mild", description: "Light motivation", intensity: 2 },
                          { emoji: "🌟", label: "Balanced", description: "Steady support", intensity: 3 },
                          { emoji: "🔥", label: "Energetic", description: "High motivation", intensity: 4 },
                          { emoji: "⚡", label: "Intense", description: "Maximum drive", intensity: 5 }
                        ].map((level) => (
                          <div
                            key={level.emoji}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                              quiz.moodSettings?.motivationalLevel === level.emoji
                                ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setQuiz(prev => ({
                              ...prev,
                              moodSettings: {
                                ...prev.moodSettings,
                                motivationalLevel: level.emoji
                              }
                            }))}
                          >
                            <div className="text-2xl text-center mb-2">{level.emoji}</div>
                            <div className="text-sm font-medium text-center">{level.label}</div>
                            <div className="text-xs text-muted-foreground text-center mt-1">{level.description}</div>
                            <div className="mt-2 flex justify-center">
                              <div className="flex space-x-1">
                                {[...Array(5)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full ${
                                      i < level.intensity ? "bg-yellow-500" : "bg-gray-200"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Summary Display */}
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Learning Experience Summary
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Mood:</span>
                          <span className="ml-2 font-medium">
                            {quiz.moodSettings?.selectedMood} 
                            {quiz.moodSettings?.selectedMood === "😊" && " Happy"}
                            {quiz.moodSettings?.selectedMood === "😌" && " Calm"}
                            {quiz.moodSettings?.selectedMood === "🤔" && " Thoughtful"}
                            {quiz.moodSettings?.selectedMood === "💪" && " Confident"}
                            {quiz.moodSettings?.selectedMood === "🎯" && " Focused"}
                            {quiz.moodSettings?.selectedMood === "🌟" && " Inspired"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Difficulty:</span>
                          <span className="ml-2 font-medium">
                            {quiz.moodSettings?.learningDifficulty}
                            {quiz.moodSettings?.learningDifficulty === "🌱" && " Beginner"}
                            {quiz.moodSettings?.learningDifficulty === "📚" && " Learning"}
                            {quiz.moodSettings?.learningDifficulty === "🎯" && " Focused"}
                            {quiz.moodSettings?.learningDifficulty === "🚀" && " Advanced"}
                            {quiz.moodSettings?.learningDifficulty === "⚡" && " Expert"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Support:</span>
                          <span className="ml-2 font-medium">
                            {quiz.moodSettings?.emotionalTone}
                            {quiz.moodSettings?.emotionalTone === "🤝" && " Supportive"}
                            {quiz.moodSettings?.emotionalTone === "💪" && " Empowering"}
                            {quiz.moodSettings?.emotionalTone === "🎓" && " Academic"}
                            {quiz.moodSettings?.emotionalTone === "🌈" && " Uplifting"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Energy:</span>
                          <span className="ml-2 font-medium">
                            {quiz.moodSettings?.motivationalLevel}
                            {quiz.moodSettings?.motivationalLevel === "😴" && " Gentle"}
                            {quiz.moodSettings?.motivationalLevel === "🌸" && " Mild"}
                            {quiz.moodSettings?.motivationalLevel === "🌟" && " Balanced"}
                            {quiz.moodSettings?.motivationalLevel === "🔥" && " Energetic"}
                            {quiz.moodSettings?.motivationalLevel === "⚡" && " Intense"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Questions Tab */}
            <TabsContent value="questions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Question Bank Selection
                  </CardTitle>
                  <CardDescription>
                    Select questions from your testbanks to include in this quiz
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {questionsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : availableQuestions.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Questions Available</h3>
                      <p className="text-sm text-muted-foreground">
                        Create questions in your testbanks first, then return here to build your quiz.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Input
                          placeholder="Search questions..."
                          className="max-w-sm"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Select value={selectedTestbankFilter} onValueChange={setSelectedTestbankFilter}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filter by testbank" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All testbanks</SelectItem>
                            {testbanks.map((testbank: any) => (
                              <SelectItem key={testbank.id} value={testbank.id}>
                                {testbank.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {availableQuestions.length} question{availableQuestions.length === 1 ? '' : 's'} available
                          {selectedQuestions.length > 0 && ` (${selectedQuestions.length} selected)`}
                        </p>
                        {selectedQuestions.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedQuestions([])}
                          >
                            Clear Selection
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid gap-4">
                        {availableQuestions.slice(0, 10).map((question: Question) => (
                          <Card key={question.id} className="p-4">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={selectedQuestions.includes(question.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedQuestions(prev => [...prev, question.id]);
                                  } else {
                                    setSelectedQuestions(prev => prev.filter(id => id !== question.id));
                                  }
                                }}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">
                                    Difficulty {question.difficultyLevel}
                                  </Badge>
                                  <Badge variant="outline">
                                    {question.bloomsLevel}
                                  </Badge>
                                  <Badge variant="outline">
                                    {question.questionType}
                                  </Badge>
                                  <Badge variant="outline">
                                    {question.points} pts
                                  </Badge>
                                </div>
                                <p className="text-sm">
                                  {question.questionText?.slice(0, 200)}...
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Question Groups Tab */}
            <TabsContent value="groups" className="space-y-6">
              <QuestionGroupBuilder
                quizId={quiz.id}
                questionGroups={questionGroups}
                availableQuestions={availableQuestions}
                onAddGroup={handleAddQuestionGroup}
                onUpdateGroup={handleUpdateQuestionGroup}
                onDeleteGroup={handleDeleteQuestionGroup}
                onAssignQuestions={handleAssignQuestions}
              />
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Quiz Behavior
                  </CardTitle>
                  <CardDescription>
                    Configure how the quiz behaves during student attempts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="shuffleQuestions">Shuffle Questions</Label>
                          <p className="text-sm text-muted-foreground">Randomize question order for each student</p>
                        </div>
                        <Switch
                          id="shuffleQuestions"
                          checked={quiz.shuffleQuestions || false}
                          onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, shuffleQuestions: checked }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="shuffleAnswers">Shuffle Answer Options</Label>
                          <p className="text-sm text-muted-foreground">Randomize answer choices</p>
                        </div>
                        <Switch
                          id="shuffleAnswers"
                          checked={quiz.shuffleAnswers || false}
                          onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, shuffleAnswers: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="adaptiveTesting">Computer Adaptive Testing (CAT)</Label>
                          <p className="text-sm text-muted-foreground">Adjust difficulty based on performance</p>
                        </div>
                        <Switch
                          id="adaptiveTesting"
                          checked={quiz.adaptiveTesting || false}
                          onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, adaptiveTesting: checked }))}
                        />
                      </div>

                      {quiz.adaptiveTesting && (
                        <div className="ml-6 border-l-2 border-blue-200 pl-4 space-y-4 bg-blue-50/50 rounded-r-lg p-4">
                          <h4 className="font-medium text-blue-900 flex items-center gap-2">
                            <Brain className="h-4 w-4" />
                            CAT Configuration
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="catModel">CAT Model</Label>
                              <Select 
                                value={quiz.catModel || "rasch"} 
                                onValueChange={(value) => setQuiz(prev => ({ ...prev, catModel: value }))}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="rasch">Rasch Model</SelectItem>
                                  <SelectItem value="2pl">2-Parameter Logistic (2PL)</SelectItem>
                                  <SelectItem value="3pl">3-Parameter Logistic (3PL)</SelectItem>
                                  <SelectItem value="grm">Graded Response Model (GRM)</SelectItem>
                                  <SelectItem value="gpcm">Generalized Partial Credit Model</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="terminationCriteria">Termination Criteria</Label>
                              <Select 
                                value={quiz.catSettings?.terminationCriteria || "fixed_sem"} 
                                onValueChange={(value) => setQuiz(prev => ({ 
                                  ...prev, 
                                  catSettings: { ...prev.catSettings, terminationCriteria: value }
                                }))}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="fixed_sem">Fixed Standard Error</SelectItem>
                                  <SelectItem value="fixed_length">Fixed Test Length</SelectItem>
                                  <SelectItem value="variable_length">Variable Length</SelectItem>
                                  <SelectItem value="confidence_interval">Confidence Interval</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="minQuestions">Minimum Questions: {quiz.catSettings?.minQuestions || 5}</Label>
                              <Slider
                                value={[quiz.catSettings?.minQuestions || 5]}
                                onValueChange={(value) => setQuiz(prev => ({ 
                                  ...prev, 
                                  catSettings: { ...prev.catSettings, minQuestions: value[0] }
                                }))}
                                max={20}
                                min={1}
                                step={1}
                                className="mt-2"
                              />
                            </div>

                            <div>
                              <Label htmlFor="maxQuestions">Maximum Questions: {quiz.catSettings?.maxQuestions || 50}</Label>
                              <Slider
                                value={[quiz.catSettings?.maxQuestions || 50]}
                                onValueChange={(value) => setQuiz(prev => ({ 
                                  ...prev, 
                                  catSettings: { ...prev.catSettings, maxQuestions: value[0] }
                                }))}
                                max={100}
                                min={5}
                                step={1}
                                className="mt-2"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="targetSEM">Target Standard Error: {quiz.catSettings?.targetSEM || 0.32}</Label>
                              <Slider
                                value={[quiz.catSettings?.targetSEM || 0.32]}
                                onValueChange={(value) => setQuiz(prev => ({ 
                                  ...prev, 
                                  catSettings: { ...prev.catSettings, targetSEM: value[0] }
                                }))}
                                max={1.0}
                                min={0.1}
                                step={0.01}
                                className="mt-2"
                              />
                            </div>

                            <div>
                              <Label htmlFor="initialDifficulty">Initial Difficulty: {quiz.catSettings?.initialDifficulty || 0}</Label>
                              <Slider
                                value={[quiz.catSettings?.initialDifficulty || 0]}
                                onValueChange={(value) => setQuiz(prev => ({ 
                                  ...prev, 
                                  catSettings: { ...prev.catSettings, initialDifficulty: value[0] }
                                }))}
                                max={3}
                                min={-3}
                                step={0.1}
                                className="mt-2"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="allowCalculator">On-Screen Calculator</Label>
                          <p className="text-sm text-muted-foreground">Provide a calculator during the exam</p>
                        </div>
                        <Switch
                          id="allowCalculator"
                          checked={quiz.allowCalculator || false}
                          onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, allowCalculator: checked }))}
                        />
                      </div>

                      {quiz.allowCalculator && (
                        <div className="ml-6 border-l-2 border-muted pl-4">
                          <Label htmlFor="calculatorType">Calculator Type</Label>
                          <Select 
                            value={quiz.calculatorType || "basic"} 
                            onValueChange={(value) => setQuiz(prev => ({ ...prev, calculatorType: value }))}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basic">Basic Calculator</SelectItem>
                              <SelectItem value="scientific">Scientific Calculator</SelectItem>
                              <SelectItem value="graphing">Graphing Calculator</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="allowMultipleAttempts">Multiple Attempts</Label>
                          <p className="text-sm text-muted-foreground">Allow students to retake the quiz</p>
                        </div>
                        <Switch
                          id="allowMultipleAttempts"
                          checked={quiz.allowMultipleAttempts || false}
                          onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, allowMultipleAttempts: checked }))}
                        />
                      </div>

                      {quiz.allowMultipleAttempts && (
                        <div className="ml-6 border-l-2 border-green-200 pl-4 space-y-4 bg-green-50/50 rounded-r-lg p-4">
                          <h4 className="font-medium text-green-900 flex items-center gap-2">
                            <Timer className="h-4 w-4" />
                            Attempt Configuration
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="maxAttempts">Maximum Attempts</Label>
                              <Input
                                id="maxAttempts"
                                type="number"
                                min="1"
                                max="10"
                                value={quiz.attemptSettings?.maxAttempts || 1}
                                onChange={(e) => setQuiz(prev => ({ 
                                  ...prev, 
                                  attemptSettings: { 
                                    ...prev.attemptSettings, 
                                    maxAttempts: parseInt(e.target.value) || 1 
                                  }
                                }))}
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <Label htmlFor="attemptGap">Gap Between Attempts (minutes)</Label>
                              <Input
                                id="attemptGap"
                                type="number"
                                min="0"
                                max="1440"
                                value={quiz.attemptSettings?.attemptGap || 0}
                                onChange={(e) => setQuiz(prev => ({ 
                                  ...prev, 
                                  attemptSettings: { 
                                    ...prev.attemptSettings, 
                                    attemptGap: parseInt(e.target.value) || 0 
                                  }
                                }))}
                                className="mt-1"
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label htmlFor="keepHighestScore">Keep Highest Score</Label>
                                <p className="text-xs text-muted-foreground">Use the highest attempt score</p>
                              </div>
                              <Switch
                                id="keepHighestScore"
                                checked={quiz.attemptSettings?.keepHighestScore || true}
                                onCheckedChange={(checked) => setQuiz(prev => ({ 
                                  ...prev, 
                                  attemptSettings: { 
                                    ...prev.attemptSettings, 
                                    keepHighestScore: checked 
                                  }
                                }))}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <Label htmlFor="allowReviewBetweenAttempts">Allow Review Between Attempts</Label>
                                <p className="text-xs text-muted-foreground">Students can see results before retaking</p>
                              </div>
                              <Switch
                                id="allowReviewBetweenAttempts"
                                checked={quiz.attemptSettings?.allowReviewBetweenAttempts || false}
                                onCheckedChange={(checked) => setQuiz(prev => ({ 
                                  ...prev, 
                                  attemptSettings: { 
                                    ...prev.attemptSettings, 
                                    allowReviewBetweenAttempts: checked 
                                  }
                                }))}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <Label htmlFor="timeExtensions">Time Extensions</Label>
                                <p className="text-xs text-muted-foreground">Allow extra time for eligible students</p>
                              </div>
                              <Switch
                                id="timeExtensions"
                                checked={quiz.attemptSettings?.timeExtensions?.enabled || false}
                                onCheckedChange={(checked) => setQuiz(prev => ({ 
                                  ...prev, 
                                  attemptSettings: { 
                                    ...prev.attemptSettings, 
                                    timeExtensions: {
                                      ...prev.attemptSettings?.timeExtensions,
                                      enabled: checked
                                    }
                                  }
                                }))}
                              />
                            </div>

                            {quiz.attemptSettings?.timeExtensions?.enabled && (
                              <div className="ml-4 border-l-2 border-gray-200 pl-4">
                                <div>
                                  <Label htmlFor="timeExtensionPercentage">Additional Time (%): {quiz.attemptSettings?.timeExtensions?.percentage || 50}%</Label>
                                  <Slider
                                    value={[quiz.attemptSettings?.timeExtensions?.percentage || 50]}
                                    onValueChange={(value) => setQuiz(prev => ({ 
                                      ...prev, 
                                      attemptSettings: { 
                                        ...prev.attemptSettings, 
                                        timeExtensions: {
                                          ...prev.attemptSettings?.timeExtensions,
                                          percentage: value[0]
                                        }
                                      }
                                    }))}
                                    max={200}
                                    min={10}
                                    step={10}
                                    className="mt-2"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="showCorrectAnswers">Show Correct Answers</Label>
                          <p className="text-sm text-muted-foreground">Display answers after completion</p>
                        </div>
                        <Switch
                          id="showCorrectAnswers"
                          checked={quiz.showCorrectAnswers || false}
                          onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, showCorrectAnswers: checked }))}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Additional security measures for quiz integrity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="passwordProtected">Password Protection</Label>
                          <p className="text-sm text-muted-foreground">Require password to access quiz</p>
                        </div>
                        <Switch
                          id="passwordProtected"
                          checked={quiz.passwordProtected || false}
                          onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, passwordProtected: checked }))}
                        />
                      </div>

                      {quiz.passwordProtected && (
                        <div>
                          <Label htmlFor="password">Quiz Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={quiz.password || ""}
                            onChange={(e) => setQuiz(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="Enter quiz password..."
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="ipLocking">IP Address Locking</Label>
                          <p className="text-sm text-muted-foreground">Restrict access by IP address</p>
                        </div>
                        <Switch
                          id="ipLocking"
                          checked={quiz.ipLocking || false}
                          onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, ipLocking: checked }))}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Proctoring Tab */}
            <TabsContent value="proctoring" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Live Proctoring Settings
                  </CardTitle>
                  <CardDescription>
                    Configure real-time monitoring and academic integrity measures
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="proctoring" className="text-base">Enable Live Proctoring</Label>
                      <p className="text-sm text-muted-foreground">Monitor students during quiz attempts</p>
                    </div>
                    <Switch
                      id="proctoring"
                      checked={quiz.proctoring || false}
                      onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, proctoring: checked }))}
                    />
                  </div>

                  {quiz.proctoring && (
                    <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
                      <h4 className="font-medium">Proctoring Options</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="requireCamera">Require Camera</Label>
                            <p className="text-xs text-muted-foreground">Student must enable webcam</p>
                          </div>
                          <Switch
                            id="requireCamera"
                            checked={quiz.proctoringSettings?.requireCamera || false}
                            onCheckedChange={(checked) => 
                              setQuiz(prev => ({
                                ...prev,
                                proctoringSettings: {
                                  ...prev.proctoringSettings,
                                  requireCamera: checked
                                }
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="requireMicrophone">Require Microphone</Label>
                            <p className="text-xs text-muted-foreground">Student must enable microphone</p>
                          </div>
                          <Switch
                            id="requireMicrophone"
                            checked={quiz.proctoringSettings?.requireMicrophone || false}
                            onCheckedChange={(checked) => 
                              setQuiz(prev => ({
                                ...prev,
                                proctoringSettings: {
                                  ...prev.proctoringSettings,
                                  requireMicrophone: checked
                                }
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="lockdownBrowser">Lockdown Browser</Label>
                            <p className="text-xs text-muted-foreground">Restrict browser features</p>
                          </div>
                          <Switch
                            id="lockdownBrowser"
                            checked={quiz.proctoringSettings?.lockdownBrowser || false}
                            onCheckedChange={(checked) => 
                              setQuiz(prev => ({
                                ...prev,
                                proctoringSettings: {
                                  ...prev.proctoringSettings,
                                  lockdownBrowser: checked
                                }
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="preventTabSwitching">Prevent Tab Switching</Label>
                            <p className="text-xs text-muted-foreground">Detect when student leaves tab</p>
                          </div>
                          <Switch
                            id="preventTabSwitching"
                            checked={quiz.proctoringSettings?.preventTabSwitching || false}
                            onCheckedChange={(checked) => 
                              setQuiz(prev => ({
                                ...prev,
                                proctoringSettings: {
                                  ...prev.proctoringSettings,
                                  preventTabSwitching: checked
                                }
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="recordSession">Record Session</Label>
                            <p className="text-xs text-muted-foreground">Save video recording for review</p>
                          </div>
                          <Switch
                            id="recordSession"
                            checked={quiz.proctoringSettings?.recordSession || false}
                            onCheckedChange={(checked) => 
                              setQuiz(prev => ({
                                ...prev,
                                proctoringSettings: {
                                  ...prev.proctoringSettings,
                                  recordSession: checked
                                }
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="flagSuspiciousActivity">Flag Suspicious Activity</Label>
                            <p className="text-xs text-muted-foreground">Auto-detect cheating behaviors</p>
                          </div>
                          <Switch
                            id="flagSuspiciousActivity"
                            checked={quiz.proctoringSettings?.flagSuspiciousActivity || false}
                            onCheckedChange={(checked) => 
                              setQuiz(prev => ({
                                ...prev,
                                proctoringSettings: {
                                  ...prev.proctoringSettings,
                                  flagSuspiciousActivity: checked
                                }
                              }))
                            }
                          />
                        </div>
                      </div>

                      <Separator className="my-4" />
                      
                      <div className="space-y-4">
                        <h4 className="font-medium text-orange-900 flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Advanced Monitoring
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="faceDetection">Face Detection</Label>
                              <p className="text-xs text-muted-foreground">Verify student presence</p>
                            </div>
                            <Switch
                              id="faceDetection"
                              checked={quiz.proctoringSettings?.faceDetection || false}
                              onCheckedChange={(checked) => 
                                setQuiz(prev => ({
                                  ...prev,
                                  proctoringSettings: {
                                    ...prev.proctoringSettings,
                                    faceDetection: checked
                                  }
                                }))
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="eyeTracking">Eye Tracking</Label>
                              <p className="text-xs text-muted-foreground">Monitor gaze patterns</p>
                            </div>
                            <Switch
                              id="eyeTracking"
                              checked={quiz.proctoringSettings?.eyeTracking || false}
                              onCheckedChange={(checked) => 
                                setQuiz(prev => ({
                                  ...prev,
                                  proctoringSettings: {
                                    ...prev.proctoringSettings,
                                    eyeTracking: checked
                                  }
                                }))
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="roomScan">Room Scan</Label>
                              <p className="text-xs text-muted-foreground">Require environment check</p>
                            </div>
                            <Switch
                              id="roomScan"
                              checked={quiz.proctoringSettings?.roomScan || false}
                              onCheckedChange={(checked) => 
                                setQuiz(prev => ({
                                  ...prev,
                                  proctoringSettings: {
                                    ...prev.proctoringSettings,
                                    roomScan: checked
                                  }
                                }))
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="idVerification">ID Verification</Label>
                              <p className="text-xs text-muted-foreground">Verify student identity</p>
                            </div>
                            <Switch
                              id="idVerification"
                              checked={quiz.proctoringSettings?.idVerification || false}
                              onCheckedChange={(checked) => 
                                setQuiz(prev => ({
                                  ...prev,
                                  proctoringSettings: {
                                    ...prev.proctoringSettings,
                                    idVerification: checked
                                  }
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Grading Tab */}
            <TabsContent value="grading" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Grading & Feedback
                  </CardTitle>
                  <CardDescription>
                    Configure how grades are calculated and displayed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="pointsPerQuestion">Default Points per Question</Label>
                      <Input
                        id="pointsPerQuestion"
                        type="number"
                        min="0"
                        step="0.1"
                        value={quiz.pointsPerQuestion || 1}
                        onChange={(e) => setQuiz(prev => ({ ...prev, pointsPerQuestion: parseFloat(e.target.value) || 1 }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="gradeDisplay">Grade Display Format</Label>
                      <Select 
                        value={quiz.gradeToShow || "percentage"} 
                        onValueChange={(value) => setQuiz(prev => ({ ...prev, gradeToShow: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (90%)</SelectItem>
                          <SelectItem value="points">Points (18/20)</SelectItem>
                          <SelectItem value="letter">Letter Grade (A-)</SelectItem>
                          <SelectItem value="gpa">GPA Scale (3.7)</SelectItem>
                          <SelectItem value="complete">Complete/Incomplete</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-4">Answer Feedback Settings</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="showCorrectAnswers">Show Correct Answers</Label>
                          <p className="text-sm text-muted-foreground">Display correct answers to students</p>
                        </div>
                        <Switch
                          id="showCorrectAnswers"
                          checked={quiz.showCorrectAnswers || false}
                          onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, showCorrectAnswers: checked }))}
                        />
                      </div>

                      {quiz.showCorrectAnswers && (
                        <div>
                          <Label htmlFor="showCorrectAnswersAfter">Show Answers After</Label>
                          <Select 
                            value={quiz.showCorrectAnswersAfter || "immediately"} 
                            onValueChange={(value) => setQuiz(prev => ({ ...prev, showCorrectAnswersAfter: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="immediately">Immediately</SelectItem>
                              <SelectItem value="submission">After Submission</SelectItem>
                              <SelectItem value="due_date">After Due Date</SelectItem>
                              <SelectItem value="manual">Manual Release</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-4">AI-Powered Learning Features</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="enableQuestionFeedback">Question Feedback</Label>
                          <p className="text-sm text-muted-foreground">AI-generated explanations for each question</p>
                        </div>
                        <Switch
                          id="enableQuestionFeedback"
                          checked={quiz.enableQuestionFeedback || false}
                          onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, enableQuestionFeedback: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="enableLearningPrescription">Learning Prescriptions</Label>
                          <p className="text-sm text-muted-foreground">Personalized study recommendations after quiz completion</p>
                        </div>
                        <Switch
                          id="enableLearningPrescription"
                          checked={quiz.enableLearningPrescription || false}
                          onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, enableLearningPrescription: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="showAnswerReasoning">Answer Reasoning</Label>
                          <p className="text-sm text-muted-foreground">Show explanations for why each answer option is correct/incorrect</p>
                        </div>
                        <Switch
                          id="showAnswerReasoning"
                          checked={quiz.showAnswerReasoning || false}
                          onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, showAnswerReasoning: checked }))}
                        />
                      </div>

                      {quiz.enableLearningPrescription && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <Brain className="h-4 w-4 inline mr-1" />
                            Learning prescriptions will analyze student performance and provide detailed study recommendations based on their quiz results.
                            The level of detail depends on whether correct answers are shown to students.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Navigation & Accessibility Tab */}
            <TabsContent value="navigation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Navigation & Accessibility
                  </CardTitle>
                  <CardDescription>
                    Configure exam navigation, display options, and accessibility features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4" />
                        Navigation Controls
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="allowBacktrack">Allow Backtracking</Label>
                            <p className="text-xs text-muted-foreground">Students can go back to previous questions</p>
                          </div>
                          <Switch
                            id="allowBacktrack"
                            checked={quiz.navigationSettings?.allowBacktrack || true}
                            onCheckedChange={(checked) => 
                              setQuiz(prev => ({
                                ...prev,
                                navigationSettings: {
                                  ...prev.navigationSettings,
                                  allowBacktrack: checked
                                }
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="oneQuestionPerPage">One Question Per Page</Label>
                            <p className="text-xs text-muted-foreground">Display questions individually</p>
                          </div>
                          <Switch
                            id="oneQuestionPerPage"
                            checked={quiz.navigationSettings?.oneQuestionPerPage || false}
                            onCheckedChange={(checked) => 
                              setQuiz(prev => ({
                                ...prev,
                                navigationSettings: {
                                  ...prev.navigationSettings,
                                  oneQuestionPerPage: checked
                                }
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="allowSaveAndContinue">Save & Continue Later</Label>
                            <p className="text-xs text-muted-foreground">Allow pausing and resuming</p>
                          </div>
                          <Switch
                            id="allowSaveAndContinue"
                            checked={quiz.navigationSettings?.allowSaveAndContinue || false}
                            onCheckedChange={(checked) => 
                              setQuiz(prev => ({
                                ...prev,
                                navigationSettings: {
                                  ...prev.navigationSettings,
                                  allowSaveAndContinue: checked
                                }
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Display Options
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="showProgressBar">Progress Bar</Label>
                            <p className="text-xs text-muted-foreground">Show completion progress</p>
                          </div>
                          <Switch
                            id="showProgressBar"
                            checked={quiz.navigationSettings?.showProgressBar || true}
                            onCheckedChange={(checked) => 
                              setQuiz(prev => ({
                                ...prev,
                                navigationSettings: {
                                  ...prev.navigationSettings,
                                  showProgressBar: checked
                                }
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="showQuestionNumbers">Question Numbers</Label>
                            <p className="text-xs text-muted-foreground">Display question numbering</p>
                          </div>
                          <Switch
                            id="showQuestionNumbers"
                            checked={quiz.navigationSettings?.showQuestionNumbers || true}
                            onCheckedChange={(checked) => 
                              setQuiz(prev => ({
                                ...prev,
                                navigationSettings: {
                                  ...prev.navigationSettings,
                                  showQuestionNumbers: checked
                                }
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="showTimeRemaining">Time Remaining</Label>
                            <p className="text-xs text-muted-foreground">Display countdown timer</p>
                          </div>
                          <Switch
                            id="showTimeRemaining"
                            checked={quiz.navigationSettings?.showTimeRemaining || true}
                            onCheckedChange={(checked) => 
                              setQuiz(prev => ({
                                ...prev,
                                navigationSettings: {
                                  ...prev.navigationSettings,
                                  showTimeRemaining: checked
                                }
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <Keyboard className="h-4 w-4" />
                        Accessibility Features
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="allowScreenReader">Screen Reader Support</Label>
                            <p className="text-xs text-muted-foreground">Optimize for assistive technology</p>
                          </div>
                          <Switch
                            id="allowScreenReader"
                            checked={quiz.accessibilitySettings?.allowScreenReader || true}
                            onCheckedChange={(checked) => 
                              setQuiz(prev => ({
                                ...prev,
                                accessibilitySettings: {
                                  ...prev.accessibilitySettings,
                                  allowScreenReader: checked
                                }
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="keyboardNavigation">Keyboard Navigation</Label>
                            <p className="text-xs text-muted-foreground">Full keyboard accessibility</p>
                          </div>
                          <Switch
                            id="keyboardNavigation"
                            checked={quiz.accessibilitySettings?.keyboardNavigation || true}
                            onCheckedChange={(checked) => 
                              setQuiz(prev => ({
                                ...prev,
                                accessibilitySettings: {
                                  ...prev.accessibilitySettings,
                                  keyboardNavigation: checked
                                }
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="highContrast">High Contrast Mode</Label>
                            <p className="text-xs text-muted-foreground">Enhanced visual contrast</p>
                          </div>
                          <Switch
                            id="highContrast"
                            checked={quiz.accessibilitySettings?.highContrast || false}
                            onCheckedChange={(checked) => 
                              setQuiz(prev => ({
                                ...prev,
                                accessibilitySettings: {
                                  ...prev.accessibilitySettings,
                                  highContrast: checked
                                }
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="colorBlindSupport">Color Blind Support</Label>
                            <p className="text-xs text-muted-foreground">Alternative visual indicators</p>
                          </div>
                          <Switch
                            id="colorBlindSupport"
                            checked={quiz.accessibilitySettings?.colorBlindSupport || false}
                            onCheckedChange={(checked) => 
                              setQuiz(prev => ({
                                ...prev,
                                accessibilitySettings: {
                                  ...prev.accessibilitySettings,
                                  colorBlindSupport: checked
                                }
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <Label htmlFor="fontSize">Font Size</Label>
                        <Select 
                          value={quiz.accessibilitySettings?.fontSize || "normal"} 
                          onValueChange={(value) => setQuiz(prev => ({ 
                            ...prev, 
                            accessibilitySettings: {
                              ...prev.accessibilitySettings,
                              fontSize: value
                            }
                          }))}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                            <SelectItem value="extra-large">Extra Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}