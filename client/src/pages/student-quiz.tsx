import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  text: string;
  type: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
  difficulty: number;
}

interface QuizSession {
  id: string;
  quizId: string;
  questions: Question[];
  timeLimit: number;
  startedAt: string;
  currentQuestion: number;
  answers: Record<string, string>;
  timeRemaining: number;
}

export default function StudentQuiz() {
  const { quizId } = useParams<{ quizId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: quizSession, isLoading } = useQuery<QuizSession>({
    queryKey: [`/api/student/quiz-session/${quizId}`],
    enabled: !!quizId,
  });

  // Timer countdown
  useEffect(() => {
    if (!quizSession) return;
    
    setTimeRemaining(quizSession.timeRemaining);
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizSession]);

  // Load saved answers
  useEffect(() => {
    if (quizSession?.answers) {
      setAnswers(quizSession.answers);
      setCurrentQuestionIndex(quizSession.currentQuestion || 0);
    }
  }, [quizSession]);

  const handleAutoSubmit = async () => {
    if (isSubmitting) return;
    
    toast({
      title: "Time's Up!",
      description: "Quiz has been automatically submitted.",
      variant: "destructive",
    });
    
    await submitQuiz();
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    // Auto-save answer
    saveProgress(questionId, answer);
  };

  const saveProgress = async (questionId: string, answer: string) => {
    try {
      await fetch(`/api/student/quiz-session/${quizId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          answer,
          currentQuestion: currentQuestionIndex
        }),
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const submitQuiz = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/student/quiz-session/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Quiz Submitted!",
          description: `Your score: ${data.score}%`,
        });
        
        setLocation(`/student/results/${data.attemptId}`);
      } else {
        throw new Error(data.message || 'Submission failed');
      }
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < (quizSession?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const progress = quizSession ? (getAnsweredCount() / quizSession.questions.length) * 100 : 0;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!quizSession) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Quiz Not Found</h2>
            <p className="text-gray-600 mb-6">The quiz session could not be loaded.</p>
            <Button onClick={() => setLocation('/student')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = quizSession.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizSession.questions.length - 1;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/student')}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Exit Quiz
          </Button>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="px-4 py-2">
              <Clock className="w-4 h-4 mr-2" />
              {formatTime(timeRemaining)}
            </Badge>
            
            <Badge variant="secondary" className="px-4 py-2">
              Question {currentQuestionIndex + 1} of {quizSession.questions.length}
            </Badge>
          </div>
        </div>
        
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-gray-600 mt-2">
          {getAnsweredCount()} of {quizSession.questions.length} questions answered
        </p>
      </div>

      {/* Question */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">
            {currentQuestion?.text}
          </CardTitle>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Points: {currentQuestion?.points}</span>
            <span>Difficulty: {currentQuestion?.difficulty}/10</span>
          </div>
        </CardHeader>
        
        <CardContent>
          {currentQuestion?.type === 'multiple_choice' && currentQuestion.options && (
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={previousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex space-x-4">
          {!isLastQuestion ? (
            <Button onClick={nextQuestion}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={submitQuiz}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Submit Quiz
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Question Navigator */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Question Navigator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-2">
            {quizSession.questions.map((question, index) => (
              <Button
                key={question.id}
                variant={index === currentQuestionIndex ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentQuestionIndex(index)}
                className={`relative ${answers[question.id] ? 'bg-green-100 border-green-300' : ''}`}
              >
                {index + 1}
                {answers[question.id] && (
                  <Check className="w-3 h-3 absolute top-0 right-0 text-green-600" />
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}