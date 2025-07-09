import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Users, 
  PlayCircle, 
  BarChart3, 
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Brain,
  Shield,
  Eye
} from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { TipTooltip, AdminTooltip, FeatureTooltip } from '@/components/SmartTooltip';

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: dashboardStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: activeExamSessions, error: sessionsError } = useQuery({
    queryKey: ["/api/dashboard/active-sessions"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Handle errors from API calls
  useEffect(() => {
    if (statsError && isUnauthorizedError(statsError)) {
      toast({
        title: "Session expired",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 2000);
    }
  }, [statsError, toast]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (statsLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.firstName || 'User'}!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Here's what's happening with your assessments today
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {user?.role === 'admin' ? 'Administrator' : user?.role === 'teacher' ? 'Teacher' : 'Student'}
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="stats-card">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Exams</p>
                <p className="text-3xl font-bold text-primary">
                  {dashboardStats?.activeExams || 0}
                </p>
              </div>
              <div className="stats-icon bg-primary/10">
                <PlayCircle className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Students</p>
                <p className="text-3xl font-bold text-secondary">
                  {dashboardStats?.totalStudents || 0}
                </p>
              </div>
              <div className="stats-icon bg-secondary/10">
                <Users className="h-6 w-6 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Item Banks</p>
                <p className="text-3xl font-bold text-accent">
                  {dashboardStats?.itemBanks || 0}
                </p>
              </div>
              <div className="stats-icon bg-accent/10">
                <BookOpen className="h-6 w-6 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">AI Validations</p>
                <p className="text-3xl font-bold text-purple-600">
                  {dashboardStats?.aiValidations || 0}
                </p>
              </div>
              <div className="stats-icon bg-purple-100">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Exam Monitoring */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  Live Exam Monitoring
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Full View
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeExamSessions && activeExamSessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeExamSessions.map((session: any) => (
                    <div key={session.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">{session.title}</h4>
                        <Badge className="bg-secondary/10 text-secondary">Active</Badge>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        <div className="flex items-center mb-1">
                          <Users className="h-4 w-4 mr-2" />
                          <span>Student: {session.studentEmail}</span>
                        </div>
                        <div className="flex items-center mb-1">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>
                            {session.remainingTime !== null 
                              ? `${session.remainingTime} min remaining`
                              : `Started ${new Date(session.startedAt).toLocaleTimeString()}`
                            }
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">Status: {session.status}</div>
                        <Button variant="link" size="sm" onClick={() => window.location.href = `/live-exams?session=${session.id}`}>
                          Monitor
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Eye className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No Active Exam Sessions
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Start a live proctored exam to see monitoring details here.
                  </p>
                  <FeatureTooltip
                    id="live-proctoring-start"
                    title="Live Proctoring Feature 🎯"
                    content="Start a live proctored exam with real-time monitoring, violation detection, and comprehensive security measures."
                    position="top"
                  >
                    <Button onClick={() => window.location.href = '/live-exams'}>
                      Start Live Proctored Exam
                    </Button>
                  </FeatureTooltip>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">AI Validation Complete</p>
                    <p className="text-xs text-gray-500">Chemistry Item Bank - 15 questions validated</p>
                    <p className="text-xs text-gray-400">2 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-secondary/10 p-2 rounded-full flex-shrink-0">
                    <Users className="h-4 w-4 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">New User Registration</p>
                    <p className="text-xs text-gray-500">Prof. Michael Chen joined as Teacher</p>
                    <p className="text-xs text-gray-400">15 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-accent/10 p-2 rounded-full flex-shrink-0">
                    <AlertTriangle className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Proctoring Alert</p>
                    <p className="text-xs text-gray-500">Suspicious activity detected in Biology Exam</p>
                    <p className="text-xs text-gray-400">32 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 p-2 rounded-full flex-shrink-0">
                    <Brain className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">AI Content Generated</p>
                    <p className="text-xs text-gray-500">Study guide created for Physics Quiz</p>
                    <p className="text-xs text-gray-400">1 hour ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Performance Analytics</CardTitle>
              <div className="flex items-center space-x-2">
                <select className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm bg-white dark:bg-gray-800">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </select>
                <TipTooltip
                  id="analytics-report"
                  title="Analytics Reports 📊"
                  content="Access detailed performance reports, student insights, and question analytics to improve your assessments."
                  position="left"
                >
                  <Button variant="outline" size="sm">View Full Report</Button>
                </TipTooltip>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Exam Performance Chart */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Exam Performance Trends</h4>
                <div className="h-32 bg-gradient-to-r from-primary/20 to-secondary/20 rounded flex items-end justify-between p-4">
                  <div className="bg-primary w-4 h-16 rounded-t"></div>
                  <div className="bg-primary w-4 h-20 rounded-t"></div>
                  <div className="bg-primary w-4 h-24 rounded-t"></div>
                  <div className="bg-primary w-4 h-18 rounded-t"></div>
                  <div className="bg-primary w-4 h-28 rounded-t"></div>
                  <div className="bg-primary w-4 h-22 rounded-t"></div>
                  <div className="bg-primary w-4 h-26 rounded-t"></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Average score: 78.5%</p>
              </div>
              
              {/* Question Difficulty Distribution */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Question Difficulty</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Easy</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-secondary h-2 rounded-full w-3/4"></div>
                      </div>
                      <span className="text-xs text-gray-500">75%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Medium</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-accent h-2 rounded-full w-1/2"></div>
                      </div>
                      <span className="text-xs text-gray-500">50%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Hard</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-destructive h-2 rounded-full w-1/4"></div>
                      </div>
                      <span className="text-xs text-gray-500">25%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* AI Insights */}
              <div className="ai-insight">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">AI Insights</h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <TrendingUp className="h-4 w-4 text-secondary mt-1" />
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">Question clarity improved by 23%</p>
                      <p className="text-xs text-gray-500">After AI validation</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <BarChart3 className="h-4 w-4 text-secondary mt-1" />
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">Student engagement +15%</p>
                      <p className="text-xs text-gray-500">With adaptive testing</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Shield className="h-4 w-4 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">Exam integrity: 98.7%</p>
                      <p className="text-xs text-gray-500">Proctoring effectiveness</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button className="bg-primary hover:bg-primary/90 text-white p-4 h-auto flex items-center justify-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Create Item Bank</span>
          </Button>
          
          <Button className="bg-secondary hover:bg-secondary/90 text-white p-4 h-auto flex items-center justify-center space-x-2">
            <PlayCircle className="h-5 w-5" />
            <span>Build Quiz</span>
          </Button>
          
          <Button className="bg-accent hover:bg-accent/90 text-white p-4 h-auto flex items-center justify-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>AI Generate</span>
          </Button>
          
          <Button className="bg-purple-600 hover:bg-purple-700 text-white p-4 h-auto flex items-center justify-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Monitor Exams</span>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
