import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  BarChart3, 
  Download, 
  Filter, 
  Search, 
  TrendingUp, 
  User, 
  Calendar,
  FileText,
  Eye,
  Edit,
  Mail,
  MessageCircle,
  Star,
  AlertTriangle,
  CheckCircle,
  Home,
  ChevronRight
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import Layout from "@/components/Layout";
import { FeatureTooltip, AdminTooltip } from "@/components/SmartTooltip";

interface GradebookEntry {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  quizId: string;
  quizTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: string;
  attempts: number;
  timeSpent: number;
  status: 'completed' | 'in_progress' | 'not_started' | 'overdue';
  feedback?: string;
}

interface QuizStats {
  id: string;
  title: string;
  totalStudents: number;
  completedStudents: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  dueDate?: string;
}

export default function Gradebook() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [feedbackModal, setFeedbackModal] = useState<{ open: boolean; entry: GradebookEntry | null }>({
    open: false,
    entry: null
  });
  const [feedback, setFeedback] = useState("");
  const { toast } = useToast();

  const { data: gradebook = [], isLoading } = useQuery({
    queryKey: ['/api/gradebook'],
  });

  const { data: quizStats = [] } = useQuery({
    queryKey: ['/api/gradebook/quiz-stats'],
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ['/api/quizzes'],
  });

  const updateFeedbackMutation = useMutation({
    mutationFn: async ({ entryId, feedback }: { entryId: string; feedback: string }) => {
      return apiRequest(`/api/gradebook/${entryId}/feedback`, {
        method: 'PUT',
        body: JSON.stringify({ feedback })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gradebook'] });
      setFeedbackModal({ open: false, entry: null });
      setFeedback("");
      toast({
        title: "Feedback Updated",
        description: "Student feedback has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update feedback. Please try again.",
        variant: "destructive",
      });
    }
  });

  const emailStudentMutation = useMutation({
    mutationFn: async ({ studentId, subject, message }: { studentId: string; subject: string; message: string }) => {
      return apiRequest('/api/gradebook/send-email', {
        method: 'POST',
        body: JSON.stringify({ studentId, subject, message })
      });
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Email has been sent to the student successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    }
  });

  const exportGradebook = () => {
    const csvContent = [
      ['Student Name', 'Email', 'Quiz', 'Score', 'Max Score', 'Percentage', 'Status', 'Completed At', 'Attempts', 'Time Spent (min)'],
      ...filteredGradebook.map(entry => [
        entry.studentName,
        entry.studentEmail,
        entry.quizTitle,
        entry.score,
        entry.maxScore,
        entry.percentage,
        entry.status,
        format(new Date(entry.completedAt), 'MMM dd, yyyy HH:mm'),
        entry.attempts,
        Math.round(entry.timeSpent / 60)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gradebook-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredGradebook = gradebook.filter((entry: GradebookEntry) => {
    const matchesSearch = entry.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.quizTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesQuiz = selectedQuiz === "all" || entry.quizId === selectedQuiz;
    const matchesStatus = selectedStatus === "all" || entry.status === selectedStatus;
    
    return matchesSearch && matchesQuiz && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'not_started':
        return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 80) return "text-green-500";
    if (percentage >= 70) return "text-yellow-600";
    if (percentage >= 60) return "text-orange-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
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
          <span>Gradebook</span>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gradebook</h1>
            <p className="text-muted-foreground mt-1">
              Track student progress and manage grades
            </p>
          </div>
          <div className="flex gap-2">
            <FeatureTooltip
              id="export-gradebook"
              title="Export Gradebook 📊"
              content="Download complete gradebook data as CSV file for external analysis or record keeping."
              position="top"
            >
              <Button variant="outline" onClick={exportGradebook}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </FeatureTooltip>
            <AdminTooltip
              id="gradebook-analytics"
              title="Grade Analytics"
              content="View detailed performance analytics and trends across all quizzes and students."
              position="top"
            >
              <Button onClick={() => window.location.href = '/analytics'}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </AdminTooltip>
          </div>
        </div>

        {/* Quiz Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quizStats.slice(0, 4).map((quiz: QuizStats) => (
            <Card key={quiz.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{quiz.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completion</span>
                    <span className="text-sm font-medium">
                      {quiz.completedStudents}/{quiz.totalStudents}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average</span>
                    <span className="text-sm font-medium">
                      {quiz.averageScore.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Range</span>
                    <span className="text-sm font-medium">
                      {quiz.lowestScore}% - {quiz.highestScore}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search students or quizzes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
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
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Gradebook Table */}
        <Card>
          <CardHeader>
            <CardTitle>Student Grades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Quiz</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGradebook.map((entry: GradebookEntry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{entry.studentName}</p>
                          <p className="text-sm text-gray-500">{entry.studentEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{entry.quizTitle}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className={`font-medium ${getScoreColor(entry.percentage)}`}>
                            {entry.score}/{entry.maxScore}
                          </span>
                          <p className="text-sm text-gray-500">
                            {entry.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(entry.status)}
                      </TableCell>
                      <TableCell>
                        {entry.completedAt ? (
                          <span className="text-sm">
                            {format(new Date(entry.completedAt), 'MMM dd, yyyy')}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{entry.attempts}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{Math.round(entry.timeSpent / 60)}m</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFeedbackModal({ open: true, entry })}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => emailStudentMutation.mutate({
                              studentId: entry.studentId,
                              subject: `Grade Update: ${entry.quizTitle}`,
                              message: `Your grade for ${entry.quizTitle} is ${entry.percentage.toFixed(1)}%`
                            })}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Modal */}
        <Dialog open={feedbackModal.open} onOpenChange={(open) => setFeedbackModal({ open, entry: feedbackModal.entry })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Provide Feedback</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Student: {feedbackModal.entry?.studentName}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Quiz: {feedbackModal.entry?.quizTitle}
                </p>
              </div>
              <div>
                <Textarea
                  placeholder="Enter feedback for the student..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setFeedbackModal({ open: false, entry: null })}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (feedbackModal.entry) {
                      updateFeedbackMutation.mutate({
                        entryId: feedbackModal.entry.id,
                        feedback
                      });
                    }
                  }}
                >
                  Save Feedback
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}