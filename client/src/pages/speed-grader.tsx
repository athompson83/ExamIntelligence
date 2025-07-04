import { useState, useEffect } from "react";
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
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  FileText, 
  Clock, 
  User, 
  MessageCircle, 
  Star,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Upload,
  Volume2,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  RotateCcw,
  Eye,
  EyeOff,
  Mic,
  Video,
  Camera
} from "lucide-react";
import { format } from "date-fns";

interface Student {
  id: string;
  name: string;
  email: string;
  profileImageUrl?: string;
}

interface QuizSubmission {
  id: string;
  studentId: string;
  student: Student;
  quizId: string;
  submittedAt: string;
  score: number;
  totalPoints: number;
  timeSpent: number;
  attemptNumber: number;
  isGraded: boolean;
  gradedAt?: string;
  gradedBy?: string;
  feedback: string;
  responses: Array<{
    questionId: string;
    questionText: string;
    questionType: string;
    response: any;
    isCorrect: boolean;
    pointsEarned: number;
    pointsPossible: number;
    feedback: string;
    graderComments: string;
  }>;
  proctoringFlags: Array<{
    id: string;
    flagType: string;
    description: string;
    timestamp: string;
    severity: string;
  }>;
}

interface SpeedGraderProps {
  quizId?: string;
}

