import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
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
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
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
  Target,
  FolderPlus,
  GripVertical,
  X,
  Edit,
  Home,
  ArrowRight,
  User,
  Shield,
  CopyPlus,
  Link
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Droppable } from "@hello-pangea/dnd";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

// Simple enhanced quiz builder with fixed JSX structure
export default function EnhancedQuizBuilder() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  // Basic state management
  const [quiz, setQuiz] = useState({
    title: '',
    description: '',
    instructions: '',
    timeLimit: 60,
    alwaysAvailable: true,
    shuffleQuestions: false,
    shuffleAnswers: false,
    allowMultipleAttempts: false,
    maxAttempts: 1,
    showCorrectAnswers: false,
    showCorrectAnswersAt: 'after_submission',
    passingGrade: 70,
    gradeToShow: 'percentage',
    enableQuestionFeedback: true,
    enableLearningPrescription: true,
    availabilityStart: null,
    availabilityEnd: null,
    passwordProtected: false,
    password: '',
    proctoring: false,
    showQuestionsAfterAttempt: false,
    proctoringSettings: {}
  });

  const [quizQuestions, setQuizQuestions] = useState([]);
  const [questionGroups, setQuestionGroups] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [viewingQuizQuestions, setViewingQuizQuestions] = useState(false);
  const [isAddToGroupDialogOpen, setIsAddToGroupDialogOpen] = useState(false);
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTestbank, setSelectedTestbank] = useState('all');

  // Parse URL parameters to get quiz ID for editing
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const quizId = urlParams.get('id');
  const isEditing = Boolean(quizId);

  // Load existing quiz data if editing
  const { data: existingQuiz, isLoading: quizLoading } = useQuery({
    queryKey: ['/api/quizzes', quizId],
    enabled: isEditing,
  });

  // Update quiz state when existing quiz data is loaded
  useEffect(() => {
    if (existingQuiz) {
      console.log('Loading existing quiz data:', existingQuiz);
      setQuiz({
        title: existingQuiz.title || '',
        description: existingQuiz.description || '',
        instructions: existingQuiz.instructions || '',
        timeLimit: existingQuiz.timeLimit || 60,
        alwaysAvailable: existingQuiz.alwaysAvailable ?? true,
        shuffleQuestions: existingQuiz.shuffleQuestions || false,
        shuffleAnswers: existingQuiz.shuffleAnswers || false,
        allowMultipleAttempts: existingQuiz.allowMultipleAttempts || false,
        maxAttempts: existingQuiz.maxAttempts || 1,
        showCorrectAnswers: existingQuiz.showCorrectAnswers || false,
        showCorrectAnswersAt: existingQuiz.showCorrectAnswersAt || 'after_submission',
        passingGrade: existingQuiz.passingGrade || 70,
        gradeToShow: existingQuiz.gradeToShow || 'percentage',
        enableQuestionFeedback: existingQuiz.enableQuestionFeedback ?? true,
        enableLearningPrescription: existingQuiz.enableLearningPrescription ?? true,
        availabilityStart: existingQuiz.availabilityStart,
        availabilityEnd: existingQuiz.availabilityEnd,
        passwordProtected: existingQuiz.passwordProtected || false,
        password: existingQuiz.password || '',
        proctoring: existingQuiz.proctoring || false,
        showQuestionsAfterAttempt: existingQuiz.showQuestionsAfterAttempt || false,
        proctoringSettings: existingQuiz.proctoringSettings || {}
      });
      
      // Load questions if available
      if (existingQuiz.questions && existingQuiz.questions.length > 0) {
        setQuizQuestions(existingQuiz.questions);
      }
    }
  }, [existingQuiz]);

  // Load testbanks and questions
  const { data: testbanks = [], isLoading: testbanksLoading } = useQuery({
    queryKey: ['/api/testbanks'],
    enabled: !viewingQuizQuestions,
  });

  const { data: availableQuestions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['/api/questions'],
    enabled: !viewingQuizQuestions,
  });

  // Load existing quiz data when editing
  useEffect(() => {
    if (isEditing && existingQuiz) {
      setQuiz({
        title: existingQuiz.title || '',
        description: existingQuiz.description || '',
        instructions: existingQuiz.instructions || '',
        timeLimit: existingQuiz.timeLimit || 60,
        alwaysAvailable: existingQuiz.alwaysAvailable !== false,
        shuffleQuestions: existingQuiz.shuffleQuestions || false,
        shuffleAnswers: existingQuiz.shuffleAnswers || false,
        allowMultipleAttempts: existingQuiz.allowMultipleAttempts || false,
        maxAttempts: existingQuiz.maxAttempts || 1,
        showCorrectAnswers: existingQuiz.showCorrectAnswers || false,
        showCorrectAnswersAt: existingQuiz.showCorrectAnswersAt || 'after_submission',
        passingGrade: existingQuiz.passingGrade || 70,
        gradeToShow: existingQuiz.gradeToShow || 'percentage',
        enableQuestionFeedback: existingQuiz.enableQuestionFeedback !== false,
        enableLearningPrescription: existingQuiz.enableLearningPrescription !== false,
        availabilityStart: existingQuiz.availabilityStart || null,
        availabilityEnd: existingQuiz.availabilityEnd || null,
        passwordProtected: existingQuiz.passwordProtected || false,
        password: existingQuiz.password || '',
        proctoring: existingQuiz.proctoring || false,
        showQuestionsAfterAttempt: existingQuiz.showQuestionsAfterAttempt || false,
        proctoringSettings: existingQuiz.proctoringSettings || {}
      });
      
      // Load quiz questions if they exist
      if (existingQuiz.questions && existingQuiz.questions.length > 0) {
        setQuizQuestions(existingQuiz.questions);
      }
      
      // Load question groups if they exist
      if (existingQuiz.questionGroups && existingQuiz.questionGroups.length > 0) {
        setQuestionGroups(existingQuiz.questionGroups);
      }
    }
  }, [isEditing, existingQuiz]);

  // Filter available questions based on search and testbank
  const filteredQuestions = availableQuestions.filter(question => {
    const matchesSearch = !searchTerm || 
      question.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.questionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.bloomsLevel.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTestbank = selectedTestbank === 'all' || question.testbankId === selectedTestbank;
    
    return matchesSearch && matchesTestbank;
  });

  // DND Kit setup
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setQuizQuestions((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSelectQuestion = (questionId, selected) => {
    setSelectedQuestions(prev => 
      selected 
        ? [...prev, questionId]
        : prev.filter(id => id !== questionId)
    );
  };

  const handleSelectAllQuestions = (checked) => {
    setSelectedQuestions(checked ? quizQuestions.map(q => q.id) : []);
  };

  const handleDeleteSelectedQuestions = () => {
    setQuizQuestions(prev => prev.filter(q => !selectedQuestions.includes(q.id)));
    setSelectedQuestions([]);
  };

  const toggleGroupExpansion = (groupId) => {
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

  // Save quiz functionality
  const handleSaveQuiz = async () => {
    try {
      const url = isEditing ? `/api/quizzes/${quizId}` : '/api/quizzes';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await apiRequest(url, {
        method: method,
        body: JSON.stringify({
          ...quiz,
          questions: quizQuestions,
          questionGroups: questionGroups
        })
      });
      
      toast({
        title: "Quiz Saved",
        description: isEditing ? "Your quiz has been updated successfully." : "Your quiz has been created successfully."
      });
      
      navigate('/quiz-manager');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save quiz. Please try again.",
        variant: "destructive"
      });
    }
  };

  // DraggableQuestion component
  function DraggableQuestion({ question, onRemove, isSelected, onSelect, showCheckbox = false }) {
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
        className={cn(
          "flex items-center gap-3 p-4 bg-card border rounded-lg hover:bg-muted/50 transition-colors",
          isSelected && "ring-2 ring-primary"
        )}
      >
        <div {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        {showCheckbox && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(question.id, checked)}
            className="mt-1"
          />
        )}
        
        <div className="flex-1">
          <div className="font-medium">{question.questionText}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {question.questionType} • Difficulty: {question.difficulty}/10 • Blooms: {question.bloomsLevel}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(question.id)}
          className="text-red-500 hover:text-red-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Show loading state while fetching existing quiz data
  if (isEditing && quizLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <Home className="h-4 w-4 cursor-pointer" onClick={() => navigate('/')} />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="cursor-pointer" onClick={() => navigate('/quiz-manager')}>Quiz Manager</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {isEditing ? `Edit Quiz: ${quiz.title || 'Loading...'}` : 'Enhanced Quiz Builder'}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {isEditing ? 'Edit Quiz' : 'Enhanced Quiz Builder'}
        </h1>
        <p className="text-muted-foreground">
          {isEditing ? 'Update your quiz with advanced features and settings' : 'Create comprehensive quizzes with advanced features and settings'}
        </p>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="timing">Timing & Attempts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Set up the basic details for your quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="quiz-title">Quiz Title</Label>
                <Input
                  id="quiz-title"
                  placeholder="Enter quiz title..."
                  value={quiz.title}
                  onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quiz-description">Description</Label>
                <Textarea
                  id="quiz-description"
                  placeholder="Describe your quiz..."
                  value={quiz.description}
                  onChange={(e) => setQuiz(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quiz-instructions">Instructions</Label>
                <Textarea
                  id="quiz-instructions"
                  placeholder="Provide instructions for quiz takers..."
                  value={quiz.instructions}
                  onChange={(e) => setQuiz(prev => ({ ...prev, instructions: e.target.value }))}
                  rows={4}
                />
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
                    <BookOpen className="h-5 w-5" />
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
                    <div className="space-y-4">
                      {/* Selection Controls */}
                      {quizQuestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedQuestions.length === quizQuestions.length}
                              onCheckedChange={handleSelectAllQuestions}
                            />
                            <Label className="text-sm font-medium">
                              {selectedQuestions.length > 0 
                                ? `${selectedQuestions.length} of ${quizQuestions.length} questions selected`
                                : 'Select All Questions'
                              }
                            </Label>
                          </div>
                          
                          {selectedQuestions.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsAddToGroupDialogOpen(true)}
                              >
                                <FolderPlus className="h-4 w-4 mr-2" />
                                Add to Group
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDeleteSelectedQuestions}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Selected
                              </Button>
                            </div>
                          )}
                        </motion.div>
                      )}

                      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                        <SortableContext items={quizQuestions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-4">
                            {/* Question Groups */}
                            {questionGroups.map((group) => {
                              const groupQuestions = quizQuestions.filter(q => q.groupId === group.id);
                              const isExpanded = expandedGroups.has(group.id);
                              
                              return (
                                <div key={group.id} className="border rounded-lg">
                                  <motion.div 
                                    className="flex items-center justify-between p-4 cursor-pointer bg-muted/50 hover:bg-muted/70 transition-colors"
                                    onClick={() => toggleGroupExpansion(group.id)}
                                    whileHover={{ scale: 1.005 }}
                                    whileTap={{ scale: 0.995 }}
                                    transition={{ duration: 0.1 }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-2">
                                        <motion.div
                                          animate={{ rotate: isExpanded ? 0 : -90 }}
                                          transition={{ duration: 0.2, ease: "easeInOut" }}
                                        >
                                          <ChevronDown className="h-4 w-4" />
                                        </motion.div>
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
                                          setEditingGroup(group);
                                          setIsEditGroupDialogOpen(true);
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
                                  </motion.div>
                                  
                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        className="border-t bg-background overflow-hidden"
                                      >
                                        {groupQuestions.length === 0 ? (
                                          <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1, duration: 0.2 }}
                                            className="p-4 text-center text-muted-foreground"
                                          >
                                            No questions in this group yet
                                          </motion.div>
                                        ) : (
                                          <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.1, duration: 0.2 }}
                                            className="space-y-2 p-4"
                                          >
                                            {groupQuestions.map((question, index) => (
                                              <motion.div
                                                key={question.id}
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 + index * 0.05, duration: 0.2 }}
                                              >
                                                <DraggableQuestion
                                                  question={question}
                                                  onRemove={(questionId) => {
                                                    setQuizQuestions(prev => prev.filter(q => q.id !== questionId));
                                                  }}
                                                  showCheckbox={true}
                                                  isSelected={selectedQuestions.includes(question.id)}
                                                  onSelect={handleSelectQuestion}
                                                />
                                              </motion.div>
                                            ))}
                                          </motion.div>
                                        )}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                            
                            {/* Ungrouped Questions */}
                            {quizQuestions.filter(q => !q.groupId).length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="border rounded-lg"
                              >
                                <div className="p-4 bg-muted/30">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    <h4 className="font-medium">Individual Questions</h4>
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ delay: 0.2, duration: 0.2 }}
                                    >
                                      <Badge variant="secondary">{quizQuestions.filter(q => !q.groupId).length}</Badge>
                                    </motion.div>
                                  </div>
                                </div>
                                <div className="space-y-2 p-4">
                                  {quizQuestions.filter(q => !q.groupId).map((question, index) => (
                                    <motion.div
                                      key={question.id}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.1 + index * 0.05, duration: 0.2 }}
                                    >
                                      <DraggableQuestion
                                        question={question}
                                        onRemove={(questionId) => {
                                          setQuizQuestions(prev => prev.filter(q => q.id !== questionId));
                                        }}
                                        showCheckbox={true}
                                        isSelected={selectedQuestions.includes(question.id)}
                                        onSelect={handleSelectQuestion}
                                      />
                                    </motion.div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </SortableContext>
                      </DndContext>
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
                                  {testbank.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid gap-4">
                        {filteredQuestions.map((question) => (
                          <div
                            key={question.id}
                            className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedQuestions(prev => 
                                prev.includes(question.id) 
                                  ? prev.filter(id => id !== question.id)
                                  : [...prev, question.id]
                              );
                            }}
                          >
                            <div className="flex items-start gap-3">
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
                  Availability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="always-available"
                    checked={quiz.alwaysAvailable ?? true}
                    onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, alwaysAvailable: checked }))}
                  />
                  <Label htmlFor="always-available">Always Available</Label>
                </div>

                {!quiz.alwaysAvailable && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="availability-start">Available From</Label>
                      <Input
                        id="availability-start"
                        type="datetime-local"
                        value={quiz.availabilityStart || ''}
                        onChange={(e) => setQuiz(prev => ({ ...prev, availabilityStart: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="availability-end">Available Until</Label>
                      <Input
                        id="availability-end"
                        type="datetime-local"
                        value={quiz.availabilityEnd || ''}
                        onChange={(e) => setQuiz(prev => ({ ...prev, availabilityEnd: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Time Limit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="time-limit">Time Limit (minutes)</Label>
                  <Input
                    id="time-limit"
                    type="number"
                    min="1"
                    value={quiz.timeLimit}
                    onChange={(e) => setQuiz(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Attempts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allow-multiple-attempts"
                    checked={quiz.allowMultipleAttempts || false}
                    onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, allowMultipleAttempts: checked }))}
                  />
                  <Label htmlFor="allow-multiple-attempts">Allow Multiple Attempts</Label>
                </div>

                {quiz.allowMultipleAttempts && (
                  <div className="space-y-2">
                    <Label htmlFor="max-attempts">Maximum Attempts</Label>
                    <Input
                      id="max-attempts"
                      type="number"
                      min="1"
                      value={quiz.maxAttempts}
                      onChange={(e) => setQuiz(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) }))}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Question Settings
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
                  <Eye className="h-5 w-5" />
                  Results & Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-correct-answers"
                    checked={quiz.showCorrectAnswers || false}
                    onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, showCorrectAnswers: checked }))}
                  />
                  <Label htmlFor="show-correct-answers">Show Correct Answers</Label>
                </div>

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
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 mt-8">
        <Button variant="outline" onClick={() => navigate('/quiz-manager')}>
          Cancel
        </Button>
        <Button variant="outline">
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button onClick={handleSaveQuiz}>
          <Save className="h-4 w-4 mr-2" />
          Save Quiz
        </Button>
      </div>
    </div>
  );
}