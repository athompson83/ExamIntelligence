import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { 
  Eye, 
  Play, 
  Pause, 
  Square, 
  Users, 
  Clock, 
  AlertTriangle,
  Shield,
  Camera,
  Monitor,
  Activity,
  Video,
  Mic,
  MousePointer,
  Keyboard,
  Maximize,
  Navigation,
  Plus,
  Home,
  ChevronRight
} from "lucide-react";

interface StudentSession {
  id: string;
  studentName: string;
  email: string;
  attemptId: string;
  startTime: string;
  currentQuestion: number;
  totalQuestions: number;
  progress: number;
  timeSpent: number;
  status: 'active' | 'paused' | 'flagged' | 'completed';
  alerts: ProctoringAlert[];
  lastActivity: string;
}

interface ProctoringAlert {
  id: string;
  type: 'tab_switch' | 'window_blur' | 'copy_paste' | 'suspicious_activity' | 'network_disconnect';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  description: string;
  resolved: boolean;
}

interface LiveExamSession {
  id: string;
  quizId: string;
  title: string;
  startTime: string;
  duration: number;
  totalStudents: number;
  activeStudents: number;
  flaggedStudents: number;
  completedStudents: number;
  students: StudentSession[];
  proctoringSettings: {
    requireCamera: boolean;
    requireMicrophone: boolean;
    lockdownBrowser: boolean;
    preventTabSwitching: boolean;
    recordSession: boolean;
    flagSuspiciousActivity: boolean;
  };
}

