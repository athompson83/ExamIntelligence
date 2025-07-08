import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Book, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  Play, 
  Pause,
  Home,
  Settings,
  BarChart3,
  Calculator,
  Camera,
  Mic,
  MicOff,
  CameraOff,
  ArrowLeft,
  Send,
  MessageCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';

interface Quiz {
  id: string;
  title: string;
  duration: number;
  questions: number;
  status: 'available' | 'completed' | 'in_progress';
  progress?: number;
  score?: number;
  dueDate?: string;
  allowCalculator?: boolean;
  calculatorType?: 'basic' | 'scientific' | 'graphing';
}

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
}

interface ExamSession {
  id: string;
  quizId: string;
  startTime: Date;
  timeRemaining: number;
  currentQuestion: number;
  answers: Record<string, string>;
  proctoring: {
    cameraEnabled: boolean;
    micEnabled: boolean;
    violations: string[];
  };
}

// Mock data for testing
const mockQuizzes: Quiz[] = [
  {
    id: '1',
    title: 'Introduction to Biology',
    duration: 45,
    questions: 25,
    status: 'available',
    dueDate: '2025-07-15',
    allowCalculator: true,
    calculatorType: 'basic'
  },
  {
    id: '2',
    title: 'Advanced Mathematics',
    duration: 60,
    questions: 30,
    status: 'in_progress',
    progress: 65,
    allowCalculator: true,
    calculatorType: 'scientific'
  },
  {
    id: '3',
    title: 'History Final Exam',
    duration: 90,
    questions: 40,
    status: 'completed',
    score: 88,
    allowCalculator: false
  }
];

const mockQuestions: Question[] = [
  {
    id: '1',
    text: 'Which of the following is the powerhouse of the cell?',
    type: 'multiple_choice',
    options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Endoplasmic Reticulum'],
    correctAnswer: 'Mitochondria',
    explanation: 'Mitochondria are known as the powerhouse of the cell because they produce ATP.'
  },
  {
    id: '2',
    text: 'DNA stands for Deoxyribonucleic Acid.',
    type: 'true_false',
    correctAnswer: 'True',
    explanation: 'DNA is indeed the abbreviation for Deoxyribonucleic Acid.'
  }
];

