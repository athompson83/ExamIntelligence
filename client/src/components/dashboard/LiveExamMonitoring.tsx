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
      <Card className="lg:col-span-2 rounded-2xl shadow-lg border-0">
        <CardHeader className="gradient-blue p-6">
          <div className="flex items-center justify-between">
            <div className="relative overflow-hidden rounded-lg h-6 w-48">
              <div className="h-full w-full bg-white/20 animate-pulse" />
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </div>
            <div className="relative overflow-hidden rounded-xl h-10 w-24">
              <div className="h-full w-full bg-white/20 animate-pulse" />
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="border rounded-xl p-5 relative overflow-hidden">
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-lg h-6 w-32">
                    <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="relative overflow-hidden rounded-lg aspect-square">
                        <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
                      </div>
                    ))}
                  </div>
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
    <Card className="lg:col-span-2 rounded-2xl shadow-lg border-0 bg-white dark:bg-gray-900 overflow-hidden">
      <CardHeader className="gradient-blue p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Video className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-white">Live Exam Monitoring</CardTitle>
          </div>
          <Button className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm rounded-xl">
            <Maximize2 className="mr-2 h-4 w-4" />
            Full View
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {!activeQuizzes || activeQuizzes.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full gradient-blue flex items-center justify-center">
              <Video className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No Active Exams</h3>
            <p className="text-muted-foreground text-base">
              There are no exams currently in progress. Check back later or create a new exam.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeQuizzes.map((quiz) => {
              const alertCount = (proctoringAlerts as any[])?.filter((alert: any) => alert.quizId === quiz.id)?.length || 0;
              
              return (
                <div 
                  key={quiz.id} 
                  className={`rounded-xl p-5 border-l-4 ${
                    alertCount > 0 ? 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20' : 'border-l-green-500 bg-green-50 dark:bg-green-950/20'
                  } hover:scale-105 hover:shadow-xl transition-all duration-300`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-foreground text-base">{quiz.title}</h4>
                    <Badge className={`rounded-full ${
                      alertCount > 0 ? 'gradient-amber' : 'gradient-green'
                    } text-white border-0`}>
                      {alertCount > 0 ? 'Alert' : 'Active'}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-4 space-y-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <span>Students taking exam</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <span>{formatTimeRemaining(quiz.scheduleEndTime)}</span>
                    </div>
                  </div>
                  
                  {/* Live Camera Feeds Preview */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {/* Mock camera feeds */}
                    <div className="bg-gray-200 dark:bg-gray-800 rounded-lg aspect-square flex items-center justify-center relative overflow-hidden">
                      <Video className="h-5 w-5 text-muted-foreground" />
                      <div className="absolute top-1.5 left-1.5 gradient-green text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Live
                      </div>
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-800 rounded-lg aspect-square flex items-center justify-center relative overflow-hidden">
                      <Video className="h-5 w-5 text-muted-foreground" />
                      <div className="absolute top-1.5 left-1.5 gradient-green text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Live
                      </div>
                    </div>
                    <div className={`rounded-lg aspect-square flex items-center justify-center relative overflow-hidden ${
                      alertCount > 0 ? 'bg-amber-100 dark:bg-amber-950 border-2 border-amber-500' : 'bg-gray-200 dark:bg-gray-800'
                    }`}>
                      {alertCount > 0 ? (
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <Video className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div className={`absolute top-1.5 left-1.5 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        alertCount > 0 ? 'gradient-amber' : 'gradient-green'
                      }`}>
                        {alertCount > 0 && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                        {alertCount > 0 ? 'Alert' : 'Live'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="text-xs font-medium text-muted-foreground">
                      {alertCount > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400">⚠️ {alertCount} alerts pending</span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400">✓ No alerts</span>
                      )}
                    </div>
                    <Button variant="link" size="sm" className="text-primary hover:text-primary/80 font-semibold">
                      View Details →
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
