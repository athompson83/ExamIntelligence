import { useQuery } from "@tanstack/react-query";
import { Play, Users, FolderOpen, Brain } from "lucide-react";
import { SystemAnalytics } from "@/types";
import { useLocation } from "wouter";
import { StatCard } from "@/components/ui/stat-card";
import { AsyncState } from "@/components/ui/async-state";

export function QuickStats() {
  const [, setLocation] = useLocation();
  
  const { data: analytics, isLoading, isError, error, refetch } = useQuery<SystemAnalytics>({
    queryKey: ["/api/analytics/system"],
    staleTime: 30000,
    gcTime: 60000,
  });

  const { data: activeQuizzes, isLoading: activeQuizzesLoading } = useQuery({
    queryKey: ["/api/quizzes/active"],
    staleTime: 30000,
    gcTime: 60000,
  });

  const { data: proctoringAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["/api/proctoring/alerts"],
    staleTime: 5000,
    gcTime: 30000,
  });

  const activeExamsCount = activeQuizzesLoading ? "..." : ((activeQuizzes as any[])?.length || 0);
  const totalStudents = analytics?.users?.totalStudents || 0;
  const totalTestbanks = analytics?.testbanks?.totalTestbanks || 0;
  const validationsCount = alertsLoading ? "..." : ((proctoringAlerts as any[])?.length || 0);
  
  const customLoadingState = (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="relative overflow-hidden rounded-2xl shadow-lg h-40">
          <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
        </div>
      ))}
    </div>
  );

  return (
    <AsyncState
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={refetch}
      loadingComponent={customLoadingState}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Exams"
          value={activeExamsCount}
          subtitle="+2 from yesterday"
          gradient="blue"
          icon={Play}
          onClick={() => setLocation('/live-exams')}
          testId="stat-card-active-exams"
        />

        <StatCard
          title="Total Students"
          value={totalStudents}
          subtitle="+15 new this week"
          gradient="green"
          icon={Users}
          onClick={() => setLocation('/user-management')}
          testId="stat-card-total-students"
        />

        <StatCard
          title="Item Banks"
          value={totalTestbanks}
          subtitle="+3 updated today"
          gradient="orange"
          icon={FolderOpen}
          onClick={() => setLocation('/item-banks')}
          testId="stat-card-item-banks"
        />

        <StatCard
          title="AI Validations"
          value={validationsCount}
          subtitle="24 pending review"
          gradient="purple"
          icon={Brain}
          onClick={() => setLocation('/analytics')}
          testId="stat-card-ai-validations"
        />
      </div>
    </AsyncState>
  );
}
