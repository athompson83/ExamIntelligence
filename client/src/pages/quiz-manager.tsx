import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Plus, 
  Edit, 
  Eye, 
  Copy, 
  Trash2, 
  Clock, 
  Users, 
  FileText,
  Calendar,
  BarChart3,
  Home,
  ChevronRight,
  Search,
  UserPlus,
  Play
} from "lucide-react";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Quiz {
  id: string;
  title: string;
  description?: string;
  questionCount?: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  timeLimit?: number;
  maxAttempts?: number;
  attempts?: number;
  difficulty?: number;
  status?: string;
  tags?: string[];
}

export default function QuizManager() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['/api/quizzes'],
  });

  const deleteQuizMutation = useMutation({
    mutationFn: async (quizId: string) => {
      await apiRequest(`/api/quizzes/${quizId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes'] });
      toast({
        title: "Success",
        description: "Quiz deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive",
      });
    },
  });

  const copyQuizMutation = useMutation({
    mutationFn: async ({ quizId, newTitle }: { quizId: string; newTitle: string }) => {
      return await apiRequest(`/api/quizzes/${quizId}/copy`, { 
        method: "POST", 
        body: JSON.stringify({ newTitle }) 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes'] });
      toast({
        title: "Success",
        description: "Quiz copied successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to copy quiz",
        variant: "destructive",
      });
    },
  });

  const assignQuizMutation = useMutation({
    mutationFn: async ({ quizId, studentIds, dueDate }: { quizId: string; studentIds: string[]; dueDate?: string }) => {
      return await apiRequest(`/api/quizzes/${quizId}/assign`, { 
        method: "POST", 
        body: JSON.stringify({ studentIds, dueDate }) 
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quiz assigned successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to assign quiz",
        variant: "destructive",
      });
    },
  });

  const startLiveExamMutation = useMutation({
    mutationFn: async (quizId: string) => {
      return await apiRequest(`/api/quizzes/${quizId}/start-live`, { method: "POST" });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Live exam started! Access code: ${data.accessCode}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start live exam",
        variant: "destructive",
      });
    },
  });

  const handleCreateNew = () => {
    setLocation('/enhanced-quiz-builder');
  };

  const handleEdit = (quizId: string) => {
    setLocation(`/enhanced-quiz-builder?id=${quizId}`);
  };

  const handlePreview = (quizId: string) => {
    setLocation(`/quiz-preview/${quizId}`);
  };

  const handleDuplicate = (quiz: Quiz) => {
    const newTitle = window.prompt('Enter a title for the copied quiz:', `Copy of ${quiz.title}`);
    if (newTitle && newTitle.trim()) {
      copyQuizMutation.mutate({ quizId: quiz.id, newTitle: newTitle.trim() });
    }
  };

  const handleDelete = (quizId: string) => {
    if (window.confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) {
      deleteQuizMutation.mutate(quizId);
    }
  };

  const handleAnalytics = (quizId: string) => {
    setLocation(`/analytics?quiz=${quizId}`);
  };

  const handleAssign = (quiz: Quiz) => {
    // Navigate to assignment page with pre-selected quiz
    setLocation(`/assignments?quizId=${quiz.id}&quizTitle=${encodeURIComponent(quiz.title)}`);
  };

  const handleStartLiveExam = (quiz: Quiz) => {
    // Navigate to live exam setup page with pre-selected quiz
    setLocation(`/live-exams?quizId=${quiz.id}&quizTitle=${encodeURIComponent(quiz.title)}`);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Ensure quizzes is an array
  const quizzesArray = Array.isArray(quizzes) ? quizzes : [];
  
  // Filter quizzes based on search term
  const filteredQuizzes = quizzesArray.filter((quiz: Quiz) =>
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (quiz.description && quiz.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const draftQuizzes = filteredQuizzes.filter((q: Quiz) => !q.publishedAt);
  const publishedQuizzes = filteredQuizzes.filter((q: Quiz) => q.publishedAt);

  return (
    <div className="p-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
        <Button variant="ghost" size="sm" onClick={() => setLocation('/dashboard')}>
          <Home className="h-4 w-4" />
        </Button>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Quiz Manager</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quiz Manager</h1>
          <p className="text-muted-foreground">Create, edit, and manage your quizzes</p>
        </div>
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Quiz
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{quizzesArray.length}</p>
                <p className="text-sm text-muted-foreground">Total Quizzes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Edit className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{draftQuizzes.length}</p>
                <p className="text-sm text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{publishedQuizzes.length}</p>
                <p className="text-sm text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {quizzesArray.reduce((sum, quiz) => sum + (quiz.questionCount || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Questions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quiz Lists */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Quizzes ({filteredQuizzes.length})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({draftQuizzes.length})</TabsTrigger>
          <TabsTrigger value="published">Published ({publishedQuizzes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredQuizzes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? "No quizzes match your search" : "No quizzes yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Try adjusting your search terms" : "Get started by creating your first quiz"}
                </p>
                {!searchTerm && (
                  <Button onClick={handleCreateNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Quiz
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quiz Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Time Limit</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuizzes.map((quiz: Quiz) => (
                    <TableRow key={quiz.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{quiz.title || "Untitled Quiz"}</div>
                          {quiz.description && (
                            <div className="text-sm text-muted-foreground">{quiz.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={quiz.publishedAt ? "default" : "outline"}>
                          {quiz.publishedAt ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>{quiz.questionCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {quiz.timeLimit ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{quiz.timeLimit} min</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No limit</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(quiz.updatedAt), { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => handleEdit(quiz.id)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit Quiz</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => handlePreview(quiz.id)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Preview Quiz</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => handleAssign(quiz)}>
                                  <UserPlus className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Assign to Students</TooltipContent>
                            </Tooltip>
                            {quiz.publishedAt && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => handleAnalytics(quiz.id)}>
                                      <BarChart3 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View Analytics</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="default" size="sm" onClick={() => handleStartLiveExam(quiz)}>
                                      <Users className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Start Live Exam</TooltipContent>
                                </Tooltip>
                              </>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => handleDuplicate(quiz)}>
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Copy Quiz</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(quiz.id)} className="text-red-600 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete Quiz</TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="drafts" className="space-y-4">
          {draftQuizzes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Edit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? "No draft quizzes match your search" : "No draft quizzes"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Try adjusting your search terms" : "All your quizzes are published or you haven't created any yet"}
                </p>
                {!searchTerm && (
                  <Button onClick={handleCreateNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Quiz
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quiz Name</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Time Limit</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {draftQuizzes.map((quiz: Quiz) => (
                    <TableRow key={quiz.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{quiz.title || "Untitled Quiz"}</div>
                          {quiz.description && (
                            <div className="text-sm text-muted-foreground">{quiz.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>{quiz.questionCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {quiz.timeLimit ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{quiz.timeLimit} min</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No limit</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(quiz.updatedAt), { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(quiz.id)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handlePreview(quiz.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDuplicate(quiz)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(quiz.id)} className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="published" className="space-y-4">
          {publishedQuizzes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? "No published quizzes match your search" : "No published quizzes"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Try adjusting your search terms" : "Publish your first quiz to make it available to students"}
                </p>
                {!searchTerm && (
                  <Button onClick={handleCreateNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Quiz
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quiz Name</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Time Limit</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {publishedQuizzes.map((quiz: Quiz) => (
                    <TableRow key={quiz.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{quiz.title || "Untitled Quiz"}</div>
                          {quiz.description && (
                            <div className="text-sm text-muted-foreground">{quiz.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>{quiz.questionCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {quiz.timeLimit ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{quiz.timeLimit} min</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No limit</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(quiz.publishedAt!), { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(quiz.id)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handlePreview(quiz.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleAssign(quiz)}>
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleAnalytics(quiz.id)}>
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                          <Button variant="default" size="sm" onClick={() => handleStartLiveExam(quiz)}>
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDuplicate(quiz)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(quiz.id)} className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}