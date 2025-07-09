import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  User, 
  Target, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Star,
  Trophy,
  BookOpen,
  Users,
  Calendar,
  Home,
  ChevronRight,
  Download,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import Layout from "@/components/Layout";
import { FeatureTooltip, AdminTooltip } from "@/components/SmartTooltip";

interface StudentProgress {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  totalTimeSpent: number;
  streakDays: number;
  lastActive: string;
  progressPercentage: number;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    earnedAt: string;
    icon: string;
  }>;
  recentScores: Array<{
    quizId: string;
    quizTitle: string;
    score: number;
    completedAt: string;
  }>;
}

interface ProgressAnalytics {
  totalStudents: number;
  activeStudents: number;
  averageCompletion: number;
  averageScore: number;
  totalQuizzes: number;
  completedAttempts: number;
  progressTrends: Array<{
    date: string;
    completions: number;
    averageScore: number;
  }>;
  scoreDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
}

interface QuizProgress {
  quizId: string;
  quizTitle: string;
  totalStudents: number;
  completedStudents: number;
  averageScore: number;
  completionRate: number;
  difficulty: number;
  timeSpent: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ProgressTracking() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [selectedQuiz, setSelectedQuiz] = useState("all");
  const [viewMode, setViewMode] = useState<'overview' | 'individual' | 'quiz'>('overview');

