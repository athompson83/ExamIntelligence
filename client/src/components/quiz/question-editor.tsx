import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  Bot, 
  Tag,
  BookOpen,
  GripVertical,
  Image,
  Upload
} from "lucide-react";

interface AnswerOption {
  id?: string;
  answerText: string;
  isCorrect: boolean;
  mediaUrl?: string;
  displayOrder: number;
  reasoning?: string;
  feedback?: string;
}

interface Question {
  id?: string;
  testbankId: string;
  questionText: string;
  questionType: string;
  difficultyScore: number;
  tags: string[];
  bloomsLevel: string;
  answerOptions?: AnswerOption[];
  aiFeedback?: string;
  lastValidatedAt?: string;
  generalFeedback?: string;
  correctFeedback?: string;
  incorrectFeedback?: string;
  neutralFeedback?: string;
}

interface QuestionEditorProps {
  testbankId: string;
  question?: Question | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (question: Question) => void;
}

const questionTypes = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'multiple_response', label: 'Multiple Response' },
  { value: 'true_false', label: 'True/False' },
  { value: 'fill_blank', label: 'Fill in the Blank' },
  { value: 'essay', label: 'Essay' },
  { value: 'constructed_response', label: 'Constructed Response' },
  { value: 'hot_spot', label: 'Hot Spot' },
  { value: 'categorization', label: 'Categorization' },
  { value: 'formula', label: 'Formula' }
];

const bloomsLevels = [
  { value: 'remember', label: 'Remember' },
  { value: 'understand', label: 'Understand' },
  { value: 'apply', label: 'Apply' },
  { value: 'analyze', label: 'Analyze' },
  { value: 'evaluate', label: 'Evaluate' },
  { value: 'create', label: 'Create' }
];

