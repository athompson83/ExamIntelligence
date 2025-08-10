import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import Sidebar from "@/components/Sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  BookOpen, 
  Brain, 
  Wand2, 
  Upload, 
  ExternalLink,
  Tag, 
  Clock, 
  Target,
  FileText,
  Image,
  Video,
  Mic,
  Settings,
  Save,
  X,
  Check,
  AlertTriangle,
  Lightbulb,
  GraduationCap,
  BarChart3,
  Home,
  Bookmark,
  Download,
  ChevronRight,
  RefreshCw,
  Copy,
  Shuffle,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";

// Import specialized question editors - temporarily disabled problematic ones
import { MatchingQuestionEditor } from "@/components/question-types/MatchingQuestionEditor";
// import { SortingQuestionEditor } from "@/components/question-types/SortingQuestionEditor";
import { OrderingQuestionEditor } from "@/components/question-types/OrderingQuestionEditor";
// import { CategorizationQuestionEditor } from "@/components/question-types/CategorizationQuestionEditor";
import { HotSpotQuestionEditor } from "@/components/question-types/HotSpotQuestionEditor";
import { FormulaQuestionEditor } from "@/components/question-types/FormulaQuestionEditor";

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  points: number;
  difficultyScore: number;
  tags: string[];
  bloomsLevel: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  correctFeedback?: string;
  incorrectFeedback?: string;
  generalFeedback?: string;
  partialCredit: boolean;
  aiValidationStatus: string;
  aiConfidenceScore?: number;
  createdAt: string;
  answerOptions?: Array<{
    id: string;
    answerText: string;
    isCorrect: boolean;
    displayOrder: number;
  }>;
}

interface QuestionManagerProps {
  testbankId?: string;
}

