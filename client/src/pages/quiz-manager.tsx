import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Play,
  Sparkles
} from "lucide-react";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";

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

  const { data: quizzes, isLoading, isError } = useQuery({
    queryKey: ['/api/quizzes'],
    staleTime: 30000,
    gcTime: 300000,
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
    setLocation(`/assignments?quizId=${quiz.id}&quizTitle=${encodeURIComponent(quiz.title)}`);
  };

  const handleStartLiveExam = (quiz: Quiz) => {
    setLocation(`/live-exams?quizId=${quiz.id}&quizTitle=${encodeURIComponent(quiz.title)}`);
  };

  if (isLoading && !quizzes) {
    return (
      <Layout>
        <div className="p-6 space-y-6 animate-fadeIn">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl shimmer"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-72 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl shimmer"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const quizzesArray = Array.isArray(quizzes) ? quizzes : [];
  
  const filteredQuizzes = quizzesArray.filter((quiz: Quiz) =>
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (quiz.description && quiz.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const draftQuizzes = filteredQuizzes.filter((q: Quiz) => !q.publishedAt);
  const publishedQuizzes = filteredQuizzes.filter((q: Quiz) => q.publishedAt);

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/dashboard')} data-testid="button-home">
            <Home className="h-4 w-4" />
          </Button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Quiz Manager</span>
        </div>

        {/* Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 p-8 shadow-lg">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-white mb-2">Quiz Manager</h1>
            <p className="text-blue-100 text-lg">Create, organize, and manage your quizzes with ease</p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mb-24"></div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search quizzes by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-14 rounded-xl border-2 focus:border-blue-500 transition-all duration-300"
            data-testid="input-search-quiz"
          />
        </div>

        {/* Stats Grid with Gradient Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
            <Card className="rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-500 to-blue-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-100">Total Quizzes</p>
                    <p className="text-4xl font-bold text-white mt-2">{quizzesArray.length}</p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
            <Card className="rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-amber-500 to-amber-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-100">Drafts</p>
                    <p className="text-4xl font-bold text-white mt-2">{draftQuizzes.length}</p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                    <Edit className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
            <Card className="rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-green-500 to-green-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-100">Published</p>
                    <p className="text-4xl font-bold text-white mt-2">{publishedQuizzes.length}</p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
            <Card className="rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-500 to-purple-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-100">Total Questions</p>
                    <p className="text-4xl font-bold text-white mt-2">
                      {quizzesArray.reduce((sum, quiz) => sum + (quiz.questionCount || 0), 0)}
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quiz Lists with Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-white rounded-xl shadow-md p-1">
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white">
              All Quizzes ({filteredQuizzes.length})
            </TabsTrigger>
            <TabsTrigger value="drafts" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-amber-500 data-[state=active]:text-white">
              Drafts ({draftQuizzes.length})
            </TabsTrigger>
            <TabsTrigger value="published" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-500 data-[state=active]:text-white">
              Published ({publishedQuizzes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6 mt-6">
            {filteredQuizzes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="rounded-2xl shadow-lg border-0">
                  <CardContent className="text-center py-16">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mx-auto mb-6 flex items-center justify-center">
                      <FileText className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">
                      {searchTerm ? "No quizzes match your search" : "No quizzes yet"}
                    </h3>
                    <p className="text-muted-foreground mb-6 text-lg">
                      {searchTerm ? "Try adjusting your search terms" : "Get started by creating your first quiz"}
                    </p>
                    {!searchTerm && (
                      <Button 
                        onClick={handleCreateNew}
                        className="h-12 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-300"
                        data-testid="button-create-first-quiz"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Create Your First Quiz
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuizzes.map((quiz: Quiz, index: number) => (
                  <motion.div
                    key={quiz.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    data-testid={`card-quiz-${quiz.id}`}
                  >
                    <Card className="rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden">
                      <div className={`h-2 ${quiz.publishedAt ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-amber-500 to-amber-600'}`}></div>
                      <CardHeader className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <Badge className={`rounded-full px-3 py-1 ${quiz.publishedAt ? 'bg-gradient-to-r from-green-500 to-green-600 border-0 text-white' : 'bg-gradient-to-r from-amber-500 to-amber-600 border-0 text-white'}`}>
                            {quiz.publishedAt ? "Published" : "Draft"}
                          </Badge>
                          <div className="flex gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleEdit(quiz.id)}
                                    className="h-8 w-8 p-0 hover:bg-blue-50 rounded-lg"
                                    data-testid={`button-edit-${quiz.id}`}
                                  >
                                    <Edit className="h-4 w-4 text-blue-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit Quiz</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleDelete(quiz.id)}
                                    className="h-8 w-8 p-0 hover:bg-red-50 rounded-lg"
                                    data-testid={`button-delete-${quiz.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete Quiz</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                        <CardTitle className="text-xl font-bold mb-2 line-clamp-2">{quiz.title || "Untitled Quiz"}</CardTitle>
                        {quiz.description && (
                          <CardDescription className="line-clamp-2 text-base">{quiz.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="p-6 pt-0 space-y-4">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>{quiz.questionCount || 0} questions</span>
                          </div>
                          {quiz.timeLimit && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{quiz.timeLimit} min</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Updated {formatDistanceToNow(new Date(quiz.updatedAt), { addSuffix: true })}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Button 
                            size="sm" 
                            onClick={() => handlePreview(quiz.id)}
                            className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all duration-300"
                            data-testid={`button-preview-${quiz.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDuplicate(quiz)}
                            className="rounded-xl hover:bg-blue-50 transition-all duration-300"
                            data-testid={`button-duplicate-${quiz.id}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        {quiz.publishedAt && (
                          <div className="flex gap-2 pt-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAssign(quiz)}
                              className="flex-1 rounded-xl hover:bg-green-50 border-green-200 transition-all duration-300"
                              data-testid={`button-assign-${quiz.id}`}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Assign
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAnalytics(quiz.id)}
                              className="flex-1 rounded-xl hover:bg-purple-50 border-purple-200 transition-all duration-300"
                              data-testid={`button-analytics-${quiz.id}`}
                            >
                              <BarChart3 className="h-4 w-4 mr-1" />
                              Analytics
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="drafts" className="space-y-6 mt-6">
            {draftQuizzes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="rounded-2xl shadow-lg border-0">
                  <CardContent className="text-center py-16">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 mx-auto mb-6 flex items-center justify-center">
                      <Edit className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">
                      {searchTerm ? "No draft quizzes match your search" : "No draft quizzes"}
                    </h3>
                    <p className="text-muted-foreground mb-6 text-lg">
                      {searchTerm ? "Try adjusting your search terms" : "All your quizzes are published or you haven't created any yet"}
                    </p>
                    {!searchTerm && (
                      <Button 
                        onClick={handleCreateNew}
                        className="h-12 px-8 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 shadow-lg hover:shadow-xl transition-all duration-300"
                        data-testid="button-create-new-quiz"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Create New Quiz
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {draftQuizzes.map((quiz: Quiz, index: number) => (
                  <motion.div
                    key={quiz.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    data-testid={`card-draft-quiz-${quiz.id}`}
                  >
                    <Card className="rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden">
                      <div className="h-2 bg-gradient-to-r from-amber-500 to-amber-600"></div>
                      <CardHeader className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <Badge className="rounded-full px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 border-0 text-white">
                            Draft
                          </Badge>
                          <div className="flex gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleEdit(quiz.id)}
                                    className="h-8 w-8 p-0 hover:bg-blue-50 rounded-lg"
                                    data-testid={`button-edit-draft-${quiz.id}`}
                                  >
                                    <Edit className="h-4 w-4 text-blue-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit Quiz</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleDelete(quiz.id)}
                                    className="h-8 w-8 p-0 hover:bg-red-50 rounded-lg"
                                    data-testid={`button-delete-draft-${quiz.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete Quiz</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                        <CardTitle className="text-xl font-bold mb-2 line-clamp-2">{quiz.title || "Untitled Quiz"}</CardTitle>
                        {quiz.description && (
                          <CardDescription className="line-clamp-2 text-base">{quiz.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="p-6 pt-0 space-y-4">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>{quiz.questionCount || 0} questions</span>
                          </div>
                          {quiz.timeLimit && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{quiz.timeLimit} min</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Updated {formatDistanceToNow(new Date(quiz.updatedAt), { addSuffix: true })}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleEdit(quiz.id)}
                            className="flex-1 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 transition-all duration-300"
                            data-testid={`button-continue-editing-${quiz.id}`}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Continue Editing
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDuplicate(quiz)}
                            className="rounded-xl hover:bg-blue-50 transition-all duration-300"
                            data-testid={`button-duplicate-draft-${quiz.id}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="published" className="space-y-6 mt-6">
            {publishedQuizzes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="rounded-2xl shadow-lg border-0">
                  <CardContent className="text-center py-16">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mx-auto mb-6 flex items-center justify-center">
                      <Calendar className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">
                      {searchTerm ? "No published quizzes match your search" : "No published quizzes"}
                    </h3>
                    <p className="text-muted-foreground mb-6 text-lg">
                      {searchTerm ? "Try adjusting your search terms" : "Publish a quiz to make it available to students"}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publishedQuizzes.map((quiz: Quiz, index: number) => (
                  <motion.div
                    key={quiz.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    data-testid={`card-published-quiz-${quiz.id}`}
                  >
                    <Card className="rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden">
                      <div className="h-2 bg-gradient-to-r from-green-500 to-green-600"></div>
                      <CardHeader className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <Badge className="rounded-full px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 border-0 text-white">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Published
                          </Badge>
                          <div className="flex gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleEdit(quiz.id)}
                                    className="h-8 w-8 p-0 hover:bg-blue-50 rounded-lg"
                                    data-testid={`button-edit-published-${quiz.id}`}
                                  >
                                    <Edit className="h-4 w-4 text-blue-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit Quiz</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleDelete(quiz.id)}
                                    className="h-8 w-8 p-0 hover:bg-red-50 rounded-lg"
                                    data-testid={`button-delete-published-${quiz.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete Quiz</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                        <CardTitle className="text-xl font-bold mb-2 line-clamp-2">{quiz.title || "Untitled Quiz"}</CardTitle>
                        {quiz.description && (
                          <CardDescription className="line-clamp-2 text-base">{quiz.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="p-6 pt-0 space-y-4">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>{quiz.questionCount || 0} questions</span>
                          </div>
                          {quiz.timeLimit && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{quiz.timeLimit} min</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Updated {formatDistanceToNow(new Date(quiz.updatedAt), { addSuffix: true })}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Button 
                            size="sm" 
                            onClick={() => handlePreview(quiz.id)}
                            className="flex-1 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all duration-300"
                            data-testid={`button-preview-published-${quiz.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDuplicate(quiz)}
                            className="rounded-xl hover:bg-blue-50 transition-all duration-300"
                            data-testid={`button-duplicate-published-${quiz.id}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleAssign(quiz)}
                            className="flex-1 rounded-xl hover:bg-green-50 border-green-200 transition-all duration-300"
                            data-testid={`button-assign-published-${quiz.id}`}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Assign
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleAnalytics(quiz.id)}
                            className="flex-1 rounded-xl hover:bg-purple-50 border-purple-200 transition-all duration-300"
                            data-testid={`button-analytics-published-${quiz.id}`}
                          >
                            <BarChart3 className="h-4 w-4 mr-1" />
                            Analytics
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Floating Action Button */}
        <motion.div
          className="fixed bottom-24 right-8 z-50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            onClick={handleCreateNew}
            className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-2xl hover:shadow-3xl transition-all duration-300"
            data-testid="button-fab-create-quiz"
          >
            <Plus className="h-8 w-8" />
          </Button>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