export default function LiveExams() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [proctoringAlerts, setProctoringAlerts] = useState<ProctoringAlert[]>([]);
  const [liveData, setLiveData] = useState<{ [key: string]: any }>({});
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [location] = useLocation();
  const queryClient = useQueryClient();

  // Parse URL parameters for pre-selected quiz
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const preSelectedQuizId = urlParams.get('quizId');
  const preSelectedQuizTitle = urlParams.get('quizTitle');

  // Auto-open create modal if coming from quiz manager
  useEffect(() => {
    if (preSelectedQuizId && location.includes('/live-exam/create')) {
      setShowCreateModal(true);
    }
  }, [preSelectedQuizId, location]);

  // Fetch data for live exam setup
  const { data: quizzes = [] } = useQuery({
    queryKey: ['/api/quizzes'],
    queryFn: () => apiRequest('/api/quizzes'),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('/api/users'),
  });

  const { data: sections = [] } = useQuery({
    queryKey: ['/api/sections'],
    queryFn: () => apiRequest('/api/sections'),
  });

  // Create live exam mutation
  const createLiveExamMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/live-exams', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: (data) => {
      setShowCreateModal(false);
      toast({
        title: "Success",
        description: `Live exam started! Access code: ${data.accessCode}`,
      });
      setSelectedExam(data.id);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start live exam",
        variant: "destructive",
      });
    },
  });

  // Mock live exam sessions data
  const [liveSessions] = useState<LiveExamSession[]>([
    {
      id: '1',
      quizId: 'quiz-1',
      title: 'Advanced Mathematics Final Exam',
      startTime: new Date().toISOString(),
      duration: 120,
      totalStudents: 25,
      activeStudents: 22,
      flaggedStudents: 2,
      completedStudents: 1,
      students: [
        {
          id: 'student-1',
          studentName: 'Alice Johnson',
          email: 'alice@example.com',
          attemptId: 'attempt-1',
          startTime: new Date().toISOString(),
          currentQuestion: 8,
          totalQuestions: 25,
          progress: 32,
          timeSpent: 38,
          status: 'active',
          alerts: [],
          lastActivity: new Date().toISOString(),
        },
        {
          id: 'student-2',
          studentName: 'Bob Smith',
          email: 'bob@example.com',
          attemptId: 'attempt-2',
          startTime: new Date().toISOString(),
          currentQuestion: 12,
          totalQuestions: 25,
          progress: 48,
          timeSpent: 42,
          status: 'flagged',
          alerts: [
            {
              id: 'alert-1',
              type: 'tab_switch',
              severity: 'high',
              timestamp: new Date().toISOString(),
              description: 'Student switched tabs 3 times in 2 minutes',
              resolved: false,
            },
          ],
          lastActivity: new Date().toISOString(),
        },
      ],
      proctoringSettings: {
        requireCamera: true,
        requireMicrophone: true,
        lockdownBrowser: true,
        preventTabSwitching: true,
        recordSession: true,
        flagSuspiciousActivity: true,
      },
    },
  ]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Setup WebSocket connection for real-time updates
  useEffect(() => {
    if (!isAuthenticated) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connected');
      socket.send(JSON.stringify({
        type: 'authenticate',
        data: { role: 'teacher' }
      }));
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [isAuthenticated]);

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'proctoring_alert':
        setProctoringAlerts(prev => [message.data, ...prev]);
        toast({
          title: "Proctoring Alert",
          description: `${message.data.eventType} detected`,
          variant: "destructive",
        });
        break;
      case 'exam_progress':
        setLiveData(prev => ({
          ...prev,
          [message.data.userId]: message.data
        }));
        break;
      case 'student_joined':
        toast({
          title: "Student Joined",
          description: "A student has joined the exam",
        });
        break;
      case 'student_left':
        toast({
          title: "Student Left",
          description: "A student has left the exam",
          variant: "destructive",
        });
        break;
    }
  };

  const { data: activeQuizzes = [], isLoading } = useQuery({
    queryKey: ["/api/quizzes", "active"],
    enabled: isAuthenticated,
    retry: false,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: upcomingQuizzes = [] } = useQuery({
    queryKey: ["/api/quizzes", "upcoming"],
    enabled: isAuthenticated,
    retry: false,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Active</Badge>;
      case 'flagged':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Flagged</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Paused</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      case 'high':
        return 'text-orange-600 dark:text-orange-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const resolveAlert = async (alertId: string) => {
    setProctoringAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    );
    toast({
      title: "Alert Resolved",
      description: "Proctoring alert has been marked as resolved",
    });
  };

  const handleCreateLiveExam = (formData: FormData) => {
    const data = {
      quizId: formData.get('quizId'),
      title: formData.get('title'),
      duration: parseInt(formData.get('duration') as string),
      selectedStudents: selectedStudents,
      selectedSections: selectedSections,
      proctoringSettings: {
        requireCamera: formData.get('requireCamera') === 'on',
        requireMicrophone: formData.get('requireMicrophone') === 'on',
        lockdownBrowser: formData.get('lockdownBrowser') === 'on',
        preventTabSwitching: formData.get('preventTabSwitching') === 'on',
        recordSession: formData.get('recordSession') === 'on',
        flagSuspiciousActivity: formData.get('flagSuspiciousActivity') === 'on',
      }
    };
    createLiveExamMutation.mutate(data);
  };

  const LiveExamForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleCreateLiveExam(new FormData(e.target as HTMLFormElement));
    }} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Exam Title</Label>
          <Input
            id="title"
            name="title"
            defaultValue={preSelectedQuizTitle ? `Live Exam: ${preSelectedQuizTitle}` : ''}
            required
          />
        </div>
        <div>
          <Label htmlFor="quizId">Quiz</Label>
          <Select name="quizId" defaultValue={preSelectedQuizId || ''}>
            <SelectTrigger>
              <SelectValue placeholder="Select a quiz" />
            </SelectTrigger>
            <SelectContent>
              {quizzes.map((quiz: any) => (
                <SelectItem key={quiz.id} value={quiz.id}>
                  {quiz.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="duration">Duration (minutes)</Label>
        <Input
          id="duration"
          name="duration"
          type="number"
          defaultValue={120}
          min={1}
          required
        />
      </div>

      {/* Student and Section Selection */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Select Participants</Label>
          <p className="text-sm text-muted-foreground mb-3">Choose students or sections for this live exam</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Individual Students</Label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                {students.filter((student: any) => student.role === 'student').map((student: any) => (
                  <div key={student.id} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={`student-${student.id}`}
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStudents([...selectedStudents, student.id]);
                        } else {
                          setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                        }
                      }}
                    />
                    <Label htmlFor={`student-${student.id}`} className="text-sm">
                      {student.name || student.email}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Sections</Label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                {sections.map((section: any) => (
                  <div key={section.id} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={`section-${section.id}`}
                      checked={selectedSections.includes(section.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedSections([...selectedSections, section.id]);
                        } else {
                          setSelectedSections(selectedSections.filter(id => id !== section.id));
                        }
                      }}
                    />
                    <Label htmlFor={`section-${section.id}`} className="text-sm">
                      {section.name} ({section.memberCount || 0} students)
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Proctoring Settings */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Proctoring Settings</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox id="requireCamera" name="requireCamera" defaultChecked />
              <Label htmlFor="requireCamera">Require Camera</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="requireMicrophone" name="requireMicrophone" defaultChecked />
              <Label htmlFor="requireMicrophone">Require Microphone</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="lockdownBrowser" name="lockdownBrowser" defaultChecked />
              <Label htmlFor="lockdownBrowser">Lockdown Browser</Label>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox id="preventTabSwitching" name="preventTabSwitching" defaultChecked />
              <Label htmlFor="preventTabSwitching">Prevent Tab Switching</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="recordSession" name="recordSession" />
              <Label htmlFor="recordSession">Record Session</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="flagSuspiciousActivity" name="flagSuspiciousActivity" defaultChecked />
              <Label htmlFor="flagSuspiciousActivity">Flag Suspicious Activity</Label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={createLiveExamMutation.isPending}>
          {createLiveExamMutation.isPending ? 'Starting...' : 'Start Live Exam'}
        </Button>
      </div>
    </form>
  );

  if (authLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>;
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
          <Button variant="ghost" size="sm" onClick={() => window.location.href = '/dashboard'}>
            <Home className="h-4 w-4" />
          </Button>
          <ChevronRight className="h-4 w-4" />
          <span>Live Exams</span>
        </nav>

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Live Exam Monitoring</h1>
            <p className="text-gray-600 dark:text-gray-300">Real-time proctoring and exam oversight</p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Start Live Exam
            </Button>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${ws ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {ws ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Create Live Exam Dialog */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Start Live Exam</DialogTitle>
            </DialogHeader>
            <LiveExamForm />
          </DialogContent>
        </Dialog>

        {/* Live Sessions Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Students</p>
                  <p className="text-2xl font-bold">{liveSessions[0]?.activeStudents || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Flagged Students</p>
                  <p className="text-2xl font-bold text-red-600">{liveSessions[0]?.flaggedStudents || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{liveSessions[0]?.completedStudents || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Alerts</p>
                  <p className="text-2xl font-bold text-orange-600">{proctoringAlerts.filter(a => !a.resolved).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="live-sessions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="live-sessions">Live Sessions</TabsTrigger>
            <TabsTrigger value="student-monitoring">Student Monitoring</TabsTrigger>
            <TabsTrigger value="alerts">Proctoring Alerts</TabsTrigger>
          </TabsList>

          {/* Live Sessions Tab */}
          <TabsContent value="live-sessions" className="space-y-6">
            <div className="grid gap-6">
              {liveSessions.map((session) => (
                <Card key={session.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{session.title}</CardTitle>
                        <p className="text-gray-600 dark:text-gray-400">
                          Duration: {formatTime(session.duration)} | Students: {session.totalStudents}
                        </p>
                      </div>
                      <Button
                        variant={selectedExam === session.id ? "secondary" : "outline"}
                        onClick={() => setSelectedExam(selectedExam === session.id ? null : session.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {selectedExam === session.id ? 'Hide Details' : 'Monitor'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{session.activeStudents}</div>
                        <div className="text-sm text-green-600">Active</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{session.flaggedStudents}</div>
                        <div className="text-sm text-red-600">Flagged</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-gray-600">{session.completedStudents}</div>
                        <div className="text-sm text-gray-600">Completed</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{session.totalStudents}</div>
                        <div className="text-sm text-blue-600">Total</div>
                      </div>
                    </div>

                    {/* Proctoring Settings Display */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {session.proctoringSettings.requireCamera && (
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20">
                          <Camera className="h-3 w-3 mr-1" />
                          Camera Required
                        </Badge>
                      )}
                      {session.proctoringSettings.requireMicrophone && (
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20">
                          <Mic className="h-3 w-3 mr-1" />
                          Microphone Required
                        </Badge>
                      )}
                      {session.proctoringSettings.lockdownBrowser && (
                        <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/20">
                          <Shield className="h-3 w-3 mr-1" />
                          Lockdown Browser
                        </Badge>
                      )}
                      {session.proctoringSettings.preventTabSwitching && (
                        <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20">
                          <Monitor className="h-3 w-3 mr-1" />
                          Tab Switching Blocked
                        </Badge>
                      )}
                    </div>

                    {selectedExam === session.id && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-3">Student Sessions</h4>
                        <div className="space-y-3">
                          {session.students.map((student) => (
                            <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div>
                                  <p className="font-medium">{student.studentName}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{student.email}</p>
                                </div>
                                {getStatusBadge(student.status)}
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  Question {student.currentQuestion} of {student.totalQuestions}
                                </div>
                                <Progress value={student.progress} className="w-24 h-2 mt-1" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Student Monitoring Tab */}
          <TabsContent value="student-monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Student Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {liveSessions[0]?.students.map((student) => (
                    <div key={student.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{student.studentName}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{student.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(student.status)}
                          <span className="text-sm text-gray-500">
                            Last activity: {new Date(student.lastActivity).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
                          <Progress value={student.progress} className="mt-1" />
                          <p className="text-xs text-gray-500 mt-1">
                            {student.currentQuestion} of {student.totalQuestions} questions
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Time Spent</p>
                          <p className="text-lg font-semibold">{formatTime(student.timeSpent)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Alerts</p>
                          <p className="text-lg font-semibold text-red-600">
                            {student.alerts.filter(a => !a.resolved).length}
                          </p>
                        </div>
                      </div>

                      {student.alerts.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium mb-2">Recent Alerts:</p>
                          <div className="space-y-1">
                            {student.alerts.slice(0, 3).map((alert) => (
                              <div key={alert.id} className="flex items-center justify-between text-sm">
                                <span className={getAlertSeverityColor(alert.severity)}>
                                  {alert.description}
                                </span>
                                <span className="text-gray-500">
                                  {new Date(alert.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Proctoring Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Proctoring Alerts</CardTitle>
                <p className="text-gray-600 dark:text-gray-400">
                  Monitor and respond to proctoring violations and suspicious activities
                </p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {proctoringAlerts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No proctoring alerts</p>
                        <p className="text-sm">All students are following exam protocols</p>
                      </div>
                    ) : (
                      proctoringAlerts.map((alert) => (
                        <div key={alert.id} className={`border-l-4 p-4 rounded-lg ${
                          alert.severity === 'critical' ? 'border-l-red-500 bg-red-50 dark:bg-red-900/20' :
                          alert.severity === 'high' ? 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20' :
                          alert.severity === 'medium' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                          'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        }`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{alert.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={getAlertSeverityColor(alert.severity)}>
                                  {alert.severity.toUpperCase()}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {new Date(alert.timestamp).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            {!alert.resolved && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resolveAlert(alert.id)}
                              >
                                Resolve
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Live Exam Monitoring</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Monitor active exams and manage proctoring in real-time
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary">
              <Monitor className="h-3 w-3 mr-1" />
              Live Monitoring
            </Badge>
          </div>
        </div>

        {/* Connection Status Alert */}
        {!isConnected && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Real-time monitoring is disconnected. Some features may not work properly.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active" className="flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Active Exams ({activeQuizzes?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Upcoming Exams
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Proctoring Alerts ({proctoringAlerts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg h-64 animate-pulse" />
                ))}
              </div>
            ) : activeQuizzes && activeQuizzes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeQuizzes.map((quiz: any) => (
                  <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg line-clamp-2">{quiz.title}</CardTitle>
                        {getStatusBadge(quiz.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Exam Stats */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="text-2xl font-bold text-primary">
                              {quiz.activeStudents || 0}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-300">Students Online</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="text-2xl font-bold text-secondary">
                              {quiz.timeRemaining || '45'}m
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-300">Time Remaining</div>
                          </div>
                        </div>

                        {/* Proctoring Status */}
                        {quiz.isProctoringEnabled && (
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <Camera className="h-4 w-4 text-green-500" />
                              <span className="text-gray-600 dark:text-gray-300">Proctoring Active</span>
                            </div>
                            <Badge variant="outline" className="text-red-600">
                              {quiz.alertCount || 0} alerts
                            </Badge>
                          </div>
                        )}

                        {/* Live Camera Preview Grid */}
                        <div className="grid grid-cols-3 gap-2">
                          {[...Array(6)].map((_, index) => (
                            <div key={index} className="camera-feed">
                              <div className="flex items-center justify-center h-full">
                                <Camera className="h-6 w-6 text-gray-400" />
                              </div>
                              <div className="live-badge">Live</div>
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="text-xs text-gray-500">
                            Started: {new Date(quiz.startedAt || Date.now()).toLocaleTimeString()}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => setSelectedExam(quiz.id)}
                            className="bg-primary hover:bg-primary/90"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Monitor
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Active Exams
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Active exams will appear here when students are taking assessments
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            {upcomingQuizzes && upcomingQuizzes.length > 0 ? (
              <div className="space-y-4">
                {upcomingQuizzes.map((quiz: any) => (
                  <Card key={quiz.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {quiz.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 mt-1">
                            {quiz.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {new Date(quiz.scheduledStartTime).toLocaleString()}
                            </div>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {quiz.enrolledStudents || 0} students
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(quiz.status)}
                          <Button size="sm" variant="outline">
                            <Play className="h-4 w-4 mr-1" />
                            Start Early
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Upcoming Exams
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Scheduled exams will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="alerts">
            {proctoringAlerts.length > 0 ? (
              <div className="space-y-4">
                {proctoringAlerts.map((alert, index) => (
                  <Card key={index} className={alert.event?.severity === 'high' ? 'border-red-200 dark:border-red-800' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={`${getAlertSeverityColor(alert.event?.severity)} border-current`}>
                              {alert.event?.severity?.toUpperCase() || 'LOW'} PRIORITY
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {alert.event?.type || 'Unknown Event'}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            Student: {alert.studentId} • Exam: {alert.examId}
                          </p>
                          {alert.event?.details && (
                            <p className="text-sm text-gray-500 mt-2">
                              {alert.event.details}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            Review
                          </Button>
                          <Button size="sm" variant="ghost">
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Proctoring Alerts
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Proctoring alerts and suspicious activities will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Live Proctoring Monitor Modal */}
        {selectedExam && (
          <LiveProctoringMonitor
            examId={selectedExam}
            onClose={() => setSelectedExam(null)}
          />
        )}
      </div>
    </Layout>
  );
}