export default function QuestionManager({ testbankId }: QuestionManagerProps) {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  // State management
  const [selectedTestbankId, setSelectedTestbankId] = useState<string>(testbankId || "");
  
  // Bulk selection state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  
  // If no testbankId provided, show testbank selection first
  const effectiveTestbankId = testbankId || selectedTestbankId;

  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterBloomsLevel, setFilterBloomsLevel] = useState("all");
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  

  
  // AI Generation Form State
  const [aiForm, setAiForm] = useState({
    topic: "",
    questionCount: 5,
    questionTypes: ["multiple_choice"],
    difficultyRange: [3, 7], // 1-10 scale
    bloomsLevels: ["understand", "apply"],
    includeReferences: true,
    referenceFiles: [] as File[],
    referenceLinks: [""],
    targetAudience: "",
    learningObjectives: [""],
    questionStyles: ["formal"],
    includeImages: false,
    includeMultimedia: false,
    customInstructions: ""
  });

  // Custom Instructions State
  const [customInstructionForm, setCustomInstructionForm] = useState({
    name: "",
    description: "",
    category: "question_generation",
    instructions: ""
  });
  const [showSaveInstructionDialog, setShowSaveInstructionDialog] = useState(false);
  const [showLoadInstructionDialog, setShowLoadInstructionDialog] = useState(false);

  // Question Form State with specialized data fields
  const [questionForm, setQuestionForm] = useState({
    questionText: "",
    questionType: "multiple_choice",
    points: 1,
    difficultyScore: 5,
    tags: [] as string[],
    bloomsLevel: "understand",
    imageUrl: "",
    audioUrl: "",
    videoUrl: "",
    correctFeedback: "",
    incorrectFeedback: "",
    generalFeedback: "",
    partialCredit: false,
    answerOptions: [
      { answerText: "", isCorrect: false, displayOrder: 0 },
      { answerText: "", isCorrect: false, displayOrder: 1 },
      { answerText: "", isCorrect: false, displayOrder: 2 },
      { answerText: "", isCorrect: false, displayOrder: 3 }
    ],
    // Specialized question type data
    matchingData: {
      pairs: [
        { id: "pair-1", leftItem: "", rightItem: "" },
        { id: "pair-2", leftItem: "", rightItem: "" }
      ]
    },
    orderingData: {
      items: [
        { id: "item-1", text: "", correctOrder: 1 },
        { id: "item-2", text: "", correctOrder: 2 }
      ]
    },
    categorizationData: {
      categories: [
        { id: "cat-1", name: "", description: "", items: [] }
      ],
      items: [
        { id: "item-1", text: "", categoryId: "" }
      ]
    },
    hotSpotData: {
      imageUrl: "",
      hotSpots: []
    },
    formulaData: {
      formula: "",
      variables: [],
      tolerance: 0.01
    },
    numericalAnswer: 0,
    numericalTolerance: 0.01
  });

  // Fetch available testbanks when no testbank is selected
  const { data: testbanks, isLoading: testbanksLoading } = useQuery({
    queryKey: ['/api/testbanks'],
    enabled: isAuthenticated && !effectiveTestbankId,
  });

  // Fetch questions
  const { data: questions, isLoading: questionsLoading, error: questionsError } = useQuery({
    queryKey: [`/api/testbanks/${effectiveTestbankId}/questions`],
    enabled: isAuthenticated && !!effectiveTestbankId,
  });

  // Fetch testbank details
  const { data: testbank } = useQuery({
    queryKey: ['/api/testbanks', effectiveTestbankId],
    enabled: isAuthenticated && !!effectiveTestbankId,
  });

  // Fetch custom instructions
  const { data: customInstructions, refetch: refetchCustomInstructions } = useQuery({
    queryKey: ['/api/custom-instructions', { category: 'question_generation' }],
    enabled: isAuthenticated,
  });

  // Create question mutation
  const createQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", `/api/testbanks/${effectiveTestbankId}/questions`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/testbanks/${effectiveTestbankId}/questions`] });
      setIsCreateDialogOpen(false);
      resetQuestionForm();
      toast({
        title: "Success",
        description: "Question created successfully",
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
        description: "Failed to create question",
        variant: "destructive",
      });
    },
  });

  // Custom instruction mutations
  const saveCustomInstructionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/custom-instructions", data);
    },
    onSuccess: () => {
      refetchCustomInstructions();
      setShowSaveInstructionDialog(false);
      setCustomInstructionForm({
        name: "",
        description: "",
        category: "question_generation",
        instructions: ""
      });
      toast({
        title: "Success",
        description: "Custom instruction saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save custom instruction",
        variant: "destructive",
      });
    },
  });

  // Check API key availability
  const { data: apiKeyStatus } = useQuery({
    queryKey: ['/api/check-openai-key'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Progress tracking state
  const [generationProgress, setGenerationProgress] = useState({
    isGenerating: false,
    status: '',
    current: 0,
    total: 0,
    percentage: 0
  });

  // Delete questions mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const response = await apiRequest("DELETE", `/api/testbanks/${effectiveTestbankId}/questions/${questionId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/testbanks/${effectiveTestbankId}/questions`] });
      toast({
        title: "Success",
        description: "Question deleted successfully",
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
        description: "Failed to delete question",
        variant: "destructive",
      });
    },
  });

  // Bulk delete questions mutation
  const bulkDeleteQuestionsMutation = useMutation({
    mutationFn: async (questionIds: string[]) => {
      const response = await apiRequest("POST", `/api/testbanks/${effectiveTestbankId}/questions/bulk-delete`, { 
        questionIds 
      });
      return response.json();
    },
    onSuccess: (_, questionIds) => {
      queryClient.invalidateQueries({ queryKey: [`/api/testbanks/${effectiveTestbankId}/questions`] });
      setSelectedQuestions(new Set());
      setIsSelectMode(false);
      toast({
        title: "Success",
        description: `${questionIds.length} questions deleted successfully`,
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
        description: "Failed to delete selected questions",
        variant: "destructive",
      });
    },
  });

  // Bulk operations helper functions
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedQuestions(new Set());
  };

  const toggleSelectQuestion = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const selectAllQuestions = () => {
    const allIds = filteredQuestions.map(q => q.id);
    setSelectedQuestions(new Set(allIds));
  };

  const deselectAllQuestions = () => {
    setSelectedQuestions(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedQuestions.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select questions to delete",
        variant: "destructive",
      });
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete ${selectedQuestions.size} selected question(s)? This action cannot be undone.`
    );

    if (confirmed) {
      bulkDeleteQuestionsMutation.mutate(Array.from(selectedQuestions));
    }
  };

  // Custom instruction helper functions
  const handleSaveCustomInstruction = () => {
    if (!customInstructionForm.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for the custom instruction.",
        variant: "destructive",
      });
      return;
    }

    if (!customInstructionForm.instructions.trim()) {
      toast({
        title: "Instructions Required",
        description: "Please enter the instruction content.",
        variant: "destructive",
      });
      return;
    }

    saveCustomInstructionMutation.mutate({
      ...customInstructionForm,
      instructions: aiForm.customInstructions // Use current instructions from the form
    });
  };

  const handleLoadCustomInstruction = (instruction: any) => {
    setAiForm(prev => ({ ...prev, customInstructions: instruction.instructions }));
    setShowLoadInstructionDialog(false);
    toast({
      title: "Instructions Loaded",
      description: `Loaded "${instruction.name}" into custom instructions field.`,
    });
  };

  const handleSaveCurrentInstructions = () => {
    setCustomInstructionForm(prev => ({ 
      ...prev, 
      instructions: aiForm.customInstructions 
    }));
    setShowSaveInstructionDialog(true);
  };

  // AI Generation with real-time progress tracking
  const handleAIGeneration = async (data: any) => {
    console.log("Generating questions with data:", data);
    
    // Validate API key first
    if (!apiKeyStatus?.available) {
      toast({
        title: "API Key Required",
        description: "OpenAI API key is required for AI question generation. Please contact your administrator to set up the API key.",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (!data.topic?.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic for question generation.",
        variant: "destructive",
      });
      return;
    }

    if (data.questionCount < 1 || data.questionCount > 50) {
      toast({
        title: "Invalid Question Count",
        description: "Please enter a question count between 1 and 50.",
        variant: "destructive",
      });
      return;
    }

    // Optimize the prompt automatically
    const optimizedData = {
      ...data,
      customInstructions: data.customInstructions ? 
        `Enhanced instructions: ${data.customInstructions}. Please generate high-quality, educationally sound questions following evidence-based assessment practices and Canvas LMS standards.` :
        "Generate high-quality, educationally sound questions following evidence-based assessment practices and Canvas LMS standards."
    };

    // Start progress tracking
    setGenerationProgress({
      isGenerating: true,
      status: 'Initializing question generation...',
      current: 0,
      total: data.questionCount || 5,
      percentage: 0
    });

    try {
      // Use Server-Sent Events for real-time progress
      const params = new URLSearchParams({
        data: JSON.stringify(optimizedData)
      });
      
      const eventSource = new EventSource(`/api/testbanks/${effectiveTestbankId}/generate-questions-progress?${params}`);
      
      eventSource.onmessage = (event) => {
        const progressData = JSON.parse(event.data);
        
        if (progressData.type === 'progress') {
          setGenerationProgress({
            isGenerating: true,
            status: progressData.status,
            current: progressData.current,
            total: progressData.total,
            percentage: progressData.percentage
          });
        } else if (progressData.type === 'complete') {
          eventSource.close();
          setGenerationProgress({
            isGenerating: false,
            status: 'Generation completed!',
            current: progressData.count,
            total: progressData.count,
            percentage: 100
          });
          
          // Refresh questions list
          queryClient.invalidateQueries({ queryKey: [`/api/testbanks/${effectiveTestbankId}/questions`] });
          setIsAiDialogOpen(false);
          
          // Reset form
          setAiForm(prev => ({
            ...prev,
            topic: "",
            customInstructions: "",
            questionStyles: ["formal"]
          }));
          
          toast({
            title: "Questions Generated Successfully",
            description: `Generated ${progressData.count} high-quality questions with AI validation`,
          });
          
          // Reset progress after 2 seconds
          setTimeout(() => {
            setGenerationProgress({
              isGenerating: false,
              status: '',
              current: 0,
              total: 0,
              percentage: 0
            });
          }, 2000);
        } else if (progressData.type === 'error') {
          eventSource.close();
          setGenerationProgress({
            isGenerating: false,
            status: 'Generation failed',
            current: 0,
            total: 0,
            percentage: 0
          });
          
          toast({
            title: "Generation Failed",
            description: progressData.error || "Failed to generate questions",
            variant: "destructive",
          });
        }
      };
      
      eventSource.onerror = () => {
        eventSource.close();
        setGenerationProgress({
          isGenerating: false,
          status: 'Connection error',
          current: 0,
          total: 0,
          percentage: 0
        });
        
        toast({
          title: "Connection Error",
          description: "Lost connection to server during generation",
          variant: "destructive",
        });
      };
      
    } catch (error: any) {
      setGenerationProgress({
        isGenerating: false,
        status: 'Error occurred',
        current: 0,
        total: 0,
        percentage: 0
      });
      
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate questions with AI",
        variant: "destructive",
      });
    }
  };

  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PUT", `/api/questions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/testbanks/${effectiveTestbankId}/questions`] });
      setEditingQuestion(null);
      setIsCreateDialogOpen(false);
      resetQuestionForm();
      toast({
        title: "Success",
        description: "Question updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update question",
        variant: "destructive",
      });
    },
  });



  const resetQuestionForm = () => {
    setQuestionForm({
      questionText: "",
      questionType: "multiple_choice",
      points: 1,
      difficultyScore: 5,
      tags: [],
      bloomsLevel: "understand",
      imageUrl: "",
      audioUrl: "",
      videoUrl: "",
      correctFeedback: "",
      incorrectFeedback: "",
      generalFeedback: "",
      partialCredit: false,
      answerOptions: [
        { answerText: "", isCorrect: false, displayOrder: 0 },
        { answerText: "", isCorrect: false, displayOrder: 1 },
        { answerText: "", isCorrect: false, displayOrder: 2 },
        { answerText: "", isCorrect: false, displayOrder: 3 }
      ]
    });
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionForm({
      questionText: question.questionText,
      questionType: question.questionType,
      points: question.points,
      difficultyScore: question.difficultyScore,
      tags: question.tags || [],
      bloomsLevel: question.bloomsLevel || "understand",
      imageUrl: question.imageUrl || "",
      audioUrl: question.audioUrl || "",
      videoUrl: question.videoUrl || "",
      correctFeedback: question.correctFeedback || "",
      incorrectFeedback: question.incorrectFeedback || "",
      generalFeedback: question.generalFeedback || "",
      partialCredit: question.partialCredit || false,
      answerOptions: question.answerOptions || [
        { answerText: "", isCorrect: false, displayOrder: 0 },
        { answerText: "", isCorrect: false, displayOrder: 1 },
        { answerText: "", isCorrect: false, displayOrder: 2 },
        { answerText: "", isCorrect: false, displayOrder: 3 }
      ]
    });
    setIsCreateDialogOpen(true);
  };

  const handleSubmitQuestion = () => {
    const data = {
      ...questionForm,
      testbankId,
    };

    if (editingQuestion) {
      updateQuestionMutation.mutate({ id: editingQuestion.id, data });
    } else {
      createQuestionMutation.mutate(data);
    }
  };

  const handleSubmitAiGeneration = () => {
    // Frontend validation before sending to backend
    if (!aiForm.topic || aiForm.topic.trim() === "") {
      toast({
        title: "Validation Error",
        description: "Please enter a topic for question generation.",
        variant: "destructive",
      });
      return;
    }

    if (!aiForm.questionTypes || aiForm.questionTypes.length === 0) {
      toast({
        title: "Validation Error", 
        description: "Please select at least one question type.",
        variant: "destructive",
      });
      return;
    }

    const data = {
      ...aiForm,
      testbankId,
      referenceLinks: aiForm.referenceLinks.filter(link => link.trim() !== ""),
      learningObjectives: aiForm.learningObjectives.filter(obj => obj.trim() !== ""),
    };

    console.log("Sending AI generation data:", data); // Debug log
    handleAIGeneration(data);
  };

  // Question Management Actions
  const handleAcceptQuestion = async (questionId: string) => {
    try {
      await apiRequest("PUT", `/api/questions/${questionId}`, {
        aiValidationStatus: "approved"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/testbanks/${effectiveTestbankId}/questions`] });
      toast({
        title: "Success",
        description: "Question approved successfully",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to approve question",
        variant: "destructive",
      });
    }
  };

  const handleRejectQuestion = async (questionId: string) => {
    try {
      await apiRequest("PUT", `/api/questions/${questionId}`, {
        aiValidationStatus: "rejected"
      });
      
      // Optimistically update the UI to immediately remove the rejected question
      queryClient.setQueryData([`/api/testbanks/${effectiveTestbankId}/questions`], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter((question: any) => question.id !== questionId);
      });
      
      // Also invalidate to ensure data consistency
      queryClient.invalidateQueries({ queryKey: [`/api/testbanks/${effectiveTestbankId}/questions`] });
      
      toast({
        title: "Success",
        description: "Question rejected successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject question",
        variant: "destructive",
      });
    }
  };

  const handleRefreshQuestion = async (question: Question) => {
    try {
      const response = await apiRequest("POST", `/api/questions/${question.id}/refresh`);
      queryClient.invalidateQueries({ queryKey: [`/api/testbanks/${effectiveTestbankId}/questions`] });
      toast({
        title: "Success",
        description: "Question refreshed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh question",
        variant: "destructive",
      });
    }
  };

  const handleCreateSimilar = async (question: Question) => {
    try {
      const response = await apiRequest("POST", `/api/questions/${question.id}/similar`);
      queryClient.invalidateQueries({ queryKey: [`/api/testbanks/${effectiveTestbankId}/questions`] });
      toast({
        title: "Success",
        description: "Similar question created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create similar question",
        variant: "destructive",
      });
    }
  };

  const handleChangeOptions = async (question: Question) => {
    try {
      const response = await apiRequest("POST", `/api/questions/${question.id}/change-options`);
      queryClient.invalidateQueries({ queryKey: [`/api/testbanks/${effectiveTestbankId}/questions`] });
      toast({
        title: "Success",
        description: "Answer options changed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change answer options",
        variant: "destructive",
      });
    }
  };

  const addAnswerOption = () => {
    setQuestionForm(prev => ({
      ...prev,
      answerOptions: [
        ...prev.answerOptions,
        { answerText: "", isCorrect: false, displayOrder: prev.answerOptions.length }
      ]
    }));
  };

  const removeAnswerOption = (index: number) => {
    setQuestionForm(prev => ({
      ...prev,
      answerOptions: prev.answerOptions.filter((_, i) => i !== index)
    }));
  };

  const updateAnswerOption = (index: number, field: string, value: any) => {
    setQuestionForm(prev => ({
      ...prev,
      answerOptions: prev.answerOptions.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  const addReferenceLink = () => {
    setAiForm(prev => ({
      ...prev,
      referenceLinks: [...prev.referenceLinks, ""]
    }));
  };

  const addLearningObjective = () => {
    setAiForm(prev => ({
      ...prev,
      learningObjectives: [...prev.learningObjectives, ""]
    }));
  };

  const filteredQuestions = useMemo(() => {
    if (!questions || !Array.isArray(questions)) return [];
    
    return questions.filter((question: Question) => {
      if (!question) return false;
      
      const matchesSearch = !searchTerm || 
                           (question.questionText && typeof question.questionText === 'string' && 
                            question.questionText.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (question.tags && Array.isArray(question.tags) && 
                            question.tags.some(tag => tag && typeof tag === 'string' && 
                                              tag.toLowerCase().includes(searchTerm.toLowerCase())));
      
      const matchesType = filterType === "all" || question.questionType === filterType;
      const matchesDifficulty = filterDifficulty === "all" || 
                               (filterDifficulty === "easy" && question.difficultyScore <= 3) ||
                               (filterDifficulty === "medium" && question.difficultyScore > 3 && question.difficultyScore <= 7) ||
                               (filterDifficulty === "hard" && question.difficultyScore > 7);
      const matchesBlooms = filterBloomsLevel === "all" || question.bloomsLevel === filterBloomsLevel;
      
      return matchesSearch && matchesType && matchesDifficulty && matchesBlooms;
    });
  }, [questions, searchTerm, filterType, filterDifficulty, filterBloomsLevel]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Please log in to access question manager.</div>
      </div>
    );
  }

  // Show testbank selection if no testbank is selected
  if (!effectiveTestbankId && !testbanksLoading) {
    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar />
        
        <div className="flex-1 md:md:ml-64">
          <TopBar />
          
          <main className="p-6">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
              <Link href="/" className="flex items-center hover:text-gray-900">
                <Home className="h-4 w-4" />
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-900 font-medium">Question Manager</span>
            </nav>
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Question Manager</h1>
                <p className="text-gray-600">Select a test bank to manage questions</p>
              </div>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Select Test Bank</CardTitle>
                  <CardDescription>
                    Choose a test bank to view and manage questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {testbanks && testbanks.length > 0 ? (
                    <div className="grid gap-4">
                      {testbanks.map((bank: any) => (
                        <Card key={bank.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedTestbankId(bank.id)}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold text-lg">{bank.title}</h3>
                                <p className="text-gray-600 text-sm">{bank.description}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Created {format(new Date(bank.createdAt), 'MMM d, yyyy')}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600">{bank.questionCount || 0} questions</p>
                                <Badge variant="outline">{bank.subject}</Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No test banks found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Create a test bank first to start managing questions.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (questionsLoading || testbanksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      
      <main className="p-4 md:p-6">
          {/* Mobile Back Button & Breadcrumb Navigation */}
          <div className="flex items-center gap-4 mb-4">
            {/* Mobile back button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 md:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              <Link href="/" className="flex items-center hover:text-gray-900">
                <Home className="h-4 w-4" />
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-900 font-medium">Question Manager</span>
              {effectiveTestbankId && testbank && (
                <>
                  <ChevronRight className="h-4 w-4" />
                  <span className="text-gray-500">{testbank.title}</span>
                </>
              )}
            </nav>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Question Manager</h1>
              <p className="text-gray-600">{testbank?.title || 'Managing questions'}</p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Bulk Actions Toolbar */}
              {isSelectMode ? (
                <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    {selectedQuestions.size} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllQuestions}
                    className="text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAllQuestions}
                    className="text-xs"
                  >
                    Deselect All
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={selectedQuestions.size === 0}
                    className="text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete ({selectedQuestions.size})
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectMode}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={toggleSelectMode}
                  className="text-sm"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Select Multiple
                </Button>
              )}

              {/* AI Generation Dialog */}
              <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    <Brain className="mr-2 h-4 w-4" />
                    AI Generate Questions
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Wand2 className="mr-2 h-5 w-5" />
                        AI Question Generation
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        {apiKeyStatus?.available ? (
                          <div className="flex items-center text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            AI Ready
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600">
                            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                            API Key Required
                          </div>
                        )}
                      </div>
                    </DialogTitle>
                    <div className="text-sm text-muted-foreground">
                      Generate high-quality questions using research-based educational assessment standards from CRESST, Kansas Curriculum Center, and UC Riverside School of Medicine
                    </div>
                    {!apiKeyStatus?.available && (
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm">
                        <div className="font-medium text-amber-800 mb-1">Setup Required</div>
                        <div className="text-amber-700">
                          To enable AI question generation, your administrator needs to configure the OpenAI API key. 
                          Contact your system administrator to set up this feature.
                        </div>
                      </div>
                    )}
                  </DialogHeader>
                  
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                      <TabsTrigger value="advanced">Advanced</TabsTrigger>
                      <TabsTrigger value="references">References</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="space-y-4">
                      <div>
                        <Label htmlFor="topic">Topic/Subject</Label>
                        <Input
                          id="topic"
                          value={aiForm.topic}
                          onChange={(e) => setAiForm(prev => ({ ...prev, topic: e.target.value }))}
                          placeholder="Enter the main topic (e.g., 'Photosynthesis in Plants')"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="questionCount">Number of Questions</Label>
                        <Input
                          id="questionCount"
                          type="number"
                          min="1"
                          max="50"
                          value={aiForm.questionCount}
                          onChange={(e) => setAiForm(prev => ({ ...prev, questionCount: parseInt(e.target.value) || 5 }))}
                        />
                      </div>
                      
                      <div>
                        <Label>Question Types</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {[
                            { value: "multiple_choice", label: "Multiple Choice" },
                            { value: "multiple_response", label: "Multiple Response" },
                            { value: "true_false", label: "True/False" },
                            { value: "fill_blank", label: "Fill in the Blank" },
                            { value: "multiple_fill_blank", label: "Multiple Fill in the Blank" },
                            { value: "essay", label: "Essay" },
                            { value: "file_upload", label: "File Upload" },
                            { value: "formula", label: "Formula" },
                            { value: "numerical", label: "Numerical" },
                            { value: "matching", label: "Matching" },
                            { value: "ordering", label: "Ordering" },
                            { value: "categorization", label: "Categorization" },
                            { value: "hot_spot", label: "Hot Spot" },
                            { value: "stimulus", label: "Stimulus" },
                            { value: "text_no_question", label: "Text Block" }
                          ].map((type) => (
                            <div key={type.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={type.value}
                                checked={aiForm.questionTypes.includes(type.value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setAiForm(prev => ({
                                      ...prev,
                                      questionTypes: [...prev.questionTypes, type.value]
                                    }));
                                  } else {
                                    setAiForm(prev => ({
                                      ...prev,
                                      questionTypes: prev.questionTypes.filter(t => t !== type.value)
                                    }));
                                  }
                                }}
                              />
                              <Label htmlFor={type.value}>{type.label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label>Difficulty Range (1-10)</Label>
                        <div className="mt-2">
                          <Slider
                            value={aiForm.difficultyRange}
                            onValueChange={(value) => {
                              // Ensure we always have exactly 2 values for range
                              const newRange = Array.isArray(value) && value.length >= 2 
                                ? [value[0], value[1]] 
                                : [value[0] || 1, value[1] || 10];
                              setAiForm(prev => ({ ...prev, difficultyRange: newRange }));
                            }}
                            max={10}
                            min={1}
                            step={1}
                            minStepsBetweenThumbs={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm text-gray-500 mt-1">
                            <span>Min: {aiForm.difficultyRange[0]}</span>
                            <span>Max: {aiForm.difficultyRange[1]}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Bloom's Taxonomy Levels</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {[
                            { value: "remember", label: "Remember", icon: "📝" },
                            { value: "understand", label: "Understand", icon: "💡" },
                            { value: "apply", label: "Apply", icon: "🔧" },
                            { value: "analyze", label: "Analyze", icon: "🔍" },
                            { value: "evaluate", label: "Evaluate", icon: "⚖️" },
                            { value: "create", label: "Create", icon: "🎨" }
                          ].map((level) => (
                            <div key={level.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={level.value}
                                checked={aiForm.bloomsLevels.includes(level.value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setAiForm(prev => ({
                                      ...prev,
                                      bloomsLevels: [...prev.bloomsLevels, level.value]
                                    }));
                                  } else {
                                    setAiForm(prev => ({
                                      ...prev,
                                      bloomsLevels: prev.bloomsLevels.filter(l => l !== level.value)
                                    }));
                                  }
                                }}
                              />
                              <Label htmlFor={level.value}>{level.icon} {level.label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="advanced" className="space-y-4">
                      <div>
                        <Label htmlFor="targetAudience">Target Audience</Label>
                        <Input
                          id="targetAudience"
                          value={aiForm.targetAudience}
                          onChange={(e) => setAiForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                          placeholder="e.g., High school students, College freshmen"
                        />
                      </div>
                      
                      <div>
                        <Label>Learning Objectives</Label>
                        {aiForm.learningObjectives.map((objective, index) => (
                          <div key={index} className="flex items-center space-x-2 mt-2">
                            <Input
                              value={objective}
                              onChange={(e) => {
                                const newObjectives = [...aiForm.learningObjectives];
                                newObjectives[index] = e.target.value;
                                setAiForm(prev => ({ ...prev, learningObjectives: newObjectives }));
                              }}
                              placeholder="Enter learning objective"
                            />
                            {aiForm.learningObjectives.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newObjectives = aiForm.learningObjectives.filter((_, i) => i !== index);
                                  setAiForm(prev => ({ ...prev, learningObjectives: newObjectives }));
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addLearningObjective}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Objective
                        </Button>
                      </div>
                      
                      <div>
                        <Label>Question Styles (Select Multiple)</Label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          {[
                            { value: "formal", label: "Formal Academic" },
                            { value: "conversational", label: "Conversational" },
                            { value: "scenario", label: "Scenario-based" },
                            { value: "problem_solving", label: "Problem Solving" },
                            { value: "case_study", label: "Case Study" }
                          ].map((style) => (
                            <div key={style.value} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`style-${style.value}`}
                                checked={aiForm.questionStyles.includes(style.value)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setAiForm(prev => ({ 
                                      ...prev, 
                                      questionStyles: [...prev.questionStyles, style.value] 
                                    }));
                                  } else {
                                    setAiForm(prev => ({ 
                                      ...prev, 
                                      questionStyles: prev.questionStyles.filter(s => s !== style.value) 
                                    }));
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <Label htmlFor={`style-${style.value}`} className="text-sm">
                                {style.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="includeImages"
                          checked={aiForm.includeImages}
                          onCheckedChange={(checked) => setAiForm(prev => ({ ...prev, includeImages: checked }))}
                        />
                        <Label htmlFor="includeImages">Generate image suggestions</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="includeMultimedia"
                          checked={aiForm.includeMultimedia}
                          onCheckedChange={(checked) => setAiForm(prev => ({ ...prev, includeMultimedia: checked }))}
                        />
                        <Label htmlFor="includeMultimedia">Include multimedia elements</Label>
                      </div>

                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="customInstructions">Custom Instructions</Label>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowLoadInstructionDialog(true)}
                              disabled={!customInstructions?.length}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Load
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleSaveCurrentInstructions}
                              disabled={!aiForm.customInstructions.trim()}
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                          </div>
                        </div>
                        <Textarea
                          id="customInstructions"
                          value={aiForm.customInstructions}
                          onChange={(e) => setAiForm(prev => ({ ...prev, customInstructions: e.target.value }))}
                          placeholder="Any specific requirements or style preferences... (This will be automatically optimized by AI)"
                          className="min-h-20"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Your instructions will be automatically enhanced and optimized for better question generation.
                        </p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="references" className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="includeReferences"
                          checked={aiForm.includeReferences}
                          onCheckedChange={(checked) => setAiForm(prev => ({ ...prev, includeReferences: checked }))}
                        />
                        <Label htmlFor="includeReferences">Include reference materials in question generation</Label>
                      </div>
                      
                      {aiForm.includeReferences && (
                        <>
                          <div>
                            <Label>Reference Links</Label>
                            {aiForm.referenceLinks.map((link, index) => (
                              <div key={index} className="flex items-center space-x-2 mt-2">
                                <ExternalLink className="h-4 w-4 text-gray-400" />
                                <Input
                                  value={link}
                                  onChange={(e) => {
                                    const newLinks = [...aiForm.referenceLinks];
                                    newLinks[index] = e.target.value;
                                    setAiForm(prev => ({ ...prev, referenceLinks: newLinks }));
                                  }}
                                  placeholder="https://example.com/resource"
                                />
                                {aiForm.referenceLinks.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newLinks = aiForm.referenceLinks.filter((_, i) => i !== index);
                                      setAiForm(prev => ({ ...prev, referenceLinks: newLinks }));
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addReferenceLink}
                              className="mt-2"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Link
                            </Button>
                          </div>
                          
                          <div>
                            <Label htmlFor="referenceFiles">Reference Files</Label>
                            <Input
                              id="referenceFiles"
                              type="file"
                              multiple
                              accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                              onChange={(e) => {
                                setAiForm(prev => ({ 
                                  ...prev, 
                                  referenceFiles: Array.from(e.target.files || [])
                                }));
                              }}
                              className="mt-2"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              Supported formats: PDF, Word, PowerPoint, Text files
                            </p>
                          </div>
                          
                          {aiForm.referenceFiles.length > 0 && (
                            <div>
                              <Label>Selected Files</Label>
                              <div className="space-y-2 mt-2">
                                {aiForm.referenceFiles.map((file, index) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div className="flex items-center space-x-2">
                                      <FileText className="h-4 w-4" />
                                      <span className="text-sm">{file.name}</span>
                                      <span className="text-xs text-gray-500">
                                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                                      </span>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const newFiles = aiForm.referenceFiles.filter((_, i) => i !== index);
                                        setAiForm(prev => ({ ...prev, referenceFiles: newFiles }));
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </TabsContent>
                  </Tabs>
                  
                  <div className="flex gap-2 mt-6">
                    <div className="space-y-2">
                      {!apiKeyStatus?.available && (
                        <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                          ⚠️ OpenAI API key is required for question generation. Contact your administrator to enable AI features.
                        </div>
                      )}
                      <Button 
                        onClick={handleSubmitAiGeneration}
                        disabled={generationProgress.isGenerating || !aiForm.topic || !apiKeyStatus?.available}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
                      >
                        {generationProgress.isGenerating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="mr-2 h-4 w-4" />
                            Generate Questions
                          </>
                        )}
                      </Button>
                      
                      {/* Progress Indicator */}
                      {generationProgress.isGenerating && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-900">
                              {generationProgress.status}
                            </span>
                            <span className="text-sm text-blue-700">
                              {generationProgress.percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-blue-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                              style={{ width: `${generationProgress.percentage}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            {generationProgress.current} of {generationProgress.total} questions
                          </div>
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAiDialogOpen(false)}
                      disabled={generationProgress.isGenerating}
                    >
                      Cancel
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Manual Create Dialog */}
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setEditingQuestion(null);
                      resetQuestionForm();
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Question
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingQuestion ? 'Edit Question' : 'Create New Question'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingQuestion 
                        ? 'Modify the question details, answer options, and feedback using the rich text editor below.'
                        : 'Create a new question with Canvas LMS-style formatting, media attachments, and comprehensive feedback options.'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  {/* Question form content would go here - abbreviated for space */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="questionText">Question Text</Label>
                      <RichTextEditor
                        value={questionForm.questionText}
                        onChange={(value) => setQuestionForm(prev => ({ ...prev, questionText: value }))}
                        placeholder="Enter your question here..."
                        className="mt-1"
                        allowMedia={true}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="questionType">Question Type</Label>
                        <Select 
                          value={questionForm.questionType} 
                          onValueChange={(value) => setQuestionForm(prev => ({ ...prev, questionType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                            <SelectItem value="multiple_response">Multiple Response</SelectItem>
                            <SelectItem value="true_false">True/False</SelectItem>
                            <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                            <SelectItem value="multiple_fill_blank">Multiple Fill in the Blank</SelectItem>
                            <SelectItem value="essay">Essay</SelectItem>
                            <SelectItem value="file_upload">File Upload</SelectItem>
                            <SelectItem value="formula">Formula</SelectItem>
                            <SelectItem value="numerical">Numerical</SelectItem>
                            <SelectItem value="matching">Matching</SelectItem>
                            <SelectItem value="ordering">Ordering</SelectItem>
                            <SelectItem value="categorization">Categorization</SelectItem>
                            <SelectItem value="hot_spot">Hot Spot</SelectItem>
                            <SelectItem value="stimulus">Stimulus</SelectItem>
                            <SelectItem value="text_no_question">Text Block</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="bloomsLevel">Bloom's Level</Label>
                        <Select 
                          value={questionForm.bloomsLevel} 
                          onValueChange={(value) => setQuestionForm(prev => ({ ...prev, bloomsLevel: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="remember">Remember</SelectItem>
                            <SelectItem value="understand">Understand</SelectItem>
                            <SelectItem value="apply">Apply</SelectItem>
                            <SelectItem value="analyze">Analyze</SelectItem>
                            <SelectItem value="evaluate">Evaluate</SelectItem>
                            <SelectItem value="create">Create</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Answer Options for Multiple Choice */}
                    {(questionForm.questionType === "multiple_choice" || questionForm.questionType === "multiple_response") && (
                      <div>
                        <Label>Answer Options</Label>
                        <div className="space-y-2 mt-2">
                          {questionForm.answerOptions.map((option, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <Checkbox
                                checked={option.isCorrect}
                                onCheckedChange={(checked) => updateAnswerOption(index, 'isCorrect', checked)}
                                className="mt-2"
                              />
                              <div className="flex-1">
                                <RichTextEditor
                                  value={option.answerText}
                                  onChange={(value) => updateAnswerOption(index, 'answerText', value)}
                                  placeholder={`Option ${index + 1}`}
                                  className="w-full"
                                  compact={true}
                                  allowMedia={true}
                                />
                              </div>
                              {questionForm.answerOptions.length > 2 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeAnswerOption(index)}
                                  className="mt-2"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addAnswerOption}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Option
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Matching Question Editor */}
                    {questionForm.questionType === "matching" && (
                      <div>
                        <Label>Matching Options</Label>
                        <MatchingQuestionEditor 
                          pairs={questionForm.matchingData?.pairs || []}
                          onChange={(pairs) => setQuestionForm(prev => ({ 
                            ...prev, 
                            matchingData: { pairs } 
                          }))}
                        />
                      </div>
                    )}
                    
                    {/* Ordering Question Editor */}
                    {questionForm.questionType === "ordering" && (
                      <div>
                        <Label>Ordering Items</Label>
                        <OrderingQuestionEditor 
                          items={questionForm.orderingData?.items || []}
                          onChange={(items) => setQuestionForm(prev => ({ 
                            ...prev, 
                            orderingData: { items } 
                          }))}
                        />
                      </div>
                    )}
                    
                    {/* Categorization Question Editor */}
                    {questionForm.questionType === "categorization" && (
                      <div>
                        <Label>Categorization Setup</Label>
                        <div className="space-y-4">
                          <div>
                            <Label>Categories (comma-separated)</Label>
                            <Input
                              placeholder="Category 1, Category 2, Category 3"
                              value={questionForm.categorizationData?.categories?.map(c => c.name).join(', ') || ''}
                              onChange={(e) => {
                                const categories = e.target.value.split(',').map((name, i) => ({
                                  id: `cat-${i}`,
                                  name: name.trim(),
                                  description: '',
                                  items: []
                                }));
                                setQuestionForm(prev => ({ 
                                  ...prev, 
                                  categorizationData: { categories, items: [] }
                                }));
                              }}
                            />
                          </div>
                          <div>
                            <Label>Items to Categorize (comma-separated)</Label>
                            <Input
                              placeholder="Item 1, Item 2, Item 3"
                              value={questionForm.categorizationData?.items?.map(i => i.text).join(', ') || ''}
                              onChange={(e) => {
                                const items = e.target.value.split(',').map((text, i) => ({
                                  id: `item-${i}`,
                                  text: text.trim(),
                                  categoryId: ''
                                }));
                                setQuestionForm(prev => ({ 
                                  ...prev, 
                                  categorizationData: { ...prev.categorizationData, items }
                                }));
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Hot Spot Question Editor */}
                    {questionForm.questionType === "hot_spot" && (
                      <div>
                        <Label>Hot Spot Image Setup</Label>
                        <HotSpotQuestionEditor 
                          imageUrl={questionForm.hotSpotData?.imageUrl || ""}
                          hotSpots={questionForm.hotSpotData?.hotSpots || []}
                          onChange={(imageUrl, hotSpots) => setQuestionForm(prev => ({ 
                            ...prev, 
                            hotSpotData: { imageUrl, hotSpots } 
                          }))}
                        />
                      </div>
                    )}
                    
                    {/* Formula Question Editor */}
                    {questionForm.questionType === "formula" && (
                      <div>
                        <Label>Formula Setup</Label>
                        <FormulaQuestionEditor 
                          formula={questionForm.formulaData?.formula || ""}
                          variables={questionForm.formulaData?.variables || []}
                          possibleAnswers={5}
                          decimalPlaces={2}
                          marginType="percentage"
                          marginValue={5}
                          scientificNotation={false}
                          onChange={(data) => setQuestionForm(prev => ({ 
                            ...prev, 
                            formulaData: data 
                          }))}
                        />
                      </div>
                    )}
                    
                    {/* Numerical Answer Input */}
                    {questionForm.questionType === "numerical" && (
                      <div>
                        <Label>Numerical Answer</Label>
                        <Input
                          type="number"
                          step="any"
                          value={questionForm.numericalAnswer || ""}
                          onChange={(e) => setQuestionForm(prev => ({ 
                            ...prev, 
                            numericalAnswer: parseFloat(e.target.value) || 0 
                          }))}
                          placeholder="Enter the correct numerical answer"
                        />
                        <div className="mt-2">
                          <Label>Tolerance</Label>
                          <Input
                            type="number"
                            step="any"
                            value={questionForm.numericalTolerance || 0.01}
                            onChange={(e) => setQuestionForm(prev => ({ 
                              ...prev, 
                              numericalTolerance: parseFloat(e.target.value) || 0.01 
                            }))}
                            placeholder="Acceptable margin of error"
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Canvas LMS-style Feedback Fields */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Question Feedback</h3>
                      
                      <div>
                        <Label htmlFor="correctFeedback">Correct Answer Feedback</Label>
                        <p className="text-sm text-gray-600 mb-2">
                          This feedback will be shown to students when they select the correct answer
                        </p>
                        <RichTextEditor
                          value={questionForm.correctFeedback}
                          onChange={(value) => setQuestionForm(prev => ({ ...prev, correctFeedback: value }))}
                          placeholder="Enter feedback for correct answers..."
                          className="mt-1"
                          compact={true}
                          allowMedia={true}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="incorrectFeedback">Incorrect Answer Feedback</Label>
                        <p className="text-sm text-gray-600 mb-2">
                          This feedback will be shown to students when they select an incorrect answer
                        </p>
                        <RichTextEditor
                          value={questionForm.incorrectFeedback}
                          onChange={(value) => setQuestionForm(prev => ({ ...prev, incorrectFeedback: value }))}
                          placeholder="Enter feedback for incorrect answers..."
                          className="mt-1"
                          compact={true}
                          allowMedia={true}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="generalFeedback">General Feedback</Label>
                        <p className="text-sm text-gray-600 mb-2">
                          This feedback will be shown to all students regardless of their answer
                        </p>
                        <RichTextEditor
                          value={questionForm.generalFeedback}
                          onChange={(value) => setQuestionForm(prev => ({ ...prev, generalFeedback: value }))}
                          placeholder="Enter general feedback..."
                          className="mt-1"
                          compact={true}
                          allowMedia={true}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="partialCredit"
                          checked={questionForm.partialCredit}
                          onCheckedChange={(checked) => setQuestionForm(prev => ({ ...prev, partialCredit: checked }))}
                        />
                        <Label htmlFor="partialCredit" className="text-sm">
                          Allow partial credit for this question
                        </Label>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSubmitQuestion}
                        disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {editingQuestion ? 'Update Question' : 'Create Question'}
                      </Button>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="multiple_response">Multiple Response</SelectItem>
                <SelectItem value="true_false">True/False</SelectItem>
                <SelectItem value="essay">Essay</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterBloomsLevel} onValueChange={setFilterBloomsLevel}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Bloom's" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="remember">Remember</SelectItem>
                <SelectItem value="understand">Understand</SelectItem>
                <SelectItem value="apply">Apply</SelectItem>
                <SelectItem value="analyze">Analyze</SelectItem>
                <SelectItem value="evaluate">Evaluate</SelectItem>
                <SelectItem value="create">Create</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {questionsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-600">Loading questions...</p>
              </div>
            ) : questionsError ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Questions</h3>
                <p className="text-gray-600 mb-4">
                  {questionsError instanceof Error && questionsError.message.includes('401') 
                    ? 'Please log in again to access your questions.'
                    : 'There was an error loading your questions. Please try again.'}
                </p>
                <Button 
                  onClick={() => {
                    if (questionsError instanceof Error && questionsError.message.includes('401')) {
                      window.location.href = "/api/login";
                    } else {
                      queryClient.invalidateQueries({ queryKey: [`/api/testbanks/${effectiveTestbankId}/questions`] });
                    }
                  }}
                >
                  {questionsError instanceof Error && questionsError.message.includes('401') ? 'Log In' : 'Try Again'}
                </Button>
              </div>
            ) : filteredQuestions && filteredQuestions.length > 0 ? (
              filteredQuestions.map((question: Question) => (
                <Card key={question.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      {/* Selection checkbox */}
                      {isSelectMode && (
                        <div className="flex items-center mr-4 pt-1">
                          <Checkbox
                            checked={selectedQuestions.has(question.id)}
                            onCheckedChange={() => toggleSelectQuestion(question.id)}
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <CardTitle className="text-base mb-2">{question.questionText || 'No question text'}</CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{question.questionType ? question.questionType.replace('_', ' ') : 'Unknown'}</Badge>
                          <Badge variant="secondary">{question.bloomsLevel || 'N/A'}</Badge>
                          <Badge 
                            variant={
                              (question.difficultyScore || 0) <= 3 ? "default" :
                              (question.difficultyScore || 0) <= 7 ? "secondary" : "destructive"
                            }
                          >
                            Difficulty: {question.difficultyScore || 0}/10
                          </Badge>
                          <Badge variant="outline">{question.points || 0} pts</Badge>
                          {question.aiValidationStatus && (
                            <Badge 
                              variant={
                                question.aiValidationStatus === "approved" ? "default" :
                                question.aiValidationStatus === "rejected" ? "destructive" : "secondary"
                              }
                            >
                              AI: {question.aiValidationStatus}
                            </Badge>
                          )}
                        </div>
                        {question.tags && question.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {question.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {question.aiValidationStatus === 'pending' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAcceptQuestion(question.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRejectQuestion(question.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRefreshQuestion(question)}
                          title="Generate new version"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCreateSimilar(question)}
                          title="Create similar question"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleChangeOptions(question)}
                          title="Change answer options"
                        >
                          <Shuffle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditQuestion(question)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteQuestionMutation.mutate(question.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {question.answerOptions && question.answerOptions.length > 0 && (
                    <CardContent>
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Answer Options:</Label>
                        {question.answerOptions.map((option, index) => (
                          <div key={option.id} className="flex items-center space-x-2">
                            {option.isCorrect ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <div className="h-4 w-4" />
                            )}
                            <span className={`text-sm ${option.isCorrect ? 'font-medium text-green-700' : 'text-gray-600'}`}>
                              {String.fromCharCode(65 + index)}. {option.answerText}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterType !== "all" || filterDifficulty !== "all" || filterBloomsLevel !== "all" 
                    ? 'No questions match your current filters.' 
                    : 'Start by creating your first question or using AI generation.'}
                </p>
                <div className="flex justify-center space-x-3">
                  <Button onClick={() => setIsAiDialogOpen(true)} className="bg-gradient-to-r from-purple-600 to-blue-600">
                    <Brain className="mr-2 h-4 w-4" />
                    AI Generate
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Manually
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>

      {/* Save Custom Instruction Dialog */}
      <Dialog open={showSaveInstructionDialog} onOpenChange={setShowSaveInstructionDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Save Custom Instruction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="instructionName">Name</Label>
              <Input
                id="instructionName"
                value={customInstructionForm.name}
                onChange={(e) => setCustomInstructionForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter a name for this instruction template"
              />
            </div>
            <div>
              <Label htmlFor="instructionDescription">Description (Optional)</Label>
              <Input
                id="instructionDescription"
                value={customInstructionForm.description}
                onChange={(e) => setCustomInstructionForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of what this instruction does"
              />
            </div>
            <div>
              <Label htmlFor="instructionCategory">Category</Label>
              <Select
                value={customInstructionForm.category}
                onValueChange={(value) => setCustomInstructionForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="question_generation">Question Generation</SelectItem>
                  <SelectItem value="validation">Validation</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="instructionPreview">Instructions to Save</Label>
              <Textarea
                id="instructionPreview"
                value={aiForm.customInstructions}
                readOnly
                className="min-h-20 bg-gray-50"
                placeholder="No instructions entered yet"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSaveInstructionDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCustomInstruction}
              disabled={!customInstructionForm.name.trim() || !aiForm.customInstructions.trim()}
            >
              Save Instruction
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Custom Instruction Dialog */}
      <Dialog open={showLoadInstructionDialog} onOpenChange={setShowLoadInstructionDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Load Custom Instruction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {customInstructions && customInstructions.length > 0 ? (
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {customInstructions.map((instruction: any) => (
                  <Card key={instruction.id} className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{instruction.name}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {instruction.category}
                            </Badge>
                          </div>
                          {instruction.description && (
                            <p className="text-sm text-gray-600 mb-2">{instruction.description}</p>
                          )}
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {instruction.instructions}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Used {instruction.usageCount || 0} times</span>
                            <span>Created {new Date(instruction.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleLoadCustomInstruction(instruction)}
                          className="ml-4"
                        >
                          Load
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Instructions</h3>
                <p className="text-gray-600">
                  You haven't saved any custom instructions yet. Create some instructions and save them for future use.
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowLoadInstructionDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}