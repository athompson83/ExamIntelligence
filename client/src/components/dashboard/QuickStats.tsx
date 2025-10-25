import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Users, FolderOpen, Brain, TrendingUp, TrendingDown } from "lucide-react";
import { SystemAnalytics } from "@/types";

export function QuickStats() {
  const { data: analytics, isLoading } = useQuery<SystemAnalytics>({
    queryKey: ["/api/analytics/system"],
  });

  const { data: activeQuizzes, isLoading: activeQuizzesLoading } = useQuery({
    queryKey: ["/api/quizzes/active"],
  });

  const { data: proctoringAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["/api/proctoring/alerts"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl shadow-lg">
            <div className="h-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
          </div>
        ))}
      </div>
    );
  }

  const activeExamsCount = activeQuizzesLoading ? "..." : ((activeQuizzes as any[])?.length || 0);
  const totalStudents = analytics?.users?.totalStudents || 0;
  const totalTestbanks = analytics?.testbanks?.totalTestbanks || 0;
  const validationsCount = alertsLoading ? "..." : ((proctoringAlerts as any[])?.length || 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Active Exams - Blue Gradient */}
      <Card className="rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-blue-600 to-blue-500 text-white animate-fade-in relative overflow-hidden">
        <CardContent className="p-6 relative">
          <div className="absolute top-4 right-4 opacity-20">
            <Play className="h-16 w-16 text-white" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-white/80 uppercase tracking-wide mb-2">
              Active Exams
            </p>
            <p className="text-4xl font-bold text-white mb-3">
              {activeExamsCount}
            </p>
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 w-fit">
              <TrendingUp className="h-3 w-3 text-white" />
              <span className="text-xs font-semibold text-white">
                +2 from yesterday
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Students - Green Gradient */}
      <Card 
        className="rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-green-600 to-emerald-500 text-white animate-fade-in relative overflow-hidden"
        style={{ animationDelay: '100ms' }}
      >
        <CardContent className="p-6 relative">
          <div className="absolute top-4 right-4 opacity-20">
            <Users className="h-16 w-16 text-white" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-white/80 uppercase tracking-wide mb-2">
              Total Students
            </p>
            <p className="text-4xl font-bold text-white mb-3">
              {totalStudents}
            </p>
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 w-fit">
              <TrendingUp className="h-3 w-3 text-white" />
              <span className="text-xs font-semibold text-white">
                +15 new this week
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Item Banks - Orange/Amber Gradient */}
      <Card 
        className="rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-orange-600 to-amber-500 text-white animate-fade-in relative overflow-hidden"
        style={{ animationDelay: '200ms' }}
      >
        <CardContent className="p-6 relative">
          <div className="absolute top-4 right-4 opacity-20">
            <FolderOpen className="h-16 w-16 text-white" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-white/80 uppercase tracking-wide mb-2">
              Item Banks
            </p>
            <p className="text-4xl font-bold text-white mb-3">
              {totalTestbanks}
            </p>
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 w-fit">
              <TrendingUp className="h-3 w-3 text-white" />
              <span className="text-xs font-semibold text-white">
                +3 updated today
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Validations - Purple Gradient */}
      <Card 
        className="rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-purple-600 to-purple-400 text-white animate-fade-in relative overflow-hidden"
        style={{ animationDelay: '300ms' }}
      >
        <CardContent className="p-6 relative">
          <div className="absolute top-4 right-4 opacity-20">
            <Brain className="h-16 w-16 text-white" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-white/80 uppercase tracking-wide mb-2">
              AI Validations
            </p>
            <p className="text-4xl font-bold text-white mb-3">
              {validationsCount}
            </p>
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 w-fit">
              <span className="text-xs font-semibold text-white">
                24 pending review
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