export function QuestionEditor({ testbankId, question, isOpen, onClose, onSave }: QuestionEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const getDefaultAnswerOptions = (questionType: string) => {
    switch (questionType) {
      case 'multiple_choice':
        return [
          { answerText: '', isCorrect: true, displayOrder: 0, feedback: '' },
          { answerText: '', isCorrect: false, displayOrder: 1, feedback: '' },
          { answerText: '', isCorrect: false, displayOrder: 2, feedback: '' },
          { answerText: '', isCorrect: false, displayOrder: 3, feedback: '' }
        ];
      case 'multiple_response':
        return [
          { answerText: '', isCorrect: false, displayOrder: 0, feedback: '' },
          { answerText: '', isCorrect: false, displayOrder: 1, feedback: '' },
          { answerText: '', isCorrect: false, displayOrder: 2, feedback: '' },
          { answerText: '', isCorrect: false, displayOrder: 3, feedback: '' }
        ];
      case 'true_false':
        return [
          { answerText: 'True', isCorrect: false, displayOrder: 0, feedback: '' },
          { answerText: 'False', isCorrect: false, displayOrder: 1, feedback: '' }
        ];
      default:
        return [];
    }
  };

  const [formData, setFormData] = useState<Question>({
    testbankId,
    questionText: question?.questionText || '',
    questionType: question?.questionType || 'multiple_choice',
    difficultyScore: question?.difficultyScore || 5,
    tags: question?.tags || [],
    bloomsLevel: question?.bloomsLevel || 'remember',
    answerOptions: question?.answerOptions || getDefaultAnswerOptions(question?.questionType || 'multiple_choice'),
    generalFeedback: question?.generalFeedback || '',
    correctFeedback: question?.correctFeedback || '',
    incorrectFeedback: question?.incorrectFeedback || '',
    neutralFeedback: question?.neutralFeedback || ''
  });

  const [newTag, setNewTag] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const saveQuestionMutation = useMutation({
    mutationFn: async (questionData: Question) => {
      const endpoint = question?.id 
        ? `/api/questions/${question.id}`
        : '/api/questions';
      const method = question?.id ? 'PUT' : 'POST';
      
      await apiRequest(method, endpoint, {
        ...questionData,
        answerOptions: formData.answerOptions
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/testbanks', testbankId, 'questions'] });
      toast({
        title: "Success",
        description: question?.id ? "Question updated successfully" : "Question created successfully",
      });
      onSave?.(formData);
      onClose();
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
        description: "Failed to save question",
        variant: "destructive",
      });
    },
  });

  const validateQuestionMutation = useMutation({
    mutationFn: async () => {
      if (!question?.id) {
        throw new Error("Question must be saved before validation");
      }
      const response = await apiRequest("POST", `/api/questions/${question.id}/validate`);
      return response.json();
    },
    onSuccess: (data) => {
      setValidationResult(data);
      setIsValidating(false);
      toast({
        title: "Validation Complete",
        description: `AI validation completed with ${data.issues?.length || 0} issues found`,
      });
    },
    onError: (error) => {
      setIsValidating(false);
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
        description: "Failed to validate question",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof Question, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // If question type changes, set appropriate default answer options
      if (field === 'questionType') {
        if (value === 'multiple_choice' || value === 'multiple_response') {
          // Default to 4 options for multiple choice questions
          updated.answerOptions = [
            { answerText: '', isCorrect: false, displayOrder: 0 },
            { answerText: '', isCorrect: false, displayOrder: 1 },
            { answerText: '', isCorrect: false, displayOrder: 2 },
            { answerText: '', isCorrect: false, displayOrder: 3 }
          ];
        } else if (value === 'true_false') {
          // Default True/False options
          updated.answerOptions = [
            { answerText: 'True', isCorrect: false, displayOrder: 0 },
            { answerText: 'False', isCorrect: false, displayOrder: 1 }
          ];
        } else {
          // Remove answer options for other question types
          updated.answerOptions = [];
        }
      }
      
      return updated;
    });
  };

  const handleAnswerOptionChange = (index: number, field: keyof AnswerOption, value: any) => {
    setFormData(prev => ({
      ...prev,
      answerOptions: prev.answerOptions?.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  const addAnswerOption = () => {
    setFormData(prev => ({
      ...prev,
      answerOptions: [
        ...(prev.answerOptions || []),
        { 
          answerText: '', 
          isCorrect: false, 
          displayOrder: prev.answerOptions?.length || 0 
        }
      ]
    }));
  };

  const removeAnswerOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      answerOptions: prev.answerOptions?.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleInputChange('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = () => {
    // Validate required fields
    if (!formData.questionText.trim()) {
      toast({
        title: "Validation Error",
        description: "Question text is required",
        variant: "destructive",
      });
      return;
    }

    // Validate answer options for certain question types
    if (['multiple_choice', 'multiple_response', 'true_false'].includes(formData.questionType)) {
      const hasCorrectAnswer = formData.answerOptions?.some(option => option.isCorrect);
      if (!hasCorrectAnswer) {
        toast({
          title: "Validation Error",
          description: "At least one answer option must be marked as correct",
          variant: "destructive",
        });
        return;
      }
    }

    saveQuestionMutation.mutate(formData);
  };

  const handleValidate = () => {
    setIsValidating(true);
    validateQuestionMutation.mutate();
  };

  const renderAnswerOptions = () => {
    if (!['multiple_choice', 'multiple_response', 'true_false'].includes(formData.questionType)) {
      return null;
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Answer Options</Label>
          {formData.questionType !== 'true_false' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addAnswerOption}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Option
            </Button>
          )}
        </div>
        
        <div className="space-y-4">
          {formData.answerOptions?.map((option, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <GripVertical className="h-4 w-4 text-muted-foreground mr-2" />
                  <Checkbox
                    checked={option.isCorrect}
                    onCheckedChange={(checked) => 
                      handleAnswerOptionChange(index, 'isCorrect', checked)
                    }
                  />
                  <Label className="ml-2 text-sm font-medium">
                    {option.isCorrect ? '✓ Correct Answer' : 'Possible Answer'}
                  </Label>
                </div>
                
                {formData.questionType !== 'true_false' && formData.answerOptions && formData.answerOptions.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAnswerOption(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Answer Text</Label>
                  <RichTextEditor
                    value={option.answerText}
                    onChange={(value) => handleAnswerOptionChange(index, 'answerText', value)}
                    placeholder={`Answer ${String.fromCharCode(65 + index)}`}
                    className="mt-1"
                    allowMedia={true}
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Answer Comment</Label>
                  <RichTextEditor
                    value={option.feedback || ''}
                    onChange={(value) => handleAnswerOptionChange(index, 'feedback', value)}
                    placeholder="Feedback for this specific answer..."
                    className="mt-1"
                    allowMedia={false}
                  />
                </div>
              </div>
              
              <Separator />
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {question?.id ? 'Edit Question' : 'Create New Question'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="content" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="options">Answer Options</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="validation">AI Validation</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <div>
              <Label htmlFor="questionText">Question Text</Label>
              <RichTextEditor
                value={formData.questionText}
                onChange={(value) => handleInputChange('questionText', value)}
                placeholder="Enter your question here..."
                className="mt-1"
                allowMedia={true}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="questionType">Question Type</Label>
                <Select 
                  value={formData.questionType} 
                  onValueChange={(value) => handleInputChange('questionType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {questionTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="difficultyScore">Difficulty (1-10)</Label>
                <Input
                  id="difficultyScore"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.difficultyScore}
                  onChange={(e) => handleInputChange('difficultyScore', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="options" className="space-y-4">
            {renderAnswerOptions()}
            
            {!['multiple_choice', 'multiple_response', 'true_false'].includes(formData.questionType) && (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-2" />
                <p>No answer options needed for {questionTypes.find(t => t.value === formData.questionType)?.label} questions</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold">Question Feedback Settings</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure feedback messages that students will see based on their responses.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <Label className="font-semibold text-green-700">Correct Answer Feedback</Label>
                    </div>
                    <RichTextEditor
                      value={formData.correctFeedback || ''}
                      onChange={(value) => handleInputChange('correctFeedback', value)}
                      placeholder="Feedback shown when the student answers correctly..."
                      allowMedia={false}
                    />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <Label className="font-semibold text-red-700">Incorrect Answer Feedback</Label>
                    </div>
                    <RichTextEditor
                      value={formData.incorrectFeedback || ''}
                      onChange={(value) => handleInputChange('incorrectFeedback', value)}
                      placeholder="Feedback shown when the student answers incorrectly..."
                      allowMedia={false}
                    />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <Label className="font-semibold text-blue-700">General Feedback (All)</Label>
                    </div>
                    <RichTextEditor
                      value={formData.generalFeedback || ''}
                      onChange={(value) => handleInputChange('generalFeedback', value)}
                      placeholder="Feedback shown to all students regardless of their answer..."
                      allowMedia={false}
                    />
                  </div>
                </Card>
              </div>

              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <Label className="font-semibold text-gray-700">Neutral/Partial Credit Feedback</Label>
                  </div>
                  <RichTextEditor
                    value={formData.neutralFeedback || ''}
                    onChange={(value) => handleInputChange('neutralFeedback', value)}
                    placeholder="Feedback for partial credit or neutral responses..."
                    allowMedia={false}
                  />
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4">
            <div>
              <Label htmlFor="bloomsLevel">Bloom's Taxonomy Level</Label>
              <Select 
                value={formData.bloomsLevel} 
                onValueChange={(value) => handleInputChange('bloomsLevel', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bloomsLevels.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tags</Label>
              <div className="mt-2 space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button onClick={addTag} variant="outline">
                    <Tag className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="validation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="mr-2 h-5 w-5" />
                  AI Validation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {question?.id ? (
                    <Button 
                      onClick={handleValidate} 
                      disabled={isValidating}
                      className="w-full"
                    >
                      <Bot className="mr-2 h-4 w-4" />
                      {isValidating ? 'Validating...' : 'Run AI Validation'}
                    </Button>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <p>Save the question first to enable AI validation</p>
                    </div>
                  )}

                  {validationResult && (
                    <div className="space-y-4">
                      <Separator />
                      
                      <div>
                        <h4 className="font-medium mb-2">Validation Results</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Status:</span>
                            <Badge variant={
                              validationResult.status === 'approved' ? 'default' :
                              validationResult.status === 'rejected' ? 'destructive' :
                              'secondary'
                            }>
                              {validationResult.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Confidence:</span>
                            <span className="text-sm font-medium">
                              {Math.round(validationResult.confidenceScore * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {validationResult.issues?.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 text-destructive">Issues Found</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {validationResult.issues.map((issue: string, index: number) => (
                              <li key={index} className="text-destructive">{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {validationResult.suggestions?.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 text-primary">Suggestions</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {validationResult.suggestions.map((suggestion: string, index: number) => (
                              <li key={index} className="text-primary">{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {validationResult.comments && (
                        <div>
                          <h4 className="font-medium mb-2">AI Feedback</h4>
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                            {validationResult.comments}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {question?.aiFeedback && !validationResult && (
                    <div>
                      <h4 className="font-medium mb-2">Previous AI Feedback</h4>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                        {question.aiFeedback}
                      </p>
                      {question.lastValidatedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Last validated: {new Date(question.lastValidatedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={handleSave} 
            disabled={saveQuestionMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="mr-2 h-4 w-4" />
            {saveQuestionMutation.isPending ? 'Saving...' : 'Save Question'}
          </Button>
          
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          
          <Button variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
