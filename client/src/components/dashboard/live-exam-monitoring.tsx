import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Maximize2, Users, Clock, Camera, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface ExamSession {
  id: string;
  title: string;
  studentsOnline: number;
  timeRemaining: number;
  status: 'active' | 'starting' | 'ended';
  alertCount: number;
}

export function LiveExamMonitoring() {
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  
  const { data: activeExams, isLoading } = useQuery({
    queryKey: ['/api/live-exams'],
  });

  const { isConnected } = useWebSocket();

  // Mock data for demonstration - replace with real data
  const mockExams: ExamSession[] = [
    {
      id: '1',
      title: 'Biology Final Exam',
      studentsOnline: 24,
      timeRemaining: 45,
      status: 'active',
      alertCount: 2
    },
    {
      id: '2',
      title: 'Chemistry Quiz',
      studentsOnline: 18,
      timeRemaining: 5,
      status: 'starting',
      alertCount: 0
    }
  ];

  const exams = activeExams || mockExams;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-secondary text-secondary-foreground">Active</Badge>;
      case 'starting':
        return <Badge className="bg-accent text-accent-foreground">Starting</Badge>;
      default:
        return <Badge variant="secondary">Ended</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Live Exam Monitoring</CardTitle>
            <Skeleton className="h-10 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <Skeleton className="h-6 w-32 mb-3" />
                <div className="space-y-2 mb-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[...Array(3)].map((_, j) => (
                    <Skeleton key={j} className="aspect-square rounded" />
                  ))}
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Maximize2 className="mr-2 h-5 w-5" />
            <CardTitle>Live Exam Monitoring</CardTitle>
            {isConnected && (
              <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                Connected
              </Badge>
            )}
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => window.location.href = '/live-exams'}
          >
            <Maximize2 className="mr-2 h-4 w-4" />
            Full View
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((exam: ExamSession) => (
            <div 
              key={exam.id} 
              className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
              onClick={() => setSelectedExam(exam.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-foreground">{exam.title}</h4>
                {getStatusBadge(exam.status)}
              </div>
              
              <div className="text-sm text-muted-foreground mb-3">
                <div className="flex items-center mb-1">
                  <Users className="mr-2 h-4 w-4" />
                  <span>{exam.studentsOnline} students online</span>
                </div>
                <div className="flex items-center mb-1">
                  <Clock className="mr-2 h-4 w-4" />
                  <span>
                    {exam.status === 'starting' 
                      ? `Starts in ${exam.timeRemaining} min`
                      : `${exam.timeRemaining} min remaining`
                    }
                  </span>
                </div>
              </div>
              
              {/* Live Camera Feeds Preview */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {/* Student camera feed 1 */}
                <div className="bg-muted rounded aspect-square flex items-center justify-center relative">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  {exam.status === 'active' && (
                    <div className="absolute top-1 left-1 bg-secondary text-secondary-foreground text-xs px-1 rounded">
                      Live
                    </div>
                  )}
                </div>
                
                {/* Student camera feed 2 */}
                <div className="bg-muted rounded aspect-square flex items-center justify-center relative">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  {exam.status === 'active' && (
                    <div className="absolute top-1 left-1 bg-secondary text-secondary-foreground text-xs px-1 rounded">
                      Live
                    </div>
                  )}
                </div>
                
                {/* Alert indicator or normal feed */}
                <div className={`rounded aspect-square flex items-center justify-center relative ${
                  exam.alertCount > 0 
                    ? 'bg-destructive/10 border border-destructive' 
                    : 'bg-muted'
                }`}>
                  {exam.alertCount > 0 ? (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  ) : (
                    <Camera className="h-4 w-4 text-muted-foreground" />
                  )}
                  {exam.alertCount > 0 && (
                    <div className="absolute top-1 left-1 bg-destructive text-destructive-foreground text-xs px-1 rounded">
                      Alert
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {exam.alertCount > 0 ? `${exam.alertCount} alerts pending` : 'All systems normal'}
                </div>
                <Button variant="link" size="sm" className="text-primary hover:text-primary/80 p-0">
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>

        {exams.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Camera className="h-8 w-8 mx-auto mb-2" />
            <p>No active exams at the moment</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
