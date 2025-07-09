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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AIValidationPanel from "./AIValidationPanel";
import { OrderingQuestionEditor } from "./question-types/OrderingQuestionEditor";
import { CategorizationQuestionEditor } from "./question-types/CategorizationQuestionEditor";
import { HotSpotQuestionEditor } from "./question-types/HotSpotQuestionEditor";
import { FormulaQuestionEditor } from "./question-types/FormulaQuestionEditor";
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

const questionFormSchema = insertQuestionSchema.extend({
  tags: z.string().optional(),
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
      tags: "",
      bloomsLevel: "remember",
    },
  });

  useEffect(() => {
    if (question) {
      form.reset({
        testbankId: question.testbankId,
        questionText: question.questionText,
        questionType: question.questionType,
        tags: question.tags?.join(", ") || "",
        bloomsLevel: question.bloomsLevel || "remember",
      });

      if (question.answerOptions) {
        setAnswerOptions(question.answerOptions);
      }

      // Load question-specific data from questionConfig
      if (question.questionConfig) {
        const config = question.questionConfig;
        
        if (question.questionType === "ordering" && config.items) {
          setOrderingItems(config.items);
        }
        
        if (question.questionType === "categorization" && config.categories && config.items) {
          setCategorizationCategories(config.categories);
          setCategorizationItems(config.items);
        }
        
        if (question.questionType === "hot_spot") {
          setHotSpotImageUrl(config.imageUrl || "");
          setHotSpotAreas(config.hotSpots || []);
          setHotSpotShowCalculator(config.showCalculator || false);
        }
        
        if (question.questionType === "formula") {
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

  const watchedQuestionType = form.watch("questionType");
  const watchedQuestionText = form.watch("questionText");

  const getDifficultyBadge = (score?: number) => {
    if (!score) return null;
    if (score <= 3) return <Badge className="difficulty-easy">Easy</Badge>;
    if (score <= 7) return <Badge className="difficulty-medium">Medium</Badge>;
    return <Badge className="difficulty-hard">Hard</Badge>;
  };

  return (
    <div className="question-editor">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {questionId ? "Edit Question" : "Create New Question"}
            </CardTitle>
            <div className="flex items-center space-x-2">
              {question?.difficultyScore && getDifficultyBadge(question.difficultyScore)}
              {question?.lastValidatedAt && (
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                              onCheckedChange={(checked) => 
                                updateAnswerOption(index, 'isCorrect', checked as boolean)
                              }
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
                    <OrderingQuestionEditor
                      items={orderingItems}
                      onChange={setOrderingItems}
                    />
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
                    <HotSpotQuestionEditor
                      imageUrl={hotSpotImageUrl}
                      hotSpots={hotSpotAreas}
                      showCalculator={hotSpotShowCalculator}
                      onChange={(imageUrl, hotSpots, showCalculator) => {
                        setHotSpotImageUrl(imageUrl);
                        setHotSpotAreas(hotSpots);
                        setHotSpotShowCalculator(showCalculator);
                      }}
                    />
                  )}

                  {/* Formula Question Editor */}
                  {watchedQuestionType === "formula" && (
                    <FormulaQuestionEditor
                      {...formulaConfig}
                      onChange={setFormulaConfig}
                    />
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
                  {watchedQuestionType === "numerical" && (
                    <div className="space-y-4">
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
                  )}

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
