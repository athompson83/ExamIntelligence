import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { EnhancedSkeleton } from "@/components/ui/loading";
import { Play, Users, FolderOpen, Brain, TrendingUp, TrendingDown } from "lucide-react";
import { SystemAnalytics } from "@/types";
import { cn } from "@/lib/utils";

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
          <Card key={i} className="rounded-2xl shadow-lg animate-shimmer">
            <CardContent className="p-6">
              <div className="space-y-3">
                <EnhancedSkeleton className="h-4 w-20" />
                <EnhancedSkeleton className="h-10 w-16" />
                <EnhancedSkeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      name: "Active Exams",
      value: activeQuizzesLoading ? "..." : (activeQuizzes?.length || 0),
      icon: Play,
      gradient: "gradient-blue",
      change: "+2",
      changeLabel: "from yesterday",
      trend: "up",
    },
    {
      name: "Total Students",
      value: analytics?.users?.totalStudents || 0,
      icon: Users,
      gradient: "gradient-green",
      change: "+15",
      changeLabel: "new this week",
      trend: "up",
    },
    {
      name: "Item Banks",
      value: analytics?.testbanks?.totalTestbanks || 0,
      icon: FolderOpen,
      gradient: "gradient-amber",
      change: "+3",
      changeLabel: "updated today",
      trend: "up",
    },
    {
      name: "AI Validations",
      value: alertsLoading ? "..." : (proctoringAlerts?.length || 0),
      icon: Brain,
      gradient: "gradient-purple",
      change: "24",
      changeLabel: "pending review",
      trend: "neutral",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card 
          key={stat.name} 
          className={cn(
            "rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer border-0 relative overflow-hidden animate-fade-in",
            stat.gradient
          )}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardContent className="p-6 relative">
            {/* Icon - Large, absolute top-right with low opacity */}
            <div className="absolute top-4 right-4 opacity-20">
              <stat.icon className="h-16 w-16 text-white" />
            </div>
            
            {/* Content */}
            <div className="relative z-10">
              <p className="text-sm font-semibold text-white/80 uppercase tracking-wide mb-2">
                {stat.name}
              </p>
              <p className="text-4xl font-bold text-white mb-3">
                {stat.value}
              </p>
              
              {/* Trend Badge */}
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 w-fit">
                {stat.trend === "up" && <TrendingUp className="h-3 w-3 text-white" />}
                {stat.trend === "down" && <TrendingDown className="h-3 w-3 text-white" />}
                <span className="text-xs font-semibold text-white">
                  {stat.change} {stat.changeLabel}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
