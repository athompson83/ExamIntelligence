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
  Upload,
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
  const urlParams = new URLSearchParams(window.location.search);
  const quizId = urlParams.get('id');
  const isEditing = Boolean(quizId);
  
  console.log('URL Parsing Debug:', {
    location,
    windowLocationSearch: window.location.search,
    urlParams: urlParams.toString(),
    quizId,
    isEditing
  });

  // Load existing quiz data if editing
  const { data: existingQuiz, isLoading: quizLoading, error: quizError } = useQuery({
    queryKey: [`/api/quizzes/${quizId}`],
    enabled: isEditing && !!quizId,
  });

  // Debug logging
  console.log('EnhancedQuizBuilder Debug:', {
    quizId,
    isEditing,
    existingQuiz,
    quizLoading,
    quizError,
    currentQuizState: quiz.title
  });

  // Update quiz state when existing quiz data is loaded
  useEffect(() => {
    console.log('useEffect triggered with existingQuiz:', existingQuiz);
    if (existingQuiz) {
      console.log('Loading existing quiz data:', existingQuiz);
      console.log('Setting quiz state...');
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
      console.log('Quiz state updated with:', existingQuiz.title);
      
      // Load questions if available
      if (existingQuiz.questions && existingQuiz.questions.length > 0) {
        setQuizQuestions(existingQuiz.questions);
      }
    } else {
      console.log('No existingQuiz data to load');
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

  // Publish quiz functionality
  const handlePublishQuiz = async () => {
    try {
      // Validation before publishing
      if (!quiz.title?.trim()) {
        toast({
          title: "Validation Error",
          description: "Quiz title is required before publishing.",
          variant: "destructive"
        });
        return;
      }

      if (quizQuestions.length === 0) {
        toast({
          title: "Validation Error",
          description: "At least one question is required before publishing.",
          variant: "destructive"
        });
        return;
      }

      // Save first if there are unsaved changes, then publish
      let currentQuizId = quizId;
      
      if (!isEditing) {
        // Create quiz first if it's new
        const createUrl = '/api/quizzes';
        const createResponse = await apiRequest(createUrl, {
          method: 'POST',
          body: JSON.stringify({
            ...quiz,
            status: 'draft',
            questions: quizQuestions,
            questionGroups: questionGroups
          })
        });
        
        const createdQuiz = await createResponse.json();
        currentQuizId = createdQuiz.id;
      } else {
        // Update existing quiz first
        const updateUrl = `/api/quizzes/${quizId}`;
        await apiRequest(updateUrl, {
          method: 'PUT',
          body: JSON.stringify({
            ...quiz,
            questions: quizQuestions,
            questionGroups: questionGroups
          })
        });
      }

      // Now publish the quiz
      const publishUrl = `/api/quizzes/${currentQuizId}/publish`;
      await apiRequest(publishUrl, {
        method: 'POST'
      });
      
      // Invalidate quiz cache to update the quiz manager list
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes'] });
      
      toast({
        title: "Quiz Published",
        description: "Your quiz has been published and is now available to students."
      });
      
      navigate('/quiz-manager');
    } catch (error) {
      console.error('Publish error:', error);
      toast({
        title: "Error",
        description: "Failed to publish quiz. Please try again.",
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
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-4 sm:mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <Home className="h-4 w-4 cursor-pointer" onClick={() => navigate('/')} />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="cursor-pointer text-sm" onClick={() => navigate('/quiz-manager')}>
              <span className="hidden sm:inline">Quiz Manager</span>
              <span className="sm:hidden">Quizzes</span>
            </span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-sm">
              <span className="hidden sm:inline">
                {isEditing ? `Edit Quiz: ${quiz.title || 'Loading...'}` : 'Enhanced Quiz Builder'}
              </span>
              <span className="sm:hidden">
                {isEditing ? 'Edit' : 'New Quiz'}
              </span>
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
          {isEditing ? 'Edit Quiz' : 'Enhanced Quiz Builder'}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {isEditing ? 'Update your quiz with advanced features and settings' : 'Create comprehensive quizzes with advanced features and settings'}
        </p>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4">
          <TabsTrigger value="basic" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Basic Info</span>
            <span className="sm:hidden">Basic</span>
          </TabsTrigger>
          <TabsTrigger value="questions" className="text-xs sm:text-sm">Questions</TabsTrigger>
          <TabsTrigger value="timing" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Timing & Attempts</span>
            <span className="sm:hidden">Timing</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic">
          <Card className="card-mobile">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                Basic Information
              </CardTitle>
              <CardDescription className="text-sm">
                Set up the basic details for your quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="quiz-title" className="text-sm font-medium">Quiz Title</Label>
                <Input
                  id="quiz-title"
                  placeholder="Enter quiz title..."
                  value={quiz.title}
                  onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
                  className="text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quiz-description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="quiz-description"
                  placeholder="Describe your quiz..."
                  value={quiz.description}
                  onChange={(e) => setQuiz(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="text-base resize-none"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quiz-instructions" className="text-sm font-medium">Instructions</Label>
                <Textarea
                  id="quiz-instructions"
                  placeholder="Provide instructions for quiz takers..."
                  value={quiz.instructions}
                  onChange={(e) => setQuiz(prev => ({ ...prev, instructions: e.target.value }))}
                  rows={4}
                  className="text-base resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Questions Tab - Mobile Responsive */}
        <TabsContent value="questions">
          <Card className="card-mobile">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
                    Quiz Questions
                  </CardTitle>
                  <CardDescription className="text-sm mt-2">
                    {viewingQuizQuestions 
                      ? "Questions currently included in this quiz"
                      : "Select questions from your testbanks to include in this quiz"
                    }
                  </CardDescription>
                </div>
                {/* Mobile-First Toggle Buttons */}
                <div className="flex items-center w-full sm:w-auto">
                  <div className="flex w-full sm:w-auto rounded-lg border overflow-hidden">
                    <Button
                      variant={!viewingQuizQuestions ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewingQuizQuestions(false)}
                      className="flex-1 sm:flex-none rounded-none text-base sm:text-sm font-medium px-4 py-3 sm:py-2"
                    >
                      <span className="hidden sm:inline">Item Banks</span>
                      <span className="sm:hidden">Item Banks</span>
                    </Button>
                    <Button
                      variant={viewingQuizQuestions ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewingQuizQuestions(true)}
                      className="flex-1 sm:flex-none rounded-none text-base sm:text-sm font-medium px-4 py-3 sm:py-2 border-l"
                    >
                      <span className="hidden sm:inline">Quiz Questions</span>
                      <span className="sm:hidden">Questions</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {viewingQuizQuestions ? (
                <div className="space-y-4 sm:space-y-6">
                  {quizQuestions.length === 0 && questionGroups.length === 0 ? (
                    <div className="text-center py-12 mobile-section">
                      <BookOpen className="h-16 w-16 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-6 sm:mb-4" />
                      <h3 className="text-xl sm:text-lg font-bold mb-3 sm:mb-2">No Questions Added Yet</h3>
                      <p className="text-base sm:text-sm text-muted-foreground mb-6 sm:mb-4">
                        Switch to "Item Banks" to add questions to this quiz.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Enhanced Selection Controls - Mobile Responsive */}
                      {quizQuestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-4 bg-muted/30 rounded-lg border mobile-section"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedQuestions.length === quizQuestions.length}
                              onCheckedChange={handleSelectAllQuestions}
                              className="h-6 w-6 sm:h-5 sm:w-5"
                            />
                            <Label className="text-base sm:text-sm font-medium">
                              {selectedQuestions.length > 0 
                                ? `${selectedQuestions.length} of ${quizQuestions.length} questions selected`
                                : 'Select All Questions'
                              }
                            </Label>
                          </div>
                          
                          {selectedQuestions.length > 0 && (
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 w-full sm:w-auto">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsAddToGroupDialogOpen(true)}
                                className="btn-mobile text-base sm:text-sm font-medium justify-center sm:justify-start"
                              >
                                <FolderPlus className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                                <span className="hidden sm:inline">Add to Group</span>
                                <span className="sm:hidden">Group</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDeleteSelectedQuestions}
                                className="btn-mobile text-base sm:text-sm font-medium text-red-500 hover:text-red-700 justify-center sm:justify-start"
                              >
                                <Trash2 className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                                <span className="hidden sm:inline">Delete Selected</span>
                                <span className="sm:hidden">Delete</span>
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
                    <div className="space-y-4 sm:space-y-6">
                      {/* Enhanced Search & Filter - Mobile Responsive */}
                      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                        <div className="flex-1">
                          <Input
                            placeholder="Search questions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mobile-input text-base w-full"
                          />
                        </div>
                        <div className="w-full sm:min-w-[200px] sm:w-auto">
                          <Select value={selectedTestbank} onValueChange={setSelectedTestbank}>
                            <SelectTrigger className="mobile-select text-base w-full">
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

                      {/* Enhanced Question List - Mobile Responsive */}
                      <div className="grid gap-4 sm:gap-4">
                        {filteredQuestions.map((question) => (
                          <div
                            key={question.id}
                            className="border rounded-xl p-4 sm:p-4 hover:bg-muted/50 active:bg-muted/70 transition-all duration-200 cursor-pointer mobile-section"
                            onClick={() => {
                              setSelectedQuestions(prev => 
                                prev.includes(question.id) 
                                  ? prev.filter(id => id !== question.id)
                                  : [...prev, question.id]
                              );
                            }}
                          >
                            <div className="flex items-start gap-4 sm:gap-3">
                              <Checkbox 
                                checked={selectedQuestions.includes(question.id)}
                                className="mt-1 h-6 w-6 sm:h-5 sm:w-5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-base sm:text-sm leading-relaxed mb-2 sm:mb-1">
                                  {question.questionText}
                                </div>
                                <div className="text-sm sm:text-xs text-muted-foreground flex flex-wrap gap-1 sm:gap-2">
                                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-xs font-medium">
                                    {question.questionType}
                                  </span>
                                  <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md text-xs font-medium">
                                    Difficulty: {question.difficulty}/10
                                  </span>
                                  <span className="inline-flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-md text-xs font-medium">
                                    Blooms: {question.bloomsLevel}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Enhanced Add Selected - Mobile Responsive */}
                      {selectedQuestions.length > 0 && (
                        <div className="flex flex-col sm:flex-row justify-center sm:justify-end pt-6 sm:pt-4">
                          <Button
                            onClick={() => setIsAddToGroupDialogOpen(true)}
                            className="btn-mobile w-full sm:w-auto flex items-center justify-center gap-2 text-base sm:text-sm font-medium"
                          >
                            <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">
                              Add {selectedQuestions.length} Selected Question{selectedQuestions.length === 1 ? '' : 's'}
                            </span>
                            <span className="sm:hidden">
                              Add {selectedQuestions.length} Question{selectedQuestions.length === 1 ? '' : 's'}
                            </span>
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
          <div className="space-y-4 sm:space-y-6">
            <Card className="card-mobile">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  Availability
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="always-available"
                    checked={quiz.alwaysAvailable ?? true}
                    onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, alwaysAvailable: checked }))}
                  />
                  <Label htmlFor="always-available" className="text-sm font-medium">Always Available</Label>
                </div>

                {!quiz.alwaysAvailable && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="availability-start" className="text-sm font-medium">Available From</Label>
                      <Input
                        id="availability-start"
                        type="datetime-local"
                        value={quiz.availabilityStart || ''}
                        onChange={(e) => setQuiz(prev => ({ ...prev, availabilityStart: e.target.value }))}
                        className="text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="availability-end" className="text-sm font-medium">Available Until</Label>
                      <Input
                        id="availability-end"
                        type="datetime-local"
                        value={quiz.availabilityEnd || ''}
                        onChange={(e) => setQuiz(prev => ({ ...prev, availabilityEnd: e.target.value }))}
                        className="text-base"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="card-mobile">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Timer className="h-4 w-4 sm:h-5 sm:w-5" />
                  Time Limit
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="time-limit" className="text-sm font-medium">Time Limit (minutes)</Label>
                  <Input
                    id="time-limit"
                    type="number"
                    min="1"
                    value={quiz.timeLimit}
                    onChange={(e) => setQuiz(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                    className="text-base"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="card-mobile">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  Attempts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allow-multiple-attempts"
                    checked={quiz.allowMultipleAttempts || false}
                    onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, allowMultipleAttempts: checked }))}
                  />
                  <Label htmlFor="allow-multiple-attempts" className="text-sm font-medium">Allow Multiple Attempts</Label>
                </div>

                {quiz.allowMultipleAttempts && (
                  <div className="space-y-2">
                    <Label htmlFor="max-attempts" className="text-sm font-medium">Maximum Attempts</Label>
                    <Input
                      id="max-attempts"
                      type="number"
                      min="1"
                      value={quiz.maxAttempts}
                      onChange={(e) => setQuiz(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) }))}
                      className="text-base"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="space-y-4 sm:space-y-6">
            <Card className="card-mobile">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                  Question Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="shuffle-questions"
                    checked={quiz.shuffleQuestions || false}
                    onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, shuffleQuestions: checked }))}
                  />
                  <Label htmlFor="shuffle-questions" className="text-sm font-medium">Shuffle Questions</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="shuffle-answers"
                    checked={quiz.shuffleAnswers || false}
                    onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, shuffleAnswers: checked }))}
                  />
                  <Label htmlFor="shuffle-answers" className="text-sm font-medium">Shuffle Answer Options</Label>
                </div>
              </CardContent>
            </Card>

            <Card className="card-mobile">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
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

      {/* Enhanced Action Buttons - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-8 pb-4 sm:pb-0">
        <Button 
          variant="outline" 
          onClick={() => navigate('/quiz-manager')}
          className="btn-mobile w-full sm:w-auto text-base sm:text-sm font-medium"
        >
          Cancel
        </Button>
        <Button 
          variant="outline"
          className="btn-mobile w-full sm:w-auto text-base sm:text-sm font-medium"
        >
          <Eye className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
          Preview
        </Button>
        <Button 
          variant="outline" 
          onClick={handleSaveQuiz}
          className="btn-mobile w-full sm:w-auto text-base sm:text-sm font-medium"
        >
          <Save className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
          <span className="hidden sm:inline">Save as Draft</span>
          <span className="sm:hidden">Save</span>
        </Button>
        <Button 
          onClick={handlePublishQuiz} 
          className="bg-green-600 hover:bg-green-700 btn-mobile w-full sm:w-auto text-base sm:text-sm font-medium"
        >
          <Upload className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
          <span className="hidden sm:inline">Publish Quiz</span>
          <span className="sm:hidden">Publish</span>
        </Button>
      </div>
    </div>
  );
}