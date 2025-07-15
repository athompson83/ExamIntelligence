import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import ExamLockdown from '@/components/ExamLockdown';
import { 
  ArrowLeft, 
  Settings, 
  User, 
  Clock, 
  FileText, 
  Trophy, 
  TrendingUp, 
  Calendar, 
  Bell, 
  Wifi, 
  WifiOff, 
  Camera, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  RotateCw, 
  CheckCircle, 
  AlertCircle,
  Calculator,
  Home,
  BookOpen,
  BarChart3,
  Award,
  Search,
  Filter,
  Star,
  Target,
  Zap,
  Shield,
  Brain,
  Plus,
  Minus,
  Divide,
  X as Multiply,
  Equal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

// Type definitions
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
  createdAt: string;
  updatedAt: string;
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

interface StudentProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  profileImageUrl?: string;
  studentId: string;
  completedExams: number;
  averageScore: number;
  totalPoints: number;
  rank: string;
  achievements: Array<{
    name: string;
    icon: string;
    date: string;
  }>;
  recentScores: Array<{
    exam: string;
    score: number;
    date: string;
  }>;
}

interface DashboardStats {
  assignedQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  totalQuestions: number;
  upcomingDeadlines: number;
  recentActivity: Array<{
    id: string;
    title: string;
    status: string;
    questionCount: number;
    dueDate?: string;
  }>;
}

interface CalculatorState {
  display: string;
  previousValue: number;
  operator: string;
  waitingForNewValue: boolean;
  memory: number;
  history: string[];
}

