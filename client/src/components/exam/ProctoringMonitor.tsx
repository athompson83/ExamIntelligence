import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Video, AlertTriangle, Eye } from "lucide-react";
import { ProctoringSession, ProctoringLog } from "@/types";

interface ProctoringMonitorProps {
  quizId: number;
  onClose: () => void;
}

export function ProctoringMonitor({ quizId, onClose }: ProctoringMonitorProps) {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const { data: sessions, isLoading: sessionsLoading } = useQuery<ProctoringSession[]>({
    queryKey: ["/api/proctoring/sessions"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery<ProctoringLog[]>({
    queryKey: ["/api/proctoring/alerts"],
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  const activeSessions = sessions?.filter(session => session.isActive) || [];
  const pendingAlerts = alerts?.filter(alert => alert.resolutionStatus === 'pending') || [];

  const getViolationColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      case 'low':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Normal':
        return 'text-green-600';
      case 'Suspicious':
        return 'text-red-600';
      case 'Flagged':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  if (sessionsLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-7xl max-h-screen overflow-y-auto">
          <div className="bg-gray-800 text-white p-4">
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="aspect-video" />
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-7xl max-h-screen overflow-y-auto">
        {/* Monitor Header */}
        <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Live Proctoring Monitor</h2>
            <p className="text-sm opacity-90">
              Quiz ID: {quizId} - {activeSessions.length} students online
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm">
                Status: <span className="text-green-400">Active</span>
              </div>
              <div className="text-sm">
                Alerts: <span className="text-red-400">{pendingAlerts.length} pending</span>
              </div>
            </div>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Main Monitoring Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Student Camera Feeds */}
            <div className="lg:col-span-3">
              {activeSessions.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Active Sessions</h3>
                  <p className="text-muted-foreground">
                    No students are currently taking this exam.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {activeSessions.map((session) => {
                    const hasHighAlerts = session.violationBreakdown.high > 0;
                    const hasMediumAlerts = session.violationBreakdown.medium > 0;
                    const status = hasHighAlerts ? 'Suspicious' : hasMediumAlerts ? 'Flagged' : 'Normal';
                    
                    return (
                      <div
                        key={session.sessionId}
                        className={`rounded-lg p-2 relative cursor-pointer transition-all ${
                          hasHighAlerts ? getViolationColor('high') :
                          hasMediumAlerts ? getViolationColor('medium') :
                          'bg-gray-100'
                        }`}
                        onClick={() => setSelectedSession(session.sessionId)}
                      >
                        <div className="aspect-video bg-gray-200 rounded mb-2 flex items-center justify-center relative">
                          <Video className="h-6 w-6 text-gray-400" />
                          <div className={`absolute top-2 left-2 text-white text-xs px-2 py-1 rounded ${
                            hasHighAlerts ? 'bg-red-600' :
                            hasMediumAlerts ? 'bg-yellow-600' :
                            'bg-green-600'
                          }`}>
                            {hasHighAlerts ? 'Alert' : hasMediumAlerts ? 'Warning' : 'Live'}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 font-medium truncate">
                          Student {session.studentId}
                        </div>
                        <div className="text-xs text-gray-500">Session Active</div>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-xs ${getStatusColor(status)}`}>
                            {status}
                          </span>
                          <Button variant="link" size="sm" className="text-xs h-auto p-0">
                            View
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Alert Panel */}
            <div className="bg-card">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium text-foreground mb-4">Active Alerts</h3>
                
                {pendingAlerts.length === 0 ? (
                  <div className="text-center py-4">
                    <Eye className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No active alerts</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingAlerts.slice(0, 5).map((alert) => (
                      <div
                        key={alert.id}
                        className={`rounded-lg p-3 ${getViolationColor(alert.severity)}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                            {alert.severity === 'high' ? 'High Priority' : 
                             alert.severity === 'medium' ? 'Medium Priority' : 'Low Priority'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.eventTimestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground font-medium">
                          {alert.eventDescription}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {alert.eventType} - Quiz Result ID: {alert.quizResultId}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Button size="sm" variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                            Review
                          </Button>
                          <Button size="sm" variant="outline">
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="font-medium text-foreground mb-2">System Status</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Camera Feeds</span>
                      <span className="text-sm text-green-600">
                        {activeSessions.length}/{activeSessions.length} Active
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Network Quality</span>
                      <span className="text-sm text-green-600">Excellent</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Server Load</span>
                      <span className="text-sm text-green-600">Normal</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
