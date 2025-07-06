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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,

  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  ChevronRight,
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

// Enhanced interface for questions with group tracking
interface QuizQuestion {
  id: string;
  questionText: string;
  questionType: string;
  difficulty: number;
  bloomsLevel: string;
  groupId?: string | null;
  points: number;
  displayOrder: number;
  // Additional fields from the database
  [key: string]: any;
}

// Enhanced interface for question groups
interface EnhancedQuestionGroup {
  id: string;
  name: string;
  description: string;
  pickCount: number;
  pointsPerQuestion: number;
  displayOrder: number;
  questions: QuizQuestion[];
  // Additional fields from the database
  [key: string]: any;
}

// Drag and drop item component
interface DraggableQuestionProps {
  question: QuizQuestion;
  onRemove: (questionId: string) => void;
}

function DraggableQuestion({ question, onRemove }: DraggableQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center justify-between p-3 border rounded-lg bg-background cursor-move hover:bg-accent/50"
    >
      <div className="flex-1">
        <div className="font-medium">{question.questionText}</div>
        <div className="text-sm text-muted-foreground mt-1">
          {question.questionType} • Difficulty: {question.difficulty}/10 • Points: {question.points}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(question.id);
        }}
      >
        Remove
      </Button>
    </div>
  );
}

// Droppable component for groups
function Droppable({ children, id }: { children: React.ReactNode; id: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-colors",
        isOver && "bg-primary/5 border-primary/20"
      )}
    >
      {children}
    </div>
  );
}

