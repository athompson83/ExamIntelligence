import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  Clock, 
  Camera,
  Mic,
  Monitor,
  AlertTriangle
} from "lucide-react";

interface ExamQuestion {
  id: string;
  questionText: string;
  questionType: string;
  answerOptions?: Array<{
    id: string;
    answerText: string;
  }>;
  points: number;
}

interface ExamAttempt {
  id: string;
  quizId: string;
  timeRemaining: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  responses: Record<string, any>;
  flaggedQuestions: string[];
}

export default function ExamInterface() {
  const { id: quizId } = useParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { sendMessage, isConnected } = useWebSocket();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isProctoringActive, setIsProctoringActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: ['/api/quizzes', quizId],
    enabled: isAuthenticated && !!quizId,
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['/api/quizzes', quizId, 'questions'],
    enabled: isAuthenticated && !!quizId,
  });

  const { data: attempt, isLoading: attemptLoading } = useQuery({
    queryKey: ['/api/attempts/current', quizId],
    enabled: isAuthenticated && !!quizId,
  });

  const startAttemptMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/quizzes/${quizId}/attempts`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/attempts/current', quizId] });
      setTimeRemaining(data.timeLimit * 60); // Convert to seconds
      
      // Join exam session via WebSocket
      if (isConnected) {
        sendMessage({
          type: 'join_exam',
          data: {
            userId: user?.id,
            attemptId: data.id,
            quizId: quizId,
          },
        });
      }
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
        description: "Failed to start exam",
        variant: "destructive",
      });
    },
  });

  const saveResponseMutation = useMutation({
    mutationFn: async ({ questionId, response }: { questionId: string; response: any }) => {
      await apiRequest("POST", `/api/attempts/${attempt?.id}/responses`, {
        questionId,
        response,
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
        description: "Failed to save response",
        variant: "destructive",
      });
    },
  });

  const submitExamMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", `/api/attempts/${attempt?.id}`, {
        status: 'submitted',
        submittedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Exam submitted successfully",
      });
      window.location.href = '/';
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
        description: "Failed to submit exam",
        variant: "destructive",
      });
    },
  });

  // Request camera permission for proctoring
  useEffect(() => {
    if (quiz?.proctoring && attempt) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(() => {
          setCameraPermission('granted');
          setIsProctoringActive(true);
        })
        .catch(() => {
          setCameraPermission('denied');
          toast({
            title: "Camera Access Required",
            description: "This exam requires camera access for proctoring",
            variant: "destructive",
          });
        });
    }
  }, [quiz, attempt]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0 && attempt?.status === 'in_progress') {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Auto-submit when time runs out
            submitExamMutation.mutate();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, attempt, submitExamMutation]);

  // Mock data for demonstration
  const mockQuestions: ExamQuestion[] = [
    {
      id: '1',
      questionText: 'Which of the following best describes the process of photosynthesis?',
      questionType: 'multiple_choice',
      answerOptions: [
        { id: 'a', answerText: 'The process by which plants convert sunlight into chemical energy' },
        { id: 'b', answerText: 'The process by which plants absorb water from the soil' },
        { id: 'c', answerText: 'The process by which plants release oxygen into the atmosphere' },
        { id: 'd', answerText: 'The process by which plants reproduce' },
      ],
      points: 10
    },
    {
      id: '2',
      questionText: 'Explain the difference between mitosis and meiosis.',
      questionType: 'essay',
      points: 20
    },
  ];

  const mockAttempt: ExamAttempt = {
    id: 'attempt-1',
    quizId: quizId || '',
    timeRemaining: 2700, // 45 minutes
    currentQuestionIndex: 0,
    totalQuestions: 2,
    responses: {},
    flaggedQuestions: []
  };

  const examQuestions = questions || mockQuestions;
  const examAttempt = attempt || mockAttempt;
  const currentQuestion = examQuestions[currentQuestionIndex];

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleResponseChange = (questionId: string, response: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: response
    }));

    // Auto-save response
    saveResponseMutation.mutate({ questionId, response });
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < examQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const renderQuestionInput = (question: ExamQuestion) => {
    const currentResponse = responses[question.id];

    switch (question.questionType) {
      case 'multiple_choice':
        return (
          <RadioGroup
            value={currentResponse || ''}
            onValueChange={(value) => handleResponseChange(question.id, value)}
          >
            {question.answerOptions?.map((option) => (
              <div key={option.id} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-accent">
                <RadioGroupItem value={option.id} id={option.id} />
                <label htmlFor={option.id} className="flex-1 cursor-pointer">
                  {option.answerText}
                </label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'multiple_response':
        return (
          <div className="space-y-3">
            {question.answerOptions?.map((option) => (
              <div key={option.id} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-accent">
                <Checkbox
                  id={option.id}
                  checked={currentResponse?.includes(option.id) || false}
                  onCheckedChange={(checked) => {
                    const current = currentResponse || [];
                    const updated = checked
                      ? [...current, option.id]
                      : current.filter((id: string) => id !== option.id);
                    handleResponseChange(question.id, updated);
                  }}
                />
                <label htmlFor={option.id} className="flex-1 cursor-pointer">
                  {option.answerText}
                </label>
              </div>
            ))}
          </div>
        );

      case 'essay':
      case 'constructed_response':
        return (
          <Textarea
            placeholder="Enter your response here..."
            value={currentResponse || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            rows={8}
            className="w-full"
          />
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  if (isLoading || quizLoading || questionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Start Exam</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{quiz?.title}</h3>
                <p className="text-sm text-muted-foreground">{quiz?.description}</p>
              </div>
              
              {quiz?.proctoring && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Camera className="h-5 w-5 text-amber-600 mr-2" />
                    <span className="text-sm font-medium text-amber-800">
                      Proctoring Required
                    </span>
                  </div>
                  <p className="text-sm text-amber-700 mt-1">
                    This exam requires camera and microphone access for monitoring.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Time Limit:</span>
                  <div>{quiz?.timeLimit} minutes</div>
                </div>
                <div>
                  <span className="font-medium">Questions:</span>
                  <div>{examQuestions.length}</div>
                </div>
              </div>

              <Button 
                onClick={() => startAttemptMutation.mutate()} 
                disabled={startAttemptMutation.isPending}
                className="w-full"
              >
                {startAttemptMutation.isPending ? 'Starting...' : 'Start Exam'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = ((currentQuestionIndex + 1) / examQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Exam Header */}
      <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{quiz?.title}</h2>
            <p className="text-sm opacity-90">
              Question {currentQuestionIndex + 1} of {examQuestions.length}
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              {formatTime(timeRemaining)}
            </div>
            <p className="text-sm opacity-90">Time remaining</p>
          </div>
        </div>
      </div>

      {/* Proctoring Status */}
      {quiz?.proctoring && (
        <div className="bg-amber-50 border-b border-amber-200 p-2">
          <div className="container mx-auto flex items-center justify-center text-sm">
            {isProctoringActive ? (
              <div className="flex items-center text-amber-800">
                <Camera className="mr-2 h-4 w-4" />
                <span>Proctoring active - You are being monitored</span>
                <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            ) : (
              <div className="flex items-center text-red-800">
                <AlertTriangle className="mr-2 h-4 w-4" />
                <span>Camera access required for this exam</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="p-6">
            {currentQuestion && (
              <div className="space-y-6">
                {/* Question Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium mb-4">
                      {currentQuestion.questionText}
                    </h3>
                    {currentQuestion.points && (
                      <Badge variant="outline" className="mb-4">
                        {currentQuestion.points} points
                      </Badge>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleFlag(currentQuestion.id)}
                    className={flaggedQuestions.has(currentQuestion.id) ? 'bg-amber-100 border-amber-300' : ''}
                  >
                    <Flag className="mr-2 h-4 w-4" />
                    {flaggedQuestions.has(currentQuestion.id) ? 'Flagged' : 'Flag for Review'}
                  </Button>
                </div>

                {/* Question Input */}
                <div className="space-y-4">
                  {renderQuestionInput(currentQuestion)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => toggleFlag(currentQuestion?.id || '')}>
              <Flag className="mr-2 h-4 w-4" />
              Flag for Review
            </Button>
            
            {currentQuestionIndex === examQuestions.length - 1 ? (
              <Button 
                onClick={() => submitExamMutation.mutate()}
                disabled={submitExamMutation.isPending}
                className="bg-destructive hover:bg-destructive/90"
              >
                {submitExamMutation.isPending ? 'Submitting...' : 'Submit Exam'}
              </Button>
            ) : (
              <Button onClick={handleNext} className="bg-primary hover:bg-primary/90">
                Save & Continue
              </Button>
            )}
          </div>
          
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentQuestionIndex === examQuestions.length - 1}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="w-full" />
        </div>
      </div>
    </div>
  );
}
