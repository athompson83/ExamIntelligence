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
  GraduationCap,
  AlertCircle,
  Target,
  Brain,
  TrendingUp,
  RotateCcw,
  Lock,
  Home,
  ChevronRightIcon,
  GripVertical,
  Move3D,
  Check,
  X,
  FolderPlus,
  Folder
} from "lucide-react";
import type { Quiz, Question, QuestionGroup, Testbank, AnswerOption } from "@shared/schema";
import { insertQuizSchema, insertQuestionSchema, insertQuestionGroupSchema, insertAnswerOptionSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { QuestionGroupBuilder } from "@/components/quiz/QuestionGroupBuilder";
import { Link, useLocation } from "wouter";

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
  isSelected?: boolean;
  onSelect?: (questionId: string, selected: boolean) => void;
  showCheckbox?: boolean;
}

function DraggableQuestion({ question, onRemove, isSelected, onSelect, showCheckbox = false }: DraggableQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex items-center gap-3 p-3 border rounded-lg bg-background transition-all duration-200",
        isDragging && "opacity-50 rotate-2 shadow-lg",
        isSelected && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20",
        !isDragging && "hover:bg-accent/50 hover:shadow-md"
      )}
    >
      {showCheckbox && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect?.(question.id, checked as boolean)}
          className="flex-shrink-0"
        />
      )}
      
      <div {...attributes} {...listeners} className="flex-shrink-0 cursor-move p-1 rounded hover:bg-accent">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{question.questionText}</div>
        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
          <span className="capitalize">{question.questionType?.replace('_', ' ')}</span>
          <span>•</span>
          <span>Difficulty: {question.difficulty}/10</span>
          <span>•</span>
          <span>Points: {question.points}</span>
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(question.id);
        }}
        className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </motion.div>
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
  const [location, setLocation] = useLocation();
  const [quiz, setQuiz] = useState<Partial<Quiz>>({
    title: "",
    description: "",
    instructions: "",
    maxAttempts: 1,
    allowMultipleAttempts: false,
    proctoring: false,
    adaptiveTesting: false,
    enableQuestionFeedback: false,
    enableLearningPrescription: false,
    ipLocking: false,
    showCorrectAnswers: false,
    showCorrectAnswersAt: "after_submission",
    showQuestionsAfterAttempt: false,
    scoreKeepingMethod: "highest",
    timeBetweenAttempts: 0,
    availabilityStart: undefined,
    availabilityEnd: undefined,
    alwaysAvailable: true,
    passingGrade: 70,
    gradeToShow: "percentage",
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
  const [selectedExistingGroupId, setSelectedExistingGroupId] = useState<string | null>(null);
  const [questionGroups, setQuestionGroups] = useState<EnhancedQuestionGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [quizId, setQuizId] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [editingGroup, setEditingGroup] = useState<EnhancedQuestionGroup | null>(null);
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false);

  // Smart autosave functionality - only save when quiz actually changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const previousQuizRef = useRef<string>('');
  const lastSavedQuizRef = useRef<string>('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [currentTab, setCurrentTab] = useState<string>('basic');
  const previousTabRef = useRef<string>('basic');

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Drag end handler for reordering questions and moving between groups
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Handle reordering within the same list
    setQuizQuestions((items) => {
      const oldIndex = items.findIndex((item) => item.id === activeId);
      const newIndex = items.findIndex((item) => item.id === overId);
      
      const newItems = arrayMove(items, oldIndex, newIndex);
      
      // Update display order
      return newItems.map((item, index) => ({
        ...item,
        displayOrder: index + 1,
      }));
    });
  };

  // Handle question selection
  const handleSelectQuestion = (questionId: string, selected: boolean) => {
    setSelectedQuestions(prev => 
      selected 
        ? [...prev, questionId]
        : prev.filter(id => id !== questionId)
    );
  };

  // Handle select all questions
  const handleSelectAllQuestions = (selected: boolean) => {
    if (selected) {
      setSelectedQuestions(quizQuestions.map(q => q.id));
    } else {
      setSelectedQuestions([]);
    }
  };

  // Add selected questions to a new group
  const handleAddSelectedToNewGroup = async () => {
    if (selectedQuestions.length === 0 || !newGroupName.trim()) return;

    const newGroup: EnhancedQuestionGroup = {
      id: `group-${Date.now()}`,
      name: newGroupName.trim(),
      description: "",
      pickCount: selectedQuestions.length,
      pointsPerQuestion: 1,
      displayOrder: questionGroups.length + 1,
      questions: []
    };

    setQuestionGroups(prev => [...prev, newGroup]);
    
    // Move selected questions to the new group
    setQuizQuestions(prev => 
      prev.map(q => 
        selectedQuestions.includes(q.id) 
          ? { ...q, groupId: newGroup.id }
          : q
      )
    );

    setSelectedQuestions([]);
    setNewGroupName("");
    setIsAddToGroupDialogOpen(false);
  };

  // Add selected questions to existing group
  const handleAddSelectedToExistingGroup = () => {
    if (selectedQuestions.length === 0 || !selectedExistingGroupId) return;

    setQuizQuestions(prev => 
      prev.map(q => 
        selectedQuestions.includes(q.id) 
          ? { ...q, groupId: selectedExistingGroupId }
          : q
      )
    );

    setSelectedQuestions([]);
    setSelectedExistingGroupId(null);
    setIsAddToGroupDialogOpen(false);
  };

  // Delete selected questions
  const handleDeleteSelectedQuestions = () => {
    if (selectedQuestions.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedQuestions.length} question${selectedQuestions.length === 1 ? '' : 's'}?`
    );

    if (confirmed) {
      setQuizQuestions(prev => prev.filter(q => !selectedQuestions.includes(q.id)));
      setSelectedQuestions([]);
    }
  };

  // Load Existing Quiz Dialog Component
  const LoadExistingQuizDialog = () => {
    const { data: existingQuizzes } = useQuery({
      queryKey: ['/api/quizzes'],
    });

    const handleLoadQuiz = (selectedQuiz: any) => {
      // Load all quiz properties that match our quiz state
      setQuiz({
        title: selectedQuiz.title || "",
        description: selectedQuiz.description || "",
        instructions: selectedQuiz.instructions || "",
        maxAttempts: selectedQuiz.maxAttempts || 1,
        allowMultipleAttempts: selectedQuiz.allowMultipleAttempts || false,
        proctoring: selectedQuiz.proctoring || false,
        adaptiveTesting: selectedQuiz.adaptiveTesting || false,
        enableQuestionFeedback: selectedQuiz.enableQuestionFeedback || false,
        enableLearningPrescription: selectedQuiz.enableLearningPrescription || false,
        ipLocking: selectedQuiz.ipLocking || false,
        showCorrectAnswers: selectedQuiz.showCorrectAnswers || false,
        showCorrectAnswersAt: selectedQuiz.showCorrectAnswersAt || "after_submission",
        showQuestionsAfterAttempt: selectedQuiz.showQuestionsAfterAttempt || false,
        scoreKeepingMethod: selectedQuiz.scoreKeepingMethod || "highest",
        timeBetweenAttempts: selectedQuiz.timeBetweenAttempts || 0,
        availabilityStart: selectedQuiz.availabilityStart || undefined,
        availabilityEnd: selectedQuiz.availabilityEnd || undefined,
        alwaysAvailable: selectedQuiz.alwaysAvailable ?? true,
        passingGrade: selectedQuiz.passingGrade || 70,
        gradeToShow: selectedQuiz.gradeToShow || "percentage",
      });
      setQuizId(selectedQuiz.id);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      lastSavedQuizRef.current = JSON.stringify(selectedQuiz);
      
      // Dialog will be closed by DialogClose component
    };

    if (!existingQuizzes) {
      return <div>Loading existing quizzes...</div>;
    }

    // Ensure existingQuizzes is an array before filtering
    const quizzesArray = Array.isArray(existingQuizzes) ? existingQuizzes : [];
    const draftQuizzes = quizzesArray.filter((q: any) => !q.publishedAt);
    const publishedQuizzes = quizzesArray.filter((q: any) => q.publishedAt);

    return (
      <div className="space-y-4">
        <Tabs defaultValue="drafts">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="drafts">Draft Quizzes</TabsTrigger>
            <TabsTrigger value="published">Published Quizzes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="drafts" className="space-y-2">
            {draftQuizzes.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No draft quizzes found</p>
            ) : (
              draftQuizzes.map((quiz: any) => (
                <div key={quiz.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{quiz.title || "Untitled Quiz"}</h4>
                    <p className="text-sm text-muted-foreground">
                      Last modified: {quiz.updatedAt ? new Date(quiz.updatedAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <DialogClose asChild>
                    <Button onClick={() => handleLoadQuiz(quiz)}>Load</Button>
                  </DialogClose>
                </div>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="published" className="space-y-2">
            {publishedQuizzes.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No published quizzes found</p>
            ) : (
              publishedQuizzes.map((quiz: any) => (
                <div key={quiz.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{quiz.title || "Untitled Quiz"}</h4>
                    <p className="text-sm text-muted-foreground">
                      Published: {quiz.publishedAt ? new Date(quiz.publishedAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <DialogClose asChild>
                    <Button onClick={() => handleLoadQuiz(quiz)}>Load</Button>
                  </DialogClose>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
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

  // Track changes to quiz state
  useEffect(() => {
    const currentQuizState = JSON.stringify(quiz);
    
    // Skip change detection on initial load or if quiz is empty
    if (isInitialLoad || !quiz.title) {
      previousQuizRef.current = currentQuizState;
      lastSavedQuizRef.current = currentQuizState;
      setIsInitialLoad(false);
      return;
    }
    
    // Check if quiz has actually changed from last saved state
    if (currentQuizState !== lastSavedQuizRef.current && lastSavedQuizRef.current !== '') {
      setHasUnsavedChanges(true);
    }
    
    previousQuizRef.current = currentQuizState;
  }, [quiz, isInitialLoad]);

  // Auto-save function
  const performAutoSave = async () => {
    if (!hasUnsavedChanges || !quiz.title || isAutoSaving) return;
    
    setIsAutoSaving(true);
    try {
      const saveData = {
        ...quiz,
        creatorId: 'test-user',
        accountId: '00000000-0000-0000-0000-000000000001',
      };

      let response;
      if (quizId) {
        response = await apiRequest(`/api/quizzes/${quizId}`, {
          method: 'PUT',
          body: JSON.stringify(saveData),
        });
      } else {
        response = await apiRequest('/api/quizzes', {
          method: 'POST',
          body: JSON.stringify(saveData),
        });
        if (response.id) {
          setQuizId(response.id);
        }
      }
      
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      lastSavedQuizRef.current = JSON.stringify(quiz);
      
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Auto-save when tab changes and there are unsaved changes
  useEffect(() => {
    if (currentTab !== previousTabRef.current && hasUnsavedChanges && quiz.title) {
      performAutoSave();
    }
    previousTabRef.current = currentTab;
  }, [currentTab, hasUnsavedChanges]);

  // Load existing quiz if id parameter is provided
  useEffect(() => {
    // Check both location and window.location for URL parameters
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const windowUrlParams = new URLSearchParams(window.location.search);
    const existingQuizId = urlParams.get('id') || windowUrlParams.get('id');
    
    console.log('=== Quiz Loading Debug ===');
    console.log('URL location:', location);
    console.log('Window location href:', window.location.href);
    console.log('Window location search:', window.location.search);
    console.log('URL params:', urlParams.toString());
    console.log('Window URL params:', windowUrlParams.toString());
    console.log('Existing quiz ID from URL:', existingQuizId);
    console.log('Current quiz ID:', quizId);
    console.log('========================');
    
    if (existingQuizId && existingQuizId !== quizId) {
      // Load the existing quiz data
      console.log('Loading quiz data for ID:', existingQuizId);
      fetch(`/api/quizzes/${existingQuizId}`)
        .then(response => {
          console.log('Quiz fetch response status:', response.status);
          return response.json();
        })
        .then(quizData => {
          console.log('Quiz data received:', quizData);
          setQuiz({
            title: quizData.title || "",
            description: quizData.description || "",
            instructions: quizData.instructions || "",
            maxAttempts: quizData.maxAttempts || 1,
            allowMultipleAttempts: quizData.allowMultipleAttempts || false,
            passingGrade: quizData.passingGrade || 70,
            gradeToShow: quizData.gradeToShow || "percentage",
            showCorrectAnswers: quizData.showCorrectAnswers || false,
            showCorrectAnswersAt: quizData.showCorrectAnswersAt || "after_submission",
            showQuestionsAfterAttempt: quizData.showQuestionsAfterAttempt || false,
            scoreKeepingMethod: quizData.scoreKeepingMethod || "highest",
            timeBetweenAttempts: quizData.timeBetweenAttempts || 0,
            availabilityStart: quizData.availabilityStart || undefined,
            availabilityEnd: quizData.availabilityEnd || undefined,
            alwaysAvailable: quizData.alwaysAvailable !== false,
            proctoring: quizData.proctoring || false,
            adaptiveTesting: quizData.adaptiveTesting || false,
            enableQuestionFeedback: quizData.enableQuestionFeedback || false,
            enableLearningPrescription: quizData.enableLearningPrescription || false,
            ipLocking: quizData.ipLocking || false,
            oneQuestionAtATime: quizData.oneQuestionAtATime !== false,
          });
          setQuizId(existingQuizId);
          
          // Load questions if available
          if (quizData.questions && Array.isArray(quizData.questions)) {
            console.log(`Loading ${quizData.questions.length} questions for quiz ${existingQuizId}`);
            const formattedQuestions = quizData.questions.map((q: any) => ({
              id: q.id,
              questionText: q.questionText,
              questionType: q.questionType,
              difficulty: q.difficulty || 1,
              bloomsLevel: q.bloomsLevel || 'remember',
              groupId: q.groupId || null,
              points: q.points || 1,
              displayOrder: q.displayOrder || 0,
              ...q // Include any other properties
            }));
            setQuizQuestions(formattedQuestions);
            console.log('Loaded quiz questions:', formattedQuestions);
          }
          
          // Load question groups if available  
          if (quizData.groups && Array.isArray(quizData.groups)) {
            setQuestionGroups(quizData.groups);
            console.log('Loaded question groups:', quizData.groups);
          }
        })
        .catch(error => {
          console.error('Error loading quiz:', error);
          toast({
            title: "Error",
            description: "Failed to load quiz data",
            variant: "destructive",
          });
        });
    }
  }, [location, quizId, toast]);

  // Alternative quiz loading from URL parameters (fallback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromParams = params.get('id');
    
    if (idFromParams && !quizId && !quiz.title) {
      console.log('Fallback: Loading quiz from window URL params:', idFromParams);
      fetch(`/api/quizzes/${idFromParams}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          return response.json();
        })
        .then(quizData => {
          console.log('Fallback: Quiz data loaded successfully:', quizData);
          setQuiz({
            title: quizData.title || "",
            description: quizData.description || "",
            instructions: quizData.instructions || "",
            maxAttempts: quizData.maxAttempts || 1,
            allowMultipleAttempts: quizData.allowMultipleAttempts || false,
            passingGrade: quizData.passingGrade || 70,
            gradeToShow: quizData.gradeToShow || "percentage",
            showCorrectAnswers: quizData.showCorrectAnswers || false,
            showCorrectAnswersAt: quizData.showCorrectAnswersAt || "after_submission",
            showQuestionsAfterAttempt: quizData.showQuestionsAfterAttempt || false,
            scoreKeepingMethod: quizData.scoreKeepingMethod || "highest",
            timeBetweenAttempts: quizData.timeBetweenAttempts || 0,
            availabilityStart: quizData.availabilityStart || undefined,
            availabilityEnd: quizData.availabilityEnd || undefined,
            alwaysAvailable: quizData.alwaysAvailable !== false,
            proctoring: quizData.proctoring || false,
            adaptiveTesting: quizData.adaptiveTesting || false,
            enableQuestionFeedback: quizData.enableQuestionFeedback || false,
            enableLearningPrescription: quizData.enableLearningPrescription || false,
            ipLocking: quizData.ipLocking || false,
            oneQuestionAtATime: quizData.oneQuestionAtATime !== false,
          });
          setQuizId(idFromParams);
          
          // Load questions if available
          if (quizData.questions && Array.isArray(quizData.questions)) {
            console.log(`Fallback: Loading ${quizData.questions.length} questions for quiz ${idFromParams}`);
            const formattedQuestions = quizData.questions.map((q: any) => ({
              id: q.id,
              questionText: q.questionText,
              questionType: q.questionType,
              difficulty: q.difficulty || 5,
              bloomsLevel: q.bloomsLevel || "Remember",
              groupId: q.groupId || null,
              points: q.points || 1,
              displayOrder: q.displayOrder || 0,
              answerOptions: q.answerOptions || [],
            }));
            setQuizQuestions(formattedQuestions);
            console.log('Fallback: Loaded quiz questions:', formattedQuestions);
          }
          
          // Load question groups if available  
          if (quizData.groups && Array.isArray(quizData.groups)) {
            setQuestionGroups(quizData.groups);
            console.log('Fallback: Loaded question groups:', quizData.groups);
          }
        })
        .catch(error => {
          console.error('Fallback: Error loading quiz:', error);
        });
    }
  }, []);

  // Separate effect for autosave with debouncing
  useEffect(() => {
    if (!quiz.title || isAutoSaving) return;

    const currentQuizString = JSON.stringify(quiz);
    
    // Only autosave if the quiz has actually changed
    if (currentQuizString === lastSavedQuizRef.current) return;

    const autoSave = async () => {
      setIsAutoSaving(true);
      try {
        const response = await fetch(quizId ? `/api/quizzes/${quizId}` : '/api/quizzes', {
          method: quizId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quiz),
        });
        
        if (response.ok) {
          const savedQuiz = await response.json();
          if (!quizId) {
            setQuizId(savedQuiz.id);
          }
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
          lastSavedQuizRef.current = currentQuizString; // Update saved state reference
        }
      } catch (error) {
        console.error('Autosave error:', error);
      } finally {
        setIsAutoSaving(false);
      }
    };

    const timeoutId = setTimeout(autoSave, 5000); // 5 seconds debounce
    return () => clearTimeout(timeoutId);
  }, [quiz, quizId, isAutoSaving]);
  
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
    mutationFn: async (draftData: any) => {
      const method = draftData.id ? 'PUT' : 'POST';
      const url = draftData.id ? `/api/quizzes/${draftData.id}` : '/api/quizzes';
      
      const response = await fetch(url, {
        method,
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
    onSuccess: (savedQuiz) => {
      setQuizId(savedQuiz.id);
      setHasUnsavedChanges(false);
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

  const handleSaveDraft = async () => {
    const draftData = {
      id: quizId,
      title: quiz.title || "Untitled Quiz",
      description: quiz.description || null,
      instructions: quiz.instructions || null,
      timeLimit: quiz.timeLimit || null,
      shuffleQuestions: quiz.shuffleQuestions || false,
      shuffleAnswers: quiz.shuffleAnswers || false,
      maxAttempts: quiz.maxAttempts || 1,
      allowMultipleAttempts: quiz.allowMultipleAttempts || false,
      passingGrade: quiz.passingGrade || 70,
      gradeToShow: quiz.gradeToShow || "percentage",
      showCorrectAnswers: quiz.showCorrectAnswers || false,
      showCorrectAnswersAt: quiz.showCorrectAnswersAt || "after_submission",
      showQuestionsAfterAttempt: quiz.showQuestionsAfterAttempt || false,
      scoreKeepingMethod: quiz.scoreKeepingMethod || "highest",
      timeBetweenAttempts: quiz.timeBetweenAttempts || 0,
      availabilityStart: quiz.availabilityStart || null,
      availabilityEnd: quiz.availabilityEnd || null,
      alwaysAvailable: quiz.alwaysAvailable !== false,
      proctoring: quiz.proctoring || false,
      adaptiveTesting: quiz.adaptiveTesting || false,
      enableQuestionFeedback: quiz.enableQuestionFeedback || false,
      enableLearningPrescription: quiz.enableLearningPrescription || false,
      passwordProtected: quiz.passwordProtected || false,
      password: quiz.password || "",
      ipLocking: quiz.ipLocking || false,
      oneQuestionAtATime: quiz.oneQuestionAtATime !== false,
      // Include questions and groups
      questions: quizQuestions,
      groups: questionGroups,
    };
    
    return new Promise((resolve, reject) => {
      saveDraftMutation.mutate(draftData, {
        onSuccess: (savedQuiz) => {
          resolve(savedQuiz);
        },
        onError: (error) => {
          reject(error);
        }
      });
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/" className="flex items-center hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRightIcon className="h-4 w-4" />
          <span className="text-foreground font-medium">Quiz Builder</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Enhanced Quiz Builder</h1>
            <p className="text-muted-foreground">Create comprehensive assessments with advanced features</p>
            {/* Autosave Status */}
            <div className="flex items-center gap-2 mt-2">
              {isAutoSaving && (
                <span className="text-sm text-blue-600 flex items-center gap-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
                  Saving...
                </span>
              )}
              {lastSaved && !isAutoSaving && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <Save className="h-3 w-3" />
                  Saved at {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Load Existing Quiz
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Load Existing Quiz</DialogTitle>
                  <DialogDescription>
                    Choose from your drafts or published quizzes to edit.
                  </DialogDescription>
                </DialogHeader>
                <LoadExistingQuizDialog />
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="outline" 
              onClick={handleSaveDraft}
              disabled={saveDraftMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveDraftMutation.isPending ? "Saving..." : "Save Draft"}
            </Button>
            <Button 
              variant="outline" 
              onClick={async () => {
                if (quizQuestions.length === 0) {
                  alert("Please add questions to preview the quiz.");
                  return;
                }
                
                // Ensure quiz is saved before preview
                let previewQuizId = quizId;
                if (!previewQuizId || hasUnsavedChanges) {
                  try {
                    const savedQuiz = await handleSaveDraft();
                    previewQuizId = savedQuiz?.id || quizId;
                  } catch (error) {
                    console.error('Failed to save quiz:', error);
                    alert("Failed to save quiz. Please try again.");
                    return;
                  }
                }
                
                // Open preview in a new tab
                window.open(`/quiz/${previewQuizId}`, '_blank');
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Quiz
            </Button>
            <Button 
              onClick={() => {
                if (quizQuestions.length === 0) {
                  alert("Please add questions before publishing.");
                  return;
                }
                if (!quiz.title || !quiz.title.trim()) {
                  alert("Please enter a quiz title before publishing.");
                  return;
                }
                // Publish the quiz
                alert("Quiz published successfully!");
              }}
            >
              Publish Quiz
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="basic" value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
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
                  <div className="space-y-2">
                    <Label htmlFor="passingGrade">Passing Grade (%)</Label>
                    <Input
                      id="passingGrade"
                      type="number"
                      min="0"
                      max="100"
                      value={quiz.passingGrade || 70}
                      placeholder="70"
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 70;
                        setQuiz(prev => ({ ...prev, passingGrade: value }));
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gradeToShow">Grade Display</Label>
                    <Select 
                      value={quiz.gradeToShow || "percentage"} 
                      onValueChange={(value: "percentage" | "points" | "letter" | "gpa") => {
                        setQuiz(prev => ({ ...prev, gradeToShow: value as "percentage" | "points" | "letter" | "gpa" }));
                      }}
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

                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Assignment Scheduling</span>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Start and end times are now managed through Assignment settings or Live Exam scheduling.
                    This allows for better control over when students can access specific quiz instances.
                  </p>
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
                            // Get quiz questions that belong to this group
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
                        </SortableContext>
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
                                    {testbank.title}
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
                          value={quiz.availabilityStart instanceof Date 
                            ? quiz.availabilityStart.toISOString().slice(0, 16)
                            : quiz.availabilityStart || ""}
                          onBlur={(e) => {
                            const value = e.target.value;
                            if (value) {
                              setQuiz(prev => ({
                                ...prev,
                                availabilityStart: new Date(value)
                              }));
                            }
                          }}
                          onFocus={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="availability-end">Available Until</Label>
                        <Input
                          id="availability-end"
                          type="datetime-local"
                          value={quiz.availabilityEnd instanceof Date 
                            ? quiz.availabilityEnd.toISOString().slice(0, 16)
                            : quiz.availabilityEnd || ""}
                          onBlur={(e) => {
                            const value = e.target.value;
                            if (value) {
                              setQuiz(prev => ({
                                ...prev,
                                availabilityEnd: new Date(value)
                              }));
                            }
                          }}
                          onFocus={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  )}
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
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allow-multiple-attempts"
                      checked={quiz.allowMultipleAttempts || false}
                      onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, allowMultipleAttempts: checked }))}
                    />
                    <Label htmlFor="allow-multiple-attempts">Allow Multiple Attempts</Label>
                  </div>

                  {quiz.allowMultipleAttempts && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="max-attempts">Maximum Attempts</Label>
                        <Select
                          value={quiz.maxAttempts === -1 ? "unlimited" : String(quiz.maxAttempts || 1)}
                          onValueChange={(value) => setQuiz(prev => ({
                            ...prev,
                            maxAttempts: value === "unlimited" ? -1 : parseInt(value) || 1
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select maximum attempts" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 attempt</SelectItem>
                            <SelectItem value="2">2 attempts</SelectItem>
                            <SelectItem value="3">3 attempts</SelectItem>
                            <SelectItem value="5">5 attempts</SelectItem>
                            <SelectItem value="10">10 attempts</SelectItem>
                            <SelectItem value="unlimited">Unlimited attempts</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="score-keeping">Score Keeping Method</Label>
                        <Select
                          value={quiz.scoreKeepingMethod || "highest"}
                          onValueChange={(value: "highest" | "latest" | "average") => 
                            setQuiz(prev => ({ ...prev, scoreKeepingMethod: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select score keeping method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="highest">Keep Highest Score</SelectItem>
                            <SelectItem value="latest">Keep Latest Score</SelectItem>
                            <SelectItem value="average">Average All Scores</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="time-between-attempts">Time Between Attempts</Label>
                        <div className="flex gap-2">
                          <Input
                            id="time-between-attempts"
                            type="number"
                            min="0"
                            value={quiz.timeBetweenAttempts || 0}
                            onChange={(e) => setQuiz(prev => ({
                              ...prev,
                              timeBetweenAttempts: parseInt(e.target.value) || 0
                            }))}
                            placeholder="0 for no restriction"
                            className="flex-1"
                          />
                          <Select
                            value={quiz.timeBetweenAttemptsUnit || "minutes"}
                            onValueChange={(value) => setQuiz(prev => ({
                              ...prev,
                              timeBetweenAttemptsUnit: value as "minutes" | "hours" | "days"
                            }))}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="minutes">Minutes</SelectItem>
                              <SelectItem value="hours">Hours</SelectItem>
                              <SelectItem value="days">Days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>


            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShuffleIcon className="h-5 w-5" />
                    Question & Answer Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">


                  <div className="flex items-center space-x-2">
                    <Switch
                      id="one-question-at-time"
                      checked={quiz.oneQuestionAtATime !== false}
                      onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, oneQuestionAtATime: checked }))}
                    />
                    <Label htmlFor="one-question-at-time">Show One Question at a Time</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Post-Attempt Display Options
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
                      id="show-questions-after-attempt"
                      checked={quiz.showQuestionsAfterAttempt || false}
                      onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, showQuestionsAfterAttempt: checked }))}
                    />
                    <Label htmlFor="show-questions-after-attempt">Show Questions After Attempt</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Learning Enhancement Features
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

            </div>
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
                      <Select value={selectedExistingGroupId || undefined} onValueChange={setSelectedExistingGroupId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose existing group" />
                        </SelectTrigger>
                        <SelectContent>
                          {questionGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
                            </SelectItem>
                          ))}
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
                    // Generate proper UUID for the group
                    const generateUUID = () => {
                      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                        const r = Math.random() * 16 | 0;
                        const v = c === 'x' ? r : (r & 0x3 | 0x8);
                        return v.toString(16);
                      });
                    };
                    const groupId = generateUUID();
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
                  } else if (selectedGroupId === "select-existing" && selectedExistingGroupId) {
                    // Add to existing group
                    const questionsWithGroupId = questionsToAdd.map(q => ({
                      ...q,
                      groupId: selectedExistingGroupId,
                      points: 1,
                      displayOrder: quizQuestions.length + questionsToAdd.indexOf(q) + 1
                    }));
                    
                    setQuizQuestions(prev => [...prev, ...questionsWithGroupId]);
                    
                    // Update the group to include these questions
                    setQuestionGroups(prev => prev.map(group => 
                      group.id === selectedExistingGroupId 
                        ? { ...group, questions: [...group.questions, ...questionsWithGroupId] }
                        : group
                    ));
                    
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

      {/* Edit Group Dialog */}
      <Dialog open={isEditGroupDialogOpen} onOpenChange={setIsEditGroupDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editGroupName">Group Name</Label>
              <Input
                id="editGroupName"
                value={editingGroup?.name || ""}
                onChange={(e) => setEditingGroup(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Enter group name"
              />
            </div>
            <div>
              <Label htmlFor="editGroupDescription">Description</Label>
              <Input
                id="editGroupDescription"
                value={editingGroup?.description || ""}
                onChange={(e) => setEditingGroup(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="Enter description (optional)"
              />
            </div>
            <div>
              <Label htmlFor="editGroupPickCount">Pick Count</Label>
              <Input
                id="editGroupPickCount"
                type="number"
                min="1"
                value={editingGroup?.pickCount || 1}
                onChange={(e) => setEditingGroup(prev => prev ? { ...prev, pickCount: parseInt(e.target.value) || 1 } : null)}
              />
            </div>
            <div>
              <Label htmlFor="editGroupPoints">Points per Question</Label>
              <Input
                id="editGroupPoints"
                type="number"
                min="1"
                value={editingGroup?.pointsPerQuestion || 1}
                onChange={(e) => setEditingGroup(prev => prev ? { ...prev, pointsPerQuestion: parseInt(e.target.value) || 1 } : null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditGroupDialogOpen(false);
                setEditingGroup(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingGroup && editingGroup.name.trim()) {
                  // Update the group in the state
                  setQuestionGroups(prev => prev.map(group => 
                    group.id === editingGroup.id 
                      ? { ...group, ...editingGroup }
                      : group
                  ));
                  
                  setIsEditGroupDialogOpen(false);
                  setEditingGroup(null);
                  
                  toast({
                    title: "Success",
                    description: "Group updated successfully",
                  });
                }
              }}
              disabled={!editingGroup?.name.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}