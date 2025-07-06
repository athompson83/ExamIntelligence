import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import QuizProgressSaver from '@/components/quiz/QuizProgressSaver';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';

interface DemoQuestion {
  id: string;
  text: string;
  options: { id: string; text: string }[];
}

export default function QuizTakerDemo() {
  // Demo quiz data
  const demoQuestions: DemoQuestion[] = [
    {
      id: 'q1',
      text: 'What is the primary purpose of React hooks?',
      options: [
        { id: 'a', text: 'To replace class components' },
        { id: 'b', text: 'To manage state and side effects in functional components' },
        { id: 'c', text: 'To improve performance' },
        { id: 'd', text: 'To handle routing' }
      ]
    },
    {
      id: 'q2',
      text: 'Which hook is used for managing state in React?',
      options: [
        { id: 'a', text: 'useEffect' },
        { id: 'b', text: 'useState' },
        { id: 'c', text: 'useContext' },
        { id: 'd', text: 'useReducer' }
      ]
    },
    {
      id: 'q3',
      text: 'What does useEffect hook handle?',
      options: [
        { id: 'a', text: 'State management' },
        { id: 'b', text: 'Side effects and lifecycle events' },
        { id: 'c', text: 'Context creation' },
        { id: 'd', text: 'Component rendering' }
      ]
    }
  ];

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<string[]>([]);
  const [savedResponses, setSavedResponses] = useState<Record<string, any>>({});
  const [timeSpentPerQuestion, setTimeSpentPerQuestion] = useState<Record<string, number>>({});
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [attemptId, setAttemptId] = useState<string>('demo_attempt_' + Date.now());

  const currentQuestion = demoQuestions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / demoQuestions.length) * 100;

  // Handle answer selection
  const handleAnswerSelect = (optionId: string) => {
    const questionId = currentQuestion.id;
    setSavedResponses(prev => ({
      ...prev,
      [questionId]: optionId
    }));

    // Mark question as answered
    if (!answeredQuestions.includes(questionId)) {
      setAnsweredQuestions(prev => [...prev, questionId]);
    }
  };

  // Handle navigation
  const handleNext = () => {
    // Calculate time spent on current question
    const timeSpent = Date.now() - questionStartTime;
    setTimeSpentPerQuestion(prev => ({
      ...prev,
      [currentQuestion.id]: (prev[currentQuestion.id] || 0) + timeSpent
    }));

    if (currentQuestionIndex < demoQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionStartTime(Date.now());
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setQuestionStartTime(Date.now());
    }
  };

  // Handle progress restoration
  const handleProgressLoaded = (progress: {
    currentQuestionIndex: number;
    answeredQuestions: string[];
    savedResponses: Record<string, any>;
    timeSpentPerQuestion: Record<string, number>;
  }) => {
    console.log('Loading saved progress:', progress);
    setCurrentQuestionIndex(progress.currentQuestionIndex);
    setAnsweredQuestions(progress.answeredQuestions);
    setSavedResponses(progress.savedResponses);
    setTimeSpentPerQuestion(progress.timeSpentPerQuestion);
  };

  // Reset question timer when question changes
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Saver Component */}
      <QuizProgressSaver
        attemptId={attemptId}
        currentQuestionIndex={currentQuestionIndex}
        answeredQuestions={answeredQuestions}
        savedResponses={savedResponses}
        timeSpentPerQuestion={timeSpentPerQuestion}
        onProgressLoaded={handleProgressLoaded}
      />

      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb items={[{ label: 'Quiz Progress Demo' }]} />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Quiz Progress Saving Demo</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Attempt ID: {attemptId}
                </span>
              </CardTitle>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Question {currentQuestionIndex + 1} of {demoQuestions.length}</span>
                  <span>{Math.round(progressPercentage)}% Complete</span>
                </div>
                <Progress value={progressPercentage} className="w-full" />
              </div>
            </CardHeader>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                Question {currentQuestionIndex + 1}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-lg">{currentQuestion.text}</div>
              
              <RadioGroup 
                value={savedResponses[currentQuestion.id] || ''} 
                onValueChange={handleAnswerSelect}
              >
                {currentQuestion.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="flex justify-between items-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={handlePrevious} 
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                
                <div className="text-sm text-muted-foreground">
                  {answeredQuestions.length} of {demoQuestions.length} questions answered
                </div>

                <Button 
                  onClick={handleNext} 
                  disabled={currentQuestionIndex === demoQuestions.length - 1}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Progress Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress Saving Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Current Progress</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Current Question: {currentQuestionIndex + 1}</li>
                    <li>• Answered Questions: {answeredQuestions.length}</li>
                    <li>• Time Tracking: Active</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Auto-Save Features</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Saves every 2 seconds when idle</li>
                    <li>• Saves on page unload</li>
                    <li>• Restores on page refresh</li>
                  </ul>
                </div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Test the progress saving:</strong> Navigate through questions, then refresh the page. 
                  Your progress will be automatically restored to where you left off.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}