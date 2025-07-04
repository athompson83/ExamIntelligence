import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Users, FolderOpen, Brain } from "lucide-react";
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-12" />
              </div>
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
            <Skeleton className="h-3 w-24 mt-2" />
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => (
        <Card key={stat.name} className="p-6">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
