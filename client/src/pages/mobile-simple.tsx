import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Camera, 
  Mic, 
  Clock, 
  BookOpen, 
  User, 
  BarChart3, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Calculator,
  ArrowLeft,
  Send,
  Eye,
  EyeOff,
  Timer,
  Award,
  Settings,
  Home,
  LogOut
} from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  description: string;
  timeLimit: number;
  questionCount: number;
  difficulty: string;
  status: 'available' | 'in_progress' | 'completed';
  score?: number;
  allowCalculator?: boolean;
  calculatorType?: 'basic' | 'scientific' | 'graphing';
}

interface Question {
  id: string;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options?: string[];
  correctAnswer?: string;
  points: number;
  difficulty: number;
}

interface ExamSession {
  id: string;
  quizId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  currentQuestionIndex: number;
  responses: Record<string, string>;
  flags: string[];
  proctorAlerts: string[];
  timeRemaining: number;
  isActive: boolean;
}

// Mock data for demonstration
const mockQuizzes: Quiz[] = [
  {
    id: '1',
    title: 'Advanced Mathematics Quiz',
    description: 'Test your knowledge of calculus and linear algebra',
    timeLimit: 60,
    questionCount: 25,
    difficulty: 'Advanced',
    status: 'available',
    allowCalculator: true,
    calculatorType: 'scientific'
  },
  {
    id: '2',
    title: 'Biology Fundamentals',
    description: 'Basic concepts in molecular biology and genetics',
    timeLimit: 45,
    questionCount: 20,
    difficulty: 'Intermediate',
    status: 'completed',
    score: 85
  },
  {
    id: '3',
    title: 'History Assessment',
    description: 'World history from 1900-2000',
    timeLimit: 90,
    questionCount: 30,
    difficulty: 'Intermediate',
    status: 'in_progress'
  }
];

const mockQuestions: Question[] = [
  {
    id: '1',
    questionText: 'What is the derivative of x²?',
    questionType: 'multiple_choice',
    options: ['2x', 'x²', '2x²', 'x'],
    correctAnswer: '2x',
    points: 2,
    difficulty: 3
  },
  {
    id: '2',
    questionText: 'The mitochondria is the powerhouse of the cell.',
    questionType: 'true_false',
    options: ['True', 'False'],
    correctAnswer: 'True',
    points: 1,
    difficulty: 2
  }
];

// Calculator Component
const Calculator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string) => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '*':
        return firstValue * secondValue;
      case '/':
        return firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const scientificOperation = (func: string) => {
    const inputValue = parseFloat(display);
    let result;

    switch (func) {
      case 'sin':
        result = Math.sin(inputValue);
        break;
      case 'cos':
        result = Math.cos(inputValue);
        break;
      case 'tan':
        result = Math.tan(inputValue);
        break;
      case 'log':
        result = Math.log10(inputValue);
        break;
      case 'ln':
        result = Math.log(inputValue);
        break;
      case 'sqrt':
        result = Math.sqrt(inputValue);
        break;
      case 'square':
        result = inputValue * inputValue;
        break;
      default:
        result = inputValue;
    }

    setDisplay(String(result));
    setWaitingForOperand(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-sm w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Calculator</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="bg-gray-100 p-3 rounded mb-4">
          <div className="text-right text-xl font-mono">{display}</div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          <Button variant="outline" onClick={clear}>C</Button>
          <Button variant="outline" onClick={() => scientificOperation('sqrt')}>√</Button>
          <Button variant="outline" onClick={() => scientificOperation('square')}>x²</Button>
          <Button variant="outline" onClick={() => inputOperation('/')}>÷</Button>
          
          <Button variant="outline" onClick={() => inputNumber('7')}>7</Button>
          <Button variant="outline" onClick={() => inputNumber('8')}>8</Button>
          <Button variant="outline" onClick={() => inputNumber('9')}>9</Button>
          <Button variant="outline" onClick={() => inputOperation('*')}>×</Button>
          
          <Button variant="outline" onClick={() => inputNumber('4')}>4</Button>
          <Button variant="outline" onClick={() => inputNumber('5')}>5</Button>
          <Button variant="outline" onClick={() => inputNumber('6')}>6</Button>
          <Button variant="outline" onClick={() => inputOperation('-')}>-</Button>
          
          <Button variant="outline" onClick={() => inputNumber('1')}>1</Button>
          <Button variant="outline" onClick={() => inputNumber('2')}>2</Button>
          <Button variant="outline" onClick={() => inputNumber('3')}>3</Button>
          <Button variant="outline" onClick={() => inputOperation('+')}>+</Button>
          
          <Button variant="outline" className="col-span-2" onClick={() => inputNumber('0')}>0</Button>
          <Button variant="outline" onClick={() => inputNumber('.')}>.</Button>
          <Button variant="outline" onClick={performCalculation}>=</Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" onClick={() => scientificOperation('sin')}>sin</Button>
          <Button variant="outline" size="sm" onClick={() => scientificOperation('cos')}>cos</Button>
          <Button variant="outline" size="sm" onClick={() => scientificOperation('tan')}>tan</Button>
          <Button variant="outline" size="sm" onClick={() => scientificOperation('log')}>log</Button>
          <Button variant="outline" size="sm" onClick={() => scientificOperation('ln')}>ln</Button>
          <Button variant="outline" size="sm" onClick={() => inputNumber('3.14159')}>π</Button>
        </div>
      </div>
    </div>
  );
};