// Mobile Calculator Component
const MobileCalculator: React.FC<{ type: 'basic' | 'scientific' | 'graphing'; onClose: () => void }> = ({ type, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [operator, setOperator] = useState('');
  const [previousValue, setPreviousValue] = useState('');
  const [isNewNumber, setIsNewNumber] = useState(true);

  const handleNumber = (num: string) => {
    if (isNewNumber) {
      setDisplay(num);
      setIsNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOperator = (op: string) => {
    if (previousValue && !isNewNumber) {
      calculate();
    }
    setOperator(op);
    setPreviousValue(display);
    setIsNewNumber(true);
  };

  const calculate = () => {
    const prev = parseFloat(previousValue);
    const current = parseFloat(display);
    let result = 0;

    switch (operator) {
      case '+':
        result = prev + current;
        break;
      case '-':
        result = prev - current;
        break;
      case '*':
        result = prev * current;
        break;
      case '/':
        result = prev / current;
        break;
      default:
        return;
    }

    setDisplay(result.toString());
    setOperator('');
    setPreviousValue('');
    setIsNewNumber(true);
  };

  const clear = () => {
    setDisplay('0');
    setOperator('');
    setPreviousValue('');
    setIsNewNumber(true);
  };

  const scientificFunctions = {
    sin: () => setDisplay(Math.sin(parseFloat(display) * Math.PI / 180).toString()),
    cos: () => setDisplay(Math.cos(parseFloat(display) * Math.PI / 180).toString()),
    tan: () => setDisplay(Math.tan(parseFloat(display) * Math.PI / 180).toString()),
    log: () => setDisplay(Math.log10(parseFloat(display)).toString()),
    ln: () => setDisplay(Math.log(parseFloat(display)).toString()),
    sqrt: () => setDisplay(Math.sqrt(parseFloat(display)).toString()),
    power: () => handleOperator('^'),
  };

  const basicButtons = [
    ['C', '±', '%', '/'],
    ['7', '8', '9', '*'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '=']
  ];

  const scientificButtons = [
    ['sin', 'cos', 'tan', 'log'],
    ['ln', '√', '^', 'π'],
    ...basicButtons
  ];

  const buttons = type === 'scientific' ? scientificButtons : basicButtons;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <Card className="w-80 max-w-[90vw] mx-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Calculator ({type})</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Display */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="text-right text-2xl font-mono">{display}</div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {buttons.flat().map((btn, index) => (
              <Button
                key={index}
                variant={['=', '+', '-', '*', '/'].includes(btn) ? 'default' : 'outline'}
                className="h-12 text-lg"
                onClick={() => {
                  if (btn === '=') calculate();
                  else if (btn === 'C') clear();
                  else if (btn === '±') setDisplay((-parseFloat(display)).toString());
                  else if (btn === '%') setDisplay((parseFloat(display) / 100).toString());
                  else if (btn === 'π') setDisplay(Math.PI.toString());
                  else if (['sin', 'cos', 'tan', 'log', 'ln', '√', '^'].includes(btn)) {
                    const fnMap: Record<string, () => void> = {
                      'sin': scientificFunctions.sin,
                      'cos': scientificFunctions.cos,
                      'tan': scientificFunctions.tan,
                      'log': scientificFunctions.log,
                      'ln': scientificFunctions.ln,
                      '√': scientificFunctions.sqrt,
                      '^': scientificFunctions.power
                    };
                    fnMap[btn]?.();
                  }
                  else if (['+', '-', '*', '/'].includes(btn)) handleOperator(btn);
                  else handleNumber(btn);
                }}
              >
                {btn}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Main Mobile App Component
const MobileApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'exam' | 'results'>('home');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [examSession, setExamSession] = useState<ExamSession | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  // Fetch quizzes (using mock data for now)
  const { data: quizzes = mockQuizzes } = useQuery({
    queryKey: ['/api/quizzes'],
    queryFn: async () => {
      // In real app, this would fetch from API
      return mockQuizzes;
    }
  });

  const startExam = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setExamSession({
      id: `session_${Date.now()}`,
      quizId: quiz.id,
      startTime: new Date(),
      timeRemaining: quiz.duration * 60, // Convert to seconds
      currentQuestion: 0,
      answers: {},
      proctoring: {
        cameraEnabled: true,
        micEnabled: true,
        violations: []
      }
    });
    setCurrentView('exam');
  };

  const submitAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Exam complete
      setCurrentView('results');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer countdown
  useEffect(() => {
    if (examSession && currentView === 'exam') {
      const timer = setInterval(() => {
        setExamSession(prev => {
          if (!prev) return null;
          const newTime = prev.timeRemaining - 1;
          if (newTime <= 0) {
            setCurrentView('results');
            return prev;
          }
          return { ...prev, timeRemaining: newTime };
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [examSession, currentView]);

  // Home View
  const renderHome = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">My Exams</h1>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm">
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <p className="text-gray-600">Welcome back! You have {quizzes.filter(q => q.status === 'available').length} exams available.</p>
      </div>

      {/* Quiz Cards */}
      <div className="space-y-4">
        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{quiz.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {quiz.duration} min
                    </span>
                    <span className="flex items-center">
                      <Book className="w-4 h-4 mr-1" />
                      {quiz.questions} questions
                    </span>
                    {quiz.allowCalculator && (
                      <span className="flex items-center">
                        <Calculator className="w-4 h-4 mr-1" />
                        {quiz.calculatorType}
                      </span>
                    )}
                  </div>
                </div>
                <Badge 
                  variant={quiz.status === 'available' ? 'default' : 
                           quiz.status === 'completed' ? 'secondary' : 'outline'}
                  className="ml-4"
                >
                  {quiz.status === 'available' ? 'Available' :
                   quiz.status === 'completed' ? 'Completed' : 'In Progress'}
                </Badge>
              </div>

              {quiz.status === 'in_progress' && quiz.progress && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{quiz.progress}%</span>
                  </div>
                  <Progress value={quiz.progress} className="h-2" />
                </div>
              )}

              {quiz.status === 'completed' && quiz.score && (
                <div className="mb-4">
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span className="text-sm">Score: {quiz.score}%</span>
                  </div>
                </div>
              )}

              {quiz.dueDate && (
                <p className="text-sm text-orange-600 mb-4">
                  Due: {new Date(quiz.dueDate).toLocaleDateString()}
                </p>
              )}

              <Button 
                onClick={() => startExam(quiz)}
                disabled={quiz.status === 'completed'}
                className="w-full"
              >
                {quiz.status === 'available' ? 'Start Exam' :
                 quiz.status === 'in_progress' ? 'Continue Exam' : 'View Results'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Exam View
  const renderExam = () => {
    if (!selectedQuiz || !examSession) return null;
    
    const currentQuestion = mockQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / mockQuestions.length) * 100;

    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-indigo-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={() => setCurrentView('home')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="font-semibold">{selectedQuiz.title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                {formatTime(examSession.timeRemaining)}
              </span>
              <span className="text-sm">
                {currentQuestionIndex + 1} / {mockQuestions.length}
              </span>
            </div>
          </div>
          <div className="mt-3">
            <Progress value={progress} className="h-2 bg-white/20" />
          </div>
        </div>

        {/* Proctoring Controls */}
        <div className="bg-gray-50 p-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm">
                <Camera className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Mic className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              {selectedQuiz.allowCalculator && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowCalculator(true)}
                >
                  <Calculator className="w-4 h-4" />
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowChat(true)}
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Question {currentQuestionIndex + 1}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {currentQuestion.text}
            </p>
          </div>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.type === 'multiple_choice' && currentQuestion.options?.map((option, index) => (
              <Button
                key={index}
                variant={answers[currentQuestion.id] === option ? 'default' : 'outline'}
                className="w-full text-left justify-start h-auto py-4 px-4"
                onClick={() => submitAnswer(currentQuestion.id, option)}
              >
                <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                {option}
              </Button>
            ))}

            {currentQuestion.type === 'true_false' && (
              <div className="flex space-x-4">
                <Button
                  variant={answers[currentQuestion.id] === 'True' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => submitAnswer(currentQuestion.id, 'True')}
                >
                  True
                </Button>
                <Button
                  variant={answers[currentQuestion.id] === 'False' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => submitAnswer(currentQuestion.id, 'False')}
                >
                  False
                </Button>
              </div>
            )}

            {currentQuestion.type === 'short_answer' && (
              <Input
                placeholder="Enter your answer..."
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => submitAnswer(currentQuestion.id, e.target.value)}
                className="w-full"
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            >
              Previous
            </Button>
            <Button 
              onClick={nextQuestion}
              disabled={!answers[currentQuestion.id]}
            >
              {currentQuestionIndex === mockQuestions.length - 1 ? 'Submit' : 'Next'}
            </Button>
          </div>
        </div>

        {/* Calculator Modal */}
        <AnimatePresence>
          {showCalculator && selectedQuiz.allowCalculator && (
            <MobileCalculator
              type={selectedQuiz.calculatorType || 'basic'}
              onClose={() => setShowCalculator(false)}
            />
          )}
        </AnimatePresence>

        {/* Chat Modal */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Question Support</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowChat(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Ask for help..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1"
                />
                <Button size="sm">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Results View
  const renderResults = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-md mx-auto">
        <Card className="shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Exam Complete!</h1>
              <p className="text-gray-600">{selectedQuiz?.title}</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span>Questions Answered:</span>
                <span className="font-semibold">{Object.keys(answers).length} / {mockQuestions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Time Taken:</span>
                <span className="font-semibold">{selectedQuiz?.duration} minutes</span>
              </div>
              <div className="flex justify-between">
                <span>Score:</span>
                <span className="font-semibold text-green-600">85%</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                className="w-full" 
                onClick={() => setCurrentView('home')}
              >
                Back to Home
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  // View detailed results
                }}
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="mobile-app">
      {currentView === 'home' && renderHome()}
      {currentView === 'exam' && renderExam()}
      {currentView === 'results' && renderResults()}
    </div>
  );
};

export default MobileApp;