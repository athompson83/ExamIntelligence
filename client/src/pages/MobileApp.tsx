import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { 
  Home, 
  BookOpen, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  PlayCircle, 
  PauseCircle, 
  SkipForward, 
  SkipBack, 
  Calculator, 
  Camera, 
  Mic, 
  MicOff, 
  VideoOff, 
  Video,
  Award,
  TrendingUp,
  FileText,
  Calendar,
  Settings,
  LogOut,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Star,
  Target,
  BarChart3,
  Globe,
  Wifi,
  WifiOff,
  Battery,
  XCircle,
  AlertTriangle,
  Shield,
  Timer,
  Flag,
  HelpCircle,
  X,
  Plus,
  Minus,
  Divide,
  Equal
} from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  timeLimit: number;
  difficulty: number;
  status: 'assigned' | 'in_progress' | 'completed' | 'overdue';
  dueDate: string;
  attempts: number;
  maxAttempts: number;
  bestScore?: number;
  tags: string[];
  allowCalculator: boolean;
  calculatorType: 'basic' | 'scientific' | 'graphing';
  proctoringEnabled: boolean;
}

interface Question {
  id: string;
  questionText: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options?: string[];
  correctAnswer?: string;
  points: number;
  timeLimit?: number;
  difficulty: number;
}

interface ExamSession {
  id: string;
  quizId: string;
  studentId: string;
  startTime: Date;
  endTime?: Date;
  currentQuestionIndex: number;
  responses: Record<string, string>;
  timeRemaining: number;
  isPaused: boolean;
  violations: any[];
  proctoring: {
    cameraEnabled: boolean;
    micEnabled: boolean;
    screenSharing: boolean;
    tabSwitches: number;
    suspiciousActivity: any[];
  };
}