// Proctoring Component
const ProctoringPanel: React.FC<{ isActive: boolean; onToggle: () => void }> = ({ isActive, onToggle }) => {
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [screenShare, setScreenShare] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isActive && cameraEnabled && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: micEnabled })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => console.error('Error accessing camera:', err));
    }
  }, [isActive, cameraEnabled, micEnabled]);

  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Proctoring Active</h3>
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "MONITORING" : "PAUSED"}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-full h-24 bg-gray-800 rounded object-cover"
          />
          <p className="text-sm text-gray-400 mt-1">Front Camera</p>
        </div>
        <div className="bg-gray-800 rounded h-24 flex items-center justify-center">
          <Eye className="h-6 w-6 text-gray-400" />
          <p className="text-sm text-gray-400 ml-2">Screen Monitor</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button
            variant={cameraEnabled ? "default" : "secondary"}
            size="sm"
            onClick={() => setCameraEnabled(!cameraEnabled)}
          >
            {cameraEnabled ? <Camera className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          </Button>
          <Button
            variant={micEnabled ? "default" : "secondary"}
            size="sm"
            onClick={() => setMicEnabled(!micEnabled)}
          >
            {micEnabled ? <Mic className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={onToggle}>
          {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

// Main Mobile App Component
const MobileApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'quiz' | 'exam' | 'results'>('dashboard');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [examSession, setExamSession] = useState<ExamSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(3600); // 1 hour in seconds
  const [isProctoring, setIsProctoring] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());

  const queryClient = useQueryClient();

  // Timer effect
  useEffect(() => {
    if (currentView === 'exam' && examSession?.isActive) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentView, examSession?.isActive]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setCurrentView('quiz');
    setIsProctoring(true);
  };

  const handleStartExam = () => {
    if (!selectedQuiz) return;
    
    const session: ExamSession = {
      id: Date.now().toString(),
      quizId: selectedQuiz.id,
      userId: 'current-user',
      startTime: new Date(),
      currentQuestionIndex: 0,
      responses: {},
      flags: [],
      proctorAlerts: [],
      timeRemaining: selectedQuiz.timeLimit * 60,
      isActive: true
    };
    
    setExamSession(session);
    setCurrentView('exam');
    setTimeRemaining(selectedQuiz.timeLimit * 60);
    setCurrentQuestionIndex(0);
    setResponses({});
  };

  const handleAnswerQuestion = (questionId: string, answer: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleFlagQuestion = (questionId: string) => {
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

  const handleSubmitExam = () => {
    if (examSession) {
      const updatedSession = {
        ...examSession,
        endTime: new Date(),
        isActive: false
      };
      setExamSession(updatedSession);
      setCurrentView('results');
      setIsProctoring(false);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Welcome Back!</h2>
        <p className="text-blue-100">Ready to continue your learning journey?</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">3</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Available Quizzes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">85%</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Average Score</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Available Quizzes</h3>
        {mockQuizzes.map(quiz => (
          <Card key={quiz.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{quiz.title}</h4>
                  <p className="text-gray-600 text-sm mb-2">{quiz.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {quiz.timeLimit} min
                    </span>
                    <span className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-1" />
                      {quiz.questionCount} questions
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Badge variant={
                    quiz.status === 'completed' ? 'default' : 
                    quiz.status === 'in_progress' ? 'secondary' : 
                    'outline'
                  }>
                    {quiz.status === 'completed' ? 'Completed' : 
                     quiz.status === 'in_progress' ? 'In Progress' : 
                     'Available'}
                  </Badge>
                  {quiz.status === 'completed' && quiz.score && (
                    <span className="text-sm font-semibold text-green-600">
                      {quiz.score}%
                    </span>
                  )}
                  {quiz.status === 'available' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleStartQuiz(quiz)}
                      className="mt-2"
                    >
                      Start Quiz
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderQuizPreview = () => (
    selectedQuiz && (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold">Quiz Preview</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{selectedQuiz.title}</CardTitle>
            <CardDescription>{selectedQuiz.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Time Limit: {selectedQuiz.timeLimit} minutes</span>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{selectedQuiz.questionCount} questions</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Difficulty: {selectedQuiz.difficulty}</span>
              </div>
              {selectedQuiz.allowCalculator && (
                <div className="flex items-center space-x-2">
                  <Calculator className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Calculator: {selectedQuiz.calculatorType}</span>
                </div>
              )}
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This quiz requires proctoring. Your camera and microphone will be monitored during the exam.
              </AlertDescription>
            </Alert>

            <Button onClick={handleStartExam} className="w-full">
              Begin Proctored Exam
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  );

  const renderExam = () => {
    if (!selectedQuiz || !examSession || currentQuestionIndex >= mockQuestions.length) return null;
    
    const currentQuestion = mockQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / mockQuestions.length) * 100;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Timer className="h-5 w-5 text-orange-500" />
            <span className="font-mono text-lg font-semibold text-orange-500">
              {formatTime(timeRemaining)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {mockQuestions.length}
            </span>
            {selectedQuiz.allowCalculator && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCalculator(true)}
              >
                <Calculator className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        <ProctoringPanel 
          isActive={isProctoring} 
          onToggle={() => setIsProctoring(!isProctoring)} 
        />

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">
                Question {currentQuestionIndex + 1}
                <Badge variant="outline" className="ml-2">
                  {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFlagQuestion(currentQuestion.id)}
                className={flaggedQuestions.has(currentQuestion.id) ? 'text-orange-500' : ''}
              >
                {flaggedQuestions.has(currentQuestion.id) ? 
                  <XCircle className="h-4 w-4" /> : 
                  <Eye className="h-4 w-4" />
                }
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">{currentQuestion.questionText}</p>
            
            {currentQuestion.questionType === 'multiple_choice' && currentQuestion.options && (
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    variant={responses[currentQuestion.id] === option ? "default" : "outline"}
                    className="w-full justify-start text-left"
                    onClick={() => handleAnswerQuestion(currentQuestion.id, option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            )}

            {currentQuestion.questionType === 'true_false' && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={responses[currentQuestion.id] === 'True' ? "default" : "outline"}
                  onClick={() => handleAnswerQuestion(currentQuestion.id, 'True')}
                >
                  True
                </Button>
                <Button
                  variant={responses[currentQuestion.id] === 'False' ? "default" : "outline"}
                  onClick={() => handleAnswerQuestion(currentQuestion.id, 'False')}
                >
                  False
                </Button>
              </div>
            )}

            {(currentQuestion.questionType === 'short_answer' || currentQuestion.questionType === 'essay') && (
              <Textarea
                placeholder="Enter your answer..."
                value={responses[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerQuestion(currentQuestion.id, e.target.value)}
                className="min-h-[100px]"
              />
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          <div className="flex space-x-2">
            {currentQuestionIndex === mockQuestions.length - 1 ? (
              <Button onClick={handleSubmitExam} className="bg-green-600 hover:bg-green-700">
                Submit Exam
              </Button>
            ) : (
              <Button onClick={handleNextQuestion}>
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => (
    <div className="space-y-4">
      <div className="text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Exam Completed!</h2>
        <p className="text-gray-600">Your responses have been submitted successfully</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exam Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Quiz Title</p>
              <p className="font-semibold">{selectedQuiz?.title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Time Taken</p>
              <p className="font-semibold">
                {selectedQuiz ? formatTime((selectedQuiz.timeLimit * 60) - timeRemaining) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Questions Answered</p>
              <p className="font-semibold">{Object.keys(responses).length} / {mockQuestions.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Questions Flagged</p>
              <p className="font-semibold">{flaggedQuestions.size}</p>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600 mb-2">Your responses will be graded and results will be available shortly.</p>
            <Button onClick={() => setCurrentView('dashboard')} className="w-full">
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2">
      <div className="flex justify-around">
        <Button
          variant={currentView === 'dashboard' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setCurrentView('dashboard')}
        >
          <Home className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
        >
          <User className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">ProficiencyAI</h1>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">Student Mode</Badge>
              <Button variant="ghost" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 pb-20">
          {currentView === 'dashboard' && renderDashboard()}
          {currentView === 'quiz' && renderQuizPreview()}
          {currentView === 'exam' && renderExam()}
          {currentView === 'results' && renderResults()}
        </div>

        {/* Calculator Modal */}
        {showCalculator && (
          <Calculator onClose={() => setShowCalculator(false)} />
        )}

        {/* Bottom Navigation */}
        {renderBottomNav()}
      </div>
    </div>
  );
};

export default MobileApp;