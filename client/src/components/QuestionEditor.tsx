import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AIValidationPanel from "./AIValidationPanel";
import { OrderingQuestionEditor } from "./question-types/OrderingQuestionEditor";
import CategorizationQuestionEditor from "./question-types/CategorizationQuestionEditor";
import { HotSpotQuestionEditor } from "./question-types/HotSpotQuestionEditor";
import { FormulaQuestionEditor } from "./question-types/FormulaQuestionEditor";
import { MatchingQuestionEditor } from "./question-types/MatchingQuestionEditor";
import { SortingQuestionEditor } from "./question-types/SortingQuestionEditor";
import { 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertQuestionSchema } from "@shared/schema";
import { z } from "zod";

// Enhanced question form schema with proper types for the UI
const questionFormSchema = z.object({
  testbankId: z.string(),
  questionText: z.string().min(1, "Question text is required"),
  questionType: z.enum([
    "multiple_choice", "multiple_response", "true_false", "fill_blank", 
    "multiple_fill_blank", "matching", "ordering", "categorization", 
    "hot_spot", "essay", "file_upload", "numerical", "formula", 
    "stimulus", "constructed_response", "text_no_question", "sorting"
  ]),
  points: z.coerce.number().min(0).default(1),
  difficultyScore: z.coerce.number().min(1).max(10).default(5),
  tags: z.string().optional(),
  bloomsLevel: z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]).optional(),
  
  // Feedback fields
  correctFeedback: z.string().optional(),
  incorrectFeedback: z.string().optional(),
  generalFeedback: z.string().optional(),
  neutralFeedback: z.string().optional(),
  
  // Media fields
  imageUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  
  // Additional options
  shuffleAnswers: z.boolean().default(false),
  requireResponse: z.boolean().default(true),
});

type QuestionFormData = z.infer<typeof questionFormSchema>;

interface QuestionEditorProps {
  questionId?: string;
  testbankId: string;
  onClose?: () => void;
}

