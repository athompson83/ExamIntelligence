import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Lightbulb, TrendingUp, Shield } from "lucide-react";
import { useState } from "react";

export function AnalyticsOverview() {
  const [timeRange, setTimeRange] = useState("7");
  
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/analytics/overview', timeRange],
  });

  // Mock data for demonstration
  const mockData = {
    examPerformance: {
      averageScore: 78.5,
      chartData: [16, 20, 24, 18, 28, 22, 26]
    },
    difficultyDistribution: {
      easy: 75,
      medium: 50,
      hard: 25
    },
    aiInsights: [
      {
        icon: Lightbulb,
        title: "Question clarity improved by 23%",
        subtitle: "After AI validation",
        color: "text-accent"
      },
      {
        icon: TrendingUp,
        title: "Student engagement +15%",
        subtitle: "With adaptive testing",
        color: "text-secondary"
      },
      {
        icon: Shield,
        title: "Exam integrity: 98.7%",
        subtitle: "Proctoring effectiveness",
        color: "text-primary"
      }
    ]
  };

  const data = analytics || mockData;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Performance Analytics</CardTitle>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-muted rounded-lg p-4">
                <Skeleton className="h-5 w-32 mb-3" />
                <Skeleton className="h-32 w-full mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Performance Analytics</CardTitle>
          <div className="flex items-center space-x-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="link" className="text-primary hover:text-primary/80">
              View Full Report
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Exam Performance Chart */}
          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3">Exam Performance Trends</h4>
            <div className="h-32 bg-gradient-to-r from-primary/20 to-secondary/20 rounded flex items-end justify-between p-4">
              {data.examPerformance.chartData.map((height, index) => (
                <div 
                  key={index}
                  className="bg-primary w-4 rounded-t transition-all duration-500"
                  style={{ height: `${height * 4}px` }}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Average score: {data.examPerformance.averageScore}%
            </p>
          </div>
          
          {/* Question Difficulty Distribution */}
          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3">Question Difficulty</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Easy</span>
                <div className="flex items-center space-x-2">
                  <Progress value={data.difficultyDistribution.easy} className="w-20" />
                  <span className="text-xs text-muted-foreground w-8">
                    {data.difficultyDistribution.easy}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Medium</span>
                <div className="flex items-center space-x-2">
                  <Progress value={data.difficultyDistribution.medium} className="w-20" />
                  <span className="text-xs text-muted-foreground w-8">
                    {data.difficultyDistribution.medium}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Hard</span>
                <div className="flex items-center space-x-2">
                  <Progress value={data.difficultyDistribution.hard} className="w-20" />
                  <span className="text-xs text-muted-foreground w-8">
                    {data.difficultyDistribution.hard}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* AI Insights */}
          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3">AI Insights</h4>
            <div className="space-y-3">
              {data.aiInsights.map((insight, index) => {
                const Icon = insight.icon;
                return (
                  <div key={index} className="flex items-start space-x-2">
                    <Icon className={`${insight.color} h-4 w-4 mt-1 flex-shrink-0`} />
                    <div>
                      <p className="text-sm text-foreground">{insight.title}</p>
                      <p className="text-xs text-muted-foreground">{insight.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