  const { data: progressAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/progress/analytics', selectedTimeRange],
  });

  const { data: studentProgress = [], isLoading: progressLoading } = useQuery({
    queryKey: ['/api/progress/students', selectedStudent, selectedTimeRange],
  });

  const { data: quizProgress = [], isLoading: quizLoading } = useQuery({
    queryKey: ['/api/progress/quizzes', selectedQuiz, selectedTimeRange],
  });

  const { data: students = [] } = useQuery({
    queryKey: ['/api/students'],
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ['/api/quizzes'],
  });

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 70) return "bg-yellow-500";
    if (percentage >= 50) return "bg-orange-500";
    return "bg-red-500";
  };

  const getAchievementIcon = (icon: string) => {
    switch (icon) {
      case 'star': return <Star className="h-4 w-4 text-yellow-500" />;
      case 'trophy': return <Trophy className="h-4 w-4 text-gold-500" />;
      case 'target': return <Target className="h-4 w-4 text-blue-500" />;
      default: return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const exportProgressData = () => {
    const csvContent = [
      ['Student Name', 'Email', 'Total Quizzes', 'Completed', 'Average Score', 'Progress %', 'Time Spent (hrs)', 'Streak Days', 'Last Active'],
      ...studentProgress.map((student: StudentProgress) => [
        student.studentName,
        student.studentEmail,
        student.totalQuizzes,
        student.completedQuizzes,
        student.averageScore.toFixed(1),
        student.progressPercentage.toFixed(1),
        (student.totalTimeSpent / 3600).toFixed(1),
        student.streakDays,
        format(new Date(student.lastActive), 'MMM dd, yyyy')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `progress-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (analyticsLoading || progressLoading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Home className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
          <span>Progress Tracking</span>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Progress Tracking</h1>
            <p className="text-muted-foreground mt-1">
              Monitor student learning progress and performance analytics
            </p>
          </div>
          <div className="flex gap-2">
            <AdminTooltip
              id="export-progress"
              title="Export Progress Data 📊"
              content="Download detailed progress reports for all students including completion rates, scores, and time analytics."
              position="top"
            >
              <Button variant="outline" onClick={exportProgressData}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </AdminTooltip>
            <FeatureTooltip
              id="progress-analytics"
              title="Progress Analytics 📈"
              content="Advanced analytics dashboard showing learning trends, completion rates, and performance insights."
              position="top"
            >
              <Button onClick={() => window.location.href = '/analytics'}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </FeatureTooltip>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Progress Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students.map((student: any) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select quiz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quizzes</SelectItem>
                  {quizzes.map((quiz: any) => (
                    <SelectItem key={quiz.id} value={quiz.id}>
                      {quiz.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Overview Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Active Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {progressAnalytics?.activeStudents || 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                of {progressAnalytics?.totalStudents || 0} total students
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Avg Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {progressAnalytics?.averageCompletion?.toFixed(1) || 0}%
              </div>
              <p className="text-sm text-gray-600 mt-1">
                across all quizzes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Trophy className="h-5 w-5 mr-2" />
                Avg Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {progressAnalytics?.averageScore?.toFixed(1) || 0}%
              </div>
              <p className="text-sm text-gray-600 mt-1">
                overall performance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Total Attempts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {progressAnalytics?.completedAttempts || 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                quiz attempts completed
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="individual" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="individual">Individual Progress</TabsTrigger>
            <TabsTrigger value="trends">Progress Trends</TabsTrigger>
            <TabsTrigger value="quizzes">Quiz Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Progress Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {studentProgress.map((student: StudentProgress) => (
                    <Card key={student.id} className="border-l-4 border-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{student.studentName}</CardTitle>
                            <p className="text-sm text-gray-600">{student.studentEmail}</p>
                          </div>
                          <Badge className={`${getProgressColor(student.progressPercentage)} text-white`}>
                            {student.progressPercentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{student.completedQuizzes}/{student.totalQuizzes} quizzes</span>
                          </div>
                          <Progress value={student.progressPercentage} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Average Score</p>
                            <p className="font-bold text-lg">{student.averageScore.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Time Spent</p>
                            <p className="font-bold text-lg">{(student.totalTimeSpent / 3600).toFixed(1)}h</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 mr-1 text-yellow-500" />
                            <span>{student.streakDays} day streak</span>
                          </div>
                          <span className="text-gray-500">
                            Last active: {format(new Date(student.lastActive), 'MMM dd')}
                          </span>
                        </div>

                        {student.achievements.length > 0 && (
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Recent Achievements</p>
                            <div className="flex flex-wrap gap-2">
                              {student.achievements.slice(0, 3).map((achievement) => (
                                <Badge key={achievement.id} variant="outline" className="text-xs">
                                  {getAchievementIcon(achievement.icon)}
                                  <span className="ml-1">{achievement.title}</span>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Progress Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressAnalytics?.progressTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="completions" stroke="#8884d8" name="Completions" />
                      <Line type="monotone" dataKey="averageScore" stroke="#82ca9d" name="Average Score" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={progressAnalytics?.scoreDistribution || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ range, percentage }) => `${range}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {(progressAnalytics?.scoreDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Quiz</th>
                        <th className="text-left p-2">Completion Rate</th>
                        <th className="text-left p-2">Average Score</th>
                        <th className="text-left p-2">Students</th>
                        <th className="text-left p-2">Avg Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quizProgress.map((quiz: QuizProgress) => (
                        <tr key={quiz.quizId} className="border-b">
                          <td className="p-2 font-medium">{quiz.quizTitle}</td>
                          <td className="p-2">
                            <div className="flex items-center">
                              <Progress value={quiz.completionRate} className="w-20 h-2 mr-2" />
                              <span className="text-sm">{quiz.completionRate.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="p-2">
                            <span className={`font-bold ${getProgressColor(quiz.averageScore) === 'bg-green-500' ? 'text-green-600' : 
                                                          getProgressColor(quiz.averageScore) === 'bg-yellow-500' ? 'text-yellow-600' : 
                                                          getProgressColor(quiz.averageScore) === 'bg-orange-500' ? 'text-orange-600' : 'text-red-600'}`}>
                              {quiz.averageScore.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-2">
                            <span className="text-sm">{quiz.completedStudents}/{quiz.totalStudents}</span>
                          </td>
                          <td className="p-2">
                            <span className="text-sm">{Math.round(quiz.timeSpent / 60)}m</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}