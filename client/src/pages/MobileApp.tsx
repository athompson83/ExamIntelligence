import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
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
  ChevronRight,
  Smartphone,
  Monitor
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

// Cross-platform media capture optimization
const getOptimalMediaConstraints = (device: any, quality: 'low' | 'medium' | 'high') => {
  const constraints: any = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: quality === 'high' ? 48000 : quality === 'medium' ? 44100 : 22050
    },
    video: {
      facingMode: 'user',
      width: { ideal: quality === 'high' ? 1280 : quality === 'medium' ? 640 : 320 },
      height: { ideal: quality === 'high' ? 720 : quality === 'medium' ? 480 : 240 },
      frameRate: { ideal: quality === 'high' ? 30 : quality === 'medium' ? 24 : 15 }
    }
  };

  // Device-specific optimizations
  if (device.isIOS) {
    // iOS Safari optimizations
    constraints.video.width = { max: quality === 'high' ? 1280 : quality === 'medium' ? 640 : 320 };
    constraints.video.height = { max: quality === 'high' ? 720 : quality === 'medium' ? 480 : 240 };
    constraints.video.frameRate = { max: 30 };
  } else if (device.isAndroid) {
    // Android Chrome optimizations
    constraints.video.aspectRatio = 16/9;
  } else if (device.isDesktop) {
    // Desktop optimizations - higher quality possible
    if (quality === 'high') {
      constraints.video.width = { ideal: 1920 };
      constraints.video.height = { ideal: 1080 };
    }
  }

  // Low-end device detection and adjustments
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
    constraints.video.frameRate = { max: 15 };
    constraints.video.width = { max: 480 };
    constraints.video.height = { max: 360 };
  }

  return constraints;
};

const getOptimalScreenShareConstraints = (device: any, quality: 'low' | 'medium' | 'high') => {
  const constraints: any = {
    video: {
      width: { ideal: quality === 'high' ? 1920 : quality === 'medium' ? 1280 : 640 },
      height: { ideal: quality === 'high' ? 1080 : quality === 'medium' ? 720 : 480 },
      frameRate: { ideal: quality === 'high' ? 15 : quality === 'medium' ? 10 : 5 }
    },
    audio: false // Usually no audio for screen share
  };

  // Mobile devices - reduce quality for performance
  if (device.isMobile) {
    constraints.video.width = { max: 720 };
    constraints.video.height = { max: 480 };
    constraints.video.frameRate = { max: 5 };
  }

  return constraints;
};

const detectMediaCapabilities = async () => {
  const capabilities: any = {
    camera: false,
    microphone: false,
    screenShare: false,
    supportedResolutions: [],
    supportedFrameRates: [],
    audioContextSupported: false
  };

  try {
    // Check basic media device availability
    const devices = await navigator.mediaDevices.enumerateDevices();
    capabilities.camera = devices.some(device => device.kind === 'videoinput');
    capabilities.microphone = devices.some(device => device.kind === 'audioinput');
    
    // Check screen share support
    capabilities.screenShare = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
    
    // Check audio context support
    capabilities.audioContextSupported = !!(window.AudioContext || (window as any).webkitAudioContext);
    
    // Test resolution capabilities
    if (capabilities.camera) {
      const resolutions = [
        { width: 320, height: 240 },
        { width: 640, height: 480 },
        { width: 1280, height: 720 },
        { width: 1920, height: 1080 }
      ];
      
      for (const res of resolutions) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { exact: res.width }, height: { exact: res.height } }
          });
          capabilities.supportedResolutions.push(res);
          stream.getTracks().forEach(track => track.stop());
        } catch (e) {
          // Resolution not supported
        }
      }
    }
    
  } catch (error) {
    console.error('Error detecting media capabilities:', error);
  }

  return capabilities;
};

// Enhanced device detection functions
const detectDevice = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isAndroid = /android/.test(userAgent);
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isMobile = isAndroid || isIOS;
  const isSmartphone = isMobile && !/ipad/.test(userAgent);
  const isTablet = (isMobile && /ipad/.test(userAgent)) || 
                   (isAndroid && !/mobile/.test(userAgent)) ||
                   (window.innerWidth >= 768 && window.innerWidth <= 1024);
  const isDesktop = !isMobile || window.innerWidth > 1024;
  
  // Screen size detection
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const isLandscape = screenWidth > screenHeight;
  const isPortrait = screenHeight >= screenWidth;
  
  return {
    isMobile,
    isSmartphone,
    isTablet,
    isAndroid,
    isIOS,
    isDesktop,
    isLandscape,
    isPortrait,
    screenWidth,
    screenHeight,
    userAgent,
    // Breakpoint helpers
    isSm: screenWidth >= 640,
    isMd: screenWidth >= 768,
    isLg: screenWidth >= 1024,
    isXl: screenWidth >= 1280,
    is2Xl: screenWidth >= 1536
  };
};

// App store detection
const getAppStoreUrls = () => ({
  ios: 'https://apps.apple.com/app/proficiencyai/id123456789', // Replace with actual App Store URL
  android: 'https://play.google.com/store/apps/details?id=com.proficiencyai.app', // Replace with actual Play Store URL
  nativeAppScheme: 'proficiencyai://', // Deep link to open native app
});

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

