import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  BarChart3
} from "lucide-react";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: any[];
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  timeLimit?: number;
  maxAttempts?: number;
}

export default function QuizManager() {
  const [, setLocation] = useLocation();

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['/api/quizzes'],
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
    // TODO: Implement quiz duplication
    console.log('Duplicate quiz:', quiz.id);
  };

  const handleDelete = (quizId: string) => {
    // TODO: Implement quiz deletion with confirmation
    console.log('Delete quiz:', quizId);
  };

  const handleAnalytics = (quizId: string) => {
    setLocation(`/analytics?quiz=${quizId}`);
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
  const draftQuizzes = quizzesArray.filter((q: Quiz) => !q.publishedAt);
  const publishedQuizzes = quizzesArray.filter((q: Quiz) => q.publishedAt);

  const QuizCard = ({ quiz, isDraft = false }: { quiz: Quiz; isDraft?: boolean }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{quiz.title || "Untitled Quiz"}</CardTitle>
            <CardDescription className="text-sm">
              {quiz.description || "No description provided"}
            </CardDescription>
          </div>
          <Badge variant={isDraft ? "outline" : "default"}>
            {isDraft ? "Draft" : "Published"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Quiz Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{quiz.questionCount || quiz.questions?.length || 0} questions</span>
            </div>
            {quiz.timeLimit && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{quiz.timeLimit} min</span>
              </div>
            )}
            {quiz.maxAttempts && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{quiz.maxAttempts === -1 ? "Unlimited" : quiz.maxAttempts} attempts</span>
              </div>
            )}
          </div>

          {/* Last Modified */}
          <div className="text-xs text-muted-foreground">
            {isDraft ? "Last modified" : "Published"} {formatDistanceToNow(new Date(isDraft ? quiz.updatedAt : quiz.publishedAt!), { addSuffix: true })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => handleEdit(quiz.id)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePreview(quiz.id)}>
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
            {!isDraft && (
              <Button variant="outline" size="sm" onClick={() => handleAnalytics(quiz.id)}>
                <BarChart3 className="h-4 w-4 mr-1" />
                Analytics
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => handleDuplicate(quiz)}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(quiz.id)} className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6">
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
                  {quizzesArray.reduce((sum, quiz) => sum + (quiz.questions?.length || 0), 0)}
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
          <TabsTrigger value="all">All Quizzes ({quizzesArray.length})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({draftQuizzes.length})</TabsTrigger>
          <TabsTrigger value="published">Published ({publishedQuizzes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {quizzesArray.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No quizzes yet</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by creating your first quiz.
                </p>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Quiz
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzesArray.map((quiz: Quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} isDraft={!quiz.publishedAt} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="drafts" className="space-y-4">
          {draftQuizzes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Edit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No draft quizzes</h3>
                <p className="text-muted-foreground mb-4">
                  All your quizzes are published or you haven't created any yet.
                </p>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Quiz
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {draftQuizzes.map((quiz: Quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} isDraft={true} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="published" className="space-y-4">
          {publishedQuizzes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No published quizzes</h3>
                <p className="text-muted-foreground mb-4">
                  Publish your first quiz to make it available to students.
                </p>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Quiz
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publishedQuizzes.map((quiz: Quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} isDraft={false} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}