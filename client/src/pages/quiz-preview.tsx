import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, FileText, Users, CheckCircle, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useParams } from "wouter";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export default function QuizPreview() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const quizId = params.id;

  // Quiz taking state
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const { data: quiz, isLoading, error } = useQuery({
    queryKey: [`/api/quizzes/${quizId}`],
  });

  // Timer effect
  useEffect(() => {
    if (quizStarted && timeRemaining !== null && timeRemaining > 0 && !quizCompleted) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      handleSubmitQuiz();
    }
  }, [quizStarted, timeRemaining, quizCompleted]);

  const handleStartQuiz = () => {
    setQuizStarted(true);
    if (safeQuiz.timeLimit) {
      setTimeRemaining(safeQuiz.timeLimit * 60); // Convert minutes to seconds
    }
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (safeQuiz.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = () => {
    setQuizCompleted(true);
    setShowResults(true);
  };

  const calculateScore = () => {
    if (!safeQuiz.questions || safeQuiz.questions.length === 0) return 0;
    
    let correct = 0;
    safeQuiz.questions.forEach((question: any) => {
      const userAnswer = answers[question.id];
      if (question.questionType === 'multiple_choice' && userAnswer === question.correctAnswer) {
        correct++;
      } else if (question.questionType === 'multiple_select') {
        const correctAnswers = question.answerOptions?.filter((opt: any) => opt.isCorrect).map((opt: any) => opt.id) || [];
        const userAnswers = userAnswer || [];
        if (correctAnswers.length === userAnswers.length && correctAnswers.every((id: string) => userAnswers.includes(id))) {
          correct++;
        }
      }
    });
    
    return Math.round((correct / safeQuiz.questions.length) * 100);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Quiz Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The quiz you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => setLocation('/published-quizzes')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quizzes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Provide default values to prevent property access errors
  const safeQuiz = {
    title: quiz?.title || "Quiz Preview",
    description: quiz?.description || "No description available",
    instructions: quiz?.instructions || "No instructions provided",
    timeLimit: quiz?.timeLimit || 0,
    maxAttempts: quiz?.maxAttempts || 1,
    questions: quiz?.questions || [],
    ...quiz,
  };

  // Results display
  if (showResults) {
    const score = calculateScore();
    const totalQuestions = safeQuiz.questions?.length || 0;
    const correctAnswers = Math.round((score / 100) * totalQuestions);

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-2">Quiz Completed!</CardTitle>
            <CardDescription>Here are your results</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="text-6xl font-bold text-primary">{score}%</div>
            <div className="text-lg">
              You answered {correctAnswers} out of {totalQuestions} questions correctly
            </div>
            
            <div className="flex justify-center gap-4 mt-6">
              <Button onClick={() => setLocation('/published-quizzes')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Quizzes
              </Button>
              <Button variant="outline" onClick={() => {
                setQuizStarted(false);
                setCurrentQuestionIndex(0);
                setAnswers({});
                setQuizCompleted(false);
                setShowResults(false);
                setTimeRemaining(null);
              }}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz taking interface
  if (quizStarted && !quizCompleted) {
    const currentQuestion = safeQuiz.questions?.[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / (safeQuiz.questions?.length || 1)) * 100;

    if (!currentQuestion) {
      return <div className="p-6 text-center">No questions available</div>;
    }

    return (
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header with timer and progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">{safeQuiz.title}</h1>
            {timeRemaining !== null && (
              <div className="flex items-center gap-2 text-lg font-mono">
                <Clock className="h-5 w-5" />
                <span className={timeRemaining < 300 ? "text-red-500" : "text-green-500"}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Question {currentQuestionIndex + 1} of {safeQuiz.questions?.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Question */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Question {currentQuestionIndex + 1}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-lg font-medium">
              {currentQuestion.questionText}
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.questionType === 'multiple_choice' && (
                <RadioGroup
                  value={answers[currentQuestion.id] || ""}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                >
                  {currentQuestion.answerOptions?.map((option: any) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion.questionType === 'multiple_select' && (
                <div className="space-y-3">
                  {currentQuestion.answerOptions?.map((option: any) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={(answers[currentQuestion.id] || []).includes(option.id)}
                        onCheckedChange={(checked) => {
                          const currentAnswers = answers[currentQuestion.id] || [];
                          if (checked) {
                            handleAnswerChange(currentQuestion.id, [...currentAnswers, option.id]);
                          } else {
                            handleAnswerChange(currentQuestion.id, currentAnswers.filter((id: string) => id !== option.id));
                          }
                        }}
                      />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {currentQuestion.questionType === 'short_answer' && (
                <Textarea
                  placeholder="Enter your answer here..."
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  className="min-h-[100px]"
                />
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              
              <div className="flex gap-2">
                {currentQuestionIndex === (safeQuiz.questions?.length || 0) - 1 ? (
                  <Button onClick={handleSubmitQuiz} size="lg">
                    Submit Quiz
                  </Button>
                ) : (
                  <Button onClick={handleNextQuestion}>
                    Next
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Landing page (before starting quiz) - Hide questions
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => setLocation('/published-quizzes')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quizzes
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">{safeQuiz.title}</h1>
        <p className="text-muted-foreground">Preview Mode</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quiz Information</CardTitle>
          <CardDescription>
            {safeQuiz.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {safeQuiz.timeLimit ? `${safeQuiz.timeLimit} minutes` : 'No time limit'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {safeQuiz.maxAttempts === 1 ? '1 attempt allowed' : `${safeQuiz.maxAttempts} attempts allowed`}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {safeQuiz.questions?.length || 0} questions
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Instructions</h4>
                <p className="text-sm text-muted-foreground">
                  {safeQuiz.instructions}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Badge variant="secondary">Preview Mode</Badge>
                <Badge variant="outline">Draft</Badge>
              </div>
            </div>
          </div>

          {/* Don't show questions on landing page */}
          <div className="mt-6 pt-6 border-t text-center">
            <h3 className="font-medium mb-2">Ready to start?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Questions will be shown once you begin the quiz attempt.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-center">
        <Button size="lg" className="px-8" onClick={handleStartQuiz}>
          Start Quiz Preview
        </Button>
      </div>
    </div>
  );
}