export default function EnhancedQuizBuilder() {
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<Partial<Quiz>>({
    title: "",
    description: "",
    instructions: "",
    timeLimit: 60,
    shuffleQuestions: false,
    shuffleAnswers: false,
    maxAttempts: 1,
    allowMultipleAttempts: false,
    proctoring: false,
    adaptiveTesting: false,
    enableQuestionFeedback: false,
    enableLearningPrescription: false,
    passwordProtected: false,
    ipLocking: false,
  });

  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isAddQuestionDialogOpen, setIsAddQuestionDialogOpen] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTestbank, setSelectedTestbank] = useState("all");
  const [viewingQuizQuestions, setViewingQuizQuestions] = useState(false);
  const [isAddToGroupDialogOpen, setIsAddToGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [questionGroups, setQuestionGroups] = useState<EnhancedQuestionGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Drag end handler for reordering questions and moving between groups
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Handle dropping on a group
    if (overId.startsWith('group-')) {
      const groupId = overId.replace('group-', '');
      moveQuestionToGroup(activeId, groupId);
      return;
    }

    // Handle reordering within the same container
    if (activeId !== overId) {
      setQuizQuestions((items) => {
        const oldIndex = items.findIndex((item) => item.id === activeId);
        const newIndex = items.findIndex((item) => item.id === overId);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Function to move question to a specific group
  const moveQuestionToGroup = (questionId: string, groupId: string) => {
    setQuizQuestions(prev => 
      prev.map(q => 
        q.id === questionId 
          ? { ...q, groupId: groupId }
          : q
      )
    );

    // Update the question groups to include the question
    setQuestionGroups(prev => 
      prev.map(group => {
        if (group.id === groupId) {
          const question = quizQuestions.find(q => q.id === questionId);
          if (question && !group.questions.find(q => q.id === questionId)) {
            return {
              ...group,
              questions: [...group.questions, question]
            };
          }
        } else {
          // Remove question from other groups
          return {
            ...group,
            questions: group.questions.filter(q => q.id !== questionId)
          };
        }
        return group;
      })
    );

    toast({
      title: "Question Moved",
      description: "Question has been moved to the selected group.",
    });
  };

  // Test questions query
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['/api/questions'],
  });

  // Test testbanks query  
  const { data: testbanks } = useQuery({
    queryKey: ['/api/testbanks'],
  });

  const availableQuestions = Array.isArray(questions) ? questions : [];
  
  // Get quiz question IDs for filtering
  const quizQuestionIds = quizQuestions.map(q => q.id);
  
  // Filter questions based on search and testbank, excluding already added questions
  const filteredQuestions = availableQuestions.filter((question) => {
    const matchesSearch = question.questionText?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesTestbank = selectedTestbank === "all" || question.testbankId === selectedTestbank;
    const notInQuiz = !quizQuestionIds.includes(question.id);
    return matchesSearch && matchesTestbank && notInQuiz;
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

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const saveDraftMutation = useMutation({
    mutationFn: async (draftData: Partial<Quiz>) => {
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
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
      title: quiz.title || "Untitled Quiz",
      description: quiz.description || null,
      instructions: quiz.instructions || null,
      timeLimit: quiz.timeLimit || null,
      shuffleQuestions: quiz.shuffleQuestions || false,
      shuffleAnswers: quiz.shuffleAnswers || false,
      maxAttempts: quiz.maxAttempts || 1,
      allowMultipleAttempts: quiz.allowMultipleAttempts || false,
      proctoring: quiz.proctoring || false,
      adaptiveTesting: quiz.adaptiveTesting || false,
      enableQuestionFeedback: quiz.enableQuestionFeedback || false,
      enableLearningPrescription: quiz.enableLearningPrescription || false,
      passwordProtected: quiz.passwordProtected || false,
      ipLocking: quiz.ipLocking || false,
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Settings</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="timing">Timing & Attempts</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
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
                    <div className="flex items-center h-10 px-3 py-2 bg-muted rounded-md">
                      <span className="text-sm text-muted-foreground">Draft</span>
                    </div>
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
                      value="70"
                      placeholder="70"
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gradeToShow">Grade Display</Label>
                  <Select value="percentage" disabled>
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
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={quiz.startTime ? new Date(quiz.startTime).toISOString().slice(0, 16) : ""}
                      onChange={(e) => setQuiz(prev => ({ ...prev, startTime: e.target.value ? new Date(e.target.value) : null }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={quiz.endTime ? new Date(quiz.endTime).toISOString().slice(0, 16) : ""}
                      onChange={(e) => setQuiz(prev => ({ ...prev, endTime: e.target.value ? new Date(e.target.value) : null }))}
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
                    <div className="flex rounded-md border">
                      <Button
                        variant={!viewingQuizQuestions ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewingQuizQuestions(false)}
                        className="rounded-r-none"
                      >
                        Item Banks
                      </Button>
                      <Button
                        variant={viewingQuizQuestions ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewingQuizQuestions(true)}
                        className="rounded-l-none border-l-0"
                      >
                        Quiz Questions
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {viewingQuizQuestions ? (
                  <div className="space-y-4">
                    {quizQuestions.length === 0 && questionGroups.length === 0 ? (
                      <div className="text-center py-12">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Questions Added Yet</h3>
                        <p className="text-sm text-muted-foreground">
                          Switch to "Item Banks" to add questions to this quiz.
                        </p>
                      </div>
                    ) : (
                      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                        <div className="space-y-4">
                          {/* Question Groups */}
                          {questionGroups.map((group) => {
                          // Get quiz questions that belong to this group
                          const groupQuestions = quizQuestions.filter(q => q.groupId === group.id);
                          const isExpanded = expandedGroups.has(group.id);
                          
                          return (
                            <div key={group.id} className="border rounded-lg">
                              <div 
                                className="flex items-center justify-between p-4 cursor-pointer bg-muted/50 hover:bg-muted/70 transition-colors"
                                onClick={() => toggleGroupExpansion(group.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                    <Target className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{group.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {groupQuestions.length} questions • Pick {group.pickCount || 'all'} • {group.pointsPerQuestion || 1} points each
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // TODO: Edit group functionality
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // TODO: Delete group functionality
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                              
                              {isExpanded && (
                                <div className="border-t bg-background">
                                  {groupQuestions.length === 0 ? (
                                    <div className="p-4 text-center text-muted-foreground">
                                      No questions in this group yet
                                    </div>
                                  ) : (
                                    <div className="space-y-2 p-4">
                                      {groupQuestions.map((question) => (
                                        <div key={question.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                                          <div className="flex-1">
                                            <div className="font-medium">{question.questionText}</div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                              {question.questionType}
                                            </div>
                                          </div>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setQuizQuestions(prev => prev.filter(q => q.id !== question.id));
                                            }}
                                          >
                                            Remove
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        {/* Ungrouped Questions */}
                        {(() => {
                          const ungroupedQuestions = quizQuestions.filter(q => !q.groupId);
                          if (ungroupedQuestions.length === 0) return null;
                          
                          return (
                            <div className="border rounded-lg">
                              <div className="p-4 bg-muted/30">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  <h4 className="font-medium">Individual Questions</h4>
                                  <Badge variant="secondary">{ungroupedQuestions.length}</Badge>
                                </div>
                              </div>
                              <div className="space-y-2 p-4">
                                {ungroupedQuestions.map((question) => (
                                  <div key={question.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex-1">
                                      <div className="font-medium">{question.questionText}</div>
                                      <div className="text-sm text-muted-foreground mt-1">
                                        {question.questionType}
                                      </div>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setQuizQuestions(prev => prev.filter(q => q.id !== question.id));
                                      }}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                        </div>
                      </DndContext>
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

                        {filteredQuestions.length > 0 && (
                          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={selectedQuestions.length === filteredQuestions.length}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedQuestions(filteredQuestions.map(q => q.id));
                                  } else {
                                    setSelectedQuestions([]);
                                  }
                                }}
                              />
                              <span className="text-sm font-medium">
                                {selectedQuestions.length > 0 
                                  ? `${selectedQuestions.length} question${selectedQuestions.length === 1 ? '' : 's'} selected`
                                  : 'Select All'
                                }
                              </span>
                            </div>
                            {selectedQuestions.length > 0 && (
                              <div className="flex gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => setIsAddToGroupDialogOpen(true)}
                                >
                                  Add Selected Questions
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedQuestions([])}
                                >
                                  Clear Selection
                                </Button>
                              </div>
                            )}
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
                                  {question.questionType} • Difficulty: {question.difficulty}/10 • Blooms: {question.bloomsLevel}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {selectedQuestions.length > 0 && (
                          <div className="flex justify-end pt-4">
                            <Button
                              onClick={() => setIsAddToGroupDialogOpen(true)}
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
                      value={quiz.maxAttempts || 1}
                      onChange={(e) => setQuiz(prev => ({
                        ...prev,
                        maxAttempts: parseInt(e.target.value) || 1
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
                    id="enable-question-feedback"
                    checked={quiz.enableQuestionFeedback || false}
                    onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, enableQuestionFeedback: checked }))}
                  />
                  <Label htmlFor="enable-question-feedback">Enable Question Feedback</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable-learning-prescription"
                    checked={quiz.enableLearningPrescription || false}
                    onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, enableLearningPrescription: checked }))}
                  />
                  <Label htmlFor="enable-learning-prescription">Enable Learning Prescription</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
      </div>

      {/* Group Selection Dialog */}
      <Dialog open={isAddToGroupDialogOpen} onOpenChange={setIsAddToGroupDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Questions to Group</DialogTitle>
            <DialogDescription>
              Choose how to organize the {selectedQuestions.length} selected question{selectedQuestions.length === 1 ? '' : 's'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-3">
              <Label>Select an option:</Label>
              
              <RadioGroup value={selectedGroupId || ""} onValueChange={setSelectedGroupId} className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="create-new" id="create-new-group" />
                    <Label htmlFor="create-new-group">Create New Group</Label>
                  </div>
                  
                  {selectedGroupId === "create-new" && (
                    <div className="ml-6">
                      <Input
                        placeholder="Enter group name"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="select-existing" id="select-existing-group" />
                    <Label htmlFor="select-existing-group">Select Existing Group</Label>
                  </div>
                  
                  {selectedGroupId === "select-existing" && (
                    <div className="ml-6">
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose existing group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="group1">Group 1</SelectItem>
                          <SelectItem value="group2">Group 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ungrouped" id="add-ungrouped" />
                  <Label htmlFor="add-ungrouped">Add as Ungrouped Questions</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddToGroupDialogOpen(false);
              setSelectedGroupId(null);
              setNewGroupName("");
            }}>
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                try {
                  // Get the actual question objects from selected IDs
                  const questionsToAdd = availableQuestions.filter(q => selectedQuestions.includes(q.id));
                  
                  if (selectedGroupId === "create-new" && newGroupName.trim()) {
                    // Create new group and add questions with proper groupId
                    const groupId = `group-${Date.now()}`;
                    const newGroup: EnhancedQuestionGroup = {
                      id: groupId,
                      name: newGroupName.trim(),
                      description: `Group with ${selectedQuestions.length} questions`,
                      questions: questionsToAdd.map(q => ({ ...q, groupId })),
                      pickCount: questionsToAdd.length,
                      pointsPerQuestion: 1,
                      displayOrder: questionGroups.length + 1
                    };
                    
                    setQuestionGroups(prev => [...prev, newGroup]);
                    
                    // Add questions to quiz with proper groupId
                    const questionsWithGroupId = questionsToAdd.map(q => ({
                      ...q,
                      groupId: groupId,
                      points: 1,
                      displayOrder: quizQuestions.length + questionsToAdd.indexOf(q) + 1
                    }));
                    
                    setQuizQuestions(prev => [...prev, ...questionsWithGroupId]);
                    
                    toast({
                      title: "Success",
                      description: `Created new group "${newGroupName}" with ${selectedQuestions.length} question${selectedQuestions.length === 1 ? '' : 's'}`,
                    });
                  } else if (selectedGroupId === "select-existing") {
                    // Add to existing group (placeholder for now)
                    const questionsWithoutGroup = questionsToAdd.map(q => ({
                      ...q,
                      groupId: null,
                      points: 1,
                      displayOrder: quizQuestions.length + questionsToAdd.indexOf(q) + 1
                    }));
                    
                    setQuizQuestions(prev => [...prev, ...questionsWithoutGroup]);
                    toast({
                      title: "Success",
                      description: `Added ${selectedQuestions.length} question${selectedQuestions.length === 1 ? '' : 's'} to existing group`,
                    });
                  } else if (selectedGroupId === "ungrouped") {
                    // Add as ungrouped questions
                    const ungroupedQuestions = questionsToAdd.map(q => ({
                      ...q,
                      groupId: null,
                      points: 1,
                      displayOrder: quizQuestions.length + questionsToAdd.indexOf(q) + 1
                    }));
                    
                    setQuizQuestions(prev => [...prev, ...ungroupedQuestions]);
                    toast({
                      title: "Success",
                      description: `Added ${selectedQuestions.length} ungrouped question${selectedQuestions.length === 1 ? '' : 's'} to quiz`,
                    });
                  }
                  
                  // Reset states
                  setSelectedQuestions([]);
                  setIsAddToGroupDialogOpen(false);
                  setSelectedGroupId(null);
                  setNewGroupName("");
                  setViewingQuizQuestions(true);
                } catch (error) {
                  console.error('Error adding questions:', error);
                  toast({
                    title: "Error",
                    description: "Failed to add questions. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
              disabled={!selectedGroupId || (selectedGroupId === "create-new" && !newGroupName.trim())}
            >
              Add Questions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}