import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, Plus, Brain, CheckCircle, AlertTriangle } from "lucide-react";
import { Question, AnswerOption, ValidationResult } from "@/types";

const answerOptionSchema = z.object({
  answerText: z.string().min(1, "Answer text is required"),
  isCorrect: z.boolean().default(false),
  explanation: z.string().optional(),
});

const questionSchema = z.object({
  questionText: z.string().min(1, "Question text is required"),
  questionType: z.enum([
    "multiple_choice",
    "multiple_response", 
    "true_false",
    "fill_blank",
    "multiple_fill_blank",
    "essay",
    "file_upload",
    "formula",
    "numerical",
    "matching",
    "ordering",
    "categorization",
    "hot_spot",
    "stimulus",
    "text_no_question"
  ]),
  points: z.number().min(1).default(1),
  timeLimit: z.number().optional(),
  bloomsLevel: z.string().optional(),
  tags: z.array(z.string()).default([]),
  answerOptions: z.array(answerOptionSchema).default([]),
});

type QuestionFormData = z.infer<typeof questionSchema>;

interface QuestionEditorProps {
  testbankId: number;
  question?: Question;
  onSave: (question: Question) => void;
  onCancel: () => void;
}

export function QuestionEditor({ testbankId, question, onSave, onCancel }: QuestionEditorProps) {
  const [tagInput, setTagInput] = useState("");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      questionText: question?.questionText || "",
      questionType: question?.questionType || "multiple_choice",
      points: question?.points || 1,
      timeLimit: question?.timeLimit || undefined,
      bloomsLevel: question?.bloomsLevel || "",
      tags: question?.tags || [],
      answerOptions: question?.answerOptions || [
        { answerText: "", isCorrect: false, explanation: "" },
        { answerText: "", isCorrect: false, explanation: "" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "answerOptions",
  });

  const questionType = watch("questionType");
  const tags = watch("tags");
  const answerOptions = watch("answerOptions");

  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      const response = await apiRequest("/api/questions", { method: "POST", body: JSON.stringify({
        ...data,
        testbankId,
      }) });
      return response.json();
    },
    onSuccess: (newQuestion) => {
      queryClient.invalidateQueries({ queryKey: ["/api/testbanks", testbankId, "questions"] });
      toast({
        title: "Success",
        description: "Question created successfully",
      });
      onSave(newQuestion);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create question",
        variant: "destructive",
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      const response = await apiRequest(`/api/questions/${question!.id}`, { method: "PUT", body: JSON.stringify(data) });
      return response.json();
    },
    onSuccess: (updatedQuestion) => {
      queryClient.invalidateQueries({ queryKey: ["/api/testbanks", testbankId, "questions"] });
      toast({
        title: "Success",
        description: "Question updated successfully",
      });
      onSave(updatedQuestion);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update question",
        variant: "destructive",
      });
    },
  });

  const validateQuestionMutation = useMutation({
    mutationFn: async () => {
      if (!question?.id) throw new Error("Question must be saved before validation");
      const response = await apiRequest("POST", `/api/questions/${question.id}/validate`);
      return response.json();
    },
    onSuccess: (result: ValidationResult) => {
      setValidationResult(result);
      toast({
        title: "Validation Complete",
        description: result.isValid ? "Question is valid" : "Issues found in question",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to validate question",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: QuestionFormData) => {
    // Ensure at least one correct answer for multiple choice questions
    if (data.questionType === "multiple_choice" || data.questionType === "multiple_response") {
      const hasCorrectAnswer = data.answerOptions.some(option => option.isCorrect);
      if (!hasCorrectAnswer) {
        toast({
          title: "Validation Error",
          description: "At least one answer option must be marked as correct",
          variant: "destructive",
        });
        return;
      }
    }

    if (question) {
      updateQuestionMutation.mutate(data);
    } else {
      createQuestionMutation.mutate(data);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setValue("tags", [...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue("tags", tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const addAnswerOption = () => {
    append({ answerText: "", isCorrect: false, explanation: "" });
  };

  const questionTypeOptions = [
    { value: "multiple_choice", label: "Multiple Choice" },
    { value: "multiple_response", label: "Multiple Response" },
    { value: "true_false", label: "True/False" },
    { value: "fill_blank", label: "Fill in the Blank" },
    { value: "essay", label: "Essay" },
    { value: "constructed_response", label: "Constructed Response" },
    { value: "hot_spot", label: "Hot Spot" },
    { value: "categorization", label: "Categorization" },
    { value: "formula", label: "Formula" },
    { value: "matching", label: "Matching" },
    { value: "ordering", label: "Ordering" },
  ];

  const bloomsLevels = [
    "Remember",
    "Understand",
    "Apply",
    "Analyze",
    "Evaluate",
    "Create",
  ];

  const requiresOptions = ["multiple_choice", "multiple_response", "true_false"];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {question ? "Edit Question" : "Create New Question"}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="question" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="question">Question</TabsTrigger>
            <TabsTrigger value="validation">AI Validation</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>

          <TabsContent value="question" className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Question Type */}
              <div className="space-y-2">
                <Label>Question Type *</Label>
                <Select
                  value={questionType}
                  onValueChange={(value) => setValue("questionType", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {questionTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                <Label htmlFor="questionText">Question Text *</Label>
                <Textarea
                  id="questionText"
                  {...register("questionText")}
                  placeholder="Enter your question text"
                  rows={4}
                />
                {errors.questionText && (
                  <p className="text-sm text-destructive">{errors.questionText.message}</p>
                )}
              </div>

              {/* Answer Options */}
              {requiresOptions.includes(questionType) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Answer Options</Label>
                    <Button type="button" onClick={addAnswerOption} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Switch
                            {...register(`answerOptions.${index}.isCorrect`)}
                            onCheckedChange={(checked) => 
                              setValue(`answerOptions.${index}.isCorrect`, checked)
                            }
                          />
                          <Label className="text-xs">Correct</Label>
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <Input
                            {...register(`answerOptions.${index}.answerText`)}
                            placeholder="Answer text"
                          />
                          <Input
                            {...register(`answerOptions.${index}.explanation`)}
                            placeholder="Explanation (optional)"
                            className="text-sm"
                          />
                        </div>
                        
                        {fields.length > 2 && (
                          <Button
                            type="button"
                            onClick={() => remove(index)}
                            variant="outline"
                            size="sm"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    {...register("points", { valueAsNumber: true })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    min="0"
                    {...register("timeLimit", { valueAsNumber: true })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {createQuestionMutation.isPending || updateQuestionMutation.isPending
                    ? "Saving..."
                    : question ? "Update Question" : "Create Question"
                  }
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="validation" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">AI Validation</h3>
                <Button
                  onClick={() => validateQuestionMutation.mutate()}
                  disabled={!question?.id || validateQuestionMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  {validateQuestionMutation.isPending ? "Validating..." : "Validate Question"}
                </Button>
              </div>

              {!question?.id && (
                <div className="text-center py-8">
                  <Brain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Save the question first to enable AI validation.
                  </p>
                </div>
              )}

              {validationResult && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        {validationResult.isValid ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        )}
                        <span className="font-medium">
                          {validationResult.isValid ? "Question is valid" : "Issues found"}
                        </span>
                        <Badge variant="secondary">
                          Confidence: {Math.round(validationResult.confidenceScore * 100)}%
                        </Badge>
                      </div>

                      {validationResult.issues.length > 0 && (
                        <div>
                          <h4 className="font-medium text-destructive mb-2">Issues:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {validationResult.issues.map((issue, index) => (
                              <li key={index} className="text-sm text-muted-foreground">
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {validationResult.suggestions.length > 0 && (
                        <div>
                          <h4 className="font-medium text-primary mb-2">Suggestions:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {validationResult.suggestions.map((suggestion, index) => (
                              <li key={index} className="text-sm text-muted-foreground">
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div>
                        <Label>Difficulty Score</Label>
                        <div className="text-2xl font-bold text-primary">
                          {validationResult.difficultyScore}/10
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-6">
            {/* Bloom's Taxonomy */}
            <div className="space-y-2">
              <Label>Bloom's Taxonomy Level</Label>
              <Select
                value={watch("bloomsLevel") || ""}
                onValueChange={(value) => setValue("bloomsLevel", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Bloom's level" />
                </SelectTrigger>
                <SelectContent>
                  {bloomsLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  placeholder="Add tags (press Enter)"
                />
                <Button type="button" onClick={addTag} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
