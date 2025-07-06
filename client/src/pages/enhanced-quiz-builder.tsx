import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  BookOpen, 
  Plus, 
  Settings,
  Clock,
  Users,
  FileText,
  Save,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Timer,
  ShuffleIcon,
  GraduationCap,
  AlertCircle,
  Target,
  Brain,
  TrendingUp,
  RotateCcw
} from "lucide-react";
import type { Quiz, Question, QuestionGroup, Testbank, AnswerOption } from "@shared/schema";
import { insertQuizSchema, insertQuestionSchema, insertQuestionGroupSchema, insertAnswerOptionSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { QuestionGroupBuilder } from "@/components/quiz/QuestionGroupBuilder";

const quizFormSchema = insertQuizSchema.extend({
  availableFrom: z.string().optional(),
  availableUntil: z.string().optional(),
});

type QuizFormData = z.infer<typeof quizFormSchema>;

const questionFormSchema = insertQuestionSchema.extend({
  answerOptions: z.array(insertAnswerOptionSchema).optional(),
});

type QuestionFormData = z.infer<typeof questionFormSchema>;

export default function EnhancedQuizBuilder() {
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<Partial<Quiz>>({
    title: "",
    description: "",
    instructions: "",
    status: "draft",
    timeLimit: 60,
    passingGrade: 70,
    shuffleQuestions: false,
    shuffleAnswers: false,
    showCorrectAnswers: true,
    allowReview: true,
    maxAttempts: 1,
    gradeToShow: "percentage",
    availableFrom: "",
    availableUntil: "",
    catSettings: {
      initialDifficulty: 5,
      targetSEM: 0.3,
      maxQuestions: 50,
      minQuestions: 10,
      terminationCriteria: "sem",
    },
    attemptSettings: {
      maxAttempts: 1,
      attemptGap: 0,
      attemptGapUnit: "minutes",
      keepHighestScore: true,
      allowReviewBetweenAttempts: false,
      timeExtensions: {},
    },
  });

  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [isAddQuestionDialogOpen, setIsAddQuestionDialogOpen] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTestbank, setSelectedTestbank] = useState("all");
  const [viewingQuizQuestions, setViewingQuizQuestions] = useState(false);

  // Test questions query
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['/api/questions'],
  });

  // Test testbanks query  
  const { data: testbanks } = useQuery({
    queryKey: ['/api/testbanks'],
  });

  const availableQuestions = Array.isArray(questions) ? questions : [];
  
  // Filter questions based on search and testbank
  const filteredQuestions = availableQuestions.filter((question) => {
    const matchesSearch = question.questionText?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesTestbank = selectedTestbank === "all" || question.testbankId === selectedTestbank;
    return matchesSearch && matchesTestbank;
  });

  const toggleQuestionExpansion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const saveDraftMutation = useMutation({
    mutationFn: async (draftData: Partial<Quiz>) => {
      return apiRequest('/api/quizzes', {
        method: 'POST',
        body: JSON.stringify(draftData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Draft Saved",
        description: "Your quiz draft has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes'] });
    },
    onError: (error) => {
      console.error('Save draft error:', error);
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveDraft = () => {
    const draftData = {
      ...quiz,
      status: "draft" as const,
      timeLimit: quiz.timeLimit || null,
    };
    saveDraftMutation.mutate(draftData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Enhanced Quiz Builder</h1>
            <p className="text-muted-foreground">Create comprehensive assessments with advanced features</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleSaveDraft}
              disabled={saveDraftMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveDraftMutation.isPending ? "Saving..." : "Save Draft"}
            </Button>
            <Button>
              <Eye className="h-4 w-4 mr-2" />
              Preview Quiz
            </Button>
            <Button>
              Publish Quiz
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic">Basic Settings</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="groups">Question Groups</TabsTrigger>
            <TabsTrigger value="timing">Timing & Attempts</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="cat">CAT Settings</TabsTrigger>
          </TabsList>

          {/* Basic Settings Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Basic Quiz Settings
                </CardTitle>
                <CardDescription>
                  Configure the fundamental properties of your quiz
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Quiz Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter quiz title"
                      value={quiz.title || ""}
                      onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={quiz.status || "draft"} onValueChange={(value) => setQuiz(prev => ({ ...prev, status: value }))}>
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

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your quiz..."
                    value={quiz.description || ""}
                    onChange={(e) => setQuiz(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions">Instructions for Students</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Provide instructions for taking this quiz..."
                    value={quiz.instructions || ""}
                    onChange={(e) => setQuiz(prev => ({ ...prev, instructions: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="untimed"
                        checked={quiz.timeLimit === null}
                        onCheckedChange={(checked) => setQuiz(prev => ({
                          ...prev,
                          timeLimit: checked ? null : 60
                        }))}
                      />
                      <Label htmlFor="untimed">Untimed Quiz</Label>
                    </div>
                    
                    {quiz.timeLimit !== null && (
                      <div className="space-y-2">
                        <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                        <Input
                          id="timeLimit"
                          type="number"
                          value={quiz.timeLimit || 60}
                          onChange={(e) => setQuiz(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 60 }))}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gradeToShow">Grade Display</Label>
                  <Select value={quiz.gradeToShow || "percentage"} onValueChange={(value) => setQuiz(prev => ({ ...prev, gradeToShow: value }))}>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="availableFrom">Available From</Label>
                    <Input
                      id="availableFrom"
                      type="datetime-local"
                      value={quiz.availableFrom || ""}
                      onChange={(e) => setQuiz(prev => ({ ...prev, availableFrom: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
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
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Quiz Questions
                    </CardTitle>
                    <CardDescription>
                      {viewingQuizQuestions 
                        ? "Questions currently included in this quiz"
                        : "Select questions from your testbanks to include in this quiz"
                      }
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="toggle-view" className="text-sm">
                      {viewingQuizQuestions ? "Show Item Bank Questions" : "Show Quiz Questions"}
                    </Label>
                    <Switch
                      id="toggle-view"
                      checked={viewingQuizQuestions}
                      onCheckedChange={setViewingQuizQuestions}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {viewingQuizQuestions ? (
                  <div className="space-y-4">
                    {selectedQuestions.length === 0 ? (
                      <div className="text-center py-12">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Questions Added Yet</h3>
                        <p className="text-sm text-muted-foreground">
                          Switch to "Show Item Bank Questions" to add questions to this quiz.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedQuestions.map((questionId) => {
                          const question = availableQuestions.find(q => q.id === questionId);
                          if (!question) return null;
                          
                          return (
                            <div key={questionId} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex-1">
                                <div className="font-medium">{question.questionText}</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {question.questionType} • Difficulty: {question.difficultyLevel}/10
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedQuestions(prev => prev.filter(id => id !== questionId));
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {questionsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                      </div>
                    ) : availableQuestions.length === 0 ? (
                      <div className="text-center py-12">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Questions Available</h3>
                        <p className="text-sm text-muted-foreground">
                          Create questions in your testbanks first.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex gap-4 items-center">
                          <div className="flex-1">
                            <Input
                              placeholder="Search questions..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <div className="min-w-[200px]">
                            <Select value={selectedTestbank} onValueChange={setSelectedTestbank}>
                              <SelectTrigger>
                                <SelectValue placeholder="All Testbanks" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Testbanks</SelectItem>
                                {Array.isArray(testbanks) && testbanks.map((testbank) => (
                                  <SelectItem key={testbank.id} value={testbank.id}>
                                    {testbank.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAddQuestionDialogOpen(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Question
                          </Button>
                        </div>

                        {selectedQuestions.length > 0 && (
                          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="text-sm font-medium">
                              {selectedQuestions.length} question{selectedQuestions.length === 1 ? '' : 's'} selected
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedQuestions([])}
                            >
                              Clear Selection
                            </Button>
                          </div>
                        )}

                        <div className="space-y-3">
                          {filteredQuestions.map((question) => (
                            <div
                              key={question.id}
                              className={cn(
                                "flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-accent/50",
                                selectedQuestions.includes(question.id) && "bg-accent border-primary"
                              )}
                              onClick={() => {
                                setSelectedQuestions(prev => 
                                  prev.includes(question.id) 
                                    ? prev.filter(id => id !== question.id)
                                    : [...prev, question.id]
                                );
                              }}
                            >
                              <Checkbox 
                                checked={selectedQuestions.includes(question.id)}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="font-medium">{question.questionText}</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {question.questionType} • Difficulty: {question.difficultyLevel}/10
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {selectedQuestions.length > 0 && (
                          <div className="flex justify-end pt-4">
                            <Button
                              onClick={async () => {
                                try {
                                  toast({
                                    title: "Success",
                                    description: `Added ${selectedQuestions.length} question${selectedQuestions.length === 1 ? '' : 's'} to quiz`,
                                  });
                                  
                                  setSelectedQuestions([]);
                                  setViewingQuizQuestions(true);
                                } catch (error) {
                                  console.error('Error adding questions:', error);
                                  toast({
                                    title: "Error",
                                    description: "Failed to add questions to quiz. Please try again.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className="flex items-center gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Add {selectedQuestions.length} Selected Question{selectedQuestions.length === 1 ? '' : 's'}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Question Groups Tab */}
          <TabsContent value="groups">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Question Groups
                </CardTitle>
                <CardDescription>
                  Organize questions into groups for better assessment structure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuestionGroupBuilder
                  groups={[]}
                  onAddGroup={async (groupData) => {
                    console.log('Adding group:', groupData);
                  }}
                  onUpdateGroup={(groupId, updates) => {
                    console.log('Updating group:', groupId, updates);
                  }}
                  onDeleteGroup={(groupId) => {
                    console.log('Deleting group:', groupId);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timing & Attempts Tab */}
          <TabsContent value="timing">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Timing Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="shuffle-questions"
                      checked={quiz.shuffleQuestions || false}
                      onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, shuffleQuestions: checked }))}
                    />
                    <Label htmlFor="shuffle-questions">Shuffle Questions</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="shuffle-answers"
                      checked={quiz.shuffleAnswers || false}
                      onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, shuffleAnswers: checked }))}
                    />
                    <Label htmlFor="shuffle-answers">Shuffle Answer Options</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RotateCcw className="h-5 w-5" />
                    Attempt Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-attempts">Maximum Attempts</Label>
                    <Input
                      id="max-attempts"
                      type="number"
                      min="1"
                      value={quiz.attemptSettings?.maxAttempts || 1}
                      onChange={(e) => setQuiz(prev => ({
                        ...prev,
                        attemptSettings: {
                          ...prev.attemptSettings,
                          maxAttempts: parseInt(e.target.value) || 1,
                          attemptGap: prev.attemptSettings?.attemptGap || 0,
                          attemptGapUnit: prev.attemptSettings?.attemptGapUnit || "minutes",
                          keepHighestScore: prev.attemptSettings?.keepHighestScore || true,
                          allowReviewBetweenAttempts: prev.attemptSettings?.allowReviewBetweenAttempts || false,
                          timeExtensions: prev.attemptSettings?.timeExtensions || {},
                        }
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Advanced Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-correct-answers"
                    checked={quiz.showCorrectAnswers || false}
                    onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, showCorrectAnswers: checked }))}
                  />
                  <Label htmlFor="show-correct-answers">Show Correct Answers After Submission</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="allow-review"
                    checked={quiz.allowReview || false}
                    onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, allowReview: checked }))}
                  />
                  <Label htmlFor="allow-review">Allow Review Before Submission</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CAT Settings Tab */}
          <TabsContent value="cat">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Computer Adaptive Testing (CAT)
                </CardTitle>
                <CardDescription>
                  Configure adaptive testing parameters for personalized assessments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="termination-criteria">Termination Criteria</Label>
                  <Select 
                    value={quiz.catSettings?.terminationCriteria || "sem"} 
                    onValueChange={(value) => setQuiz(prev => ({
                      ...prev,
                      catSettings: {
                        ...prev.catSettings,
                        terminationCriteria: value,
                        initialDifficulty: prev.catSettings?.initialDifficulty || 5,
                        targetSEM: prev.catSettings?.targetSEM || 0.3,
                        maxQuestions: prev.catSettings?.maxQuestions || 50,
                        minQuestions: prev.catSettings?.minQuestions || 10,
                      }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sem">Standard Error of Measurement</SelectItem>
                      <SelectItem value="fixed">Fixed Number of Items</SelectItem>
                      <SelectItem value="confidence">Confidence Interval</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-questions">Minimum Questions</Label>
                    <Input
                      id="min-questions"
                      type="number"
                      min="1"
                      value={quiz.catSettings?.minQuestions || 10}
                      onChange={(e) => setQuiz(prev => ({
                        ...prev,
                        catSettings: {
                          ...prev.catSettings,
                          minQuestions: parseInt(e.target.value) || 10,
                          initialDifficulty: prev.catSettings?.initialDifficulty || 5,
                          targetSEM: prev.catSettings?.targetSEM || 0.3,
                          maxQuestions: prev.catSettings?.maxQuestions || 50,
                          terminationCriteria: prev.catSettings?.terminationCriteria || "sem",
                        }
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-questions">Maximum Questions</Label>
                    <Input
                      id="max-questions"
                      type="number"
                      min="1"
                      value={quiz.catSettings?.maxQuestions || 50}
                      onChange={(e) => setQuiz(prev => ({
                        ...prev,
                        catSettings: {
                          ...prev.catSettings,
                          maxQuestions: parseInt(e.target.value) || 50,
                          initialDifficulty: prev.catSettings?.initialDifficulty || 5,
                          targetSEM: prev.catSettings?.targetSEM || 0.3,
                          minQuestions: prev.catSettings?.minQuestions || 10,
                          terminationCriteria: prev.catSettings?.terminationCriteria || "sem",
                        }
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target-sem">Target SEM</Label>
                    <Input
                      id="target-sem"
                      type="number"
                      step="0.01"
                      min="0.1"
                      max="1.0"
                      value={quiz.catSettings?.targetSEM || 0.3}
                      onChange={(e) => setQuiz(prev => ({
                        ...prev,
                        catSettings: {
                          ...prev.catSettings,
                          targetSEM: parseFloat(e.target.value) || 0.3,
                          initialDifficulty: prev.catSettings?.initialDifficulty || 5,
                          maxQuestions: prev.catSettings?.maxQuestions || 50,
                          minQuestions: prev.catSettings?.minQuestions || 10,
                          terminationCriteria: prev.catSettings?.terminationCriteria || "sem",
                        }
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="initial-difficulty">Initial Difficulty (1-10)</Label>
                    <Input
                      id="initial-difficulty"
                      type="number"
                      min="1"
                      max="10"
                      value={quiz.catSettings?.initialDifficulty || 5}
                      onChange={(e) => setQuiz(prev => ({
                        ...prev,
                        catSettings: {
                          ...prev.catSettings,
                          initialDifficulty: parseInt(e.target.value) || 5,
                          targetSEM: prev.catSettings?.targetSEM || 0.3,
                          maxQuestions: prev.catSettings?.maxQuestions || 50,
                          minQuestions: prev.catSettings?.minQuestions || 10,
                          terminationCriteria: prev.catSettings?.terminationCriteria || "sem",
                        }
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}