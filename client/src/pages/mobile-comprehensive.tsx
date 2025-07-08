import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  X,
  MonitorSpeaker,
  AlertTriangle,
  Shield,
  Eye,
  EyeOff,
  FileText,
  Timer,
  Award,
  ChevronRight,
  ChevronLeft,
  Bookmark,
  Flag,
  Volume2,
  VolumeX,
  Share2,
  Download,
  RefreshCw,
  Wifi,
  WifiOff,
  Battery,
  Signal,
  Info,
  HelpCircle,
  LogOut,
  Menu,
  Bell,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Star,
  Heart,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Target,
  TrendingUp,
  Users,
  Globe,
  Lock,
  Unlock,
  Trash2,
  Edit,
  Save,
  Plus,
  Minus,
  MoreHorizontal,
  MoreVertical,
  Maximize,
  Minimize,
  Square,
  Circle,
  Triangle,
  ChevronUp as ChevronUpIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';

// Enhanced interfaces for comprehensive app
interface Quiz {
  id: string;
  title: string;
  description?: string;
  duration: number;
  questions: number;
  status: 'available' | 'completed' | 'in_progress' | 'locked' | 'scheduled';
  progress?: number;
  score?: number;
  maxScore?: number;
  attempts?: number;
  maxAttempts?: number;
  dueDate?: string;
  availableFrom?: string;
  availableUntil?: string;
  allowCalculator?: boolean;
  calculatorType?: 'basic' | 'scientific' | 'graphing';
  requiresProctoring?: boolean;
  shuffleQuestions?: boolean;
  showFeedback?: boolean;
  passingScore?: number;
  timeLimit?: number;
  instructions?: string;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  subject?: string;
  lastAttempt?: {
    score: number;
    completedAt: string;
    timeSpent: number;
  };
}

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'matching' | 'ordering';
  options?: string[];
  correctAnswer?: string | string[];
  points?: number;
  explanation?: string;
  media?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    alt?: string;
  };
  timeLimit?: number;
  difficulty?: number;
  tags?: string[];
}

interface ExamSession {
  id: string;
  quizId: string;
  startTime: Date;
  timeRemaining: number;
  currentQuestion: number;
  totalQuestions: number;
  answers: Record<string, any>;
  flaggedQuestions: string[];
  proctoring: {
    cameraEnabled: boolean;
    micEnabled: boolean;
    screenRecording: boolean;
    violations: ProctoringViolation[];
    warnings: number;
    maxWarnings: number;
  };
  status: 'not_started' | 'in_progress' | 'paused' | 'submitted' | 'auto_submitted';
  questions: Question[];
  settings: {
    allowBackTracking: boolean;
    showQuestionNumbers: boolean;
    showProgress: boolean;
    randomizeQuestions: boolean;
    randomizeOptions: boolean;
  };
}

interface ProctoringViolation {
  id: string;
  type: 'tab_switch' | 'window_blur' | 'face_not_detected' | 'multiple_faces' | 'suspicious_movement' | 'audio_violation' | 'prohibited_software';
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  action?: 'warning' | 'pause_exam' | 'terminate_exam';
  screenshot?: string;
}

interface Assignment {
  id: string;
  title: string;
  description?: string;
  quiz: Quiz;
  dueDate: Date;
  availableFrom: Date;
  availableUntil: Date;
  assignedBy: string;
  status: 'upcoming' | 'available' | 'overdue' | 'submitted' | 'graded';
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number;
  maxAttempts: number;
  attemptsUsed: number;
}

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  stats: {
    totalQuizzes: number;
    averageScore: number;
    totalTimeSpent: number;
    streakDays: number;
    badges: Badge[];
    achievements: Achievement[];
  };
  preferences: {
    notifications: boolean;
    darkMode: boolean;
    fontSize: 'small' | 'medium' | 'large';
    soundEffects: boolean;
    autoSave: boolean;
    accessibilityMode: boolean;
  };
  recentActivity: Activity[];
}

interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  classes: Class[];
  stats: {
    totalStudents: number;
    totalQuizzes: number;
    averageClassScore: number;
    activeExams: number;
  };
  recentActivity: Activity[];
}

interface Class {
  id: string;
  name: string;
  subject: string;
  students: Student[];
  quizzes: Quiz[];
  avgScore: number;
  recentActivity: Activity[];
}

interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'in_exam';
  currentExam?: {
    quizId: string;
    startTime: Date;
    progress: number;
    violations: number;
  };
  stats: {
    averageScore: number;
    completedQuizzes: number;
    totalTimeSpent: number;
  };
}

interface Activity {
  id: string;
  type: 'quiz_completed' | 'exam_started' | 'violation_detected' | 'grade_received' | 'assignment_due';
  title: string;
  description: string;
  timestamp: Date;
  metadata?: any;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt?: Date;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: string;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

interface CalculatorState {
  display: string;
  previousValue: number;
  operation: string | null;
  waitingForNewValue: boolean;
  history: string[];
  mode: 'basic' | 'scientific';
  memory: number;
}

// Mobile App Component
export default function ComprehensiveMobileApp() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Core state management
  const [currentView, setCurrentView] = useState<
    'login' | 'dashboard' | 'quiz_list' | 'exam' | 'results' | 'profile' | 'settings' | 
    'assignments' | 'live_monitoring' | 'analytics' | 'class_management' | 'notifications'
  >('dashboard');
  
  const [userRole, setUserRole] = useState<'student' | 'teacher' | 'admin'>('student');
  
  // Exam state
  const [currentExam, setCurrentExam] = useState<ExamSession | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculator, setCalculator] = useState<CalculatorState>({
    display: '0',
    previousValue: 0,
    operation: null,
    waitingForNewValue: false,
    history: [],
    mode: 'basic',
    memory: 0
  });
  
  // Proctoring state
  const [proctoringActive, setProctoringActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [screenRecording, setScreenRecording] = useState(false);
  
  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'syncing'>('online');
  
  // References
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const examTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fetch user data and role
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/user'],
    enabled: isAuthenticated,
  });

  // Fetch assignments for students
  const { data: assignments } = useQuery({
    queryKey: ['/api/assignments'],
    enabled: isAuthenticated && userRole === 'student',
  });

  // Fetch classes for teachers
  const { data: classes } = useQuery({
    queryKey: ['/api/classes'],
    enabled: isAuthenticated && userRole === 'teacher',
  });

  // Fetch live exam sessions for teachers
  const { data: liveExams } = useQuery({
    queryKey: ['/api/live-exams'],
    enabled: isAuthenticated && userRole === 'teacher',
    refetchInterval: 5000, // Update every 5 seconds
  });

  // Set user role from userData
  useEffect(() => {
    if (userData?.role) {
      setUserRole(userData.role);
    }
  }, [userData]);

  // Mock data for development
  const mockQuizzes: Quiz[] = [
    {
      id: '1',
      title: 'Introduction to Biology',
      description: 'Basic concepts in biology and life sciences',
      duration: 45,
      questions: 20,
      status: 'available',
      maxScore: 100,
      attempts: 0,
      maxAttempts: 3,
      dueDate: '2025-01-15T23:59:59Z',
      allowCalculator: false,
      requiresProctoring: true,
      passingScore: 70,
      difficulty: 'medium',
      subject: 'Biology',
      tags: ['biology', 'science', 'intro']
    },
    {
      id: '2',
      title: 'Advanced Mathematics',
      description: 'Calculus and advanced mathematical concepts',
      duration: 90,
      questions: 15,
      status: 'available',
      maxScore: 150,
      attempts: 1,
      maxAttempts: 2,
      allowCalculator: true,
      calculatorType: 'scientific',
      requiresProctoring: true,
      passingScore: 80,
      difficulty: 'hard',
      subject: 'Mathematics',
      lastAttempt: {
        score: 85,
        completedAt: '2025-01-05T14:30:00Z',
        timeSpent: 75
      }
    },
    {
      id: '3',
      title: 'History Quiz',
      description: 'World War II and modern history',
      duration: 30,
      questions: 25,
      status: 'completed',
      score: 92,
      maxScore: 100,
      attempts: 1,
      maxAttempts: 1,
      requiresProctoring: false,
      difficulty: 'easy',
      subject: 'History'
    }
  ];

  const mockAssignments: Assignment[] = [
    {
      id: '1',
      title: 'Midterm Biology Exam',
      description: 'Comprehensive exam covering chapters 1-10',
      quiz: mockQuizzes[0],
      dueDate: new Date('2025-01-15T23:59:59Z'),
      availableFrom: new Date('2025-01-10T00:00:00Z'),
      availableUntil: new Date('2025-01-15T23:59:59Z'),
      assignedBy: 'Dr. Smith',
      status: 'available',
      priority: 'high',
      estimatedTime: 45,
      maxAttempts: 1,
      attemptsUsed: 0
    },
    {
      id: '2',
      title: 'Math Practice Test',
      quiz: mockQuizzes[1],
      dueDate: new Date('2025-01-12T17:00:00Z'),
      availableFrom: new Date('2025-01-08T00:00:00Z'),
      availableUntil: new Date('2025-01-12T17:00:00Z'),
      assignedBy: 'Prof. Johnson',
      status: 'upcoming',
      priority: 'medium',
      estimatedTime: 90,
      maxAttempts: 3,
      attemptsUsed: 1
    }
  ];

  // Camera and microphone setup
  const setupMediaDevices = useCallback(async () => {
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: true
      });
      
      setCameraStream(cameraStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = cameraStream;
      }
      
      setProctoringActive(true);
      
      toast({
        title: "Proctoring Started",
        description: "Camera and microphone are now active for exam monitoring.",
      });
      
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast({
        title: "Camera Access Error",
        description: "Please allow camera and microphone access for proctored exams.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Screen recording setup
  const startScreenRecording = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      setScreenRecording(true);
      
      toast({
        title: "Screen Recording Started",
        description: "Your screen is being recorded for exam security.",
      });
      
    } catch (error) {
      console.error('Error starting screen recording:', error);
      toast({
        title: "Screen Recording Error",
        description: "Screen recording is required for this exam.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Start exam function
  const startExam = useCallback(async (quiz: Quiz) => {
    try {
      // Setup proctoring if required
      if (quiz.requiresProctoring) {
        await setupMediaDevices();
        await startScreenRecording();
      }
      
      // Create exam session
      const examSession: ExamSession = {
        id: `exam_${Date.now()}`,
        quizId: quiz.id,
        startTime: new Date(),
        timeRemaining: quiz.duration * 60, // Convert to seconds
        currentQuestion: 0,
        totalQuestions: quiz.questions,
        answers: {},
        flaggedQuestions: [],
        proctoring: {
          cameraEnabled: quiz.requiresProctoring || false,
          micEnabled: quiz.requiresProctoring || false,
          screenRecording: quiz.requiresProctoring || false,
          violations: [],
          warnings: 0,
          maxWarnings: 3
        },
        status: 'in_progress',
        questions: [], // Will be loaded from API
        settings: {
          allowBackTracking: true,
          showQuestionNumbers: true,
          showProgress: true,
          randomizeQuestions: quiz.shuffleQuestions || false,
          randomizeOptions: false
        }
      };
      
      setCurrentExam(examSession);
      setCurrentView('exam');
      
      // Start exam timer
      examTimerRef.current = setInterval(() => {
        setCurrentExam(prev => {
          if (!prev) return null;
          
          const newTimeRemaining = prev.timeRemaining - 1;
          
          if (newTimeRemaining <= 0) {
            // Auto-submit exam
            submitExam(prev);
            return { ...prev, timeRemaining: 0, status: 'auto_submitted' };
          }
          
          return { ...prev, timeRemaining: newTimeRemaining };
        });
      }, 1000);
      
      toast({
        title: "Exam Started",
        description: `${quiz.title} has begun. Good luck!`,
      });
      
    } catch (error) {
      console.error('Error starting exam:', error);
      toast({
        title: "Error Starting Exam",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    }
  }, [setupMediaDevices, startScreenRecording, toast]);

  // Submit exam function
  const submitExam = useCallback(async (examSession: ExamSession) => {
    try {
      // Stop timer
      if (examTimerRef.current) {
        clearInterval(examTimerRef.current);
        examTimerRef.current = null;
      }
      
      // Stop media streams
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      
      if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
        setMicStream(null);
      }
      
      setProctoringActive(false);
      setScreenRecording(false);
      
      // Submit to server
      const response = await apiRequest('/api/quiz-attempts', {
        method: 'POST',
        body: JSON.stringify({
          quizId: examSession.quizId,
          answers: examSession.answers,
          timeSpent: (new Date().getTime() - examSession.startTime.getTime()) / 1000,
          violations: examSession.proctoring.violations
        })
      });
      
      setCurrentView('results');
      
      toast({
        title: "Exam Submitted",
        description: "Your exam has been submitted successfully.",
      });
      
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your exam. Please try again.",
        variant: "destructive"
      });
    }
  }, [cameraStream, micStream, toast]);

  // Calculator functions
  const handleCalculatorInput = useCallback((input: string) => {
    setCalculator(prev => {
      const newState = { ...prev };
      
      if (input === 'C') {
        return {
          ...newState,
          display: '0',
          previousValue: 0,
          operation: null,
          waitingForNewValue: false
        };
      }
      
      if (input === '=') {
        if (prev.operation && !prev.waitingForNewValue) {
          const current = parseFloat(prev.display);
          let result = 0;
          
          switch (prev.operation) {
            case '+':
              result = prev.previousValue + current;
              break;
            case '-':
              result = prev.previousValue - current;
              break;
            case '*':
              result = prev.previousValue * current;
              break;
            case '/':
              result = prev.previousValue / current;
              break;
          }
          
          return {
            ...newState,
            display: result.toString(),
            operation: null,
            waitingForNewValue: true,
            history: [...prev.history, `${prev.previousValue} ${prev.operation} ${current} = ${result}`]
          };
        }
      }
      
      if (['+', '-', '*', '/'].includes(input)) {
        return {
          ...newState,
          operation: input,
          previousValue: parseFloat(prev.display),
          waitingForNewValue: true
        };
      }
      
      // Number input
      if (prev.waitingForNewValue) {
        return {
          ...newState,
          display: input,
          waitingForNewValue: false
        };
      }
      
      return {
        ...newState,
        display: prev.display === '0' ? input : prev.display + input
      };
    });
  }, []);

  // Render functions for different views
  const renderLogin = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Book className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ProficiencyAI</h1>
          <p className="text-gray-600 mt-2">Sign in to continue your learning journey</p>
        </div>
        
        <Button 
          onClick={() => window.location.href = '/api/login'}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg rounded-xl"
        >
          Sign In with Replit
        </Button>
      </motion.div>
    </div>
  );

  const renderDashboard = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          <div className="text-center">
            <h1 className="font-semibold text-gray-900">Dashboard</h1>
            <p className="text-xs text-gray-500">Welcome back, {userData?.firstName || 'Student'}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNotificationsOpen(true)}
            >
              <Bell className="w-5 h-5" />
            </Button>
            
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'online' ? 'bg-green-500' : 
              connectionStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
            }`} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {userRole === 'student' ? (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Book className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">12</p>
                    <p className="text-sm text-gray-500">Completed</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">87%</p>
                    <p className="text-sm text-gray-500">Avg Score</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Upcoming Assignments */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Assignments</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView('assignments')}
                >
                  View All
                </Button>
              </div>
              
              <div className="space-y-3">
                {mockAssignments.slice(0, 3).map((assignment) => (
                  <Card key={assignment.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{assignment.description}</p>
                        <div className="flex items-center space-x-4 mt-3">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">{assignment.estimatedTime}min</span>
                          </div>
                          <Badge 
                            variant={assignment.priority === 'high' ? 'destructive' : 
                                    assignment.priority === 'medium' ? 'default' : 'secondary'}
                          >
                            {assignment.priority}
                          </Badge>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => startExam(assignment.quiz)}
                        disabled={assignment.status !== 'available'}
                      >
                        {assignment.status === 'available' ? 'Start' : 
                         assignment.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Completed History Quiz</p>
                    <p className="text-xs text-gray-500">Score: 92/100 • 2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Play className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Started Math Practice</p>
                    <p className="text-xs text-gray-500">First attempt • Yesterday</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Teacher Dashboard
          <>
            {/* Teacher Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">142</p>
                    <p className="text-sm text-gray-500">Students</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <MonitorSpeaker className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">3</p>
                    <p className="text-sm text-gray-500">Live Exams</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => setCurrentView('live_monitoring')}
                  className="h-16 bg-red-600 hover:bg-red-700"
                >
                  <div className="flex flex-col items-center">
                    <MonitorSpeaker className="w-6 h-6 mb-1" />
                    <span className="text-sm">Live Monitoring</span>
                  </div>
                </Button>
                
                <Button
                  onClick={() => setCurrentView('analytics')}
                  variant="outline"
                  className="h-16"
                >
                  <div className="flex flex-col items-center">
                    <BarChart3 className="w-6 h-6 mb-1" />
                    <span className="text-sm">Analytics</span>
                  </div>
                </Button>
              </div>
            </div>

            {/* Active Classes */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Classes</h2>
              <div className="space-y-3">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Biology 101</h3>
                      <p className="text-sm text-gray-500">32 students • 2 active exams</p>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Advanced Math</h3>
                      <p className="text-sm text-gray-500">28 students • 1 active exam</p>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderExam = () => {
    if (!currentExam) return null;

    const currentQuestion = currentExam.questions[currentExam.currentQuestion];
    const progress = ((currentExam.currentQuestion + 1) / currentExam.totalQuestions) * 100;
    const timeDisplay = Math.floor(currentExam.timeRemaining / 60) + ':' + 
                       (currentExam.timeRemaining % 60).toString().padStart(2, '0');

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Exam Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <div className="text-sm font-medium text-gray-900">
                Question {currentExam.currentQuestion + 1} of {currentExam.totalQuestions}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Timer className="w-4 h-4 text-gray-500" />
                <span className={`text-sm font-mono ${
                  currentExam.timeRemaining < 300 ? 'text-red-600' : 'text-gray-700'
                }`}>
                  {timeDisplay}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCalculator(!showCalculator)}
                className={currentExam.proctoring.cameraEnabled ? 'hidden' : ''}
              >
                <Calculator className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="px-4 pb-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Proctoring Status */}
        {currentExam.proctoring.cameraEnabled && (
          <div className="bg-red-50 border-b border-red-200 p-3">
            <div className="flex items-center justify-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-700">Proctoring Active</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Camera className="w-4 h-4 text-red-600" />
                <Mic className="w-4 h-4 text-red-600" />
                <MonitorSpeaker className="w-4 h-4 text-red-600" />
              </div>
            </div>
          </div>
        )}

        {/* Question Content */}
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Question {currentExam.currentQuestion + 1}
            </h2>
            
            <div className="text-gray-700 mb-6">
              {/* Mock question content */}
              <p>Which of the following best describes the process of photosynthesis?</p>
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {['A) The process by which plants convert sunlight into energy',
                'B) The breakdown of glucose in plant cells',
                'C) The transport of water through plant stems',
                'D) The reproduction process in flowering plants'].map((option, index) => (
                <label key={index} className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="answer"
                    value={option.charAt(0)}
                    className="mt-1"
                    onChange={(e) => {
                      setCurrentExam(prev => prev ? {
                        ...prev,
                        answers: {
                          ...prev.answers,
                          [currentExam.currentQuestion]: e.target.value
                        }
                      } : null);
                    }}
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentExam(prev => prev ? {
                  ...prev,
                  currentQuestion: Math.max(0, prev.currentQuestion - 1)
                } : null);
              }}
              disabled={currentExam.currentQuestion === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setCurrentExam(prev => prev ? {
                    ...prev,
                    flaggedQuestions: prev.flaggedQuestions.includes(prev.currentQuestion.toString()) 
                      ? prev.flaggedQuestions.filter(q => q !== prev.currentQuestion.toString())
                      : [...prev.flaggedQuestions, prev.currentQuestion.toString()]
                  } : null);
                }}
              >
                <Flag className={`w-4 h-4 ${
                  currentExam.flaggedQuestions.includes(currentExam.currentQuestion.toString()) 
                    ? 'text-yellow-500' : 'text-gray-400'
                }`} />
              </Button>

              {currentExam.currentQuestion === currentExam.totalQuestions - 1 ? (
                <Button
                  onClick={() => submitExam(currentExam)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Submit Exam
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setCurrentExam(prev => prev ? {
                      ...prev,
                      currentQuestion: Math.min(prev.totalQuestions - 1, prev.currentQuestion + 1)
                    } : null);
                  }}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Hidden camera feed for proctoring */}
        {proctoringActive && (
          <video
            ref={videoRef}
            autoPlay
            muted
            className="fixed bottom-4 right-4 w-32 h-24 border rounded-lg bg-black"
          />
        )}

        {/* Calculator Modal */}
        {showCalculator && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 m-4 w-full max-w-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Calculator</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCalculator(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-100 p-3 rounded-lg text-right font-mono text-lg">
                  {calculator.display}
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  {['C', '±', '%', '÷',
                    '7', '8', '9', '×',
                    '4', '5', '6', '-',
                    '1', '2', '3', '+',
                    '0', '.', '='].map((btn) => (
                    <Button
                      key={btn}
                      variant={['C', '±', '%', '÷', '×', '-', '+', '='].includes(btn) ? 'default' : 'outline'}
                      className={btn === '0' ? 'col-span-2' : ''}
                      onClick={() => handleCalculatorInput(btn === '×' ? '*' : btn === '÷' ? '/' : btn)}
                    >
                      {btn}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLiveMonitoring = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('dashboard')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="font-semibold text-gray-900">Live Monitoring</h1>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-red-600">Live</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Active Exams Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">12</p>
            <p className="text-sm text-gray-500">Active Students</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">3</p>
            <p className="text-sm text-gray-500">Flagged</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">1</p>
            <p className="text-sm text-gray-500">Violations</p>
          </Card>
        </div>

        {/* Student List */}
        <div className="space-y-3">
          {[
            { name: 'Alice Johnson', status: 'active', progress: 75, violations: 0, time: '32:45' },
            { name: 'Bob Smith', status: 'flagged', progress: 45, violations: 2, time: '28:12' },
            { name: 'Carol Davis', status: 'active', progress: 90, violations: 0, time: '35:30' },
            { name: 'David Wilson', status: 'violation', progress: 35, violations: 3, time: '25:08' }
          ].map((student, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-gray-500">{student.progress}% complete</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">{student.time}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {student.violations > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {student.violations} violations
                    </Badge>
                  )}
                  <div className={`w-3 h-3 rounded-full ${
                    student.status === 'active' ? 'bg-green-500' :
                    student.status === 'flagged' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                </div>
              </div>
              
              <div className="mt-3">
                <Progress value={student.progress} className="h-2" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  // Sidebar component
  const renderSidebar = () => (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={userData?.profileImageUrl} />
              <AvatarFallback>
                {userData?.firstName?.[0]}{userData?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{userData?.firstName} {userData?.lastName}</p>
              <p className="text-sm text-gray-500 capitalize">{userRole}</p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-8 space-y-4">
          <Button
            variant={currentView === 'dashboard' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => {
              setCurrentView('dashboard');
              setSidebarOpen(false);
            }}
          >
            <Home className="w-4 h-4 mr-3" />
            Dashboard
          </Button>

          {userRole === 'student' ? (
            <>
              <Button
                variant={currentView === 'assignments' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setCurrentView('assignments');
                  setSidebarOpen(false);
                }}
              >
                <Book className="w-4 h-4 mr-3" />
                Assignments
              </Button>

              <Button
                variant={currentView === 'quiz_list' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setCurrentView('quiz_list');
                  setSidebarOpen(false);
                }}
              >
                <FileText className="w-4 h-4 mr-3" />
                Practice Quizzes
              </Button>
            </>
          ) : (
            <>
              <Button
                variant={currentView === 'live_monitoring' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setCurrentView('live_monitoring');
                  setSidebarOpen(false);
                }}
              >
                <MonitorSpeaker className="w-4 h-4 mr-3" />
                Live Monitoring
              </Button>

              <Button
                variant={currentView === 'analytics' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setCurrentView('analytics');
                  setSidebarOpen(false);
                }}
              >
                <BarChart3 className="w-4 h-4 mr-3" />
                Analytics
              </Button>

              <Button
                variant={currentView === 'class_management' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setCurrentView('class_management');
                  setSidebarOpen(false);
                }}
              >
                <Users className="w-4 h-4 mr-3" />
                Class Management
              </Button>
            </>
          )}

          <Separator />

          <Button
            variant={currentView === 'profile' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => {
              setCurrentView('profile');
              setSidebarOpen(false);
            }}
          >
            <User className="w-4 h-4 mr-3" />
            Profile
          </Button>

          <Button
            variant={currentView === 'settings' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => {
              setCurrentView('settings');
              setSidebarOpen(false);
            }}
          >
            <Settings className="w-4 h-4 mr-3" />
            Settings
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-red-600"
            onClick={() => window.location.href = '/api/logout'}
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );

  // Main render logic
  if (!isAuthenticated) {
    return renderLogin();
  }

  return (
    <div className="mobile-app">
      {currentView === 'dashboard' && renderDashboard()}
      {currentView === 'exam' && renderExam()}
      {currentView === 'live_monitoring' && renderLiveMonitoring()}
      
      {renderSidebar()}
      
      {/* Add other view renderers as needed */}
    </div>
  );
}