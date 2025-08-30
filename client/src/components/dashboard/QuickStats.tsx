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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            <Card className="p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <EnhancedSkeleton className="h-4 w-20" />
                  <EnhancedSkeleton className="h-8 w-12" />
                </div>
                <EnhancedSkeleton className="h-12 w-12 rounded-full" />
              </div>
              <EnhancedSkeleton className="h-3 w-24 mt-2" />
            </Card>
          </motion.div>
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
      {stats.map((stat, index) => (
        <motion.div
          key={stat.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card className="card-modern cursor-pointer group border-0 bg-gradient-to-br from-card to-card/95">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <motion.p 
                    className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors duration-300"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                  >
                    {stat.value}
                  </motion.p>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
                    {stat.name}
                  </p>
                </div>
                <motion.div 
                  className={cn("p-3 rounded-full group-hover:scale-110 transition-transform duration-300", stat.color)}
                  initial={{ rotate: -10 }}
                  animate={{ rotate: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 + 0.3 }}
                >
                  <stat.icon className="h-6 w-6" />
                </motion.div>
              </div>
              <motion.p 
                className="text-xs text-gray-500 dark:text-gray-400 mt-4 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 + 0.4 }}
              >
                {stat.change}
              </motion.p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
