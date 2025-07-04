import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  BookOpen, 
  TrendingUp, 
  Sparkles, 
  Plus,
  Download,
  Eye,
  Search,
  Filter,
  Calendar,
  User,
  Target,
  Lightbulb
} from "lucide-react";
import { useForm } from "react-hook-form";

export default function AIResources() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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
  }, [isAuthenticated, authLoading, toast]);

  const { data: aiResources, isLoading } = useQuery({
    queryKey: ["/api/ai-resources"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: testbanks } = useQuery({
    queryKey: ["/api/testbanks"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: quizAttempts } = useQuery({
    queryKey: ["/api/quiz-attempts"],
    enabled: isAuthenticated && user?.role === 'student',
    retry: false,
  });

  const form = useForm({
    defaultValues: {
      resourceType: "study_guide",
      topic: "",
      testbankId: "",
      difficulty: "intermediate",
    },
  });

  const generateStudyGuideMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/ai-resources/study-guide", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Study guide generated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-resources"] });
      setIsGenerateDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to generate study guide",
        variant: "destructive",
      });
    },
  });

  const generateImprovementPlanMutation = useMutation({
    mutationFn: async (attemptId: string) => {
      await apiRequest("POST", "/api/ai-resources/improvement-plan", { attemptId });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Improvement plan generated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-resources"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to generate improvement plan",
        variant: "destructive",
      });
    },
  });

  const filteredResources = aiResources?.filter((resource: any) => {
    if (searchQuery && !resource.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (resourceFilter !== "all" && resource.resourceType !== resourceFilter) {
      return false;
    }
    return true;
  });

  const onSubmit = (data: any) => {
    generateStudyGuideMutation.mutate(data);
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'study_guide':
        return <BookOpen className="h-5 w-5" />;
      case 'improvement_plan':
        return <TrendingUp className="h-5 w-5" />;
      case 'lecture_notes':
        return <Brain className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const getResourceTypeLabel = (type: string) => {
    switch (type) {
      case 'study_guide':
        return 'Study Guide';
      case 'improvement_plan':
        return 'Improvement Plan';
      case 'lecture_notes':
        return 'Lecture Notes';
      default:
        return 'AI Resource';
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Resources</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              AI-generated study materials and personalized learning content
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Resource
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate AI Study Resource</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="resourceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resource Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select resource type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="study_guide">Study Guide</SelectItem>
                              <SelectItem value="lecture_notes">Lecture Notes</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="topic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Topic</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter topic (e.g., Cell Biology)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="testbankId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source Testbank</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select testbank" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {testbanks?.map((testbank: any) => (
                                <SelectItem key={testbank.id} value={testbank.id}>
                                  {testbank.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsGenerateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={generateStudyGuideMutation.isPending}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {generateStudyGuideMutation.isPending ? "Generating..." : "Generate"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                Your AI Resources
              </CardTitle>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={resourceFilter} onValueChange={setResourceFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="study_guide">Study Guides</SelectItem>
                    <SelectItem value="improvement_plan">Improvement Plans</SelectItem>
                    <SelectItem value="lecture_notes">Lecture Notes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="resources" className="space-y-6">
          <TabsList>
            <TabsTrigger value="resources">All Resources</TabsTrigger>
            <TabsTrigger value="study-guides">Study Guides</TabsTrigger>
            <TabsTrigger value="improvement-plans">Improvement Plans</TabsTrigger>
            {user?.role === 'student' && (
              <TabsTrigger value="my-plans">My Learning Plans</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="resources">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg h-48 animate-pulse" />
                ))}
              </div>
            ) : filteredResources && filteredResources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map((resource: any) => (
                  <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getResourceIcon(resource.resourceType)}
                          <Badge variant="secondary">
                            {getResourceTypeLabel(resource.resourceType)}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(resource.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <CardTitle className="line-clamp-2">{resource.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Resource Preview */}
                        {resource.content && (
                          <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                            {typeof resource.content === 'string' 
                              ? resource.content.substring(0, 150) + '...'
                              : 'AI-generated content available'
                            }
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Generated: {new Date(resource.createdAt).toLocaleDateString()}
                          </div>
                          {resource.generatedFor && (
                            <div className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              Personal
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No AI Resources Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Generate your first AI-powered study resource to get started
                  </p>
                  <Button 
                    onClick={() => setIsGenerateDialogOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Resource
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="study-guides">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Study Guides
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  AI-generated study guides based on your testbank content and learning objectives.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="improvement-plans">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Improvement Plans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Personalized learning plans generated based on student performance and weak areas.
                  </p>
                  
                  {user?.role === 'teacher' && quizAttempts && quizAttempts.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Generate Improvement Plans</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {quizAttempts.slice(0, 4).map((attempt: any) => (
                          <div key={attempt.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium">{attempt.quiz?.title}</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  Score: {attempt.score}% • {attempt.student?.name}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => generateImprovementPlanMutation.mutate(attempt.id)}
                                disabled={generateImprovementPlanMutation.isPending}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                Generate Plan
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {user?.role === 'student' && (
            <TabsContent value="my-plans">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    My Learning Plans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Personalized Learning Plans
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Complete quizzes to receive AI-generated improvement plans tailored to your performance
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
}
