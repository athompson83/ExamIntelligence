import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Layout from "@/components/Layout";
import LiveProctoringMonitor from "@/components/LiveProctoringMonitor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Activity
} from "lucide-react";

export default function LiveExams() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [proctoringAlerts, setProctoringAlerts] = useState<any[]>([]);

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

  const { data: activeQuizzes, isLoading } = useQuery({
    queryKey: ["/api/quizzes", "active"],
    enabled: isAuthenticated,
    retry: false,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: upcomingQuizzes } = useQuery({
    queryKey: ["/api/quizzes", "upcoming"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { lastMessage, isConnected } = useWebSocket({
    onMessage: (message) => {
      if (message.type === 'proctoring_alert') {
        setProctoringAlerts(prev => [message.data, ...prev.slice(0, 19)]); // Keep last 20 alerts
        
        if (message.data.event?.severity === 'high') {
          toast({
            title: "High Priority Alert",
            description: `Suspicious activity detected: ${message.data.event.type}`,
            variant: "destructive",
          });
        }
      }
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Active</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Scheduled</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  if (authLoading || !isAuthenticated) {
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
