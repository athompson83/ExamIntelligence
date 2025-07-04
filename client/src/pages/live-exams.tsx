import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { ProctoringMonitor } from "@/components/proctoring/proctoring-monitor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Play, Users, Clock, AlertTriangle, Eye, Calendar } from "lucide-react";
import { useEffect } from "react";

export default function LiveExams() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [showProctoring, setShowProctoring] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: activeExams, isLoading: examsLoading } = useQuery({
    queryKey: ['/api/live-exams/active'],
    enabled: isAuthenticated,
  });

  const { data: scheduledExams, isLoading: scheduledLoading } = useQuery({
    queryKey: ['/api/live-exams/scheduled'],
    enabled: isAuthenticated,
  });

  const { data: proctoringAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/proctoring/logs/unresolved'],
    enabled: isAuthenticated,
  });

  if (isLoading || examsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <TopBar />
        
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Live Exam Monitoring</h1>
              <p className="text-gray-600">Monitor active exams and manage proctoring</p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/quiz-builder'}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Exam
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => setShowProctoring(true)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Proctoring Dashboard
              </Button>
            </div>
          </div>

          <Tabs defaultValue="active" className="space-y-6">
            <TabsList>
              <TabsTrigger value="active">Active Exams</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeExams?.map((exam: any) => (
                  <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{exam.title}</CardTitle>
                        <Badge className="bg-secondary text-secondary-foreground">
                          <Play className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center">
                            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{exam.activeStudents} students</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{exam.timeRemaining} min left</span>
                          </div>
                        </div>

                        {exam.alertCount > 0 && (
                          <div className="flex items-center p-3 bg-destructive/10 border border-destructive rounded-lg">
                            <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />
                            <span className="text-sm text-destructive">
                              {exam.alertCount} proctoring alerts
                            </span>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedExam(exam.id)}
                          >
                            Monitor
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowProctoring(true)}
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            Proctoring
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {(!activeExams || activeExams.length === 0) && (
                  <div className="col-span-full text-center py-12">
                    <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No active exams</h3>
                    <p className="text-gray-600 mb-4">Schedule an exam to start monitoring</p>
                    <Button onClick={() => window.location.href = '/quiz-builder'}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Exam
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scheduledExams?.map((exam: any) => (
                  <Card key={exam.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{exam.title}</CardTitle>
                        <Badge variant="outline">
                          <Calendar className="mr-1 h-3 w-3" />
                          Scheduled
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                          <p>Starts: {new Date(exam.startTime).toLocaleString()}</p>
                          <p>Duration: {exam.duration} minutes</p>
                          <p>Enrolled: {exam.enrolledStudents} students</p>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            Start Early
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {(!scheduledExams || scheduledExams.length === 0) && (
                  <div className="col-span-full text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled exams</h3>
                    <p className="text-gray-600">No upcoming exams scheduled</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <div className="space-y-4">
                {proctoringAlerts?.map((alert: any) => (
                  <Card key={alert.id} className="border-l-4 border-l-destructive">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="h-5 w-5 text-destructive mt-1" />
                          <div>
                            <h4 className="font-medium text-foreground">{alert.eventType}</h4>
                            <p className="text-sm text-muted-foreground">{alert.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="destructive" size="sm">
                            Review
                          </Button>
                          <Button variant="outline" size="sm">
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {(!proctoringAlerts || proctoringAlerts.length === 0) && (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No active alerts</h3>
                    <p className="text-gray-600">All proctoring alerts have been resolved</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Proctoring Monitor Modal */}
      {showProctoring && (
        <ProctoringMonitor 
          isOpen={showProctoring}
          onClose={() => setShowProctoring(false)}
          examId={selectedExam}
        />
      )}
    </div>
  );
}
