import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Users, BookOpen, Bot } from "lucide-react";

export function QuickStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const statCards = [
    {
      title: "Active Exams",
      value: stats?.activeExams || 0,
      icon: Play,
      color: "text-primary",
      bgColor: "bg-primary/10",
      change: "+2 from yesterday"
    },
    {
      title: "Total Students",
      value: stats?.totalStudents || 0,
      icon: Users,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      change: "+15 new this week"
    },
    {
      title: "Item Banks",
      value: stats?.itemBanks || 0,
      icon: BookOpen,
      color: "text-accent",
      bgColor: "bg-accent/10",
      change: "3 updated today"
    },
    {
      title: "AI Validations",
      value: stats?.aiValidations || 0,
      icon: Bot,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      change: "24 pending review"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="card-mobile hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-10 w-20" />
                </div>
                <Skeleton className="h-14 w-14 md:h-16 md:w-16 rounded-xl" />
              </div>
              <Skeleton className="h-4 w-24 mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="hover:shadow-lg transition-all duration-300 card-mobile transform hover:scale-105">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-base md:text-sm font-semibold text-muted-foreground mb-2">{stat.title}</p>
                  <p className="text-3xl md:text-4xl font-bold text-overflow-mobile">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`${stat.bgColor} p-4 md:p-3 rounded-xl flex items-center justify-center`}>
                  <Icon className={`h-7 w-7 md:h-6 md:w-6 ${stat.color}`} />
                </div>
              </div>
              <p className="text-sm md:text-xs text-muted-foreground mt-4 md:mt-2 font-medium">{stat.change}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
