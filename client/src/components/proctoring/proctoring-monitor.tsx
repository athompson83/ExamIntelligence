import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, 
  Camera, 
  AlertTriangle, 
  Users, 
  Clock, 
  Eye,
  CheckCircle,
  Wifi,
  Server
} from "lucide-react";

interface StudentSession {
  id: string;
  name: string;
  attemptId: string;
  currentQuestion: number;
  totalQuestions: number;
  status: 'normal' | 'warning' | 'alert';
  timeSpent: number;
  lastActivity: string;
  cameraActive: boolean;
}

interface ProctoringAlert {
  id: string;
  studentId: string;
  studentName: string;
  attemptId: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  description: string;
  resolved: boolean;
}

interface ProctoringMonitorProps {
  isOpen: boolean;
  onClose: () => void;
  examId?: string | null;
}

export function ProctoringMonitor({ isOpen, onClose, examId }: ProctoringMonitorProps) {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const { sendMessage, lastMessage, isConnected } = useWebSocket();

  const { data: examSession, isLoading: sessionLoading } = useQuery({
    queryKey: ['/api/proctoring/session', examId],
    enabled: !!examId && isOpen,
    staleTime: 60 * 1000, // 1 minute - session data doesn't change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  const { data: activeAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/proctoring/alerts', examId],
    enabled: !!examId && isOpen,
    // Remove aggressive polling - WebSocket will handle real-time updates
    refetchInterval: false, // Disabled - using WebSocket for real-time alerts
    staleTime: 30 * 1000, // 30 seconds - alerts are real-time via WebSocket
    gcTime: 2 * 60 * 1000, // 2 minutes cache
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  // Mock data for demonstration - replace with real WebSocket data
  const mockStudents: StudentSession[] = [
    {
      id: '1',
      name: 'Sarah Thompson',
      attemptId: 'attempt-1',
      currentQuestion: 15,
      totalQuestions: 25,
      status: 'normal',
      timeSpent: 1800,
      lastActivity: new Date().toISOString(),
      cameraActive: true
    },
    {
      id: '2',
      name: 'Michael Chen',
      attemptId: 'attempt-2',
      currentQuestion: 12,
      totalQuestions: 25,
      status: 'normal',
      timeSpent: 1500,
      lastActivity: new Date().toISOString(),
      cameraActive: true
    },
    {
      id: '3',
      name: 'Alex Rodriguez',
      attemptId: 'attempt-3',
      currentQuestion: 8,
      totalQuestions: 25,
      status: 'alert',
      timeSpent: 900,
      lastActivity: new Date(Date.now() - 30000).toISOString(),
      cameraActive: false
    },
    {
      id: '4',
      name: 'Emma Johnson',
      attemptId: 'attempt-4',
      currentQuestion: 18,
      totalQuestions: 25,
      status: 'normal',
      timeSpent: 2100,
      lastActivity: new Date().toISOString(),
      cameraActive: true
    },
    {
      id: '5',
      name: 'David Kim',
      attemptId: 'attempt-5',
      currentQuestion: 10,
      totalQuestions: 25,
      status: 'normal',
      timeSpent: 1200,
      lastActivity: new Date().toISOString(),
      cameraActive: true
    },
    {
      id: '6',
      name: 'Lisa Wang',
      attemptId: 'attempt-6',
      currentQuestion: 20,
      totalQuestions: 25,
      status: 'normal',
      timeSpent: 2400,
      lastActivity: new Date().toISOString(),
      cameraActive: true
    },
    {
      id: '7',
      name: 'James Brown',
      attemptId: 'attempt-7',
      currentQuestion: 5,
      totalQuestions: 25,
      status: 'warning',
      timeSpent: 600,
      lastActivity: new Date(Date.now() - 120000).toISOString(),
      cameraActive: true
    },
    {
      id: '8',
      name: 'Maria Garcia',
      attemptId: 'attempt-8',
      currentQuestion: 13,
      totalQuestions: 25,
      status: 'normal',
      timeSpent: 1650,
      lastActivity: new Date().toISOString(),
      cameraActive: true
    }
  ];

  const mockAlerts: ProctoringAlert[] = [
    {
      id: '1',
      studentId: '3',
      studentName: 'Alex Rodriguez',
      attemptId: 'attempt-3',
      eventType: 'multiple_tab_switches',
      severity: 'high',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      description: 'Multiple tab switches detected',
      resolved: false
    },
    {
      id: '2',
      studentId: '7',
      studentName: 'James Brown',
      attemptId: 'attempt-7',
      eventType: 'extended_idle_time',
      severity: 'medium',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      description: 'Extended idle time detected',
      resolved: false
    }
  ];

  const students = examSession?.students || mockStudents;
  const alerts = activeAlerts || mockAlerts;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'text-secondary border-secondary';
      case 'warning':
        return 'text-accent border-accent';
      case 'alert':
        return 'text-destructive border-destructive';
      default:
        return 'text-muted-foreground border-muted';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-secondary/10';
      case 'warning':
        return 'bg-accent/10';
      case 'alert':
        return 'bg-destructive/10';
      default:
        return 'bg-muted';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-600 text-white">Critical</Badge>;
      case 'high':
        return <Badge className="bg-destructive text-destructive-foreground">High</Badge>;
      case 'medium':
        return <Badge className="bg-accent text-accent-foreground">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const formatTimeSpent = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const handleResolveAlert = (alertId: string) => {
    // TODO: Implement alert resolution
    console.log('Resolving alert:', alertId);
  };

  const handleDismissAlert = (alertId: string) => {
    // TODO: Implement alert dismissal
    console.log('Dismissing alert:', alertId);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0">
        <DialogHeader className="bg-gray-800 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">Live Proctoring Monitor</DialogTitle>
              <p className="text-sm opacity-90">Biology Final Exam - {students.length} students online</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right text-sm">
                <div className="flex items-center">
                  Status: 
                  {isConnected ? (
                    <span className="text-secondary ml-1">Active</span>
                  ) : (
                    <span className="text-destructive ml-1">Disconnected</span>
                  )}
                </div>
                <div className="flex items-center">
                  Alerts: <span className="text-destructive ml-1">{alerts.filter(a => !a.resolved).length} pending</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[70vh]">
            {/* Student Camera Feeds */}
            <div className="lg:col-span-3">
              <div className="h-full">
                <h3 className="font-medium text-foreground mb-4">Student Camera Feeds</h3>
                <ScrollArea className="h-full">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pr-4">
                    {students.map((student) => (
                      <Card 
                        key={student.id} 
                        className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                          student.status === 'alert' ? 'border-destructive bg-destructive/5' :
                          student.status === 'warning' ? 'border-accent bg-accent/5' : 
                          'border-border hover:border-primary'
                        }`}
                        onClick={() => setSelectedStudent(student.id)}
                      >
                        <div className="p-2">
                          {/* Camera Feed Placeholder */}
                          <div className={`aspect-video rounded mb-2 flex items-center justify-center relative ${getStatusBg(student.status)}`}>
                            <Camera className="h-6 w-6 text-muted-foreground" />
                            {student.cameraActive && (
                              <div className="absolute top-2 left-2 bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded">
                                Live
                              </div>
                            )}
                            {student.status === 'alert' && (
                              <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded">
                                Alert
                              </div>
                            )}
                            {student.status === 'warning' && (
                              <div className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs px-2 py-1 rounded">
                                Warning
                              </div>
                            )}
                          </div>
                          
                          {/* Student Info */}
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-foreground truncate">
                              {student.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Q {student.currentQuestion}/{student.totalQuestions}
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className={`font-medium ${getStatusColor(student.status).split(' ')[0]}`}>
                                {student.status === 'normal' ? 'Normal' : 
                                 student.status === 'warning' ? 'Warning' : 'Alert'}
                              </span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2 text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
            
            {/* Alert Panel */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-4">Active Alerts</h3>
              
              <ScrollArea className="h-[calc(100%-120px)]">
                <div className="space-y-3">
                  {alerts.filter(alert => !alert.resolved).map((alert) => (
                    <Card key={alert.id} className={`border ${
                      alert.severity === 'critical' ? 'border-red-600 bg-red-50' :
                      alert.severity === 'high' ? 'border-destructive bg-destructive/10' :
                      alert.severity === 'medium' ? 'border-accent bg-accent/10' :
                      'border-border bg-background'
                    }`}>
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          {getSeverityBadge(alert.severity)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">
                          {alert.description}
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">
                          {alert.studentName} - {alert.eventType.replace(/_/g, ' ')}
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="h-7 px-2 text-xs bg-destructive hover:bg-destructive/90"
                            onClick={() => handleResolveAlert(alert.id)}
                          >
                            Review
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 px-2 text-xs"
                            onClick={() => handleDismissAlert(alert.id)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {alerts.filter(alert => !alert.resolved).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">No active alerts</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <Separator className="my-4" />
              
              {/* System Status */}
              <div>
                <h4 className="font-medium text-foreground mb-2 text-sm">System Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Camera className="h-3 w-3 mr-2" />
                      <span className="text-muted-foreground">Camera Feeds</span>
                    </div>
                    <span className="text-secondary font-medium">
                      {students.filter(s => s.cameraActive).length}/{students.length} Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Wifi className="h-3 w-3 mr-2" />
                      <span className="text-muted-foreground">Network Quality</span>
                    </div>
                    <span className="text-secondary font-medium">Excellent</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Server className="h-3 w-3 mr-2" />
                      <span className="text-muted-foreground">Server Load</span>
                    </div>
                    <span className="text-secondary font-medium">Normal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
