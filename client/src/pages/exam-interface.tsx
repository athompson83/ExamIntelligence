import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Camera, 
  Mic, 
  Eye, 
  EyeOff, 
  Clock, 
  AlertTriangle, 
  Flag, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Send,
  Volume2,
  VolumeX,
  Maximize,
  Shield,
  FileText,
  CheckCircle
} from "lucide-react";

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  imageUrl?: string;
  audioUrl?: string;
  points: number;
  options?: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

interface ExamAttempt {
  id: string;
  quizId: string;
  userId: string;
  startedAt: string;
  timeRemaining: number;
  currentQuestionIndex: number;
  responses: Record<string, any>;
  flags: string[];
  proctoringWarnings: string[];
  isSubmitted: boolean;
  quiz: {
    title: string;
    description: string;
    instructions: string;
    timeLimit: number;
    shuffleQuestions: boolean;
    shuffleAnswers: boolean;
    proctoring: boolean;
    proctoringSettings: {
      requireCamera: boolean;
      requireMicrophone: boolean;
      lockdownBrowser: boolean;
      preventTabSwitching: boolean;
    };
  };
  questions: Question[];
}

interface ExamInterfaceProps {
  examId?: string;
}

export default function ExamInterface({ examId }: ExamInterfaceProps) {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [microphoneStream, setMicrophoneStream] = useState<MediaStream | null>(null);
  const [proctoringWarnings, setProctoringWarnings] = useState<string[]>([]);
  const [flags, setFlags] = useState<string[]>([]);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [examPassword, setExamPassword] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: examAttempt, isLoading: examLoading } = useQuery({
    queryKey: ['/api/exam-attempts', examId],
    enabled: isAuthenticated && !!examId,
  });

  const startExamMutation = useMutation({
    mutationFn: async (data: { quizId: string; password?: string }) => {
      return await apiRequest("POST", "/api/exam-attempts", data);
    },
    onSuccess: (data) => {
      setIsExamStarted(true);
      setShowPasswordDialog(false);
      setTimeRemaining(data.timeRemaining);
      setResponses(data.responses || {});
      setCurrentQuestionIndex(data.currentQuestionIndex || 0);
      queryClient.invalidateQueries({ queryKey: ['/api/exam-attempts', examId] });
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
    mutationFn: async (data: { attemptId: string; questionId: string; response: any }) => {
      await apiRequest("POST", "/api/exam-responses", data);
    },
    onSuccess: () => {
      // Auto-save successful
    },
    onError: (error) => {
      if (!isUnauthorizedError(error)) {
        toast({
          title: "Auto-save failed",
          description: "Your response couldn't be saved automatically",
          variant: "destructive",
        });
      }
    },
  });

  const submitExamMutation = useMutation({
    mutationFn: async (attemptId: string) => {
      await apiRequest("POST", `/api/exam-attempts/${attemptId}/submit`);
    },
    onSuccess: () => {
      setShowSubmitDialog(false);
      toast({
        title: "Exam Submitted",
        description: "Your exam has been submitted successfully",
      });
      // Redirect to results or dashboard
      window.location.href = "/dashboard";
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

  // Initialize WebSocket connection for proctoring
  useEffect(() => {
    if (isExamStarted && examAttempt?.quiz.proctoring) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        wsRef.current?.send(JSON.stringify({
          type: "authentication",
          data: { userId: user?.id, role: "student" }
        }));
        
        wsRef.current?.send(JSON.stringify({
          type: "join_exam",
          data: { attemptId: examAttempt.id, quizId: examAttempt.quizId }
        }));
      };

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        if (message.type === "proctoring_warning") {
          setProctoringWarnings(prev => [...prev, message.data.warning]);
          toast({
            title: "Proctoring Warning",
            description: message.data.warning,
            variant: "destructive",
          });
        }
      };

      return () => {
        wsRef.current?.close();
      };
    }
  }, [isExamStarted, examAttempt, user]);

  // Timer countdown
  useEffect(() => {
    if (isExamStarted && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Auto-submit when time runs out
            if (examAttempt?.id) {
              submitExamMutation.mutate(examAttempt.id);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isExamStarted, timeRemaining, examAttempt, submitExamMutation]);

  // Initialize camera and microphone for proctoring
  useEffect(() => {
    const initializeProctoring = async () => {
      if (isExamStarted && examAttempt?.quiz.proctoring) {
        try {
          if (examAttempt.quiz.proctoringSettings.requireCamera) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setCameraStream(stream);
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          }

          if (examAttempt.quiz.proctoringSettings.requireMicrophone) {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setMicrophoneStream(stream);
          }
        } catch (error) {
          toast({
            title: "Proctoring Setup Failed",
            description: "Could not access camera/microphone",
            variant: "destructive",
          });
        }
      }
    };

    initializeProctoring();

    return () => {
      cameraStream?.getTracks().forEach(track => track.stop());
      microphoneStream?.getTracks().forEach(track => track.stop());
    };
  }, [isExamStarted, examAttempt]);

  // Prevent tab switching and fullscreen exit
  useEffect(() => {
    if (isExamStarted && examAttempt?.quiz.proctoringSettings.preventTabSwitching) {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          setTabSwitchCount(prev => prev + 1);
          wsRef.current?.send(JSON.stringify({
            type: "proctoring_event",
            data: {
              attemptId: examAttempt.id,
              event: "tab_switch",
              timestamp: new Date().toISOString()
            }
          }));
        }
      };

      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [isExamStarted, examAttempt]);

  // Auto-save responses
  useEffect(() => {
    const currentQuestion = examAttempt?.questions[currentQuestionIndex];
    if (currentQuestion && responses[currentQuestion.id] && examAttempt?.id) {
      const timeoutId = setTimeout(() => {
        saveResponseMutation.mutate({
          attemptId: examAttempt.id,
          questionId: currentQuestion.id,
          response: responses[currentQuestion.id]
        });
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [responses, currentQuestionIndex, examAttempt]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (examAttempt?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleFlag = () => {
    const currentQuestion = examAttempt?.questions[currentQuestionIndex];
    if (currentQuestion) {
      setFlags(prev => 
        prev.includes(currentQuestion.id) 
          ? prev.filter(id => id !== currentQuestion.id)
          : [...prev, currentQuestion.id]
      );
    }
  };

  const handleStartExam = () => {
    if (examId) {
      startExamMutation.mutate({ 
        quizId: examId, 
        password: examPassword || undefined 
      });
    }
  };

  const handleSubmitExam = () => {
    setShowSubmitDialog(true);
  };

  const confirmSubmitExam = () => {
    if (examAttempt?.id) {
      submitExamMutation.mutate(examAttempt.id);
    }
  };

  const renderQuestion = (question: Question) => {
    const response = responses[question.id];

    switch (question.questionType) {
      case 'multiple_choice':
        return (
          <RadioGroup 
            value={response || ""} 
            onValueChange={(value) => handleResponseChange(question.id, value)}
          >
            {question.options?.map(option => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id}>{option.text}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'multiple_response':
        return (
          <div className="space-y-2">
            {question.options?.map(option => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={response?.includes(option.id) || false}
                  onCheckedChange={(checked) => {
                    const newResponse = response || [];
                    if (checked) {
                      handleResponseChange(question.id, [...newResponse, option.id]);
                    } else {
                      handleResponseChange(question.id, newResponse.filter((id: string) => id !== option.id));
                    }
                  }}
                />
                <Label htmlFor={option.id}>{option.text}</Label>
              </div>
            ))}
          </div>
        );

      case 'true_false':
        return (
          <RadioGroup 
            value={response || ""} 
            onValueChange={(value) => handleResponseChange(question.id, value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="true" />
              <Label htmlFor="true">True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="false" />
              <Label htmlFor="false">False</Label>
            </div>
          </RadioGroup>
        );

      case 'essay':
      case 'constructed_response':
        return (
          <Textarea
            value={response || ""}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Enter your answer here..."
            className="min-h-32"
          />
        );

      case 'fill_blank':
        return (
          <Input
            value={response || ""}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Enter your answer"
          />
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Please log in to access the exam.</div>
      </div>
    );
  }

  if (!isExamStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Start Exam
            </CardTitle>
            <CardDescription>
              You are about to start the exam. Please read the instructions carefully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {examAttempt?.quiz.passwordProtected && (
              <div>
                <Label htmlFor="password">Exam Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={examPassword}
                  onChange={(e) => setExamPassword(e.target.value)}
                  placeholder="Enter exam password"
                />
              </div>
            )}
            
            {examAttempt?.quiz.instructions && (
              <div>
                <Label>Instructions</Label>
                <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                  {examAttempt.quiz.instructions}
                </div>
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Time Limit:</span>
                <Badge>{examAttempt?.quiz.timeLimit} minutes</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Questions:</span>
                <Badge>{examAttempt?.questions.length}</Badge>
              </div>
              {examAttempt?.quiz.proctoring && (
                <div className="flex items-center justify-between">
                  <span>Proctoring:</span>
                  <Badge variant="destructive">
                    <Camera className="mr-1 h-3 w-3" />
                    Enabled
                  </Badge>
                </div>
              )}
            </div>

            <Button 
              onClick={handleStartExam} 
              className="w-full"
              disabled={startExamMutation.isPending}
            >
              {startExamMutation.isPending ? "Starting..." : "Start Exam"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (examLoading || !examAttempt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentQuestion = examAttempt.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / examAttempt.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">{examAttempt.quiz.title}</h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {examAttempt.questions.length}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Time Remaining */}
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-red-500" />
                <span className={`font-mono ${timeRemaining < 300 ? 'text-red-500' : 'text-gray-700'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>

              {/* Proctoring Status */}
              {examAttempt.quiz.proctoring && (
                <div className="flex items-center space-x-2">
                  <Camera className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Recording</span>
                </div>
              )}

              {/* Submit Button */}
              <Button onClick={handleSubmitExam} variant="outline">
                <Send className="mr-2 h-4 w-4" />
                Submit Exam
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      Question {currentQuestionIndex + 1}
                      <Badge className="ml-2" variant="secondary">
                        {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-base">
                      {currentQuestion.questionText}
                    </CardDescription>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFlag}
                    className={flags.includes(currentQuestion.id) ? "text-red-500" : ""}
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                {currentQuestion.imageUrl && (
                  <div className="mb-4">
                    <img 
                      src={currentQuestion.imageUrl} 
                      alt="Question image" 
                      className="max-w-full h-auto rounded"
                    />
                  </div>
                )}

                {currentQuestion.audioUrl && (
                  <div className="mb-4">
                    <audio controls className="w-full">
                      <source src={currentQuestion.audioUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}

                <div className="space-y-4">
                  {renderQuestion(currentQuestion)}
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center space-x-2">
                <Save className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">Auto-saved</span>
              </div>

              <Button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === examAttempt.questions.length - 1}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Question Navigator */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Question Navigator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {examAttempt.questions.map((_, index) => {
                    const questionId = examAttempt.questions[index].id;
                    const hasResponse = responses[questionId];
                    const isFlagged = flags.includes(questionId);
                    const isCurrent = index === currentQuestionIndex;

                    return (
                      <Button
                        key={index}
                        variant={isCurrent ? "default" : "outline"}
                        size="sm"
                        className={`relative ${
                          hasResponse ? "border-green-500" : ""
                        } ${isFlagged ? "border-red-500" : ""}`}
                        onClick={() => setCurrentQuestionIndex(index)}
                      >
                        {index + 1}
                        {hasResponse && (
                          <CheckCircle className="absolute -top-1 -right-1 h-3 w-3 text-green-500" />
                        )}
                        {isFlagged && (
                          <Flag className="absolute -top-1 -right-1 h-3 w-3 text-red-500" />
                        )}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Proctoring Feed */}
            {examAttempt.quiz.proctoring && examAttempt.quiz.proctoringSettings.requireCamera && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Camera className="mr-2 h-4 w-4" />
                    Proctoring
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full rounded"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Warnings */}
            {(proctoringWarnings.length > 0 || tabSwitchCount > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center text-red-600">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Warnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tabSwitchCount > 0 && (
                      <Alert>
                        <AlertDescription>
                          Tab switches detected: {tabSwitchCount}
                        </AlertDescription>
                      </Alert>
                    )}
                    {proctoringWarnings.map((warning, index) => (
                      <Alert key={index}>
                        <AlertDescription>{warning}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Exam</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to submit your exam? This action cannot be undone.</p>
            
            <div className="text-sm text-gray-600">
              <p>Answered: {Object.keys(responses).length} of {examAttempt.questions.length} questions</p>
              <p>Time remaining: {formatTime(timeRemaining)}</p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={confirmSubmitExam}
                disabled={submitExamMutation.isPending}
              >
                {submitExamMutation.isPending ? "Submitting..." : "Submit Exam"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowSubmitDialog(false)}
              >
                Continue Exam
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}