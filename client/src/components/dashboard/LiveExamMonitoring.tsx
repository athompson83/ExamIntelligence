import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Maximize2, Users, Clock, AlertTriangle, Video } from "lucide-react";
import { Quiz } from "@/types";

export function LiveExamMonitoring() {
  const { data: activeQuizzes, isLoading } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes/active"],
    // Reasonable refresh for active quizzes
    staleTime: 30 * 1000, // 30 seconds - active quizzes don't change often
    gcTime: 2 * 60 * 1000, // 2 minutes cache
    refetchInterval: 60 * 1000, // Refresh every minute for truly active exams
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    retry: 1, // Only retry once on failure
  });

  const { data: proctoringAlerts } = useQuery({
    queryKey: ["/api/proctoring/alerts"],
    // Proctoring alerts will be handled via WebSocket
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchInterval: false, // Disabled - using WebSocket for real-time alerts
  });

  if (isLoading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <Skeleton className="h-6 w-32 mb-3" />
                <div className="space-y-2 mb-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <Skeleton className="aspect-square" />
                  <Skeleton className="aspect-square" />
                  <Skeleton className="aspect-square" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatTimeRemaining = (endTime: Date | null): string => {
    if (!endTime) return "No time limit";
    
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m remaining`;
    }
    
    return `${minutes}m remaining`;
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Live Exam Monitoring</CardTitle>
          <Button>
            <Maximize2 className="mr-2 h-4 w-4" />
            Full View
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {!activeQuizzes || activeQuizzes.length === 0 ? (
          <div className="text-center py-8">
            <Video className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Active Exams</h3>
            <p className="text-muted-foreground">
              There are no exams currently in progress. Check back later or create a new exam.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeQuizzes.map((quiz) => {
              const alertCount = proctoringAlerts?.filter((alert: any) => alert.quizId === quiz.id)?.length || 0;
              
              return (
                <div key={quiz.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-foreground">{quiz.title}</h4>
                    <Badge variant="secondary" className="bg-secondary/10 text-secondary">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-3">
                    <div className="flex items-center mb-1">
                      <Users className="mr-2 h-4 w-4" />
                      <span>Students taking exam</span>
                    </div>
                    <div className="flex items-center mb-1">
                      <Clock className="mr-2 h-4 w-4" />
                      <span>{formatTimeRemaining(quiz.scheduleEndTime)}</span>
                    </div>
                  </div>
                  
                  {/* Live Camera Feeds Preview */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {/* Mock camera feeds */}
                    <div className="bg-muted rounded aspect-square flex items-center justify-center relative">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <div className="absolute top-1 left-1 bg-secondary text-white text-xs px-1 rounded">
                        Live
                      </div>
                    </div>
                    <div className="bg-muted rounded aspect-square flex items-center justify-center relative">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <div className="absolute top-1 left-1 bg-secondary text-white text-xs px-1 rounded">
                        Live
                      </div>
                    </div>
                    <div className={`rounded aspect-square flex items-center justify-center relative ${
                      alertCount > 0 ? 'bg-destructive/10 border border-destructive' : 'bg-muted'
                    }`}>
                      {alertCount > 0 ? (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      ) : (
                        <Video className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div className={`absolute top-1 left-1 text-white text-xs px-1 rounded ${
                        alertCount > 0 ? 'bg-destructive' : 'bg-secondary'
                      }`}>
                        {alertCount > 0 ? 'Alert' : 'Live'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {alertCount > 0 ? `${alertCount} alerts pending` : 'No alerts'}
                    </div>
                    <Button variant="link" size="sm" className="text-primary hover:text-primary/80">
                      View Details
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
