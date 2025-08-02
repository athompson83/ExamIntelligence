import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, UserPlus, AlertTriangle, Bot } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  type: 'validation' | 'user' | 'alert' | 'ai';
  title: string;
  description: string;
  timestamp: string;
}

export function RecentActivity() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['/api/activities'],
  });

  // Mock data for demonstration - replace with real data
  const mockActivities: Activity[] = [
    {
      id: '1',
      type: 'validation',
      title: 'AI Validation Complete',
      description: 'Chemistry Item Bank - 15 questions validated',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      type: 'user',
      title: 'New User Registration',
      description: 'Prof. Michael Chen joined as Teacher',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      type: 'alert',
      title: 'Proctoring Alert',
      description: 'Suspicious activity detected in Biology Exam',
      timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString()
    },
    {
      id: '4',
      type: 'ai',
      title: 'AI Content Generated',
      description: 'Study guide created for Physics Quiz',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    }
  ];

  const activityList = activities || mockActivities;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'validation':
        return <CheckCircle className="text-primary h-4 w-4" />;
      case 'user':
        return <UserPlus className="text-secondary h-4 w-4" />;
      case 'alert':
        return <AlertTriangle className="text-accent h-4 w-4" />;
      case 'ai':
        return <Bot className="text-purple-600 h-4 w-4" />;
      default:
        return <CheckCircle className="text-primary h-4 w-4" />;
    }
  };

  const getActivityBg = (type: string) => {
    switch (type) {
      case 'validation':
        return 'bg-primary/10';
      case 'user':
        return 'bg-secondary/10';
      case 'alert':
        return 'bg-accent/10';
      case 'ai':
        return 'bg-purple-100';
      default:
        return 'bg-primary/10';
    }
  };

  if (isLoading) {
    return (
      <Card className="card-mobile">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-mobile">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-base md:text-lg">Recent Activity</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6 pt-0">
        <div className="space-y-3 md:space-y-4">
          {activityList.map((activity: Activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`${getActivityBg(activity.type)} p-2 rounded-full flex-shrink-0`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{activity.description}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {activityList.length === 0 && (
          <div className="text-center py-6 md:py-8 text-muted-foreground">
            <CheckCircle className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2" />
            <p className="text-sm">No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
