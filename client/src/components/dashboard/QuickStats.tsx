import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { EnhancedSkeleton } from "@/components/ui/loading";
import { Play, Users, FolderOpen, Brain } from "lucide-react";
import { SystemAnalytics } from "@/types";
import { motion } from "framer-motion";
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <EnhancedSkeleton className="h-4 w-20" />
                  <EnhancedSkeleton className="h-8 w-12" />
                </div>
                <EnhancedSkeleton className="h-12 w-12 rounded-full" />
              </div>
              <EnhancedSkeleton className="h-3 w-24 mt-2" />
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
      color: "bg-primary/10 text-primary",
      change: "+2 from yesterday",
    },
    {
      name: "Total Students",
      value: analytics?.users?.totalStudents || 0,
      icon: Users,
      color: "bg-secondary/10 text-secondary",
      change: "+15 new this week",
    },
    {
      name: "Item Banks",
      value: analytics?.testbanks?.totalTestbanks || 0,
      icon: FolderOpen,
      color: "bg-accent/10 text-accent",
      change: "3 updated today",
    },
    {
      name: "AI Validations",
      value: alertsLoading ? "..." : (proctoringAlerts?.length || 0),
      icon: Brain,
      color: "bg-purple-100 text-purple-600",
      change: "24 pending review",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={stat.name} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {stat.change}
                </p>
              </div>
              <div className={cn("p-3 rounded-full", stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