// React Query hooks for API data
const useMobileAssignments = () => {
  return useQuery({
    queryKey: ['/api/mobile/assignments'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

const useMobileDashboardStats = () => {
  return useQuery({
    queryKey: ['/api/mobile/dashboard/stats'],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

const useStudentProfile = () => {
  return useQuery({
    queryKey: ['/api/mobile/student/profile'],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

const useAssignmentQuestions = (assignmentId: string) => {
  return useQuery({
    queryKey: ['/api/mobile/assignment', assignmentId, 'questions'],
    enabled: !!assignmentId,
    staleTime: 5 * 60 * 1000,
  });
};

// Calculator Component
const CalculatorModal: React.FC<{ onClose: () => void; type: 'basic' | 'scientific' | 'graphing' }> = ({ onClose, type }) => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const calculate = (firstOperand: number, secondOperand: number, operation: string) => {
    switch (operation) {
      case '+': return firstOperand + secondOperand;
      case '-': return firstOperand - secondOperand;
      case '*': return firstOperand * secondOperand;
      case '/': return firstOperand / secondOperand;
      case '=': return secondOperand;
      default: return secondOperand;
    }
  };

  const handleNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const result = calculate(currentValue, inputValue, operation);
      
      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const handleEquals = () => {
    const inputValue = parseFloat(display);
    
    if (previousValue !== null && operation) {
      const result = calculate(previousValue, inputValue, operation);
      setDisplay(String(result));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const handleScientific = (func: string) => {
    const inputValue = parseFloat(display);
    let result = 0;
    
    switch (func) {
      case 'sin': result = Math.sin(inputValue * Math.PI / 180); break;
      case 'cos': result = Math.cos(inputValue * Math.PI / 180); break;
      case 'tan': result = Math.tan(inputValue * Math.PI / 180); break;
      case 'ln': result = Math.log(inputValue); break;
      case 'log': result = Math.log10(inputValue); break;
      case 'sqrt': result = Math.sqrt(inputValue); break;
      case 'square': result = inputValue * inputValue; break;
      case 'pi': result = Math.PI; break;
      case 'e': result = Math.E; break;
    }
    
    setDisplay(String(result));
    setWaitingForOperand(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Calculator ({type})</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="mb-4">
          <div className="bg-gray-100 p-3 rounded text-right text-xl font-mono">
            {display}
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          <Button variant="outline" onClick={handleClear}>C</Button>
          <Button variant="outline" onClick={() => handleOperation('/')}><Divide className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={() => handleOperation('*')}>×</Button>
          <Button variant="outline" onClick={() => handleOperation('-')}><Minus className="h-4 w-4" /></Button>
          
          <Button variant="outline" onClick={() => handleNumber('7')}>7</Button>
          <Button variant="outline" onClick={() => handleNumber('8')}>8</Button>
          <Button variant="outline" onClick={() => handleNumber('9')}>9</Button>
          <Button variant="outline" onClick={() => handleOperation('+')} className="row-span-2"><Plus className="h-4 w-4" /></Button>
          
          <Button variant="outline" onClick={() => handleNumber('4')}>4</Button>
          <Button variant="outline" onClick={() => handleNumber('5')}>5</Button>
          <Button variant="outline" onClick={() => handleNumber('6')}>6</Button>
          
          <Button variant="outline" onClick={() => handleNumber('1')}>1</Button>
          <Button variant="outline" onClick={() => handleNumber('2')}>2</Button>
          <Button variant="outline" onClick={() => handleNumber('3')}>3</Button>
          <Button variant="outline" onClick={handleEquals} className="row-span-2"><Equal className="h-4 w-4" /></Button>
          
          <Button variant="outline" onClick={() => handleNumber('0')} className="col-span-2">0</Button>
          <Button variant="outline" onClick={() => handleNumber('.')}>.</Button>
          
          {type === 'scientific' && (
            <>
              <Button variant="outline" onClick={() => handleScientific('sin')}>sin</Button>
              <Button variant="outline" onClick={() => handleScientific('cos')}>cos</Button>
              <Button variant="outline" onClick={() => handleScientific('tan')}>tan</Button>
              <Button variant="outline" onClick={() => handleScientific('ln')}>ln</Button>
              <Button variant="outline" onClick={() => handleScientific('log')}>log</Button>
              <Button variant="outline" onClick={() => handleScientific('sqrt')}>√</Button>
              <Button variant="outline" onClick={() => handleScientific('square')}>x²</Button>
              <Button variant="outline" onClick={() => handleScientific('pi')}>π</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default function MobileApp() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'quizzes' | 'exam' | 'results' | 'profile' | 'settings'>('dashboard');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [examSession, setExamSession] = useState<ExamSession | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [examResult, setExamResult] = useState<any>(null);
  const [proctoring, setProctoring] = useState({
    cameraEnabled: false,
    micEnabled: false,
    screenSharing: false,
    violations: []
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Welcome to Mobile Learning</CardTitle>
            <CardDescription>
              Please log in to access your assignments and take exams
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => window.location.href = '/api/login'} 
              className="w-full"
            >
              Log In
            </Button>
            <p className="text-center text-sm text-gray-600">
              Use your student credentials to access the platform
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // API Data
  const { data: dashboardStats, isLoading: statsLoading } = useMobileDashboardStats();
  const { data: assignments, isLoading: assignmentsLoading } = useMobileAssignments();
  const { data: studentProfile, isLoading: profileLoading } = useStudentProfile();
  const { data: questions, isLoading: questionsLoading } = useAssignmentQuestions(selectedQuiz?.id || '');
  
  const queryClient = useQueryClient();

  // Authentication redirect
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">ProficiencyAI Mobile</CardTitle>
            <CardDescription>
              Access your assignments and take exams securely
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                This is a secure, proctored exam platform. Please log in to access your assignments.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => window.location.href = '/api/login'} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Log In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mutations
  const startAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return await apiRequest(`/api/mobile/assignment/${assignmentId}/start`, {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      setExamSession(data);
      setCurrentView('exam');
    },
  });

  const submitAssignmentMutation = useMutation({
    mutationFn: async ({ sessionId, responses, timeSpent }: { sessionId: string; responses: Record<string, string>; timeSpent: number }) => {
      return await apiRequest(`/api/mobile/session/${sessionId}/submit`, {
        method: 'POST',
        body: { responses, timeSpent },
      });
    },
    onSuccess: (data) => {
      setExamResult(data);
      setCurrentView('results');
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/dashboard/stats'] });
    },
  });

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Timer for exam
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (examSession && !examSession.isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Auto-submit exam when time runs out
            handleExamSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [examSession, timeRemaining]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyStars = (difficulty: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < difficulty ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
    ));
  };

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && examSession && !examSession.isPaused) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleExamSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining, examSession]);

  // Proctoring setup
  useEffect(() => {
    if (currentView === 'exam' && selectedQuiz?.proctoringEnabled) {
      initializeProctoring();
    }
    return () => {
      if (proctoring.cameraEnabled) {
        stopProctoring();
      }
    };
  }, [currentView, selectedQuiz]);

  // Network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const initializeProctoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setProctoring(prev => ({
        ...prev,
        cameraEnabled: true,
        micEnabled: true
      }));

      // Monitor for window focus/blur
      const handleVisibilityChange = () => {
        if (document.hidden) {
          setProctoring(prev => ({
            ...prev,
            violations: [...prev.violations, {
              type: 'tab_switch',
              timestamp: new Date().toISOString()
            }]
          }));
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        stream.getTracks().forEach(track => track.stop());
      };
    } catch (error) {
      console.error('Failed to initialize proctoring:', error);
    }
  };

  const stopProctoring = () => {
    setProctoring(prev => ({
      ...prev,
      cameraEnabled: false,
      micEnabled: false
    }));
  };

  const startExam = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setCurrentQuestion(0);
    setResponses({});
    setTimeRemaining(quiz.timeLimit * 60);
    
    // Start assignment via API
    startAssignmentMutation.mutate(quiz.id);
    
    // Enable proctoring if required
    if (quiz.proctoringEnabled) {
      setProctoring({
        cameraEnabled: true,
        micEnabled: true,
        screenSharing: true,
        violations: []
      });
    }
  };

  const handleExamSubmit = () => {
    if (examSession && selectedQuiz) {
      const timeSpent = (selectedQuiz.timeLimit * 60) - timeRemaining;
      submitAssignmentMutation.mutate({
        sessionId: examSession.id,
        responses,
        timeSpent
      });
    }
  };

  const handleResponse = (questionId: string, answer: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < mockQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const filteredQuizzes = (assignments || []).filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === 'all' || quiz.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const renderDashboard = () => {
    if (statsLoading) {
      return (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
            <div className="animate-pulse">
              <div className="h-8 bg-white/20 rounded mb-2"></div>
              <div className="h-4 bg-white/20 rounded w-3/4"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
          <h1 className="text-2xl font-bold mb-2">Welcome back, Student!</h1>
          <p className="opacity-90">You have {dashboardStats?.assignedQuizzes || 0} assignments due this week</p>
        </div>

        {/* Network Status */}
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <><Wifi className="h-5 w-5 text-green-500" /><span className="text-green-600">Online</span></>
            ) : (
              <><WifiOff className="h-5 w-5 text-red-500" /><span className="text-red-600">Offline</span></>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Battery className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-600">Battery: Good</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Assignments Due</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {dashboardStats?.assignedQuizzes || 0}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {dashboardStats?.completedQuizzes || 0}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardStats?.recentActivity?.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      activity.status === 'completed' ? 'bg-green-500' : 
                      activity.status === 'in_progress' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.questionCount} questions</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(activity.status)}>
                    {activity.status.replace('_', ' ')}
                  </Badge>
                </div>
              )) || (
                <div className="text-center py-4 text-gray-500">
                  No recent activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            onClick={() => setCurrentView('quizzes')} 
            className="h-16 bg-blue-600 hover:bg-blue-700"
          >
            <div className="flex flex-col items-center">
              <BookOpen className="h-6 w-6 mb-1" />
              <span>View Assignments</span>
            </div>
          </Button>
          
          <Button 
            onClick={() => setCurrentView('profile')} 
            variant="outline"
            className="h-16"
          >
            <div className="flex flex-col items-center">
              <BarChart3 className="h-6 w-6 mb-1" />
              <span>My Progress</span>
            </div>
          </Button>
        </div>
      </div>
    );
  };

  const renderQuizzes = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Assignments</h1>
        <Button onClick={() => setCurrentView('dashboard')} variant="outline" size="sm">
          <Home className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex space-x-2 overflow-x-auto">
          {['all', 'assigned', 'in_progress', 'completed', 'overdue'].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className="whitespace-nowrap"
            >
              {status.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Quiz List */}
      <div className="space-y-4">
        {filteredQuizzes.map((quiz) => (
          <Card key={quiz.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{quiz.title}</CardTitle>
                  <CardDescription className="mt-1">{quiz.description}</CardDescription>
                </div>
                <Badge className={getStatusColor(quiz.status)}>
                  {quiz.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* Quiz Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span>{quiz.questionCount} questions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{quiz.timeLimit} minutes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-gray-500" />
                    <span>Attempts: {quiz.attempts}/{quiz.maxAttempts}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex">{getDifficultyStars(quiz.difficulty)}</div>
                  </div>
                </div>

                {/* Features */}
                <div className="flex space-x-2">
                  {quiz.allowCalculator && (
                    <Badge variant="secondary">
                      <Calculator className="h-3 w-3 mr-1" />
                      Calculator
                    </Badge>
                  )}
                  {quiz.proctoringEnabled && (
                    <Badge variant="secondary">
                      <Camera className="h-3 w-3 mr-1" />
                      Proctored
                    </Badge>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {quiz.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Due Date */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Due: {new Date(quiz.dueDate).toLocaleDateString()}</span>
                  </div>
                  
                  {quiz.bestScore && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <span>Best: {quiz.bestScore}%</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  {quiz.status === 'assigned' && (
                    <Button 
                      onClick={() => startExam(quiz)}
                      className="flex-1"
                      disabled={!isOnline}
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Start Exam
                    </Button>
                  )}
                  
                  {quiz.status === 'in_progress' && (
                    <Button 
                      onClick={() => startExam(quiz)}
                      className="flex-1"
                      disabled={!isOnline}
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Continue
                    </Button>
                  )}
                  
                  {quiz.status === 'completed' && (
                    <Button 
                      onClick={() => setCurrentView('results')}
                      variant="outline"
                      className="flex-1"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Results
                    </Button>
                  )}
                  
                  {quiz.attempts < quiz.maxAttempts && quiz.status !== 'assigned' && (
                    <Button 
                      onClick={() => startExam(quiz)}
                      variant="outline"
                      size="sm"
                      disabled={!isOnline}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredQuizzes.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No assignments found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderExam = () => {
    if (!questions || questions.length === 0 || questionsLoading) {
      return (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="animate-pulse">
              <div className="h-6 bg-red-200 rounded mb-2"></div>
              <div className="h-4 bg-red-200 rounded w-3/4"></div>
            </div>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    const question = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    
    return (
      <div className="space-y-6">
        {/* Exam Header */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {proctoring.cameraEnabled && (
                  <div className="flex items-center space-x-1">
                    <Camera className="h-4 w-4 text-red-600" />
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  </div>
                )}
                {proctoring.micEnabled && (
                  <Mic className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium text-red-800">PROCTORED EXAM</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-red-800">Time Remaining</p>
              <p className="text-lg font-bold text-red-600">{formatTime(timeRemaining)}</p>
            </div>
          </div>
        </div>

        {/* Question Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Question {currentQuestion + 1} of {mockQuestions.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Question {currentQuestion + 1}</span>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{question.points} points</Badge>
                <div className="flex">{getDifficultyStars(question.difficulty)}</div>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <p className="text-lg leading-relaxed">{question.questionText}</p>
              
              {question.type === 'multiple_choice' && question.options && (
                <RadioGroup
                  value={responses[question.id] || ''}
                  onValueChange={(value) => handleResponse(question.id, value)}
                >
                  {question.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              
              {question.type === 'true_false' && (
                <RadioGroup
                  value={responses[question.id] || ''}
                  onValueChange={(value) => handleResponse(question.id, value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="true" />
                    <Label htmlFor="true" className="cursor-pointer">True</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="false" />
                    <Label htmlFor="false" className="cursor-pointer">False</Label>
                  </div>
                </RadioGroup>
              )}
              
              {(question.type === 'short_answer' || question.type === 'essay') && (
                <textarea
                  value={responses[question.id] || ''}
                  onChange={(e) => handleResponse(question.id, e.target.value)}
                  className="w-full p-3 border rounded-md resize-none"
                  rows={question.type === 'essay' ? 8 : 3}
                  placeholder={question.type === 'essay' ? 'Provide a detailed answer...' : 'Enter your answer...'}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            onClick={previousQuestion}
            disabled={currentQuestion === 0}
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex space-x-2">
            {selectedQuiz?.allowCalculator && (
              <Button
                onClick={() => setShowCalculator(true)}
                variant="outline"
                size="sm"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calculator
              </Button>
            )}
            
            <Button
              onClick={() => setExamSession(prev => prev ? {...prev, isPaused: !prev.isPaused} : null)}
              variant="outline"
              size="sm"
            >
              {examSession?.isPaused ? (
                <><PlayCircle className="h-4 w-4 mr-2" />Resume</>
              ) : (
                <><PauseCircle className="h-4 w-4 mr-2" />Pause</>
              )}
            </Button>
          </div>
          
          {currentQuestion < questions.length - 1 ? (
            <Button onClick={nextQuestion}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleExamSubmit} 
              className="bg-green-600 hover:bg-green-700"
              disabled={submitAssignmentMutation.isPending}
            >
              {submitAssignmentMutation.isPending ? 'Submitting...' : 'Submit'} Exam
              <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Calculator Modal */}
        {showCalculator && selectedQuiz && (
          <CalculatorModal 
            onClose={() => setShowCalculator(false)}
            type={selectedQuiz.calculatorType}
          />
        )}
      </div>
    );
  };

  const renderResults = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Exam Complete!</h1>
        <p className="text-gray-600">Your results have been submitted</p>
      </div>

      <Card>
        <CardContent className="text-center py-8">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">92%</h2>
            <p className="text-gray-600">Excellent work! You've passed the exam.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Questions Answered</p>
              <p className="text-xl font-bold">{Object.keys(responses).length}/{mockQuestions.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Time Taken</p>
              <p className="text-xl font-bold">{formatTime((selectedQuiz?.timeLimit || 0) * 60 - timeRemaining)}</p>
            </div>
          </div>
          
          <div className="flex space-x-2 justify-center">
            <Button onClick={() => setCurrentView('quizzes')} variant="outline">
              Back to Assignments
            </Button>
            <Button onClick={() => setCurrentView('dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <Button onClick={() => setCurrentView('dashboard')} variant="outline" size="sm">
          <Home className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold">John Doe</h2>
            <p className="text-gray-600">Student ID: EMT-2025-001</p>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {mockQuizzes.filter(q => q.status === 'completed').length}
                </p>
                <p className="text-sm text-gray-600">Completed Exams</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">87%</p>
                <p className="text-sm text-gray-600">Average Score</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h3 className="font-semibold">Recent Performance</h3>
              {mockQuizzes.filter(q => q.status === 'completed').map((quiz) => (
                <div key={quiz.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{quiz.title}</p>
                    <p className="text-sm text-gray-600">{new Date(quiz.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{quiz.bestScore}%</p>
                    <p className="text-xs text-gray-600">{quiz.attempts} attempt(s)</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button onClick={() => setCurrentView('dashboard')} variant="outline" size="sm">
          <Home className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exam Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications">Push Notifications</Label>
            <Checkbox id="notifications" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="sounds">Sound Effects</Label>
            <Checkbox id="sounds" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="autosubmit">Auto-submit when time expires</Label>
            <Checkbox id="autosubmit" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full">
            <User className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
          
          <Button variant="outline" className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            Privacy Settings
          </Button>
          
          <Button variant="destructive" className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="sticky top-0 z-30 bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">ProficiencyAI</h1>
              <p className="text-xs text-gray-600">Mobile Learning Platform</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isOnline && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentView('settings')}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'quizzes' && renderQuizzes()}
        {currentView === 'exam' && renderExam()}
        {currentView === 'results' && renderResults()}
        {currentView === 'profile' && renderProfile()}
        {currentView === 'settings' && renderSettings()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-2">
        <div className="flex justify-around">
          <Button
            variant={currentView === 'dashboard' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('dashboard')}
            className="flex flex-col items-center h-auto py-2"
          >
            <Home className="h-4 w-4 mb-1" />
            <span className="text-xs">Home</span>
          </Button>
          
          <Button
            variant={currentView === 'quizzes' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('quizzes')}
            className="flex flex-col items-center h-auto py-2"
          >
            <BookOpen className="h-4 w-4 mb-1" />
            <span className="text-xs">Assignments</span>
          </Button>
          
          <Button
            variant={currentView === 'profile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('profile')}
            className="flex flex-col items-center h-auto py-2"
          >
            <User className="h-4 w-4 mb-1" />
            <span className="text-xs">Profile</span>
          </Button>
          
          <Button
            variant={currentView === 'settings' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('settings')}
            className="flex flex-col items-center h-auto py-2"
          >
            <Settings className="h-4 w-4 mb-1" />
            <span className="text-xs">Settings</span>
          </Button>
        </div>
      </div>
    </div>
  );
}