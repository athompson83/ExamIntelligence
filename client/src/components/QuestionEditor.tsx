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
    }
  }, [question, form]);

  const saveQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      const formattedData = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
        answerOptions: answerOptions.filter(option => option.text.trim() !== ""),
        correctAnswers: answerOptions
          .filter(option => option.isCorrect && option.text.trim() !== "")
          .map(option => option.text),
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
                              <SelectItem value="constructed_response">Constructed Response</SelectItem>
                              <SelectItem value="true_false">True/False</SelectItem>
                              <SelectItem value="hot_spot">Hot Spot</SelectItem>
                              <SelectItem value="categorization">Categorization</SelectItem>
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

                  {/* Answer Options */}
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
                          <div key={index} className="answer-option">
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