export default function MobileApp() {
  const queryClient = useQueryClient();
  
  // Device detection with responsive updates
  const [device, setDevice] = useState(detectDevice());
  const appStoreUrls = getAppStoreUrls();
  
  // Initialize media capabilities detection
  useEffect(() => {
    const initCapabilities = async () => {
      const capabilities = await detectMediaCapabilities();
      setCaptureCapabilities(capabilities);
      
      // Auto-adjust quality based on device capabilities
      if (device.isMobile || capabilities.supportedResolutions.length <= 2) {
        setMediaQuality('low');
      } else if (device.isDesktop && capabilities.supportedResolutions.length >= 3) {
        setMediaQuality('high');
      }
    };
    initCapabilities();
  }, [device]);
  
  // Update device info on window resize
  useEffect(() => {
    const handleResize = () => {
      setDevice(detectDevice());
    };
    
    const handleOrientationChange = () => {
      // Small delay to allow for orientation change to complete
      setTimeout(() => {
        setDevice(detectDevice());
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);
  
  // State management
  const [currentView, setCurrentView] = useState<'dashboard' | 'assignments' | 'catExams' | 'exam' | 'results' | 'profile' | 'settings'>('dashboard');
  const [showAppDownload, setShowAppDownload] = useState(device.isSmartphone);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [examSession, setExamSession] = useState<ExamSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examResult, setExamResult] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);
  const [mediaQuality, setMediaQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [captureCapabilities, setCaptureCapabilities] = useState<any>(null);
  const [mediaPerformance, setMediaPerformance] = useState<any>({
    fps: 0,
    bandwidth: 0,
    latency: 0,
    droppedFrames: 0
  });
  const [violations, setViolations] = useState<any[]>([]);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorState, setCalculatorState] = useState<CalculatorState>({
    display: '0',
    previousValue: 0,
    operator: '',
    waitingForNewValue: false,
    memory: 0,
    history: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [examStartTime, setExamStartTime] = useState<Date | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // API queries
  const { data: dashboardStats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/mobile/dashboard/stats'],
    retry: false,
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<Quiz[]>({
    queryKey: ['/api/mobile/assignments'],
    retry: false,
  });

  const { data: catExams = [], isLoading: catExamsLoading } = useQuery<Quiz[]>({
    queryKey: ['/api/cat-exams'],
    retry: false,
  });

  const { data: profile, isLoading: profileLoading } = useQuery<StudentProfile>({
    queryKey: ['/api/mobile/student/profile'],
    retry: false,
  });

  // App store functions
  const tryNativeAppOpen = useCallback(() => {
    if (!device.isSmartphone) return false;
    
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = appStoreUrls.nativeAppScheme;
    document.body.appendChild(iframe);
    
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
    
    return true;
  }, [device.isSmartphone, appStoreUrls.nativeAppScheme]);

  const openAppStore = useCallback(() => {
    if (device.isIOS) {
      window.open(appStoreUrls.ios, '_blank');
    } else if (device.isAndroid) {
      window.open(appStoreUrls.android, '_blank');
    }
  }, [device.isIOS, device.isAndroid, appStoreUrls]);

  // Mutations
  const startAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return await apiRequest(`/api/mobile/assignment/${assignmentId}/start`, {
        method: 'POST',
      });
    },
    onSuccess: async (data: any) => {
      setExamSession(data);
      setExamStartTime(new Date());
      setTimeRemaining(data.timeRemaining || selectedQuiz?.timeLimit * 60 || 3600);
      
      // Load exam questions using the assignment ID
      try {
        const questionsResponse = await apiRequest(`/api/mobile/assignment/${selectedQuiz?.id}/questions`);
        setExamQuestions(Array.isArray(questionsResponse) ? questionsResponse : []);
        setCurrentQuestionIndex(0);
        setResponses({});
      } catch (error) {
        console.error('Error loading exam questions:', error);
        setExamQuestions([]);
      }
      
      setCurrentView('exam');
      initializeProctoring();
    },
  });

  const submitAssignmentMutation = useMutation({
    mutationFn: async ({ sessionId, responses, timeSpent }: { sessionId: string; responses: Record<string, string>; timeSpent: number }) => {
      return await apiRequest(`/api/mobile/session/${sessionId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ responses, timeSpent }),
      });
    },
    onSuccess: (data) => {
      setExamResult(data);
      setCurrentView('results');
      cleanup();
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
            handleExamSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [examSession, timeRemaining]);

  // Adaptive quality management
  const adaptMediaQuality = useCallback(async () => {
    if (!captureCapabilities) return;
    
    // Monitor performance and adapt quality
    const connectionType = (navigator as any).connection?.effectiveType;
    const batteryLevel = (navigator as any).getBattery ? await (navigator as any).getBattery() : null;
    
    let newQuality = mediaQuality;
    
    // Adapt based on connection speed with bandwidth optimization
    const bandwidthOptimization = optimizeBandwidth(connectionType || '3g');
    newQuality = bandwidthOptimization.quality;
    
    // Adapt based on battery level (mobile only)
    if (batteryLevel && batteryLevel.level < 0.2 && device.isMobile) {
      newQuality = 'low';
    }
    
    // Adapt based on device performance
    if (navigator.hardwareConcurrency <= 2) {
      newQuality = 'low';
    }
    
    if (newQuality !== mediaQuality) {
      setMediaQuality(newQuality);
      // Restart media streams with new quality if active
      if (cameraEnabled || screenShareEnabled) {
        await restartMediaStreams(newQuality);
      }
    }
  }, [captureCapabilities, mediaQuality, device, cameraEnabled, screenShareEnabled]);

  const restartMediaStreams = useCallback(async (quality: 'low' | 'medium' | 'high') => {
    // Stop current streams
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Restart with new quality
    if (cameraEnabled) {
      await initializeCameraWithFallback(quality);
    }
    if (screenShareEnabled) {
      await initializeScreenShare(quality);
    }
  }, [cameraEnabled, screenShareEnabled]);

  const initializeCameraWithFallback = useCallback(async (quality?: 'low' | 'medium' | 'high') => {
    const currentQuality = quality || mediaQuality;
    const constraints = getOptimalMediaConstraints(device, currentQuality);
    
    // Progressive fallback strategy
    const fallbackConstraints = [
      constraints, // Original optimal constraints
      getOptimalMediaConstraints(device, 'medium'), // Medium quality fallback
      getOptimalMediaConstraints(device, 'low'), // Low quality fallback
      { video: true, audio: true }, // Basic constraints
      { video: { width: 320, height: 240 }, audio: true }, // Minimal constraints
    ];
    
    for (const constraint of fallbackConstraints) {
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia(constraint);
        
        if (videoRef.current) {
          videoRef.current.srcObject = cameraStream;
          videoRef.current.muted = true; // Mute to prevent audio feedback
          videoRef.current.playsInline = true; // Important for mobile
          try {
            await videoRef.current.play();
          } catch (playError) {
            console.warn('Video play failed:', playError);
            // Try again with user interaction
            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.play().catch(console.warn);
              }
            }, 1000);
          }
        }
        
        mediaStreamRef.current = cameraStream;
        setCameraEnabled(true);
        setMicEnabled(true);
        
        // Log successful constraint
        console.log('Camera initialized with constraints:', constraint);
        return;
        
      } catch (error) {
        console.warn('Failed with constraint:', constraint, error);
        continue;
      }
    }
    
    // All fallbacks failed
    throw new Error('Unable to initialize camera with any constraints');
  }, [device, mediaQuality]);

  // Proctoring functions
  const initializeProctoring = useCallback(async () => {
    if (!selectedQuiz?.proctoringEnabled) return;

    try {
      // Initialize camera with adaptive quality
      await initializeCameraWithFallback();
      
      // Initialize screen sharing with delay to avoid overwhelming the system
      setTimeout(async () => {
        try {
          await initializeScreenShare();
        } catch (screenError) {
          console.warn('Screen sharing initialization failed:', screenError);
        }
      }, 1000);
      
      // Start monitoring
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleWindowBlur);
      window.addEventListener('focus', handleWindowFocus);
      
      // Start adaptive quality monitoring
      const qualityInterval = setInterval(adaptMediaQuality, 30000); // Check every 30 seconds
      
      // Start performance monitoring
      const performanceInterval = setInterval(monitorMediaPerformance, 5000); // Check every 5 seconds
      
      // Cleanup intervals on unmount
      return () => {
        clearInterval(qualityInterval);
        clearInterval(performanceInterval);
      };
      
    } catch (error) {
      console.error('Error accessing camera/microphone:', error);
      addViolation('media_access_denied', 'Failed to access camera/microphone');
    }
  }, [selectedQuiz, initializeCameraWithFallback, adaptMediaQuality]);

  // Performance monitoring
  const monitorMediaPerformance = useCallback(async () => {
    if (!mediaStreamRef.current && !screenStreamRef.current) return;

    try {
      const performance: any = {
        fps: 0,
        bandwidth: 0,
        latency: 0,
        droppedFrames: 0,
        timestamp: Date.now()
      };

      // Monitor camera stream performance
      if (mediaStreamRef.current) {
        const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
        if (videoTrack && videoTrack.getSettings) {
          const settings = videoTrack.getSettings();
          performance.fps = settings.frameRate || 24;
          performance.bandwidth = settings.width * settings.height * performance.fps * 0.1; // Estimate
        }
      }

      // Monitor screen share performance
      if (screenStreamRef.current) {
        const screenTrack = screenStreamRef.current.getVideoTracks()[0];
        if (screenTrack && screenTrack.getSettings) {
          const settings = screenTrack.getSettings();
          performance.screenFps = settings.frameRate || 15;
          performance.screenBandwidth = settings.width * settings.height * performance.screenFps * 0.1; // Estimate
        }
      }

      // Network latency estimation
      const startTime = performance.now ? performance.now() : Date.now();
      try {
        await fetch('/api/ping', { method: 'HEAD' });
        const endTime = performance.now ? performance.now() : Date.now();
        performance.latency = endTime - startTime;
      } catch (e) {
        performance.latency = 999; // High latency indicator
      }

      setMediaPerformance(performance);

      // Auto-adapt quality based on performance
      if (performance.fps < 10 && mediaQuality !== 'low') {
        console.log('Low FPS detected, reducing quality');
        setMediaQuality('low');
        await restartMediaStreams('low');
      } else if (performance.latency > 500 && mediaQuality === 'high') {
        console.log('High latency detected, reducing quality');
        setMediaQuality('medium');
        await restartMediaStreams('medium');
      }

    } catch (error) {
      console.warn('Performance monitoring error:', error);
    }
  }, [mediaQuality, restartMediaStreams]);

  // Bandwidth optimization
  const optimizeBandwidth = useCallback((connectionType: string) => {
    const optimizations: any = {
      'slow-2g': { quality: 'low', maxBitrate: 50000 },
      '2g': { quality: 'low', maxBitrate: 100000 },
      '3g': { quality: 'medium', maxBitrate: 300000 },
      '4g': { quality: 'high', maxBitrate: 1000000 },
      '5g': { quality: 'high', maxBitrate: 2000000 },
    };

    const optimization = optimizations[connectionType] || optimizations['3g'];
    
    if (optimization.quality !== mediaQuality) {
      setMediaQuality(optimization.quality);
      restartMediaStreams(optimization.quality);
    }

    return optimization;
  }, [mediaQuality, restartMediaStreams]);

  const initializeScreenShare = useCallback(async (quality?: 'low' | 'medium' | 'high') => {
    try {
      const currentQuality = quality || mediaQuality;
      const constraints = getOptimalScreenShareConstraints(device, currentQuality);
      
      const screenStream = await navigator.mediaDevices.getDisplayMedia(constraints);
      
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = screenStream;
        screenVideoRef.current.muted = true; // Screen share should be muted
        screenVideoRef.current.playsInline = true; // Important for mobile
        try {
          await screenVideoRef.current.play();
        } catch (playError) {
          console.warn('Screen video play failed:', playError);
          // Try again with user interaction
          setTimeout(() => {
            if (screenVideoRef.current) {
              screenVideoRef.current.play().catch(console.warn);
            }
          }, 1000);
        }
      }
      
      screenStreamRef.current = screenStream;
      setScreenShareEnabled(true);
      
      // Handle screen share ending
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        setScreenShareEnabled(false);
        addViolation('screen_share_ended', 'Screen sharing was stopped by user');
      });
      
      // Monitor screen share performance
      const track = screenStream.getVideoTracks()[0];
      if (track.getSettings) {
        const settings = track.getSettings();
        console.log('Screen share initialized with settings:', settings);
      }
      
    } catch (error) {
      console.error('Error accessing screen share:', error);
      addViolation('screen_share_denied', 'Failed to access screen sharing');
    }
  }, [device, mediaQuality]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      addViolation('tab_switch', 'Student switched tabs or minimized window');
    }
  }, []);

  const handleWindowBlur = useCallback(() => {
    addViolation('window_blur', 'Window lost focus');
  }, []);

  const handleWindowFocus = useCallback(() => {
    // Window regained focus
  }, []);

  const addViolation = useCallback((type: string, description: string) => {
    const violation = {
      id: Date.now().toString(),
      type,
      description,
      timestamp: new Date().toISOString(),
      severity: type === 'tab_switch' ? 'high' : 'medium'
    };
    setViolations(prev => [...prev, violation]);
  }, []);

  const cleanup = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('blur', handleWindowBlur);
    window.removeEventListener('focus', handleWindowFocus);
    
    setCameraEnabled(false);
    setMicEnabled(false);
    setScreenShareEnabled(false);
  }, []);

  // Calculator functions
  const handleCalculatorInput = useCallback((input: string) => {
    const { display, previousValue, operator, waitingForNewValue, memory, history } = calculatorState;
    
    if (input === 'C') {
      setCalculatorState({
        display: '0',
        previousValue: 0,
        operator: '',
        waitingForNewValue: false,
        memory: 0,
        history: []
      });
      return;
    }
    
    if (input === 'CE') {
      setCalculatorState(prev => ({
        ...prev,
        display: '0',
        waitingForNewValue: false
      }));
      return;
    }
    
    if (['+', '-', '*', '/'].includes(input)) {
      const currentValue = parseFloat(display);
      
      if (operator && !waitingForNewValue) {
        const result = calculate(previousValue, currentValue, operator);
        setCalculatorState(prev => ({
          ...prev,
          display: result.toString(),
          previousValue: result,
          operator: input,
          waitingForNewValue: true,
          history: [...prev.history, `${previousValue} ${operator} ${currentValue} = ${result}`]
        }));
      } else {
        setCalculatorState(prev => ({
          ...prev,
          previousValue: currentValue,
          operator: input,
          waitingForNewValue: true
        }));
      }
      return;
    }
    
    if (input === '=') {
      if (operator) {
        const currentValue = parseFloat(display);
        const result = calculate(previousValue, currentValue, operator);
        setCalculatorState(prev => ({
          ...prev,
          display: result.toString(),
          previousValue: result,
          operator: '',
          waitingForNewValue: true,
          history: [...prev.history, `${previousValue} ${operator} ${currentValue} = ${result}`]
        }));
      }
      return;
    }
    
    if (input === '.') {
      if (display.indexOf('.') === -1) {
        setCalculatorState(prev => ({
          ...prev,
          display: waitingForNewValue ? '0.' : display + '.',
          waitingForNewValue: false
        }));
      }
      return;
    }
    
    // Number input
    if (waitingForNewValue) {
      setCalculatorState(prev => ({
        ...prev,
        display: input,
        waitingForNewValue: false
      }));
    } else {
      setCalculatorState(prev => ({
        ...prev,
        display: display === '0' ? input : display + input
      }));
    }
  }, [calculatorState]);

  const calculate = (a: number, b: number, operator: string): number => {
    switch (operator) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return a / b;
      default: return b;
    }
  };

  // Exam functions
  const startExam = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    startAssignmentMutation.mutate(quiz.id);
  };

  const handleExamSubmit = useCallback(() => {
    if (!examSession || !examStartTime) return;
    
    const timeSpent = Math.floor((Date.now() - examStartTime.getTime()) / 1000);
    
    submitAssignmentMutation.mutate({
      sessionId: examSession.id,
      responses,
      timeSpent
    });
  }, [examSession, examStartTime, responses]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < examQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
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

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'bg-green-100 text-green-800';
    if (difficulty <= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getDifficultyText = (difficulty: number) => {
    if (difficulty <= 2) return 'Easy';
    if (difficulty <= 4) return 'Medium';
    return 'Hard';
  };

  const filteredAssignments = assignments.filter((assignment: Quiz) => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || assignment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Render functions
  const renderDashboard = () => (
    <div className="min-h-screen bg-gray-50">
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

      {/* Stats Cards */}
      <div className="p-4 space-y-4">
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
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Deadlines</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {dashboardStats?.upcomingDeadlines || 0}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600" />
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
            <div className="space-y-3">
              {dashboardStats?.recentActivity?.map((activity: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                    <p className="text-sm text-gray-600">{activity.questionCount} questions</p>
                  </div>
                  <Badge variant="secondary">{activity.status}</Badge>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="grid grid-cols-5 gap-1">
          <Button
            variant={currentView === 'dashboard' ? 'default' : 'ghost'}
            className="h-16 flex-col rounded-none"
            onClick={() => setCurrentView('dashboard')}
          >
            <Home className="h-5 w-5 mb-1" />
            <span className="text-xs">Dashboard</span>
          </Button>
          <Button
            variant={currentView === 'assignments' ? 'default' : 'ghost'}
            className="h-16 flex-col rounded-none"
            onClick={() => setCurrentView('assignments')}
          >
            <FileText className="h-5 w-5 mb-1" />
            <span className="text-xs">Assignments</span>
          </Button>
          <Button
            variant={currentView === 'catExams' ? 'default' : 'ghost'}
            className="h-16 flex-col rounded-none"
            onClick={() => setCurrentView('catExams')}
          >
            <Target className="h-5 w-5 mb-1" />
            <span className="text-xs">CAT Exams</span>
          </Button>
          <Button
            variant={currentView === 'profile' ? 'default' : 'ghost'}
            className="h-16 flex-col rounded-none"
            onClick={() => setCurrentView('profile')}
          >
            <User className="h-5 w-5 mb-1" />
            <span className="text-xs">Profile</span>
          </Button>
          <Button
            variant={currentView === 'settings' ? 'default' : 'ghost'}
            className="h-16 flex-col rounded-none"
            onClick={() => setCurrentView('settings')}
          >
            <Settings className="h-5 w-5 mb-1" />
            <span className="text-xs">Settings</span>
          </Button>
        </div>
      </div>
    </div>
  );

  const renderAssignments = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Assignments</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Search and Filters */}
          <div className="mt-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {showFilters && (
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignments</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Assignment List */}
      <div className="p-4 space-y-4">
        {assignmentsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
        {/* Responsive Header */}
        <div className="bg-gray-900 text-white p-3 sm:p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-lg lg:text-xl font-semibold truncate">{selectedQuiz.title}</h1>
                <p className="text-xs sm:text-sm text-gray-300 mt-1">
                  Question {currentQuestionIndex + 1} of {examQuestions.length}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg sm:text-xl lg:text-2xl font-mono">
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-xs text-gray-300">Time remaining</div>
              </div>
            </div>
            
            <div className="mt-3 sm:mt-4">
              <Progress value={progress} className="h-2 sm:h-3" />
            </div>
          </div>
        </div>

        {/* Responsive Proctoring Status */}
        {selectedQuiz.proctoringEnabled && (
          <div className="bg-yellow-50 border-b border-yellow-200 p-3 sm:p-4 lg:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                  <span className="text-sm sm:text-base font-medium text-yellow-800">
                    Proctoring Active
                  </span>
                </div>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <Camera className={`h-4 w-4 sm:h-5 sm:w-5 ${cameraEnabled ? 'text-green-600' : 'text-red-600'}`} />
                    <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">Camera</span>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    {micEnabled ? (
                      <Mic className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    ) : (
                      <MicOff className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                    )}
                    <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">Mic</span>
                  </div>
                </div>
              </div>
              
              {violations.length > 0 && (
                <div className="mt-3 sm:mt-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm sm:text-base">
                      {violations.length} violation(s) detected. Please follow exam protocols.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Responsive Question Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="lg:flex lg:gap-8 lg:p-6">
              {/* Main Question Area */}
              <div className="lg:flex-1 p-4 sm:p-6 lg:p-0">
                {currentQuestion ? (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-gray-50 p-4 sm:p-6 lg:p-8 rounded-lg sm:rounded-xl">
                      <h2 className="text-base sm:text-lg lg:text-xl font-medium mb-4 sm:mb-6 leading-relaxed">
                        {currentQuestion.questionText}
                      </h2>
                      
                      {currentQuestion.type === 'multiple_choice' && (
                        <div className="space-y-3 sm:space-y-4">
                          {currentQuestion.options?.map((option, index) => (
                            <label 
                              key={index} 
                              className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 lg:p-5 bg-white rounded-lg sm:rounded-xl border-2 hover:bg-gray-50 hover:border-blue-200 cursor-pointer transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500"
                            >
                              <input
                                type="radio"
                                name={`question-${currentQuestion.id}`}
                                value={option}
                                checked={responses[currentQuestion.id] === option}
                                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0"
                              />
                              <span className="text-sm sm:text-base lg:text-lg leading-relaxed flex-1">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}
                
                {currentQuestion.type === 'true_false' && (
                  <div className="space-y-3">
                    {['True', 'False'].map((option) => (
                      <label key={option} className="flex items-center space-x-3 p-3 bg-white rounded-lg border hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={option}
                          checked={responses[currentQuestion.id] === option}
                          onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                )}
                
                {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'essay') && (
                  <textarea
                    value={responses[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    placeholder="Enter your answer..."
                    className="w-full p-3 border rounded-lg resize-none"
                    rows={currentQuestion.type === 'essay' ? 6 : 3}
                  />
                )}
              </div>
              
              {currentQuestion.points && (
                <div className="text-sm text-gray-600">
                  Points: {currentQuestion.points}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading question...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>

        {/* Responsive Navigation */}
        <div className="border-t bg-white p-3 sm:p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Mobile Navigation - Stacked Layout */}
            <div className="lg:hidden space-y-3">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={previousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="flex-1 mr-2"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                {currentQuestionIndex < examQuestions.length - 1 ? (
                  <Button onClick={nextQuestion} className="flex-1 ml-2">
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={handleExamSubmit} className="bg-green-600 hover:bg-green-700 flex-1 ml-2">
                    Finish Exam
                  </Button>
                )}
              </div>
              
              <div className="flex items-center justify-center space-x-2">
                {selectedQuiz.allowCalculator && (
                  <Button
                    variant="outline"
                    onClick={() => setShowCalculator(true)}
                    size="sm"
                  >
                    <Calculator className="h-4 w-4 mr-1" />
                    Calculator
                  </Button>
                )}
                
                {selectedQuiz.proctoringEnabled && !screenShareEnabled && (
                  <Button
                    variant="outline"
                    onClick={() => initializeScreenShare()}
                    size="sm"
                    className="bg-blue-50 text-blue-600 hover:bg-blue-100"
                  >
                    <Monitor className="h-4 w-4 mr-1" />
                    Share Screen
                  </Button>
                )}
                
                {selectedQuiz.proctoringEnabled && (
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMediaQuality(mediaQuality === 'high' ? 'medium' : mediaQuality === 'medium' ? 'low' : 'high')}
                      className="text-xs"
                    >
                      Quality: {mediaQuality.toUpperCase()}
                    </Button>
                  </div>
                )}
                
                <Button
                  variant="outline"
                  onClick={handleExamSubmit}
                  className="bg-red-50 text-red-600 hover:bg-red-100"
                  size="sm"
                >
                  Submit Exam
                </Button>
              </div>
            </div>

            {/* Desktop Navigation - Single Row Layout */}
            <div className="hidden lg:flex items-center justify-between">
              <Button
                variant="outline"
                onClick={previousQuestion}
                disabled={currentQuestionIndex === 0}
                size="lg"
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Previous
              </Button>
              
              <div className="flex items-center space-x-4">
                {selectedQuiz.allowCalculator && (
                  <Button
                    variant="outline"
                    onClick={() => setShowCalculator(true)}
                    size="lg"
                  >
                    <Calculator className="h-5 w-5 mr-2" />
                    Calculator
                  </Button>
                )}
                
                {selectedQuiz.proctoringEnabled && !screenShareEnabled && (
                  <Button
                    variant="outline"
                    onClick={() => initializeScreenShare()}
                    size="lg"
                    className="bg-blue-50 text-blue-600 hover:bg-blue-100"
                  >
                    <Monitor className="h-5 w-5 mr-2" />
                    Share Screen
                  </Button>
                )}
                
                {selectedQuiz.proctoringEnabled && (
                  <Select value={mediaQuality} onValueChange={(value: any) => setMediaQuality(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Quality</SelectItem>
                      <SelectItem value="medium">Medium Quality</SelectItem>
                      <SelectItem value="high">High Quality</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                
                <Button
                  variant="outline"
                  onClick={handleExamSubmit}
                  className="bg-red-50 text-red-600 hover:bg-red-100"
                  size="lg"
                >
                  Submit Exam
                </Button>
              </div>
              
              {currentQuestionIndex < examQuestions.length - 1 ? (
                <Button onClick={nextQuestion} size="lg">
                  Next
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleExamSubmit} className="bg-green-600 hover:bg-green-700" size="lg">
                  Finish Exam
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Proctoring Video Feeds */}
        {selectedQuiz.proctoringEnabled && (
          <div className="fixed bottom-4 right-4 lg:bottom-6 lg:right-6 space-y-2">
            {/* Camera Feed */}
            {cameraEnabled && (
              <div className="relative w-24 h-18 sm:w-32 sm:h-24 lg:w-40 lg:h-30 bg-black rounded-lg sm:rounded-xl overflow-hidden shadow-lg border-2 border-white">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      videoRef.current.play().catch(console.warn);
                    }
                  }}
                />
                <div className="absolute top-1 right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute bottom-1 left-1 text-xs text-white bg-black bg-opacity-50 px-1 rounded hidden sm:block">
                  Camera
                </div>
              </div>
            )}
            
            {/* Screen Share Feed */}
            {screenShareEnabled && (
              <div className="relative w-24 h-18 sm:w-32 sm:h-24 lg:w-40 lg:h-30 bg-black rounded-lg sm:rounded-xl overflow-hidden shadow-lg border-2 border-green-400">
                <video
                  ref={screenVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  onLoadedMetadata={() => {
                    if (screenVideoRef.current) {
                      screenVideoRef.current.play().catch(console.warn);
                    }
                  }}
                />
                <div className="absolute top-1 right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute bottom-1 left-1 text-xs text-white bg-black bg-opacity-50 px-1 rounded hidden sm:block">
                  Screen
                </div>
              </div>
            )}
            
            {/* Proctoring Status */}
            {!cameraEnabled && !screenShareEnabled && (
              <div className="w-24 h-18 sm:w-32 sm:h-24 lg:w-40 lg:h-30 bg-red-100 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg border-2 border-red-300">
                <div className="text-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1"></div>
                  <div className="text-xs text-red-600 font-medium">No Feed</div>
                </div>
              </div>
            )}
            
            {/* Enhanced Performance Dashboard */}
            {(cameraEnabled || screenShareEnabled) && (
              <div className="w-32 sm:w-40 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
                <div className="text-xs font-medium text-gray-600 text-center mb-1">
                  {mediaQuality.toUpperCase()}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>FPS:</span>
                    <span className={mediaPerformance.fps < 15 ? 'text-red-500' : 'text-green-500'}>
                      {Math.round(mediaPerformance.fps)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Ping:</span>
                    <span className={mediaPerformance.latency > 200 ? 'text-red-500' : 'text-green-500'}>
                      {Math.round(mediaPerformance.latency)}ms
                    </span>
                  </div>
                  {captureCapabilities && (
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Res:</span>
                      <span>{captureCapabilities.supportedResolutions?.length || 0}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderResults = () => {
    if (!examResult) return null;

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                {examResult.passed ? (
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                )}
              </div>
              <CardTitle className="text-2xl">
                {examResult.passed ? 'Congratulations!' : 'Keep Studying!'}
              </CardTitle>
              <p className="text-gray-600">
                {examResult.feedback}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {examResult.score}%
                </div>
                <Progress value={examResult.score} className="h-3" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-600">Questions</p>
                  <p className="font-semibold">{examResult.answeredQuestions}/{examResult.totalQuestions}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">Time Spent</p>
                  <p className="font-semibold">{formatTime(examResult.timeSpent)}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="font-medium">Exam Details</h4>
                <div className="text-sm text-gray-600">
                  <p>Submitted: {new Date(examResult.submittedAt).toLocaleString()}</p>
                  <p>Session ID: {examResult.sessionId}</p>
                </div>
              </div>
              
              {violations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">Violations Detected</h4>
                  <div className="space-y-1">
                    {violations.map((violation, index) => (
                      <div key={index} className="text-sm bg-red-50 p-2 rounded">
                        <p className="font-medium">{violation.type}</p>
                        <p className="text-red-600">{violation.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="pt-4">
                <Button
                  onClick={() => {
                    setCurrentView('assignments');
                    setExamResult(null);
                    setSelectedQuiz(null);
                    setExamSession(null);
                    setResponses({});
                    setViolations([]);
                  }}
                  className="w-full"
                >
                  Back to Assignments
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.profileImageUrl} alt={profile?.fullName} />
              <AvatarFallback className="text-2xl">
                {profile?.firstName?.[0]}{profile?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile?.fullName}</h1>
              <p className="text-gray-600">{profile?.email}</p>
              <p className="text-sm text-gray-500">ID: {profile?.studentId}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{profile?.completedExams || 0}</p>
              <p className="text-sm text-gray-600">Completed Exams</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{profile?.averageScore || 0}%</p>
              <p className="text-sm text-gray-600">Average Score</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{profile?.totalPoints || 0}</p>
              <p className="text-sm text-gray-600">Total Points</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Award className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{profile?.rank || 'Beginner'}</p>
              <p className="text-sm text-gray-600">Current Rank</p>
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.achievements?.length > 0 ? (
              <div className="space-y-3">
                {profile.achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div>
                      <p className="font-medium">{achievement.name}</p>
                      <p className="text-sm text-gray-600">{new Date(achievement.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Award className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No achievements yet</p>
                <p className="text-sm">Complete exams to earn achievements</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Recent Scores</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.recentScores?.length > 0 ? (
              <div className="space-y-3">
                {profile.recentScores.map((score, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{score.exam}</p>
                      <p className="text-sm text-gray-600">{new Date(score.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{score.score}%</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No recent scores</p>
                <p className="text-sm">Take an exam to see your scores</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Exam Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Push Notifications</Label>
                <p className="text-sm text-gray-600">Get notified about new assignments</p>
              </div>
              <Switch id="notifications" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sound">Sound Effects</Label>
                <p className="text-sm text-gray-600">Play sounds during exams</p>
              </div>
              <Switch id="sound" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="vibration">Vibration</Label>
                <p className="text-sm text-gray-600">Vibrate for alerts</p>
              </div>
              <Switch id="vibration" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacy & Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Data Usage</Label>
                <p className="text-sm text-gray-600">Allow app to use cellular data</p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Biometric Lock</Label>
                <p className="text-sm text-gray-600">Use fingerprint/face ID</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Version</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform</span>
              <span>Web App</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Updated</span>
              <span>January 2025</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCalculator = () => (
    <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Calculator</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-gray-900 text-white p-4 rounded-lg">
            <div className="text-right text-2xl font-mono">
              {calculatorState.display}
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            <Button variant="outline" onClick={() => handleCalculatorInput('C')}>C</Button>
            <Button variant="outline" onClick={() => handleCalculatorInput('CE')}>CE</Button>
            <Button variant="outline" onClick={() => handleCalculatorInput('/')}>/</Button>
            <Button variant="outline" onClick={() => handleCalculatorInput('*')}>×</Button>
            
            <Button variant="outline" onClick={() => handleCalculatorInput('7')}>7</Button>
            <Button variant="outline" onClick={() => handleCalculatorInput('8')}>8</Button>
            <Button variant="outline" onClick={() => handleCalculatorInput('9')}>9</Button>
            <Button variant="outline" onClick={() => handleCalculatorInput('-')}>−</Button>
            
            <Button variant="outline" onClick={() => handleCalculatorInput('4')}>4</Button>
            <Button variant="outline" onClick={() => handleCalculatorInput('5')}>5</Button>
            <Button variant="outline" onClick={() => handleCalculatorInput('6')}>6</Button>
            <Button variant="outline" onClick={() => handleCalculatorInput('+')}>+</Button>
            
            <Button variant="outline" onClick={() => handleCalculatorInput('1')}>1</Button>
            <Button variant="outline" onClick={() => handleCalculatorInput('2')}>2</Button>
            <Button variant="outline" onClick={() => handleCalculatorInput('3')}>3</Button>
            <Button variant="outline" onClick={() => handleCalculatorInput('=')} className="row-span-2">=</Button>
            
            <Button variant="outline" onClick={() => handleCalculatorInput('0')} className="col-span-2">0</Button>
            <Button variant="outline" onClick={() => handleCalculatorInput('.')}>.</Button>
          </div>
          
          {calculatorState.history.length > 0 && (
            <div className="max-h-32 overflow-y-auto">
              <h4 className="text-sm font-medium mb-2">History</h4>
              <div className="space-y-1">
                {calculatorState.history.slice(-5).map((entry, index) => (
                  <div key={index} className="text-xs text-gray-600 font-mono">
                    {entry}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  // CAT Exams render function
  const renderCATExams = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">CAT Exams</h1>
            <p className="text-sm text-gray-600">Computer Adaptive Tests</p>
          </div>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-500">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex mt-4 border-t pt-4">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex-1 py-3 px-2 text-center ${currentView === 'dashboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          >
            <Home className="h-5 w-5 mx-auto mb-1" />
            <span className="text-xs">Dashboard</span>
          </button>
          <button
            onClick={() => setCurrentView('assignments')}
            className={`flex-1 py-3 px-2 text-center ${currentView === 'assignments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          >
            <BookOpen className="h-5 w-5 mx-auto mb-1" />
            <span className="text-xs">Assignments</span>
          </button>
          <button
            onClick={() => setCurrentView('catExams')}
            className={`flex-1 py-3 px-2 text-center ${currentView === 'catExams' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          >
            <Target className="h-5 w-5 mx-auto mb-1" />
            <span className="text-xs">CAT Exams</span>
          </button>
          <button
            onClick={() => setCurrentView('profile')}
            className={`flex-1 py-3 px-2 text-center ${currentView === 'profile' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          >
            <User className="h-5 w-5 mx-auto mb-1" />
            <span className="text-xs">Profile</span>
          </button>
          <button
            onClick={() => setCurrentView('settings')}
            className={`flex-1 py-3 px-2 text-center ${currentView === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          >
            <Settings className="h-5 w-5 mx-auto mb-1" />
            <span className="text-xs">Settings</span>
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {catExamsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading CAT exams...</p>
          </div>
        ) : catExams.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No CAT Exams Available</h3>
            <p className="text-gray-500">Check back later for adaptive assessments</p>
          </div>
        ) : (
          catExams.map((catExam: any) => (
            <Card key={catExam.id} className="bg-white">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-lg text-gray-900">{catExam.title}</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{catExam.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Target className="h-3 w-3 mr-1" />
                        Adaptive
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Self-paced
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-blue-800">
                    <Target className="h-4 w-4 inline mr-1" />
                    Adaptive assessment that adjusts to your skill level
                  </p>
                </div>
                
                <Button
                  onClick={() => startExam(catExam)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Start CAT Exam
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  // Render app download banner for smartphones
  const renderAppDownloadBanner = () => {
    if (!showAppDownload || !device.isSmartphone) return null;

    return (
      <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-3 z-50 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">Get the Native App</p>
              <p className="text-xs opacity-90">Better performance & offline support</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              className="text-blue-600 border-white bg-white hover:bg-gray-100"
              onClick={() => {
                const opened = tryNativeAppOpen();
                if (!opened) {
                  openAppStore();
                }
              }}
            >
              {device.isIOS ? 'App Store' : 'Play Store'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-blue-700"
              onClick={() => setShowAppDownload(false)}
            >
              ✕
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="mobile-app h-screen bg-gray-50 overflow-hidden">
      {/* App Download Banner */}
      {renderAppDownloadBanner()}
      
      {/* Main Content with offset if banner is showing */}
      <div className={`h-full ${showAppDownload && device.isSmartphone ? 'pt-16' : ''}`}>
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'assignments' && renderAssignments()}
        {currentView === 'catExams' && renderCATExams()}
        {currentView === 'exam' && renderExam()}
        {currentView === 'results' && renderResults()}
        {currentView === 'profile' && renderProfile()}
        {currentView === 'settings' && renderSettings()}
      </div>
      
      {/* Floating Calculator */}
      {showCalculator && renderCalculator()}
      
      {/* Connection Status Toast */}
      {!isOnline && (
        <div className="fixed top-4 left-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <WifiOff className="h-5 w-5" />
            <span className="text-sm font-medium">You are offline</span>
          </div>
        </div>
      )}
    </div>
  );
}