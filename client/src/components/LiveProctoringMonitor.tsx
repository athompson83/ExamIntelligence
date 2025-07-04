import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  X, 
  Camera, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  Users,
  Clock,
  Shield,
  Monitor,
  Maximize2,
  Volume2,
  VolumeX
} from "lucide-react";

interface LiveProctoringMonitorProps {
  examId: string;
  onClose: () => void;
}

export default function LiveProctoringMonitor({ examId, onClose }: LiveProctoringMonitorProps) {
  const { toast } = useToast();
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);

  const { data: examDetails } = useQuery({
    queryKey: ["/api/quizzes", examId],
    retry: false,
  });

  const { data: activeAttempts } = useQuery({
    queryKey: ["/api/quizzes", examId, "attempts"],
    retry: false,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: proctoringLogs } = useQuery({
    queryKey: ["/api/proctoring", examId],
    retry: false,
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  const { lastMessage, sendProctoringEvent } = useWebSocket({
    examId,
    onMessage: (message) => {
      if (message.type === 'proctoring_alert') {
        setAlerts(prev => [message.data, ...prev.slice(0, 19)]);
        
        if (message.data.event?.severity === 'high') {
          toast({
            title: "High Priority Alert",
            description: `${message.data.event.type} detected from student ${message.data.studentId}`,
            variant: "destructive",
          });
        }
      }
    },
  });

  // Mock student data for demonstration
  const mockStudents = [
    { id: '1', name: 'Sarah Thompson', status: 'normal', currentQuestion: 15, totalQuestions: 25, timeSpent: 1200, alertCount: 0 },
    { id: '2', name: 'Michael Chen', status: 'normal', currentQuestion: 12, totalQuestions: 25, timeSpent: 980, alertCount: 0 },
    { id: '3', name: 'Alex Rodriguez', status: 'flagged', currentQuestion: 8, totalQuestions: 25, timeSpent: 1800, alertCount: 3 },
    { id: '4', name: 'Emma Johnson', status: 'normal', currentQuestion: 18, totalQuestions: 25, timeSpent: 1100, alertCount: 0 },
    { id: '5', name: 'David Kim', status: 'normal', currentQuestion: 10, totalQuestions: 25, timeSpent: 850, alertCount: 0 },
    { id: '6', name: 'Lisa Wang', status: 'normal', currentQuestion: 20, totalQuestions: 25, timeSpent: 1300, alertCount: 0 },
    { id: '7', name: 'James Brown', status: 'warning', currentQuestion: 5, totalQuestions: 25, timeSpent: 2100, alertCount: 1 },
    { id: '8', name: 'Maria Garcia', status: 'normal', currentQuestion: 13, totalQuestions: 25, timeSpent: 950, alertCount: 0 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'border-green-200 dark:border-green-800';
      case 'warning':
        return 'border-yellow-200 dark:border-yellow-800';
      case 'flagged':
        return 'border-red-200 dark:border-red-800';
      default:
        return 'border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Normal</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Warning</Badge>;
      case 'flagged':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Flagged</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-lg shadow-lg w-full max-w-7xl max-h-screen overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Live Proctoring Monitor</h2>
            <p className="text-sm opacity-90">
              {examDetails?.title || 'Biology Final Exam'} - {mockStudents.length} students online
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right text-sm">
              <div>Status: <span className="text-green-400">Active</span></div>
              <div>Alerts: <span className="text-red-400">{alerts.length} pending</span></div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="grid-view" className="h-full flex flex-col">
            <div className="border-b p-4">
              <TabsList>
                <TabsTrigger value="grid-view">Grid View</TabsTrigger>
                <TabsTrigger value="focus-view">Focus View</TabsTrigger>
                <TabsTrigger value="alerts">Alerts ({alerts.length})</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="grid-view" className="flex-1 p-6 overflow-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {mockStudents.map((student) => (
                  <Card 
                    key={student.id} 
                    className={`cursor-pointer transition-all hover:shadow-lg ${getStatusColor(student.status)}`}
                    onClick={() => setSelectedStudent(student.id)}
                  >
                    <CardContent className="p-4">
                      {/* Camera Feed */}
                      <div className="camera-feed mb-3 relative">
                        <div className="flex items-center justify-center h-full">
                          <Camera className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="absolute top-2 left-2">
                          {student.status === 'normal' && <div className="live-badge">Live</div>}
                          {student.status === 'warning' && <div className="warning-badge">Warning</div>}
                          {student.status === 'flagged' && <div className="alert-badge">Alert</div>}
                        </div>
                        <div className="absolute top-2 right-2">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Maximize2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Student Info */}
                      <div className="space-y-2">
                        <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {student.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          Question {student.currentQuestion}/{student.totalQuestions}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          {getStatusBadge(student.status)}
                          <span className="text-gray-500">
                            {formatTime(student.timeSpent)}
                          </span>
                        </div>
                        {student.alertCount > 0 && (
                          <div className="flex items-center text-xs text-red-600">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {student.alertCount} alerts
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="focus-view" className="flex-1">
              {selectedStudent ? (
                <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                  {/* Main Camera View */}
                  <div className="lg:col-span-2">
                    <Card className="h-full">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>
                            {mockStudents.find(s => s.id === selectedStudent)?.name}
                          </CardTitle>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                            >
                              {isAudioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                            </Button>
                            <Button variant="outline" size="sm">
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <Camera className="h-16 w-16 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Student Details */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Student Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const student = mockStudents.find(s => s.id === selectedStudent);
                          return student ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Status</span>
                                {getStatusBadge(student.status)}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Progress</span>
                                <span className="text-sm">{student.currentQuestion}/{student.totalQuestions}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Time Spent</span>
                                <span className="text-sm">{formatTime(student.timeSpent)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Alerts</span>
                                <span className="text-sm text-red-600">{student.alertCount}</span>
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Actions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Button variant="outline" className="w-full justify-start">
                            <Eye className="h-4 w-4 mr-2" />
                            View Screen
                          </Button>
                          <Button variant="outline" className="w-full justify-start">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Flag Student
                          </Button>
                          <Button variant="outline" className="w-full justify-start">
                            <Shield className="h-4 w-4 mr-2" />
                            Send Warning
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300">
                      Select a student from the grid view to monitor in detail
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="alerts" className="flex-1 p-6 overflow-auto">
              <div className="space-y-4">
                {alerts.length > 0 ? (
                  alerts.map((alert, index) => (
                    <Alert key={index} className={alert.event?.severity === 'high' ? 'border-red-200 dark:border-red-800' : ''}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {alert.event?.type || 'Suspicious Activity'} - Student {alert.studentId}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {new Date(alert.timestamp).toLocaleTimeString()} - Severity: {alert.event?.severity || 'medium'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              Review
                            </Button>
                            <Button variant="ghost" size="sm">
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Active Alerts
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      All students are following exam protocols
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="flex-1 p-6 overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Student Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Normal</span>
                        <Badge className="bg-green-100 text-green-800">
                          {mockStudents.filter(s => s.status === 'normal').length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Warning</span>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {mockStudents.filter(s => s.status === 'warning').length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Flagged</span>
                        <Badge className="bg-red-100 text-red-800">
                          {mockStudents.filter(s => s.status === 'flagged').length}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Time Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Average Time</span>
                        <span className="text-sm font-medium">
                          {formatTime(Math.round(mockStudents.reduce((acc, s) => acc + s.timeSpent, 0) / mockStudents.length))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Fastest</span>
                        <span className="text-sm font-medium">
                          {formatTime(Math.min(...mockStudents.map(s => s.timeSpent)))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Slowest</span>
                        <span className="text-sm font-medium">
                          {formatTime(Math.max(...mockStudents.map(s => s.timeSpent)))}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Security Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Integrity Score</span>
                        <span className="text-sm font-medium text-green-600">98.7%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Alerts</span>
                        <span className="text-sm font-medium">
                          {mockStudents.reduce((acc, s) => acc + s.alertCount, 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Camera Feeds</span>
                        <span className="text-sm font-medium text-green-600">
                          {mockStudents.length}/{mockStudents.length} Active
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
