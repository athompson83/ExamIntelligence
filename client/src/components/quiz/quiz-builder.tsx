import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Plus, 
  Search, 
  GripVertical, 
  Eye, 
  Trash2,
  Settings,
  Clock,
  Shield,
  Zap,
  Calendar,
  Users,
  Lock
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  difficultyScore: number;
  tags: string[];
  bloomsLevel: string;
  points: number;
}

interface QuizQuestion {
  id: string;
  questionId: string;
  displayOrder: number;
  points: number;
  question?: Question;
}

interface Quiz {
  id?: string;
  title: string;
  description: string;
  timeLimit: number;
  shuffleAnswers: boolean;
  shuffleQuestions: boolean;
  allowMultipleAttempts: boolean;
  passwordProtected: boolean;
  password: string;
  ipLocking: boolean;
  adaptiveTesting: boolean;
  proctoring: boolean;
  startTime?: string;
  endTime?: string;
  maxAttempts: number;
  proctoringSettings?: any;
}

interface QuizBuilderProps {
  quiz?: Quiz | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (quiz: Quiz) => void;
}

export function QuizBuilder({ quiz, isOpen, onClose, onSave }: QuizBuilderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<Quiz>({
    title: quiz?.title || '',
    description: quiz?.description || '',
    timeLimit: quiz?.timeLimit || 60,
    shuffleAnswers: quiz?.shuffleAnswers || false,
    shuffleQuestions: quiz?.shuffleQuestions || false,
    allowMultipleAttempts: quiz?.allowMultipleAttempts || false,
    passwordProtected: quiz?.passwordProtected || false,
    password: quiz?.password || '',
    ipLocking: quiz?.ipLocking || false,
    adaptiveTesting: quiz?.adaptiveTesting || false,
    proctoring: quiz?.proctoring || false,
    maxAttempts: quiz?.maxAttempts || 1,
  });

  const [selectedQuestions, setSelectedQuestions] = useState<QuizQuestion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTestbank, setSelectedTestbank] = useState<string>('');
  const [activeTab, setActiveTab] = useState('basic');

  const { data: testbanks } = useQuery({
    queryKey: ['/api/testbanks'],
    enabled: isOpen,
  });

  const { data: questions } = useQuery({
    queryKey: ['/api/testbanks', selectedTestbank, 'questions'],
    enabled: !!selectedTestbank && isOpen,
  });

  const saveQuizMutation = useMutation({
    mutationFn: async (quizData: Quiz) => {
      const endpoint = quiz?.id ? `/api/quizzes/${quiz.id}` : '/api/quizzes';
      const method = quiz?.id ? 'PUT' : 'POST';
      
      const response = await apiRequest(method, endpoint, quizData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes'] });
      toast({
        title: "Success",
        description: quiz?.id ? "Quiz updated successfully" : "Quiz created successfully",
      });
      onSave?.(data);
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
        description: "Failed to save quiz",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof Quiz, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addQuestion = (question: Question) => {
    const newQuizQuestion: QuizQuestion = {
      id: `temp-${Date.now()}`,
      questionId: question.id,
      displayOrder: selectedQuestions.length,
      points: 1,
      question
    };
    setSelectedQuestions(prev => [...prev, newQuizQuestion]);
  };

  const removeQuestion = (questionId: string) => {
    setSelectedQuestions(prev => prev.filter(q => q.questionId !== questionId));
  };

  const updateQuestionPoints = (questionId: string, points: number) => {
    setSelectedQuestions(prev => 
      prev.map(q => 
        q.questionId === questionId ? { ...q, points } : q
      )
    );
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(selectedQuestions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update display order
    const updatedItems = items.map((item, index) => ({
      ...item,
      displayOrder: index
    }));

    setSelectedQuestions(updatedItems);
  };

  const handleSave = () => {
    // Validate required fields
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Quiz title is required",
        variant: "destructive",
      });
      return;
    }

    if (selectedQuestions.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one question must be added to the quiz",
        variant: "destructive",
      });
      return;
    }

    if (formData.passwordProtected && !formData.password.trim()) {
      toast({
        title: "Validation Error",
        description: "Password is required when password protection is enabled",
        variant: "destructive",
      });
      return;
    }

    saveQuizMutation.mutate(formData);
  };

  const filteredQuestions = questions?.filter((question: Question) =>
    question.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const totalPoints = selectedQuestions.reduce((sum, q) => sum + q.points, 0);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>
            {quiz?.id ? 'Edit Quiz' : 'Create New Quiz'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 pt-0 overflow-hidden">
          {/* Quiz Configuration */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Quiz Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 text-xs">
                    <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
                    <TabsTrigger value="security" className="text-xs">Security</TabsTrigger>
                    <TabsTrigger value="advanced" className="text-xs">Advanced</TabsTrigger>
                  </TabsList>
                  
                  <ScrollArea className="h-[500px] mt-4">
                    <TabsContent value="basic" className="space-y-4">
                      <div>
                        <Label htmlFor="title">Quiz Title</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          placeholder="Enter quiz title"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          placeholder="Enter quiz description"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                        <Input
                          id="timeLimit"
                          type="number"
                          value={formData.timeLimit}
                          onChange={(e) => handleInputChange('timeLimit', parseInt(e.target.value))}
                          min="1"
                          max="480"
                        />
                      </div>

                      <div>
                        <Label htmlFor="maxAttempts">Maximum Attempts</Label>
                        <Input
                          id="maxAttempts"
                          type="number"
                          value={formData.maxAttempts}
                          onChange={(e) => handleInputChange('maxAttempts', parseInt(e.target.value))}
                          min="1"
                          max="10"
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="shuffleAnswers">Shuffle Answers</Label>
                            <p className="text-xs text-muted-foreground">Randomize answer options</p>
                          </div>
                          <Switch
                            id="shuffleAnswers"
                            checked={formData.shuffleAnswers}
                            onCheckedChange={(checked) => handleInputChange('shuffleAnswers', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="shuffleQuestions">Shuffle Questions</Label>
                            <p className="text-xs text-muted-foreground">Randomize question order</p>
                          </div>
                          <Switch
                            id="shuffleQuestions"
                            checked={formData.shuffleQuestions}
                            onCheckedChange={(checked) => handleInputChange('shuffleQuestions', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="allowMultipleAttempts">Multiple Attempts</Label>
                            <p className="text-xs text-muted-foreground">Allow retaking</p>
                          </div>
                          <Switch
                            id="allowMultipleAttempts"
                            checked={formData.allowMultipleAttempts}
                            onCheckedChange={(checked) => handleInputChange('allowMultipleAttempts', checked)}
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="security" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="passwordProtected">Password Protection</Label>
                          <p className="text-xs text-muted-foreground">Require password to access</p>
                        </div>
                        <Switch
                          id="passwordProtected"
                          checked={formData.passwordProtected}
                          onCheckedChange={(checked) => handleInputChange('passwordProtected', checked)}
                        />
                      </div>
                      
                      {formData.passwordProtected && (
                        <div>
                          <Label htmlFor="password">Quiz Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            placeholder="Enter quiz password"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="ipLocking">IP Address Locking</Label>
                          <p className="text-xs text-muted-foreground">Restrict to specific IPs</p>
                        </div>
                        <Switch
                          id="ipLocking"
                          checked={formData.ipLocking}
                          onCheckedChange={(checked) => handleInputChange('ipLocking', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="proctoring">Enable Proctoring</Label>
                          <p className="text-xs text-muted-foreground">Monitor via camera</p>
                        </div>
                        <Switch
                          id="proctoring"
                          checked={formData.proctoring}
                          onCheckedChange={(checked) => handleInputChange('proctoring', checked)}
                        />
                      </div>

                      {formData.proctoring && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <h4 className="font-medium text-amber-900 text-sm mb-1">Proctoring Settings</h4>
                          <p className="text-xs text-amber-700">
                            Students will be required to enable camera and microphone access.
                            Suspicious activities will be automatically detected and flagged.
                          </p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="advanced" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="adaptiveTesting">Adaptive Testing</Label>
                          <p className="text-xs text-muted-foreground">Adjust difficulty dynamically</p>
                        </div>
                        <Switch
                          id="adaptiveTesting"
                          checked={formData.adaptiveTesting}
                          onCheckedChange={(checked) => handleInputChange('adaptiveTesting', checked)}
                        />
                      </div>
                      
                      {formData.adaptiveTesting && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <h4 className="font-medium text-blue-900 text-sm mb-1">Adaptive Testing</h4>
                          <p className="text-xs text-blue-700">
                            Questions will be selected based on student performance.
                            Higher performers will receive more challenging questions.
                          </p>
                        </div>
                      )}

                      <Separator />

                      <div>
                        <Label>Schedule</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <Label htmlFor="startTime" className="text-xs">Start Time</Label>
                            <Input
                              id="startTime"
                              type="datetime-local"
                              value={formData.startTime || ''}
                              onChange={(e) => handleInputChange('startTime', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="endTime" className="text-xs">End Time</Label>
                            <Input
                              id="endTime"
                              type="datetime-local"
                              value={formData.endTime || ''}
                              onChange={(e) => handleInputChange('endTime', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Question Selection */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
              {/* Available Questions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Available Questions</CardTitle>
                  <div className="space-y-2">
                    <Select value={selectedTestbank} onValueChange={setSelectedTestbank}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a testbank" />
                      </SelectTrigger>
                      <SelectContent>
                        {testbanks?.map((testbank: any) => (
                          <SelectItem key={testbank.id} value={testbank.id}>
                            {testbank.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search questions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {filteredQuestions.map((question: Question) => (
                        <div
                          key={question.id}
                          className="border border-border rounded-lg p-3 hover:bg-accent cursor-pointer"
                          onClick={() => addQuestion(question)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium line-clamp-2">
                                {question.questionText}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {question.questionType.replace('_', ' ')}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Difficulty: {question.difficultyScore}/10
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {question.bloomsLevel}
                                </Badge>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {selectedTestbank && filteredQuestions.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Search className="h-8 w-8 mx-auto mb-2" />
                          <p>No questions found</p>
                        </div>
                      )}
                      
                      {!selectedTestbank && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Search className="h-8 w-8 mx-auto mb-2" />
                          <p>Select a testbank to view questions</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Selected Questions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Quiz Questions
                    <Badge variant="outline">
                      {selectedQuestions.length} questions | {totalPoints} points
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="quiz-questions">
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-2"
                          >
                            {selectedQuestions.map((quizQuestion, index) => (
                              <Draggable
                                key={quizQuestion.id}
                                draggableId={quizQuestion.id}
                                index={index}
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="border border-border rounded-lg p-3 bg-background"
                                  >
                                    <div className="flex items-start gap-3">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="mt-1"
                                      >
                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                      
                                      <div className="flex-1">
                                        <p className="text-sm font-medium line-clamp-2">
                                          {quizQuestion.question?.questionText}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                          <Badge variant="outline" className="text-xs">
                                            {quizQuestion.question?.questionType.replace('_', ' ')}
                                          </Badge>
                                          <div className="flex items-center gap-1">
                                            <Label htmlFor={`points-${quizQuestion.id}`} className="text-xs">
                                              Points:
                                            </Label>
                                            <Input
                                              id={`points-${quizQuestion.id}`}
                                              type="number"
                                              value={quizQuestion.points}
                                              onChange={(e) => 
                                                updateQuestionPoints(
                                                  quizQuestion.questionId, 
                                                  parseInt(e.target.value) || 1
                                                )
                                              }
                                              className="w-16 h-6 text-xs"
                                              min="1"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            // TODO: Implement question preview
                                            toast({
                                              title: "Preview",
                                              description: "Question preview to be implemented",
                                            });
                                          }}
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => removeQuestion(quizQuestion.questionId)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                    
                    {selectedQuestions.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Plus className="h-8 w-8 mx-auto mb-2" />
                        <p>No questions added yet</p>
                        <p className="text-xs">Select questions from the left panel</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 p-6 pt-0 border-t">
          <Button 
            onClick={handleSave} 
            disabled={saveQuizMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {saveQuizMutation.isPending ? 'Saving...' : (quiz?.id ? 'Update Quiz' : 'Create Quiz')}
          </Button>
          
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          
          <Button variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>

          {/* Quiz Summary */}
          <div className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formData.timeLimit} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{selectedQuestions.length} questions</span>
            </div>
            {formData.proctoring && (
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span>Proctored</span>
              </div>
            )}
            {formData.adaptiveTesting && (
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                <span>Adaptive</span>
              </div>
            )}
            {formData.passwordProtected && (
              <div className="flex items-center gap-1">
                <Lock className="h-4 w-4" />
                <span>Protected</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
