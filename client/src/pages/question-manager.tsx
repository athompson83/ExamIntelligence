import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  BookOpen, 
  Brain, 
  Wand2, 
  Upload, 
  Link, 
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
  BarChart3
} from "lucide-react";
import { format } from "date-fns";

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

  // Check if testbankId is provided
  if (!testbankId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Test Bank</h2>
          <p className="text-gray-600">Test bank ID is required to view questions.</p>
        </div>
      </div>
    );
  }

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
    questionStyle: "formal",
    includeImages: false,
    includeMultimedia: false,
    customInstructions: ""
  });

  // Question Form State
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
    ]
  });

  // Fetch questions
  const { data: questions, isLoading: questionsLoading, error: questionsError } = useQuery({
    queryKey: ['/api/testbanks', testbankId, 'questions'],
    enabled: isAuthenticated && !!testbankId,
  });

  // Fetch testbank details
  const { data: testbank } = useQuery({
    queryKey: ['/api/testbanks', testbankId],
    enabled: isAuthenticated && !!testbankId,
  });

  // Create question mutation
  const createQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", `/api/testbanks/${testbankId}/questions`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/testbanks', testbankId, 'questions'] });
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

  // AI Generation mutation
  const generateQuestionsMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      formData.append('data', JSON.stringify(data));
      
      // Add reference files
      data.referenceFiles?.forEach((file: File, index: number) => {
        formData.append(`referenceFile_${index}`, file);
      });

      const response = await fetch(`/api/testbanks/${testbankId}/generate-questions`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/testbanks', testbankId, 'questions'] });
      setIsAiDialogOpen(false);
      toast({
        title: "Success",
        description: `Generated ${data.count} questions successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate questions with AI",
        variant: "destructive",
      });
    },
  });

  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PUT", `/api/questions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/testbanks', testbankId, 'questions'] });
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

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/questions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/testbanks', testbankId, 'questions'] });
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete question",
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
    const data = {
      ...aiForm,
      testbankId,
      referenceLinks: aiForm.referenceLinks.filter(link => link.trim() !== ""),
      learningObjectives: aiForm.learningObjectives.filter(obj => obj.trim() !== ""),
    };

    generateQuestionsMutation.mutate(data);
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

  if (questionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <TopBar />
        
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Question Manager</h1>
              <p className="text-gray-600">{testbank?.title || 'Managing questions'}</p>
            </div>
            
            <div className="flex items-center space-x-3">
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
                    <DialogTitle className="flex items-center">
                      <Wand2 className="mr-2 h-5 w-5" />
                      AI Question Generation
                    </DialogTitle>
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
                            { value: "essay", label: "Essay" },
                            { value: "matching", label: "Matching" }
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
                            onValueChange={(value) => setAiForm(prev => ({ ...prev, difficultyRange: value }))}
                            max={10}
                            min={1}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm text-gray-500 mt-1">
                            <span>Easy ({aiForm.difficultyRange[0]})</span>
                            <span>Hard ({aiForm.difficultyRange[1]})</span>
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
                        <Label htmlFor="questionStyle">Question Style</Label>
                        <Select 
                          value={aiForm.questionStyle} 
                          onValueChange={(value) => setAiForm(prev => ({ ...prev, questionStyle: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="formal">Formal Academic</SelectItem>
                            <SelectItem value="conversational">Conversational</SelectItem>
                            <SelectItem value="scenario">Scenario-based</SelectItem>
                            <SelectItem value="problem_solving">Problem Solving</SelectItem>
                          </SelectContent>
                        </Select>
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
                        <Label htmlFor="customInstructions">Custom Instructions</Label>
                        <Textarea
                          id="customInstructions"
                          value={aiForm.customInstructions}
                          onChange={(e) => setAiForm(prev => ({ ...prev, customInstructions: e.target.value }))}
                          placeholder="Any specific requirements or style preferences..."
                          className="min-h-20"
                        />
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
                                <Link className="h-4 w-4 text-gray-400" />
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
                    <Button 
                      onClick={handleSubmitAiGeneration}
                      disabled={generateQuestionsMutation.isPending || !aiForm.topic}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      {generateQuestionsMutation.isPending ? (
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
                    <Button variant="outline" onClick={() => setIsAiDialogOpen(false)}>
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
                  </DialogHeader>
                  
                  {/* Question form content would go here - abbreviated for space */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="questionText">Question Text</Label>
                      <Textarea
                        id="questionText"
                        value={questionForm.questionText}
                        onChange={(e) => setQuestionForm(prev => ({ ...prev, questionText: e.target.value }))}
                        placeholder="Enter your question here..."
                        className="min-h-24"
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
                            <SelectItem value="essay">Essay</SelectItem>
                            <SelectItem value="matching">Matching</SelectItem>
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
                            <div key={index} className="flex items-center space-x-2">
                              <Checkbox
                                checked={option.isCorrect}
                                onCheckedChange={(checked) => updateAnswerOption(index, 'isCorrect', checked)}
                              />
                              <Input
                                value={option.answerText}
                                onChange={(e) => updateAnswerOption(index, 'answerText', e.target.value)}
                                placeholder={`Option ${index + 1}`}
                                className="flex-1"
                              />
                              {questionForm.answerOptions.length > 2 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeAnswerOption(index)}
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
                      queryClient.invalidateQueries({ queryKey: ['/api/testbanks', testbankId, 'questions'] });
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
      </div>
    </div>
  );
}