export default function SpeedGrader({ quizId }: SpeedGraderProps) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  const [currentSubmissionIndex, setCurrentSubmissionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sortBy, setSortBy] = useState("name");
  const [filterBy, setFilterBy] = useState("all");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showRubric, setShowRubric] = useState(false);
  const [gradingComments, setGradingComments] = useState("");
  const [questionFeedback, setQuestionFeedback] = useState<Record<string, string>>({});
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [autoAdvance, setAutoAdvance] = useState(false);

  // Fetch quiz submissions
  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ['/api/quiz-submissions', quizId],
    enabled: isAuthenticated && !!quizId,
  });

  // Fetch quiz details
  const { data: quiz } = useQuery({
    queryKey: ['/api/quizzes', quizId],
    enabled: isAuthenticated && !!quizId,
  });

  // Update grade mutation
  const updateGradeMutation = useMutation({
    mutationFn: async (data: { 
      submissionId: string; 
      score: number; 
      feedback: string;
      questionFeedback: Record<string, string>;
    }) => {
      await apiRequest("PUT", `/api/quiz-submissions/${data.submissionId}/grade`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-submissions', quizId] });
      toast({
        title: "Grade Updated",
        description: "Student grade has been saved successfully",
      });
      
      if (autoAdvance && currentSubmissionIndex < filteredSubmissions.length - 1) {
        setCurrentSubmissionIndex(prev => prev + 1);
        setCurrentQuestionIndex(0);
        setGradingComments("");
        setQuestionFeedback({});
        setOverallScore(null);
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
        description: "Failed to update grade",
        variant: "destructive",
      });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (data: { submissionId: string; comment: string }) => {
      await apiRequest("POST", `/api/quiz-submissions/${data.submissionId}/comments`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-submissions', quizId] });
      toast({
        title: "Comment Added",
        description: "Your comment has been saved",
      });
    },
  });

  // Filter and sort submissions
  const filteredSubmissions = submissions?.filter((submission: QuizSubmission) => {
    if (filterBy === "graded") return submission.isGraded;
    if (filterBy === "ungraded") return !submission.isGraded;
    if (filterBy === "flagged") return submission.proctoringFlags.length > 0;
    return true;
  }).sort((a: QuizSubmission, b: QuizSubmission) => {
    switch (sortBy) {
      case "name":
        return a.student.name.localeCompare(b.student.name);
      case "submission_date":
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      case "score":
        return b.score - a.score;
      case "random":
        return Math.random() - 0.5;
      default:
        return 0;
    }
  }) || [];

  const currentSubmission = filteredSubmissions[currentSubmissionIndex];
  const currentQuestion = currentSubmission?.responses[currentQuestionIndex];
  const gradingProgress = submissions?.filter((s: QuizSubmission) => s.isGraded).length || 0;
  const totalSubmissions = submissions?.length || 0;

  const handleSaveGrade = () => {
    if (!currentSubmission) return;

    const finalScore = overallScore !== null ? overallScore : currentSubmission.score;
    
    updateGradeMutation.mutate({
      submissionId: currentSubmission.id,
      score: finalScore,
      feedback: gradingComments,
      questionFeedback,
    });
  };

  const handleNextSubmission = () => {
    if (currentSubmissionIndex < filteredSubmissions.length - 1) {
      setCurrentSubmissionIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
      resetGradingState();
    }
  };

  const handlePreviousSubmission = () => {
    if (currentSubmissionIndex > 0) {
      setCurrentSubmissionIndex(prev => prev - 1);
      setCurrentQuestionIndex(0);
      resetGradingState();
    }
  };

  const handleNextQuestion = () => {
    if (currentSubmission && currentQuestionIndex < currentSubmission.responses.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const resetGradingState = () => {
    setGradingComments("");
    setQuestionFeedback({});
    setOverallScore(null);
  };

  const handleQuestionFeedbackChange = (questionId: string, feedback: string) => {
    setQuestionFeedback(prev => ({
      ...prev,
      [questionId]: feedback
    }));
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 80) return "text-blue-600";
    if (percentage >= 70) return "text-yellow-600";
    if (percentage >= 60) return "text-orange-600";
    return "text-red-600";
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Please log in to access SpeedGrader.</div>
      </div>
    );
  }

  if (submissionsLoading || !submissions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar />
        <div className="flex-1 ml-64">
          <TopBar />
          <main className="p-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions</h3>
              <p className="text-gray-600">No quiz submissions found for grading.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <TopBar />
        
        {/* SpeedGrader Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">SpeedGrader</h1>
                <p className="text-sm text-gray-600">{quiz?.title}</p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Progress */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Progress:</span>
                  <Progress value={(gradingProgress / totalSubmissions) * 100} className="w-24" />
                  <span className="text-sm font-medium">{gradingProgress}/{totalSubmissions}</span>
                </div>
                
                {/* Controls */}
                <div className="flex items-center space-x-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="submission_date">Date</SelectItem>
                      <SelectItem value="score">Score</SelectItem>
                      <SelectItem value="random">Random</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterBy} onValueChange={setFilterBy}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="graded">Graded</SelectItem>
                      <SelectItem value="ungraded">Ungraded</SelectItem>
                      <SelectItem value="flagged">Flagged</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAnonymous(!isAnonymous)}
                  >
                    {isAnonymous ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {isAnonymous ? "Show Names" : "Anonymous"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-screen">
          {/* Left Panel - Student List */}
          <div className="w-80 bg-white border-r">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Students</h3>
                <Badge variant="secondary">{filteredSubmissions.length}</Badge>
              </div>
            </div>
            
            <ScrollArea className="h-full">
              <div className="p-2">
                {filteredSubmissions.map((submission: QuizSubmission, index: number) => (
                  <Card 
                    key={submission.id}
                    className={`mb-2 cursor-pointer transition-colors ${
                      index === currentSubmissionIndex ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => {
                      setCurrentSubmissionIndex(index);
                      setCurrentQuestionIndex(0);
                      resetGradingState();
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {submission.student.profileImageUrl ? (
                            <img 
                              src={submission.student.profileImageUrl} 
                              alt={submission.student.name}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">
                              {isAnonymous ? '?' : submission.student.name.charAt(0)}
                            </div>
                          )}
                          
                          <div>
                            <p className="font-medium text-sm">
                              {isAnonymous ? `Student ${index + 1}` : submission.student.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(submission.submittedAt), 'MMM d, HH:mm')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`font-medium text-sm ${getScoreColor(submission.score, submission.totalPoints)}`}>
                            {submission.score}/{submission.totalPoints}
                          </div>
                          <div className="flex items-center space-x-1">
                            {submission.isGraded ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-yellow-500" />
                            )}
                            {submission.proctoringFlags.length > 0 && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Main Panel - Grading Interface */}
          <div className="flex-1 flex flex-col">
            {currentSubmission && (
              <>
                {/* Student Header */}
                <div className="p-4 bg-white border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handlePreviousSubmission}
                          disabled={currentSubmissionIndex === 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleNextSubmission}
                          disabled={currentSubmissionIndex === filteredSubmissions.length - 1}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div>
                        <h2 className="font-semibold">
                          {isAnonymous ? `Student ${currentSubmissionIndex + 1}` : currentSubmission.student.name}
                        </h2>
                        <p className="text-sm text-gray-600">
                          Submitted: {format(new Date(currentSubmission.submittedAt), 'MMM d, yyyy HH:mm')} • 
                          Time Spent: {formatTime(currentSubmission.timeSpent)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className={`text-lg font-semibold ${getScoreColor(currentSubmission.score, currentSubmission.totalPoints)}`}>
                          {currentSubmission.score}/{currentSubmission.totalPoints}
                        </div>
                        <p className="text-sm text-gray-600">
                          {Math.round((currentSubmission.score / currentSubmission.totalPoints) * 100)}%
                        </p>
                      </div>
                      
                      {currentSubmission.proctoringFlags.length > 0 && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {currentSubmission.proctoringFlags.length} Flag{currentSubmission.proctoringFlags.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Question Navigation */}
                <div className="p-4 bg-gray-50 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handlePreviousQuestion}
                        disabled={currentQuestionIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium">
                        Question {currentQuestionIndex + 1} of {currentSubmission.responses.length}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleNextQuestion}
                        disabled={currentQuestionIndex === currentSubmission.responses.length - 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {currentQuestion && (
                        <Badge variant={currentQuestion.isCorrect ? "default" : "destructive"}>
                          {currentQuestion.pointsEarned}/{currentQuestion.pointsPossible} pts
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex">
                  {/* Question and Response */}
                  <div className="flex-1 p-6">
                    {currentQuestion && (
                      <div className="space-y-6">
                        {/* Question */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Question</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-800">{currentQuestion.questionText}</p>
                          </CardContent>
                        </Card>

                        {/* Student Response */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Student Response</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {currentQuestion.questionType === 'essay' || currentQuestion.questionType === 'constructed_response' ? (
                                <div className="p-3 bg-gray-50 rounded border">
                                  <p className="whitespace-pre-wrap">{currentQuestion.response}</p>
                                </div>
                              ) : (
                                <div className="p-3 bg-gray-50 rounded border">
                                  <p>{JSON.stringify(currentQuestion.response)}</p>
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-2">
                                {currentQuestion.isCorrect ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-500" />
                                )}
                                <span className={`font-medium ${currentQuestion.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                  {currentQuestion.isCorrect ? 'Correct' : 'Incorrect'}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Question Feedback */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Question Feedback</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Textarea
                              placeholder="Add feedback for this question..."
                              value={questionFeedback[currentQuestion.questionId] || ""}
                              onChange={(e) => handleQuestionFeedbackChange(currentQuestion.questionId, e.target.value)}
                              className="min-h-20"
                            />
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>

                  {/* Right Panel - Grading Tools */}
                  <div className="w-80 bg-white border-l p-4">
                    <Tabs defaultValue="grade" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="grade">Grade</TabsTrigger>
                        <TabsTrigger value="comments">Comments</TabsTrigger>
                        <TabsTrigger value="flags">Flags</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="grade" className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Overall Score</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor="score">Score</Label>
                                <Input
                                  id="score"
                                  type="number"
                                  placeholder={currentSubmission.score.toString()}
                                  value={overallScore || ""}
                                  onChange={(e) => setOverallScore(parseFloat(e.target.value) || null)}
                                  max={currentSubmission.totalPoints}
                                  min={0}
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="feedback">Overall Feedback</Label>
                                <Textarea
                                  id="feedback"
                                  placeholder="Enter overall feedback..."
                                  value={gradingComments}
                                  onChange={(e) => setGradingComments(e.target.value)}
                                  className="min-h-24"
                                />
                              </div>
                              
                              <Button 
                                onClick={handleSaveGrade}
                                disabled={updateGradeMutation.isPending}
                                className="w-full"
                              >
                                <Save className="h-4 w-4 mr-2" />
                                {updateGradeMutation.isPending ? "Saving..." : "Save Grade"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="comments" className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Comments</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <Textarea
                                placeholder="Add a comment..."
                                className="min-h-24"
                              />
                              <Button size="sm">
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Add Comment
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="flags" className="space-y-4">
                        {currentSubmission.proctoringFlags.length > 0 ? (
                          <div className="space-y-2">
                            {currentSubmission.proctoringFlags.map((flag) => (
                              <Alert key={flag.id}>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  <div className="space-y-1">
                                    <p className="font-medium">{flag.flagType}</p>
                                    <p className="text-sm">{flag.description}</p>
                                    <p className="text-xs text-gray-500">
                                      {format(new Date(flag.timestamp), 'MMM d, HH:mm:ss')}
                                    </p>
                                  </div>
                                </AlertDescription>
                              </Alert>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No proctoring flags for this submission.</p>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}