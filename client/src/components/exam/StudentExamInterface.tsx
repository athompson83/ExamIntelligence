import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Flag, Clock } from "lucide-react";
import { Question, Quiz, AnswerOption } from "@/types";

interface StudentExamInterfaceProps {
  quiz: Quiz;
  questions: Question[];
  onSubmit: (answers: Record<number, any>) => void;
  onSaveAndContinue: (questionId: number, answer: any) => void;
}

export function StudentExamInterface({ 
  quiz, 
  questions, 
  onSubmit, 
  onSaveAndContinue 
}: StudentExamInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState<number>(quiz.timeLimit ? quiz.timeLimit * 60 : 0);
  const [startTime] = useState(new Date());

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Auto-submit when time runs out
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleSaveAndContinue = () => {
    const answer = answers[currentQuestion.id];
    onSaveAndContinue(currentQuestion.id, answer);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleFlag = () => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion.id)) {
        newSet.delete(currentQuestion.id);
      } else {
        newSet.add(currentQuestion.id);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    onSubmit(answers);
  };

  const renderQuestionContent = () => {
    switch (currentQuestion.questionType) {
      case 'multiple_choice':
        return (
          <RadioGroup 
            value={answers[currentQuestion.id] || ""} 
            onValueChange={handleAnswerChange}
            className="space-y-3"
          >
            {currentQuestion.answerOptions?.map((option: AnswerOption) => (
              <div key={option.id} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value={option.id.toString()} id={`option-${option.id}`} />
                <Label htmlFor={`option-${option.id}`} className="flex-1 cursor-pointer">
                  {option.answerText}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      default:
        return (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-muted-foreground">
              Question type "{currentQuestion.questionType}" not yet implemented
            </p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-screen overflow-y-auto">
        {/* Exam Header */}
        <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{quiz.title}</h2>
            <p className="text-sm opacity-90">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
          {quiz.timeLimit && (
            <div className="text-right">
              <div className={`text-2xl font-bold ${timeRemaining < 300 ? 'text-destructive' : ''}`}>
                {formatTime(timeRemaining)}
              </div>
              <p className="text-sm opacity-90">Time remaining</p>
            </div>
          )}
        </div>
        
        {/* Question Content */}
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-medium text-foreground pr-4">
                {currentQuestion.questionText}
              </h3>
              {flaggedQuestions.has(currentQuestion.id) && (
                <Badge variant="outline" className="text-accent border-accent">
                  <Flag className="h-3 w-3 mr-1" />
                  Flagged
                </Badge>
              )}
            </div>
            
            {renderQuestionContent()}
          </div>
          
          {/* Navigation */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleFlag}>
                <Flag className="h-4 w-4 mr-2" />
                {flaggedQuestions.has(currentQuestion.id) ? 'Unflag' : 'Flag for Review'}
              </Button>
              
              {currentQuestionIndex < questions.length - 1 ? (
                <Button onClick={handleSaveAndContinue}>
                  Save & Continue
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="bg-secondary hover:bg-secondary/90">
                  Submit Exam
                </Button>
              )}
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1}
              className="flex items-center space-x-2"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
        
        {/* Progress Bar */}
        <div className="bg-muted p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </Card>
    </div>
  );
}