export default function MobileAppFixed() {
  const queryClient = useQueryClient();
  
  // State management
  const [currentView, setCurrentView] = useState<'dashboard' | 'assignments' | 'exam' | 'results' | 'profile' | 'settings'>('dashboard');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [examSession, setExamSession] = useState<ExamSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [lockdownReady, setLockdownReady] = useState(false);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  // Calculator state
  const [calculatorState, setCalculatorState] = useState<CalculatorState>({
    display: '0',
    previousValue: 0,
    operator: '',
    waitingForNewValue: false,
    memory: 0,
    history: []
  });

  // Proctoring state
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [violations, setViolations] = useState<string[]>([]);

  // Data fetching
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['/api/mobile/student/profile'],
    retry: false,
  });

  const { data: assignments, isLoading: isAssignmentsLoading } = useQuery({
    queryKey: ['/api/mobile/assignments'],
    retry: false,
  });

  const { data: dashboardStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['/api/mobile/dashboard/stats'],
    retry: false,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
    retry: false,
  });

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

  // Timer for exam
  useEffect(() => {
    if (currentView === 'exam' && examSession && !examSession.isPaused) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentView, examSession]);

  // Utility functions
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return 'bg-green-100 text-green-800';
    if (difficulty <= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getDifficultyText = (difficulty: number) => {
    if (difficulty <= 3) return 'Easy';
    if (difficulty <= 6) return 'Medium';
    return 'Hard';
  };

  // Handle exam start with lockdown
  const startExam = async (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setCurrentView('exam');
    
    // Load questions for the exam
    try {
      const response = await apiRequest(`/api/mobile/exam/questions?quizId=${quiz.id}`);
      setExamQuestions(response.questions || []);
      setTimeRemaining(quiz.timeLimit * 60);
      setCurrentQuestionIndex(0);
      setResponses({});
      
      // Create exam session
      const sessionResponse = await apiRequest(`/api/mobile/exam/start`, {
        method: 'POST',
        body: { quizId: quiz.id }
      });
      
      setExamSession(sessionResponse.session);
    } catch (error) {
      console.error('Error starting exam:', error);
    }
  };

  // Handle lockdown violations
  const handleViolation = (violation: string) => {
    setViolations(prev => [...prev, violation]);
    // Log violation to server
    apiRequest('/api/mobile/exam/violation', {
      method: 'POST',
      body: { 
        sessionId: examSession?.id,
        violation,
        timestamp: new Date().toISOString()
      }
    }).catch(console.error);
  };

  // Handle exam submission
  const handleSubmitExam = async () => {
    if (!examSession || !selectedQuiz) return;
    
    try {
      await apiRequest('/api/mobile/exam/submit', {
        method: 'POST',
        body: {
          sessionId: examSession.id,
          responses,
          timeSpent: (selectedQuiz.timeLimit * 60) - timeRemaining
        }
      });
      
      setCurrentView('results');
    } catch (error) {
      console.error('Error submitting exam:', error);
    }
  };

  // Filter assignments
  const filteredAssignments = assignments?.filter((assignment: Quiz) => {
    if (filterStatus !== 'all' && assignment.status !== filterStatus) {
      return false;
    }
    if (searchTerm && !assignment.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  }) || [];

  // Render functions
  const renderDashboard = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.profileImageUrl} alt={profile?.fullName} />
                <AvatarFallback>{profile?.firstName?.[0]}{profile?.lastName?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Hello, {profile?.firstName || 'Student'}
                </h1>
                <p className="text-sm text-gray-600">{profile?.studentId}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(true)}
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </Button>
              <div className="flex items-center space-x-1">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
                <span className="text-xs text-gray-600">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Scrollable Content */}
      <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-160px)]">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Assigned</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {dashboardStats?.assignedQuizzes || 0}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
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
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Score</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {dashboardStats?.averageScore || 0}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {dashboardStats?.upcomingDeadlines || 0}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardStats?.recentActivity?.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {dashboardStats?.recentActivity?.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{activity.title}</p>
                        <p className="text-xs text-gray-500">
                          {activity.questionCount} questions
                        </p>
                      </div>
                    </div>
                    <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAssignments = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Assignments</h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {showSearch && (
          <div className="mb-4">
            <Input
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        )}
        
        {showFilters && (
          <div className="mb-4 flex flex-wrap gap-2">
            {['all', 'assigned', 'in_progress', 'completed', 'overdue'].map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(status)}
              >
                {status.replace('_', ' ')}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-160px)]">
        {isAssignmentsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="flex space-x-2">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
            <p className="text-gray-600">Check back later for new assignments</p>
          </div>
        ) : (
          filteredAssignments.map((assignment: Quiz) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={getStatusColor(assignment.status)}>
                        {assignment.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getDifficultyColor(assignment.difficulty)}>
                        {getDifficultyText(assignment.difficulty)}
                      </Badge>
                      {assignment.proctoringEnabled && (
                        <Badge variant="outline">
                          <Shield className="h-3 w-3 mr-1" />
                          Proctored
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>{assignment.questionCount} questions</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{assignment.timeLimit} mins</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Target className="h-4 w-4" />
                    <span>{assignment.attempts}/{assignment.maxAttempts} attempts</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {assignment.bestScore && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Best Score</span>
                      <span className="text-sm font-medium">{assignment.bestScore}%</span>
                    </div>
                    <Progress value={assignment.bestScore} className="h-2" />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {assignment.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <Button
                    onClick={() => startExam(assignment)}
                    disabled={assignment.status === 'completed' || assignment.attempts >= assignment.maxAttempts}
                    className="ml-2"
                  >
                    {assignment.status === 'completed' ? 'Completed' :
                     assignment.attempts >= assignment.maxAttempts ? 'No attempts left' :
                     assignment.status === 'in_progress' ? 'Continue' : 'Start'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderExam = () => {
    if (!examSession || !selectedQuiz) return null;

    const currentQuestion = examQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / examQuestions.length) * 100;

    return (
      <div className="min-h-screen bg-white">
        {/* Exam Lockdown Component */}
        {selectedQuiz.proctoringEnabled && (
          <ExamLockdown
            isProctored={selectedQuiz.proctoringEnabled}
            onLockdownReady={setLockdownReady}
            onViolation={handleViolation}
            examTitle={selectedQuiz.title}
          />
        )}

        {/* Only show exam content if lockdown is ready (or not proctored) */}
        {(!selectedQuiz.proctoringEnabled || lockdownReady) && (
          <>
            {/* Header */}
            <div className="bg-gray-900 text-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold">{selectedQuiz.title}</h1>
                  <p className="text-sm text-gray-300">
                    Question {currentQuestionIndex + 1} of {examQuestions.length}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-xs text-gray-300">Time remaining</div>
                </div>
              </div>
              
              <div className="mt-3">
                <Progress value={progress} className="h-2" />
              </div>
            </div>

            {/* Proctoring Status */}
            {selectedQuiz.proctoringEnabled && (
              <div className="bg-yellow-50 border-b border-yellow-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      Proctoring Active
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <Camera className={`h-4 w-4 ${cameraEnabled ? 'text-green-600' : 'text-red-600'}`} />
                      <span className="text-xs text-gray-600">Camera</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {micEnabled ? (
                        <Mic className="h-4 w-4 text-green-600" />
                      ) : (
                        <MicOff className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-xs text-gray-600">Mic</span>
                    </div>
                  </div>
                </div>
                
                {violations.length > 0 && (
                  <div className="mt-2">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {violations.length} violation(s) detected. Multiple violations may result in exam termination.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            )}

            {/* Question Content */}
            <div className="p-4 flex-1 overflow-y-auto">
              {currentQuestion && (
                <div className="max-w-2xl mx-auto">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Question {currentQuestionIndex + 1}
                      </h2>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
                        </Badge>
                        <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                          {getDifficultyText(currentQuestion.difficulty)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-800 leading-relaxed">
                        {currentQuestion.questionText}
                      </p>
                    </div>
                  </div>

                  {/* Answer Options */}
                  <div className="space-y-3">
                    {currentQuestion.type === 'multiple_choice' && currentQuestion.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                        <input
                          type="radio"
                          id={`option-${index}`}
                          name={`question-${currentQuestion.id}`}
                          value={option}
                          checked={responses[currentQuestion.id] === option}
                          onChange={(e) => setResponses(prev => ({
                            ...prev,
                            [currentQuestion.id]: e.target.value
                          }))}
                          className="h-4 w-4 text-blue-600"
                        />
                        <label htmlFor={`option-${index}`} className="flex-1 text-gray-700">
                          {option}
                        </label>
                      </div>
                    ))}

                    {currentQuestion.type === 'true_false' && (
                      <div className="space-y-3">
                        {['True', 'False'].map((option) => (
                          <div key={option} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                            <input
                              type="radio"
                              id={`tf-${option}`}
                              name={`question-${currentQuestion.id}`}
                              value={option}
                              checked={responses[currentQuestion.id] === option}
                              onChange={(e) => setResponses(prev => ({
                                ...prev,
                                [currentQuestion.id]: e.target.value
                              }))}
                              className="h-4 w-4 text-blue-600"
                            />
                            <label htmlFor={`tf-${option}`} className="flex-1 text-gray-700">
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}

                    {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'essay') && (
                      <div className="space-y-3">
                        <textarea
                          value={responses[currentQuestion.id] || ''}
                          onChange={(e) => setResponses(prev => ({
                            ...prev,
                            [currentQuestion.id]: e.target.value
                          }))}
                          placeholder="Enter your answer..."
                          rows={currentQuestion.type === 'essay' ? 8 : 4}
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="bg-white border-t p-4">
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-2">
                  {selectedQuiz.allowCalculator && (
                    <Button
                      variant="outline"
                      onClick={() => setShowCalculator(true)}
                      className="flex items-center space-x-1"
                    >
                      <Calculator className="h-4 w-4" />
                      <span>Calculator</span>
                    </Button>
                  )}
                </div>
                
                {currentQuestionIndex === examQuestions.length - 1 ? (
                  <Button
                    onClick={handleSubmitExam}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Submit Exam
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentQuestionIndex(Math.min(examQuestions.length - 1, currentQuestionIndex + 1))}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderResults = () => (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Exam Completed!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              Your exam has been submitted successfully. Results will be available once graded.
            </p>
            <Button onClick={() => setCurrentView('assignments')}>
              Back to Assignments
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="min-h-screen bg-gray-50 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.profileImageUrl} alt={profile?.fullName} />
                <AvatarFallback>{profile?.firstName?.[0]}{profile?.lastName?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{profile?.fullName}</h3>
                <p className="text-gray-600">{profile?.email}</p>
                <p className="text-sm text-gray-500">Student ID: {profile?.studentId}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{profile?.completedExams || 0}</div>
                <div className="text-sm text-gray-600">Completed Exams</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{profile?.averageScore || 0}%</div>
                <div className="text-sm text-gray-600">Average Score</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="min-h-screen bg-gray-50 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Notifications</h3>
                <p className="text-sm text-gray-600">Receive exam reminders</p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Dark Mode</h3>
                <p className="text-sm text-gray-600">Enable dark theme</p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Auto-save</h3>
                <p className="text-sm text-gray-600">Auto-save exam responses</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Bottom navigation
  const renderBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50">
      <div className="flex justify-around items-center">
        <Button
          variant={currentView === 'dashboard' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setCurrentView('dashboard')}
          className="flex flex-col items-center justify-center p-2 h-16 min-h-16 w-full"
        >
          <Home className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Dashboard</span>
        </Button>
        
        <Button
          variant={currentView === 'assignments' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setCurrentView('assignments')}
          className="flex flex-col items-center justify-center p-2 h-16 min-h-16 w-full"
        >
          <BookOpen className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Assignments</span>
        </Button>
        
        <Button
          variant={currentView === 'profile' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setCurrentView('profile')}
          className="flex flex-col items-center justify-center p-2 h-16 min-h-16 w-full"
        >
          <User className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Profile</span>
        </Button>
        
        <Button
          variant={currentView === 'settings' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setCurrentView('settings')}
          className="flex flex-col items-center justify-center p-2 h-16 min-h-16 w-full"
        >
          <Settings className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Settings</span>
        </Button>
      </div>
    </div>
  );

  // Calculator component
  const renderCalculator = () => (
    <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Calculator</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="text-right text-2xl font-mono">
              {calculatorState.display}
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            <Button variant="outline" onClick={() => setCalculatorState({
              display: '0',
              previousValue: 0,
              operator: '',
              waitingForNewValue: false,
              memory: 0,
              history: []
            })}>C</Button>
            <Button variant="outline" onClick={() => setCalculatorState(prev => ({
              ...prev,
              display: '0',
              waitingForNewValue: false
            }))}>CE</Button>
            <Button variant="outline" onClick={() => {/* Handle division */}}>/</Button>
            <Button variant="outline" onClick={() => {/* Handle multiplication */}}>×</Button>
            
            <Button variant="outline" onClick={() => {/* Handle 7 */}}>7</Button>
            <Button variant="outline" onClick={() => {/* Handle 8 */}}>8</Button>
            <Button variant="outline" onClick={() => {/* Handle 9 */}}>9</Button>
            <Button variant="outline" onClick={() => {/* Handle subtraction */}}>−</Button>
            
            <Button variant="outline" onClick={() => {/* Handle 4 */}}>4</Button>
            <Button variant="outline" onClick={() => {/* Handle 5 */}}>5</Button>
            <Button variant="outline" onClick={() => {/* Handle 6 */}}>6</Button>
            <Button variant="outline" onClick={() => {/* Handle addition */}}>+</Button>
            
            <Button variant="outline" onClick={() => {/* Handle 1 */}}>1</Button>
            <Button variant="outline" onClick={() => {/* Handle 2 */}}>2</Button>
            <Button variant="outline" onClick={() => {/* Handle 3 */}}>3</Button>
            <Button variant="outline" onClick={() => {/* Handle equals */}} className="row-span-2">=</Button>
            
            <Button variant="outline" onClick={() => {/* Handle 0 */}} className="col-span-2">0</Button>
            <Button variant="outline" onClick={() => {/* Handle decimal */}}>.</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Main render
  return (
    <div className="mobile-app h-screen overflow-hidden">
      <div className="h-full pb-20 overflow-y-auto">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'assignments' && renderAssignments()}
        {currentView === 'exam' && renderExam()}
        {currentView === 'results' && renderResults()}
        {currentView === 'profile' && renderProfile()}
        {currentView === 'settings' && renderSettings()}
      </div>
      {renderCalculator()}
      {renderBottomNav()}
    </div>
  );
}