export default function QuestionEditor({ questionId, testbankId, onClose }: QuestionEditorProps) {
  const { toast } = useToast();
  const [answerOptions, setAnswerOptions] = useState<Array<{ text: string; isCorrect: boolean }>>([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);
  const [validationResults, setValidationResults] = useState<any>(null);
  
  // State for ordering questions
  const [orderingItems, setOrderingItems] = useState<Array<{ id: string; text: string; correctOrder: number }>>([]);
  
  // State for categorization questions
  const [categorizationCategories, setCategorizationCategories] = useState<Array<{ id: string; name: string; description: string; items: string[] }>>([]);
  const [categorizationItems, setCategorizationItems] = useState<Array<{ id: string; text: string; categoryId: string }>>([]);
  
  // State for matching questions
  const [matchingPairs, setMatchingPairs] = useState<Array<{ id: string; leftItem: string; rightItem: string }>>([
    { id: '1', leftItem: '', rightItem: '' },
    { id: '2', leftItem: '', rightItem: '' }
  ]);
  const [matchingDistractors, setMatchingDistractors] = useState<string[]>([]);
  
  // State for sorting questions
  const [sortingItems, setSortingItems] = useState<Array<{ id: string; text: string; correctPosition: number }>>([]);
  const [sortingCriteria, setSortingCriteria] = useState<string>("");
  const [sortingType, setSortingType] = useState<'alphabetical' | 'numerical' | 'chronological' | 'custom'>('custom');
  
  // State for hot spot questions
  const [hotSpotImageUrl, setHotSpotImageUrl] = useState<string>("");
  const [hotSpotAreas, setHotSpotAreas] = useState<Array<{ id: string; x: number; y: number; width: number; height: number; isCorrect: boolean; feedback?: string }>>([]);
  const [hotSpotShowCalculator, setHotSpotShowCalculator] = useState<boolean>(false);
  
  // State for formula questions
  const [formulaConfig, setFormulaConfig] = useState<{
    variables: Array<{ id: string; name: string; min: number; max: number; decimals: number }>;
    formula: string;
    possibleAnswers: number;
    decimalPlaces: number;
    marginType: 'absolute' | 'percentage';
    marginValue: number;
    scientificNotation: boolean;
  }>({
    variables: [],
    formula: "",
    possibleAnswers: 200,
    decimalPlaces: 0,
    marginType: 'absolute',
    marginValue: 0,
    scientificNotation: false,
  });
  
  // State for question options
  const [shuffleAnswers, setShuffleAnswers] = useState(false);
  const [requireResponse, setRequireResponse] = useState(true);

  const { data: question } = useQuery({
    queryKey: ["/api/questions", questionId],
    enabled: !!questionId,
    retry: false,
  });

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      testbankId,
      questionText: "",
      questionType: "multiple_choice",
      points: 1,
      difficultyScore: 5,
      tags: "",
      bloomsLevel: "remember",
      correctFeedback: "",
      incorrectFeedback: "",
      generalFeedback: "",
      neutralFeedback: "",
      imageUrl: "",
      audioUrl: "",
      videoUrl: "",
      shuffleAnswers: false,
      requireResponse: true,
    },
  });

  useEffect(() => {
    if (question) {
      const q = question as any; // Type assertion to bypass type checking
      form.reset({
        testbankId: q.testbankId,
        questionText: q.questionText,
        questionType: q.questionType,
        points: parseFloat(q.points?.toString() || "1"),
        difficultyScore: parseFloat(q.difficultyScore?.toString() || "5"),
        tags: q.tags?.join(", ") || "",
        bloomsLevel: q.bloomsLevel || "remember",
        correctFeedback: q.correctFeedback || "",
        incorrectFeedback: q.incorrectFeedback || "",
        generalFeedback: q.generalFeedback || "",
        neutralFeedback: q.neutralFeedback || "",
        imageUrl: q.imageUrl || "",
        audioUrl: q.audioUrl || "",
        videoUrl: q.videoUrl || "",
        shuffleAnswers: false,
        requireResponse: true,
      });

      if (q.answerOptions) {
        setAnswerOptions(q.answerOptions);
      }

      // Load question-specific data from questionConfig
      if (q.questionConfig) {
        const config = q.questionConfig;
        
        if (q.questionType === "ordering" && config.items) {
          setOrderingItems(config.items);
        }
        
        if (q.questionType === "categorization" && config.categories && config.items) {
          setCategorizationCategories(config.categories);
          setCategorizationItems(config.items);
        }
        
        if (q.questionType === "hot_spot") {
          setHotSpotImageUrl(config.imageUrl || "");
          setHotSpotAreas(config.hotSpots || []);
          setHotSpotShowCalculator(config.showCalculator || false);
        }
        
        if (q.questionType === "formula") {
          setFormulaConfig({
            variables: config.variables || [],
            formula: config.formula || "",
            possibleAnswers: config.possibleAnswers || 200,
            decimalPlaces: config.decimalPlaces || 0,
            marginType: config.marginType || 'absolute',
            marginValue: config.marginValue || 0,
            scientificNotation: config.scientificNotation || false,
          });
        }
      }
    }
  }, [question, form]);

  const watchedQuestionType = form.watch("questionType");
  
  // Debug log to verify the question type is changing
  console.log("🔍 Current question type:", watchedQuestionType);
  console.log("🔍 Form values:", form.getValues());
  console.log("🔍 Should show matching editor:", watchedQuestionType === "matching");
  console.log("🔍 Should show ordering editor:", watchedQuestionType === "ordering");
  console.log("🔍 Should show numerical editor:", watchedQuestionType === "numerical");
  
  // Add a visible debug indicator in development - FORCE ENABLED
  const isDebugging = true;

  // Initialize question type specific data when question type changes
  useEffect(() => {
    switch (watchedQuestionType) {
      case "ordering":
        if (orderingItems.length === 0) {
          setOrderingItems([
            { id: 'item-1', text: '', correctOrder: 1 },
            { id: 'item-2', text: '', correctOrder: 2 },
            { id: 'item-3', text: '', correctOrder: 3 }
          ]);
        }
        break;
      
      case "categorization":
        if (categorizationCategories.length === 0) {
          setCategorizationCategories([
            { id: 'category-1', name: 'Category 1', description: '', items: [] },
            { id: 'category-2', name: 'Category 2', description: '', items: [] }
          ]);
        }
        if (categorizationItems.length === 0) {
          setCategorizationItems([
            { id: 'item-1', text: '', categoryId: 'unassigned' },
            { id: 'item-2', text: '', categoryId: 'unassigned' },
            { id: 'item-3', text: '', categoryId: 'unassigned' }
          ]);
        }
        break;
      
      case "true_false":
        if (answerOptions.length === 0 || answerOptions.length > 2) {
          setAnswerOptions([
            { text: "True", isCorrect: true },
            { text: "False", isCorrect: false }
          ]);
        }
        break;
      
      case "multiple_choice":
      case "multiple_response":
        if (answerOptions.length === 0) {
          setAnswerOptions([
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false }
          ]);
        }
        break;
      
      case "matching":
        if (matchingPairs.length === 0) {
          setMatchingPairs([
            { id: '1', leftItem: '', rightItem: '' },
            { id: '2', leftItem: '', rightItem: '' }
          ]);
        }
        break;
      
      case "sorting":
        if (sortingItems.length === 0) {
          setSortingItems([
            { id: 'item-1', text: '', correctPosition: 1 },
            { id: 'item-2', text: '', correctPosition: 2 },
            { id: 'item-3', text: '', correctPosition: 3 }
          ]);
        }
        break;
      
      case "multiple_fill_blank":
        if (answerOptions.length === 0) {
          setAnswerOptions([
            { text: "", isCorrect: true },
            { text: "", isCorrect: true }
          ]);
        }
        break;
      
      case "numerical":
      case "fill_blank":
        if (answerOptions.length === 0) {
          setAnswerOptions([
            { text: "", isCorrect: true }
          ]);
        }
        break;
    }
  }, [watchedQuestionType]);

  const saveQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      let questionConfig = {};
      let formattedAnswerOptions = [];
      let correctAnswers: string[] = [];

      // Handle different question types
      switch (data.questionType) {
        case "ordering":
          questionConfig = {
            items: orderingItems,
            correctOrder: orderingItems.map(item => item.id)
          };
          break;
        
        case "categorization":
          questionConfig = {
            categories: categorizationCategories,
            items: categorizationItems,
            correctMapping: categorizationItems.reduce((acc, item) => {
              acc[item.id] = item.categoryId;
              return acc;
            }, {} as Record<string, string>)
          };
          break;
        
        case "hot_spot":
          questionConfig = {
            imageUrl: hotSpotImageUrl,
            hotSpots: hotSpotAreas,
            showCalculator: hotSpotShowCalculator,
            correctSpots: hotSpotAreas.filter(spot => spot.isCorrect).map(spot => spot.id)
          };
          break;
        
        case "formula":
          questionConfig = {
            ...formulaConfig,
            correctAnswers: [] // Will be generated based on variables and formula
          };
          break;
        
        case "true_false":
          formattedAnswerOptions = [
            { text: "True", isCorrect: answerOptions[0]?.isCorrect || false },
            { text: "False", isCorrect: answerOptions[1]?.isCorrect || false }
          ];
          correctAnswers = formattedAnswerOptions
            .filter(option => option.isCorrect)
            .map(option => option.text);
          break;
        
        case "multiple_choice":
        case "multiple_response":
          formattedAnswerOptions = answerOptions.filter(option => option.text.trim() !== "");
          correctAnswers = answerOptions
            .filter(option => option.isCorrect && option.text.trim() !== "")
            .map(option => option.text);
          break;
        
        case "numerical":
          formattedAnswerOptions = answerOptions.filter(option => option.text.trim() !== "");
          correctAnswers = answerOptions
            .filter(option => option.isCorrect && option.text.trim() !== "")
            .map(option => option.text);
          break;
        
        case "multiple_fill_blank":
          formattedAnswerOptions = answerOptions.filter(option => option.text.trim() !== "");
          correctAnswers = answerOptions
            .filter(option => option.text.trim() !== "")
            .map(option => option.text);
          questionConfig = {
            blanks: answerOptions.map((option, index) => ({
              id: `blank${index + 1}`,
              correctAnswer: option.text,
              position: index + 1
            }))
          };
          break;
        
        case "matching":
          questionConfig = {
            leftItems: matchingPairs.map(pair => ({
              id: `left${pair.id}`,
              text: pair.leftItem
            })),
            rightItems: matchingPairs.map(pair => ({
              id: `right${pair.id}`,
              text: pair.rightItem
            })),
            distractors: matchingDistractors,
            correctMatches: matchingPairs.reduce((acc, pair) => {
              acc[`left${pair.id}`] = `right${pair.id}`;
              return acc;
            }, {} as Record<string, string>)
          };
          break;
        
        case "sorting":
          questionConfig = {
            items: sortingItems,
            correctOrder: sortingItems.map(item => item.id),
            sortingCriteria: sortingCriteria,
            sortingType: sortingType
          };
          break;
        
        case "essay":
        case "file_upload":
        case "fill_blank":
        case "stimulus":
        case "text_no_question":
          // These don't need answer options
          break;
        
        default:
          formattedAnswerOptions = answerOptions.filter(option => option.text.trim() !== "");
          correctAnswers = answerOptions
            .filter(option => option.isCorrect && option.text.trim() !== "")
            .map(option => option.text);
      }

      const formattedData = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
        answerOptions: formattedAnswerOptions,
        correctAnswers,
        questionConfig,
      };

      if (questionId) {
        await apiRequest(`/api/questions/${questionId}`, { method: "PUT", body: JSON.stringify(formattedData) });
      } else {
        await apiRequest("/api/questions", { method: "POST", body: JSON.stringify(formattedData) });
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: questionId ? "Question updated successfully" : "Question created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      if (onClose) onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save question",
        variant: "destructive",
      });
    },
  });

  const validateQuestionMutation = useMutation({
    mutationFn: async () => {
      if (!questionId) {
        throw new Error("Question must be saved before validation");
      }
      const response = await apiRequest(`/api/questions/${questionId}/validate`, { method: "POST" });
      return await response.json();
    },
    onSuccess: (data) => {
      setValidationResults(data);
      toast({
        title: "Validation Complete",
        description: "AI validation results are ready",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to validate question",
        variant: "destructive",
      });
    },
  });

  const addAnswerOption = () => {
    setAnswerOptions([...answerOptions, { text: "", isCorrect: false }]);
  };

  const removeAnswerOption = (index: number) => {
    if (answerOptions.length > 2) {
      setAnswerOptions(answerOptions.filter((_, i) => i !== index));
    }
  };

  const updateAnswerOption = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    const updated = answerOptions.map((option, i) => 
      i === index ? { ...option, [field]: value } : option
    );
    setAnswerOptions(updated);
  };

  const onSubmit = (data: QuestionFormData) => {
    saveQuestionMutation.mutate(data);
  };

  const watchedQuestionText = form.watch("questionText");

  const getDifficultyBadge = (score?: number) => {
    if (!score) return null;
    if (score <= 3) return <Badge className="difficulty-easy">Easy</Badge>;
    if (score <= 7) return <Badge className="difficulty-medium">Medium</Badge>;
    return <Badge className="difficulty-hard">Hard</Badge>;
  };

  return (
    <div className="question-editor">
      {/* CRITICAL DEBUG: This should always show */}
      <div className="mb-4 p-4 bg-purple-100 border-2 border-purple-500 rounded">
        <h2 className="text-purple-800 font-bold text-xl">🚨 MAIN QuestionEditor Component Loaded!</h2>
        <p className="text-purple-600">If you see this, the correct component is loading.</p>
        <p className="text-purple-600">Question Type: {watchedQuestionType}</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {questionId ? "Edit Question" : "Create New Question"}
            </CardTitle>
            <div className="flex items-center space-x-2">
              {(question as any)?.difficultyScore && getDifficultyBadge((question as any).difficultyScore)}
              {(question as any)?.lastValidatedAt && (
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Validated
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="editor" className="space-y-6">
            <TabsList>
              <TabsTrigger value="editor">Question Editor</TabsTrigger>
              <TabsTrigger value="validation">AI Validation</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="editor">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Question Text */}
                  <FormField
                    control={form.control}
                    name="questionText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Text</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter your question here..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Question Type and Bloom's Level */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="questionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select question type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                              <SelectItem value="multiple_response">Multiple Response</SelectItem>
                              <SelectItem value="true_false">True/False</SelectItem>
                              <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                              <SelectItem value="multiple_fill_blank">Multiple Fill in the Blank</SelectItem>
                              <SelectItem value="essay">Essay</SelectItem>
                              <SelectItem value="file_upload">File Upload</SelectItem>
                              <SelectItem value="formula">Formula</SelectItem>
                              <SelectItem value="numerical">Numeric</SelectItem>
                              <SelectItem value="matching">Matching</SelectItem>
                              <SelectItem value="ordering">Ordering</SelectItem>
                              <SelectItem value="sorting">Sorting</SelectItem>
                              <SelectItem value="categorization">Categorization</SelectItem>
                              <SelectItem value="hot_spot">Hot Spot</SelectItem>
                              <SelectItem value="stimulus">Stimulus</SelectItem>
                              <SelectItem value="text_no_question">Text Block</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bloomsLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bloom's Taxonomy Level</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Bloom's level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="remember">Remember</SelectItem>
                              <SelectItem value="understand">Understand</SelectItem>
                              <SelectItem value="apply">Apply</SelectItem>
                              <SelectItem value="analyze">Analyze</SelectItem>
                              <SelectItem value="evaluate">Evaluate</SelectItem>
                              <SelectItem value="create">Create</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Debug indicator for question type - ALWAYS SHOW */}
                  {true && (
                    <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-md p-3 space-y-1">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        🔍 Debug: Current Question Type = "{watchedQuestionType}"
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-100">
                        Expected UI sections: {
                          watchedQuestionType === "matching" ? "Matching pairs editor" :
                          watchedQuestionType === "sorting" ? "Sorting items editor" :
                          watchedQuestionType === "numerical" ? "Numerical input field" :
                          watchedQuestionType === "categorization" ? "Category setup" :
                          watchedQuestionType === "hot_spot" ? "Hot spot configuration" :
                          watchedQuestionType === "ordering" ? "Ordering items editor" :
                          "Default feedback sections"
                        }
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-800/20 p-2 rounded mt-2">
                        👀 LOOK BELOW: The specialized editor should appear below this debug box if the question type is matching, ordering, sorting, numerical, etc.
                      </p>
                    </div>
                  )}

                  {/* Answer Options for Multiple Choice/Response */}
                  {(watchedQuestionType === "multiple_choice" || watchedQuestionType === "multiple_response") && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <FormLabel>Answer Options</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addAnswerOption}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Option
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {answerOptions.map((option, index) => (
                          <div key={index} className="answer-option flex items-center space-x-2">
                            <Checkbox
                              checked={option.isCorrect}
                              onCheckedChange={(checked) => {
                                if (watchedQuestionType === "multiple_choice") {
                                  // For multiple choice, only allow one correct answer
                                  if (checked) {
                                    // Uncheck all other options first
                                    const updatedOptions = answerOptions.map((opt, idx) => ({
                                      ...opt,
                                      isCorrect: idx === index
                                    }));
                                    setAnswerOptions(updatedOptions);
                                  } else {
                                    updateAnswerOption(index, 'isCorrect', false);
                                  }
                                } else {
                                  // For multiple response, allow multiple correct answers
                                  updateAnswerOption(index, 'isCorrect', checked as boolean);
                                }
                              }}
                            />
                            <Input
                              placeholder={`Option ${index + 1}`}
                              value={option.text}
                              onChange={(e) => updateAnswerOption(index, 'text', e.target.value)}
                              className="flex-1"
                            />
                            {answerOptions.length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAnswerOption(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* True/False Options */}
                  {watchedQuestionType === "true_false" && (
                    <div className="space-y-4">
                      <FormLabel>Correct Answer</FormLabel>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="trueFalseAnswer"
                            value="true"
                            checked={answerOptions[0]?.isCorrect || false}
                            onChange={() => {
                              setAnswerOptions([
                                { text: "True", isCorrect: true },
                                { text: "False", isCorrect: false }
                              ]);
                            }}
                          />
                          <span>True</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="trueFalseAnswer"
                            value="false"
                            checked={answerOptions[1]?.isCorrect || false}
                            onChange={() => {
                              setAnswerOptions([
                                { text: "True", isCorrect: false },
                                { text: "False", isCorrect: true }
                              ]);
                            }}
                          />
                          <span>False</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Ordering Question Editor */}
                  {watchedQuestionType === "ordering" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <FormLabel>Ordering Items</FormLabel>
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">Top Label:</span> First item
                        </div>
                      </div>
                      <Input
                        placeholder="Enter top label (optional)"
                        className="w-1/2"
                      />
                      <OrderingQuestionEditor
                        items={orderingItems}
                        onChange={setOrderingItems}
                      />
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">Bottom Label:</span> Last item
                        </div>
                        <Input
                          placeholder="Enter bottom label (optional)"
                          className="w-1/2"
                        />
                      </div>
                    </div>
                  )}

                  {/* Categorization Question Editor */}
                  {watchedQuestionType === "categorization" && (
                    <CategorizationQuestionEditor
                      categories={categorizationCategories}
                      items={categorizationItems}
                      onChange={(categories, items) => {
                        setCategorizationCategories(categories);
                        setCategorizationItems(items);
                      }}
                    />
                  )}

                  {/* Hot Spot Question Editor */}
                  {watchedQuestionType === "hot_spot" && (
                    <div className="space-y-4">
                      <FormLabel>Hot Spot Image</FormLabel>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <div className="space-y-2">
                          <div className="text-gray-500">
                            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-600">
                            Drag n' Drop here or{" "}
                            <button className="text-blue-600 hover:text-blue-800">Browse</button>
                          </p>
                        </div>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <div className="text-blue-600 mt-0.5">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="text-sm text-blue-800">
                            <p className="font-medium">This question type is not accessible to users requiring screen readers.</p>
                            <p className="mt-1">
                              Keyboard controls are available while using the hotspot.{" "}
                              <button className="underline">Click here</button> or press f for a list of shortcuts.
                              Just make sure an input field is focused to use these controls.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="show-calculator"
                            checked={hotSpotShowCalculator}
                            onCheckedChange={setHotSpotShowCalculator}
                          />
                          <label htmlFor="show-calculator" className="text-sm font-medium">
                            Show on-screen calculator
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Formula Question Editor */}
                  {watchedQuestionType === "formula" && (
                    <div className="space-y-6">
                      <FormLabel>Formula Question Configuration</FormLabel>
                      
                      {/* Variables Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Variables</h3>
                        <p className="text-sm text-gray-600">
                          Once you have entered your variables above, you should see them listed below. 
                          You can specify the range of possible values for each variable below.
                        </p>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="border border-gray-300 px-4 py-2 text-left">Variable</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Min</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Max</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Decimals</th>
                              </tr>
                            </thead>
                            <tbody>
                              {formulaConfig.variables.map((variable, index) => (
                                <tr key={variable.id}>
                                  <td className="border border-gray-300 px-4 py-2 font-medium">{variable.name}</td>
                                  <td className="border border-gray-300 px-4 py-2">
                                    <Input
                                      type="number"
                                      value={variable.min}
                                      onChange={(e) => {
                                        const newVariables = [...formulaConfig.variables];
                                        newVariables[index].min = Number(e.target.value);
                                        setFormulaConfig({...formulaConfig, variables: newVariables});
                                      }}
                                      className="w-20"
                                    />
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2">
                                    <Input
                                      type="number"
                                      value={variable.max}
                                      onChange={(e) => {
                                        const newVariables = [...formulaConfig.variables];
                                        newVariables[index].max = Number(e.target.value);
                                        setFormulaConfig({...formulaConfig, variables: newVariables});
                                      }}
                                      className="w-20"
                                    />
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2">
                                    <Input
                                      type="number"
                                      value={variable.decimals}
                                      onChange={(e) => {
                                        const newVariables = [...formulaConfig.variables];
                                        newVariables[index].decimals = Number(e.target.value);
                                        setFormulaConfig({...formulaConfig, variables: newVariables});
                                      }}
                                      className="w-20"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Formula Definition */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Formula Definition</h3>
                        <p className="text-sm text-gray-600">
                          Next, write the formula or formulas used to compute the correct answer. 
                          Use the same variable names listed above. (e.g., "5 + x")
                        </p>
                        <Textarea
                          placeholder="Enter your formula here..."
                          value={formulaConfig.formula}
                          onChange={(e) => setFormulaConfig({...formulaConfig, formula: e.target.value})}
                          className="min-h-[100px] font-mono"
                        />
                      </div>

                      {/* Generate Possible Solutions */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Generate Possible Solutions</h3>
                        <p className="text-sm text-gray-600">
                          Finally, build as many variable-solution combinations as you need for your quiz.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Number of solutions <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center">
                              <Input
                                type="number"
                                value={formulaConfig.possibleAnswers}
                                onChange={(e) => setFormulaConfig({...formulaConfig, possibleAnswers: Number(e.target.value)})}
                                className="w-20"
                              />
                              <div className="ml-2 flex flex-col">
                                <button className="text-xs px-1 border hover:bg-gray-100">▲</button>
                                <button className="text-xs px-1 border hover:bg-gray-100">▼</button>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-2">Decimal places</label>
                            <div className="flex items-center">
                              <Input
                                type="number"
                                value={formulaConfig.decimalPlaces}
                                onChange={(e) => setFormulaConfig({...formulaConfig, decimalPlaces: Number(e.target.value)})}
                                className="w-20"
                              />
                              <div className="ml-2 flex flex-col">
                                <button className="text-xs px-1 border hover:bg-gray-100">▲</button>
                                <button className="text-xs px-1 border hover:bg-gray-100">▼</button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="scientific-notation"
                              checked={formulaConfig.scientificNotation}
                              onCheckedChange={(checked) => setFormulaConfig({...formulaConfig, scientificNotation: checked as boolean})}
                            />
                            <label htmlFor="scientific-notation" className="text-sm font-medium">
                              Display as Scientific Notation
                            </label>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Margin type</label>
                            <Select
                              value={formulaConfig.marginType}
                              onValueChange={(value: 'absolute' | 'percentage') => setFormulaConfig({...formulaConfig, marginType: value})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="absolute">Absolute</SelectItem>
                                <SelectItem value="percentage">Percentage</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-2">+/- margin of error</label>
                            <div className="flex items-center">
                              <Input
                                type="number"
                                value={formulaConfig.marginValue}
                                onChange={(e) => setFormulaConfig({...formulaConfig, marginValue: Number(e.target.value)})}
                                className="w-20"
                              />
                              <div className="ml-2 flex flex-col">
                                <button className="text-xs px-1 border hover:bg-gray-100">▲</button>
                                <button className="text-xs px-1 border hover:bg-gray-100">▼</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Essay Question */}
                  {watchedQuestionType === "essay" && (
                    <div className="space-y-4">
                      <FormLabel>Essay Question Configuration</FormLabel>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <strong>Note:</strong> Essay questions are open-ended and require manual grading. 
                          Students will see a text area to enter their response.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Fill in the Blank */}
                  {watchedQuestionType === "fill_blank" && (
                    <div className="space-y-4">
                      <FormLabel>Fill in the Blank Configuration</FormLabel>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          <strong>Instructions:</strong> Use [blank] or [answer] in your question text to indicate where students should fill in answers.
                          Example: "The capital of France is [blank]."
                        </p>
                      </div>
                    </div>
                  )}

                  {/* File Upload */}
                  {watchedQuestionType === "file_upload" && (
                    <div className="space-y-4">
                      <FormLabel>File Upload Configuration</FormLabel>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <p className="text-sm text-green-700 dark:text-green-300">
                          <strong>Note:</strong> Students will be able to upload files as their response. 
                          Supported formats: PDF, DOC, DOCX, TXT, images.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Numerical Answer */}
                  {watchedQuestionType === "numerical" ? (
                    <div className="space-y-4">
                      <FormLabel>Numerical Answer Configuration</FormLabel>
                      <div className="p-4 border rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                        <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-4">
                          Enter the correct numerical answer. Students will need to provide an exact match.
                        </p>
                        <div>
                          <FormLabel>Correct Answer</FormLabel>
                          <Input
                            placeholder="Enter numerical answer (e.g., 42 or 3.14)"
                            value={answerOptions[0]?.text || ""}
                            onChange={(e) => {
                              setAnswerOptions([{ text: e.target.value, isCorrect: true }]);
                            }}
                            type="number"
                            step="any"
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Multiple Fill in the Blank */}
                  {watchedQuestionType === "multiple_fill_blank" && (
                    <div className="space-y-4">
                      <FormLabel>Multiple Fill in the Blank Configuration</FormLabel>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          <strong>Instructions:</strong> Use [blank1], [blank2], etc. in your question text to indicate multiple fill-in areas.
                          Example: "The [blank1] is the capital of [blank2]."
                        </p>
                      </div>
                      <div className="space-y-3">
                        <FormLabel>Correct Answers</FormLabel>
                        {answerOptions.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="text-sm font-medium w-16">Blank {index + 1}:</span>
                            <Input
                              placeholder={`Answer for blank ${index + 1}`}
                              value={option.text}
                              onChange={(e) => updateAnswerOption(index, 'text', e.target.value)}
                              className="flex-1"
                            />
                            {answerOptions.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAnswerOption(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
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
                          <Plus className="h-4 w-4 mr-1" />
                          Add Blank
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Matching Question Editor - FORCED TEST */}
                  {true ? (
                    <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded">
                      <p className="text-red-800 font-bold">🔧 TESTING: This red box should ALWAYS show up!</p>
                      <p className="text-red-600">Current question type: {watchedQuestionType}</p>
                      <p className="text-red-600">Should show matching editor: {String(watchedQuestionType === "matching")}</p>
                    </div>
                  ) : null}
                  
                  {/* Actual Matching Question Editor */}
                  {watchedQuestionType === "matching" ? (
                    <div className="space-y-4">
                      <FormLabel>Matching Question Setup</FormLabel>
                      <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                          Create pairs of matching items. Students will drag items from the left column to match with items in the right column.
                        </p>
                        <MatchingQuestionEditor
                          pairs={matchingPairs}
                          onChange={setMatchingPairs}
                          distractors={matchingDistractors}
                          onDistractorsChange={setMatchingDistractors}
                        />
                      </div>
                    </div>
                  ) : null}

                  {/* Sorting Question Editor */}
                  {watchedQuestionType === "sorting" ? (
                    <div className="space-y-4">
                      <FormLabel>Sorting Question Setup</FormLabel>
                      <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-900/20">
                        <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
                          Create items that students will sort according to specific criteria. Define the correct order and sorting rules.
                        </p>
                        <SortingQuestionEditor
                          items={sortingItems}
                          onChange={setSortingItems}
                          sortingCriteria={sortingCriteria}
                          onCriteriaChange={setSortingCriteria}
                          sortingType={sortingType}
                          onSortingTypeChange={setSortingType}
                        />
                      </div>
                    </div>
                  ) : null}



                  {/* Stimulus Question */}
                  {watchedQuestionType === "stimulus" && (
                    <div className="space-y-4">
                      <FormLabel>Stimulus Configuration</FormLabel>
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          <strong>Note:</strong> Stimulus questions provide context material (text, image, data) 
                          that students use to answer questions. The stimulus content should be included in the question text.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label>Stimulus Content</Label>
                          <Textarea
                            placeholder="Enter the stimulus content (passage, data, chart description, etc.)"
                            className="min-h-[120px]"
                            value={answerOptions[0]?.text || ''}
                            onChange={(e) => {
                              setAnswerOptions([{ text: e.target.value, isCorrect: true }]);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Text Block (No Question) */}
                  {watchedQuestionType === "text_no_question" && (
                    <div className="space-y-4">
                      <FormLabel>Text Block Configuration</FormLabel>
                      <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong>Note:</strong> Text blocks provide information without requiring an answer.
                          They are useful for instructions, context, or breaks between questions.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Question Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="points"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              placeholder="1"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="difficultyScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty (1-10)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              placeholder="5"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Tags */}
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags (comma-separated)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="biology, genetics, cell-structure"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Question Options */}
                  <div className="space-y-3">
                    <FormLabel>Question Options</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="shuffle-answers"
                          checked={shuffleAnswers}
                          onCheckedChange={setShuffleAnswers}
                        />
                        <label htmlFor="shuffle-answers" className="text-sm font-medium">
                          Shuffle answer choices
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="require-response"
                          checked={requireResponse}
                          onCheckedChange={setRequireResponse}
                        />
                        <label htmlFor="require-response" className="text-sm font-medium">
                          Require response
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-6 border-t">
                    <div className="flex items-center space-x-2">
                      {questionId && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => validateQuestionMutation.mutate()}
                          disabled={validateQuestionMutation.isPending}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          {validateQuestionMutation.isPending ? "Validating..." : "AI Validate"}
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {onClose && (
                        <Button type="button" variant="outline" onClick={onClose}>
                          Cancel
                        </Button>
                      )}
                      <Button
                        type="submit"
                        disabled={saveQuestionMutation.isPending}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saveQuestionMutation.isPending ? "Saving..." : "Save Question"}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="validation">
              <AIValidationPanel
                questionId={questionId}
                validationResults={validationResults}
                onValidate={() => validateQuestionMutation.mutate()}
                isValidating={validateQuestionMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="preview">
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Question Preview</h3>
                {watchedQuestionText ? (
                  <div className="space-y-4">
                    <p className="text-gray-900 dark:text-white">{watchedQuestionText}</p>
                    
                    {/* Multiple Choice/Response Preview */}
                    {(watchedQuestionType === "multiple_choice" || watchedQuestionType === "multiple_response") && (
                      <div className="space-y-2">
                        {answerOptions.filter(option => option.text.trim()).map((option, index) => (
                          <div
                            key={index}
                            className={`p-3 border rounded-lg ${
                              option.isCorrect
                                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                : "border-gray-300 dark:border-gray-600"
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border border-gray-400 rounded-full" />
                              <span>{option.text}</span>
                              {option.isCorrect && (
                                <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* True/False Preview */}
                    {watchedQuestionType === "true_false" && (
                      <div className="space-y-2">
                        <div className={`p-3 border rounded-lg ${answerOptions[0]?.isCorrect ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-gray-300 dark:border-gray-600"}`}>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border border-gray-400 rounded-full" />
                            <span>True</span>
                            {answerOptions[0]?.isCorrect && <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />}
                          </div>
                        </div>
                        <div className={`p-3 border rounded-lg ${answerOptions[1]?.isCorrect ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-gray-300 dark:border-gray-600"}`}>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border border-gray-400 rounded-full" />
                            <span>False</span>
                            {answerOptions[1]?.isCorrect && <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ordering Preview */}
                    {watchedQuestionType === "ordering" && orderingItems.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Correct order:</p>
                        {orderingItems.map((item, index) => (
                          <div key={item.id} className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                            <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">{index + 1}</span>
                            <span>{item.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Matching Preview */}
                    {watchedQuestionType === "matching" && matchingPairs.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Matching pairs:</p>
                        {matchingPairs.filter(pair => pair.leftItem.trim() && pair.rightItem.trim()).map((pair, index) => (
                          <div key={pair.id} className="flex items-center space-x-4 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                            <span className="flex-1 text-left">{pair.leftItem}</span>
                            <span className="text-gray-400">→</span>
                            <span className="flex-1 text-right">{pair.rightItem}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Multiple Fill in the Blank Preview */}
                    {watchedQuestionType === "multiple_fill_blank" && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Fill in the blanks:</p>
                        {answerOptions.filter(option => option.text.trim()).map((option, index) => (
                          <div key={index} className="flex items-center space-x-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                            <span className="font-medium">Blank {index + 1}:</span>
                            <span className="text-green-600">{option.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Numerical Preview */}
                    {watchedQuestionType === "numerical" && answerOptions[0]?.text && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                        <p className="text-sm text-gray-600">Correct answer:</p>
                        <p className="text-lg font-medium text-green-600">{answerOptions[0].text}</p>
                      </div>
                    )}

                    {/* Other question types */}
                    {["essay", "file_upload", "fill_blank", "stimulus", "text_no_question"].includes(watchedQuestionType) && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                        <p className="text-sm text-gray-600">
                          {watchedQuestionType === "essay" && "Students will see a text area for their essay response."}
                          {watchedQuestionType === "file_upload" && "Students will see a file upload interface."}
                          {watchedQuestionType === "fill_blank" && "Students will see input fields for blanks marked in the question text."}
                          {watchedQuestionType === "stimulus" && "Students will see the stimulus content with the question."}
                          {watchedQuestionType === "text_no_question" && "This is an informational text block without a question."}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">Enter question text to see preview</p>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
