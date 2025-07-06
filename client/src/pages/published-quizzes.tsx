import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Edit, Share, Users, Calendar, Search } from "lucide-react";
import { useLocation } from "wouter";

export default function PublishedQuizzes() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['/api/quizzes'],
  });

  const publishedQuizzes = (quizzes || []).filter((quiz: any) => quiz.publishedAt);
  const draftQuizzes = (quizzes || []).filter((quiz: any) => !quiz.publishedAt);

  const filteredPublished = publishedQuizzes.filter((quiz: any) =>
    quiz.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDrafts = draftQuizzes.filter((quiz: any) =>
    quiz.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewQuiz = (quizId: string) => {
    window.open(`/quiz/${quizId}`, '_blank');
  };

  const handleEditQuiz = (quizId: string) => {
    setLocation(`/enhanced-quiz-builder?id=${quizId}`);
  };

  const handleAssignQuiz = (quizId: string) => {
    // TODO: Implement quiz assignment functionality
    alert("Quiz assignment feature coming soon!");
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quiz Management</h1>
          <p className="text-muted-foreground">Manage your published quizzes and assign them to students</p>
        </div>
        <Button onClick={() => setLocation('/enhanced-quiz-builder')}>
          Create New Quiz
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="published" className="space-y-6">
        <TabsList>
          <TabsTrigger value="published" className="flex items-center gap-2">
            <Share className="h-4 w-4" />
            Published ({filteredPublished.length})
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Drafts ({filteredDrafts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="published">
          {filteredPublished.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Share className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Published Quizzes</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'No quizzes match your search.' : 'You haven\'t published any quizzes yet.'}
                </p>
                <Button onClick={() => setLocation('/enhanced-quiz-builder')}>
                  Create Your First Quiz
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPublished.map((quiz: any) => (
                <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{quiz.title || "Untitled Quiz"}</CardTitle>
                        <CardDescription className="mt-1">
                          {quiz.description || "No description provided"}
                        </CardDescription>
                      </div>
                      <Badge variant="default" className="bg-green-100 text-green-800">Published</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {quiz.publishedAt ? new Date(quiz.publishedAt).toLocaleDateString() : 'Unknown'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          0 attempts
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleViewQuiz(quiz.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditQuiz(quiz.id)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                      
                      <Button
                        className="w-full"
                        onClick={() => handleAssignQuiz(quiz.id)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Assign to Students
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="drafts">
          {filteredDrafts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Edit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Draft Quizzes</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'No draft quizzes match your search.' : 'All your quizzes are published or you haven\'t created any yet.'}
                </p>
                <Button onClick={() => setLocation('/enhanced-quiz-builder')}>
                  Create New Quiz
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDrafts.map((quiz: any) => (
                <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{quiz.title || "Untitled Quiz"}</CardTitle>
                        <CardDescription className="mt-1">
                          {quiz.description || "No description provided"}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">Draft</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Last edited: {quiz.updatedAt ? new Date(quiz.updatedAt).toLocaleDateString() : 'Unknown'}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleViewQuiz(quiz.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditQuiz(quiz.id)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Continue Editing
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}