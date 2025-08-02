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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="card-mobile">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-10 w-10 md:h-12 md:w-12 rounded-full" />
              </div>
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow card-mobile">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-full`}>
                  <Icon className={`${stat.color} h-5 w-5`} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{stat.change}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
