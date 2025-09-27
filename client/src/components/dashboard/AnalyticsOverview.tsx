import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Lightbulb, Shield } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Mock data for charts - in real app this would come from API
const performanceData = [
  { name: 'Mon', score: 75 },
  { name: 'Tue', score: 82 },
  { name: 'Wed', score: 78 },
  { name: 'Thu', score: 85 },
  { name: 'Fri', score: 88 },
  { name: 'Sat', score: 82 },
  { name: 'Sun', score: 79 },
];

export function AnalyticsOverview() {
  const { data: systemAnalytics, isLoading } = useQuery({
    queryKey: ["/api/analytics/system"],
    // Cache analytics data for 5 minutes - it doesn't change frequently
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
  });

  if (isLoading) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-muted rounded-lg p-4">
                <Skeleton className="h-6 w-32 mb-3" />
                <Skeleton className="h-32 w-full mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="space-y-4">
          {/* Title on its own row */}
          <CardTitle className="text-lg font-semibold">Performance Analytics</CardTitle>
          
          {/* Dropdown on its own row on mobile, inline on larger screens */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Select defaultValue="7days">
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Button on its own row on mobile */}
            <Button variant="link" className="text-primary hover:text-primary/80 w-full sm:w-auto justify-start sm:justify-center">
              View Full Report
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Mobile-first layout: Chart takes full width, then 2-column grid for metrics */}
        <div className="space-y-6">
          {/* Exam Performance Chart - Full width on all devices */}
          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3">Exam Performance Trends</h4>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Average score: 78.5%</p>
          </div>

          {/* Metrics Grid - 1 column on mobile, 2 columns on larger screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Question Difficulty Distribution */}
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-3">Question Difficulty</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Easy</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={75} className="w-20" />
                    <span className="text-xs text-muted-foreground">75%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Medium</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={50} className="w-20" />
                    <span className="text-xs text-muted-foreground">50%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Hard</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={25} className="w-20" />
                    <span className="text-xs text-muted-foreground">25%</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* AI Insights */}
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-3">AI Insights</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Lightbulb className="h-4 w-4 text-accent mt-1" />
                  <div>
                    <p className="text-sm text-foreground">Question clarity improved by 23%</p>
                    <p className="text-xs text-muted-foreground">After AI validation</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <TrendingUp className="h-4 w-4 text-secondary mt-1" />
                  <div>
                    <p className="text-sm text-foreground">Student engagement +15%</p>
                    <p className="text-xs text-muted-foreground">With adaptive testing</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-foreground">Exam integrity: 98.7%</p>
                    <p className="text-xs text-muted-foreground">Proctoring effectiveness</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
