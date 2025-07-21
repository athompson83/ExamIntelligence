import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Users, 
  Clock, 
  BarChart, 
  Settings,
  Eye
} from "lucide-react";
import { format } from "date-fns";

interface CATExam {
  id: string;
  title: string;
  description: string;
  subject: string;
  estimatedDuration: string;
  status: 'draft' | 'published' | 'archived';
  proctoringEnabled: boolean;
  createdAt: string;
  categories: Array<{
    name: string;
    percentage: number;
  }>;
  sessions?: number;
  avgScore?: number;
}

export default function CATExamManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedExam, setSelectedExam] = useState<CATExam | null>(null);

  // Fetch CAT exams
  const { data: catExams, isLoading } = useQuery<CATExam[]>({
    queryKey: ['/api/cat-exams'],
    enabled: !!user
  });

  // Delete CAT exam mutation
  const deleteCATExamMutation = useMutation({
    mutationFn: async (examId: string) => {
      return await apiRequest(`/api/cat-exams/${examId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cat-exams'] });
      toast({
        title: "CAT Exam Deleted",
        description: "The CAT exam has been deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete CAT exam",
        variant: "destructive"
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleEdit = (exam: CATExam) => {
    // Navigate to CAT exam builder with the exam ID
    window.location.href = `/cat-exam-builder?edit=${exam.id}`;
  };

  const handleViewDetails = (exam: CATExam) => {
    setSelectedExam(exam);
  };

  const handleStartSession = (exam: CATExam) => {
    // Navigate to CAT exam testing page
    window.location.href = `/cat-exam-test?examId=${exam.id}`;
  };

  if (isLoading) {
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              CAT Exam Manager
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage Computer Adaptive Testing exams and monitor performance
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => window.location.href = '/cat-exam-builder'}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Create CAT Exam</span>
            </Button>
            <Button
              onClick={() => window.location.href = '/cat-exam-test'}
              variant="outline"
            >
              <Play className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Test Interface</span>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total CAT Exams</p>
                  <p className="text-2xl font-bold">{catExams?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                  <p className="text-2xl font-bold">
                    {catExams?.reduce((sum, exam) => sum + (exam.sessions || 0), 0) || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Published Exams</p>
                  <p className="text-2xl font-bold">
                    {catExams?.filter(exam => exam.status === 'published').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg. Completion</p>
                  <p className="text-2xl font-bold">
                    {catExams?.reduce((sum, exam) => sum + (exam.avgScore || 0), 0) || 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CAT Exams Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Your CAT Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            {catExams && catExams.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam Details</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Categories</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catExams.map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell>
                          <div>
                            <h3 className="font-medium">{exam.title}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {exam.description}
                            </p>
                            {exam.createdAt && (
                              <p className="text-xs text-gray-400 mt-1">
                                Created {format(new Date(exam.createdAt), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{exam.subject}</Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(exam.status)}
                          {exam.proctoringEnabled && (
                            <Badge variant="outline" className="ml-2">
                              Proctored
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{exam.estimatedDuration}</span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {exam.categories?.slice(0, 2).map((category, index) => (
                              <div key={index} className="text-xs">
                                {category.name}: {category.percentage}%
                              </div>
                            ))}
                            {exam.categories && exam.categories.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{exam.categories.length - 2} more
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(exam)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(exam)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStartSession(exam)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete CAT Exam</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{exam.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteCATExamMutation.mutate(exam.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No CAT Exams Yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first Computer Adaptive Test to get started
                </p>
                <Button
                  onClick={() => window.location.href = '/cat-exam-builder'}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create CAT Exam
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exam Details Modal */}
        {selectedExam && (
          <Dialog open={!!selectedExam} onOpenChange={() => setSelectedExam(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedExam.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{selectedExam.description}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Categories & Distribution</h4>
                  <div className="space-y-2">
                    {selectedExam.categories?.map((category, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">{category.name}</span>
                        <Badge variant="secondary">{category.percentage}%</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Status</h4>
                    {getStatusBadge(selectedExam.status)}
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Duration</h4>
                    <p className="text-sm">{selectedExam.estimatedDuration}</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
}