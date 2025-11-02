import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, UserPlus, AlertTriangle, Brain } from "lucide-react";
import { Notification } from "@/types";

export function RecentActivity() {
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    staleTime: 5000,
    gcTime: 30000,
  });

  if (isLoading) {
    return (
      <Card className="rounded-2xl shadow-lg border-0">
        <CardHeader className="p-6">
          <div className="relative overflow-hidden rounded-lg h-7 w-40">
            <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start space-x-3 p-3 rounded-xl">
                <div className="relative overflow-hidden rounded-full h-10 w-10 flex-shrink-0">
                  <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="relative overflow-hidden rounded-lg h-4 w-48">
                    <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
                  </div>
                  <div className="relative overflow-hidden rounded-lg h-3 w-32">
                    <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
                  </div>
                  <div className="relative overflow-hidden rounded-lg h-3 w-24">
                    <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "validation":
        return CheckCircle;
      case "user_registration":
        return UserPlus;
      case "proctoring_alert":
        return AlertTriangle;
      case "ai_content":
        return Brain;
      default:
        return CheckCircle;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "validation":
        return "gradient-blue";
      case "user_registration":
        return "gradient-green";
      case "proctoring_alert":
        return "gradient-amber";
      case "ai_content":
        return "gradient-purple";
      default:
        return "gradient-blue";
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const recentNotifications = notifications?.slice(0, 5) || [];

  return (
    <Card className="rounded-2xl shadow-lg border-0">
      <CardHeader className="p-6">
        <CardTitle className="text-xl font-bold text-foreground">Recent Activity</CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 pt-0">
        {recentNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full gradient-blue flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No Recent Activity</h3>
            <p className="text-muted-foreground text-base">
              Activity and notifications will appear here as they occur.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentNotifications.map((notification) => {
              const Icon = getActivityIcon(notification.type);
              const gradientClass = getActivityColor(notification.type);
              
              return (
                <div 
                  key={notification.id} 
                  className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 cursor-pointer"
                >
                  <div className={`p-2.5 rounded-full flex-shrink-0 ${gradientClass} shadow-md`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground mb-1">{notification.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                      {notification.priority === 'high' && (
                        <Badge className="gradient-red text-white border-0 text-xs rounded-full">
                          High Priority
                        </Badge>
                      )}
                    </div>
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
