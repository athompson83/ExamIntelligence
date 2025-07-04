import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Settings, Clock, Users, Shield, Zap } from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  description: string;
  timeLimit: number;
  shuffleAnswers: boolean;
  shuffleQuestions: boolean;
  allowMultipleAttempts: boolean;
  passwordProtected: boolean;
  password: string;
  ipLocking: boolean;
  adaptiveTesting: boolean;
  proctoring: boolean;
  createdAt: string;
}

export default function QuizBuilder() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    timeLimit: 60,
    shuffleAnswers: false,
    shuffleQuestions: false,
    allowMultipleAttempts: false,
    passwordProtected: false,
    password: "",
    ipLocking: false,
    adaptiveTesting: false,
    proctoring: false,
  });

  const { data: quizzes, isLoading: quizzesLoading } = useQuery({
    queryKey: ['/api/quizzes'],
    enabled: isAuthenticated,
  });

  const createQuizMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiRequest("POST", "/api/quizzes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes'] });
      toast({
        title: "Success",
        description: "Quiz created successfully",
      });
      // Reset form
      setFormData({
        title: "",
        description: "",
        timeLimit: 60,
        shuffleAnswers: false,
        shuffleQuestions: false,
        allowMultipleAttempts: false,
        passwordProtected: false,
        password: "",
        ipLocking: false,
        adaptiveTesting: false,
        proctoring: false,
      });
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
        description: "Failed to create quiz",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createQuizMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading || quizzesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <TopBar />
        
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Quiz Builder</h1>
              <p className="text-gray-600">Create and configure assessments</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quiz Builder Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Plus className="mr-2 h-5 w-5" />
                    Create New Quiz
                  </CardTitle>
                  <CardDescription>
                    Configure your quiz settings and add questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit}>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="basic">Basic</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                        <TabsTrigger value="security">Security</TabsTrigger>
                        <TabsTrigger value="advanced">Advanced</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="basic" className="space-y-4 mt-4">
                        <div>
                          <Label htmlFor="title">Quiz Title</Label>
                          <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            placeholder="Enter quiz title"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Enter quiz description"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                          <Input
                            id="timeLimit"
                            type="number"
                            value={formData.timeLimit}
                            onChange={(e) => handleInputChange('timeLimit', parseInt(e.target.value))}
                            min="1"
                            max="480"
                          />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="settings" className="space-y-4 mt-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="shuffleAnswers">Shuffle Answer Options</Label>
                              <p className="text-sm text-gray-600">Randomize the order of answer choices</p>
                            </div>
                            <Switch
                              id="shuffleAnswers"
                              checked={formData.shuffleAnswers}
                              onCheckedChange={(checked) => handleInputChange('shuffleAnswers', checked)}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="shuffleQuestions">Shuffle Questions</Label>
                              <p className="text-sm text-gray-600">Randomize the order of questions</p>
                            </div>
                            <Switch
                              id="shuffleQuestions"
                              checked={formData.shuffleQuestions}
                              onCheckedChange={(checked) => handleInputChange('shuffleQuestions', checked)}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="allowMultipleAttempts">Allow Multiple Attempts</Label>
                              <p className="text-sm text-gray-600">Students can retake the quiz</p>
                            </div>
                            <Switch
                              id="allowMultipleAttempts"
                              checked={formData.allowMultipleAttempts}
                              onCheckedChange={(checked) => handleInputChange('allowMultipleAttempts', checked)}
                            />
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="security" className="space-y-4 mt-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="passwordProtected">Password Protection</Label>
                              <p className="text-sm text-gray-600">Require password to access quiz</p>
                            </div>
                            <Switch
                              id="passwordProtected"
                              checked={formData.passwordProtected}
                              onCheckedChange={(checked) => handleInputChange('passwordProtected', checked)}
                            />
                          </div>
                          
                          {formData.passwordProtected && (
                            <div>
                              <Label htmlFor="password">Quiz Password</Label>
                              <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                placeholder="Enter quiz password"
                              />
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="ipLocking">IP Address Locking</Label>
                              <p className="text-sm text-gray-600">Restrict access to specific IP addresses</p>
                            </div>
                            <Switch
                              id="ipLocking"
                              checked={formData.ipLocking}
                              onCheckedChange={(checked) => handleInputChange('ipLocking', checked)}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="proctoring">Enable Proctoring</Label>
                              <p className="text-sm text-gray-600">Monitor students during the exam</p>
                            </div>
                            <Switch
                              id="proctoring"
                              checked={formData.proctoring}
                              onCheckedChange={(checked) => handleInputChange('proctoring', checked)}
                            />
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="advanced" className="space-y-4 mt-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="adaptiveTesting">Adaptive Testing</Label>
                              <p className="text-sm text-gray-600">Adjust difficulty based on performance</p>
                            </div>
                            <Switch
                              id="adaptiveTesting"
                              checked={formData.adaptiveTesting}
                              onCheckedChange={(checked) => handleInputChange('adaptiveTesting', checked)}
                            />
                          </div>
                          
                          {formData.adaptiveTesting && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <h4 className="font-medium text-blue-900 mb-2">Adaptive Testing Settings</h4>
                              <p className="text-sm text-blue-700">
                                Adaptive testing will dynamically adjust question difficulty based on student responses.
                                This feature requires questions to be tagged with difficulty levels.
                              </p>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                    
                    <div className="flex gap-2 mt-6">
                      <Button 
                        type="submit" 
                        disabled={createQuizMutation.isPending}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {createQuizMutation.isPending ? 'Creating...' : 'Create Quiz'}
                      </Button>
                      <Button type="button" variant="outline">
                        Save Draft
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Recent Quizzes */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Quizzes</CardTitle>
                  <CardDescription>Your recently created quizzes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {quizzes?.slice(0, 5).map((quiz: Quiz) => (
                      <div key={quiz.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{quiz.title}</h4>
                          <Badge variant={quiz.proctoring ? "default" : "secondary"}>
                            {quiz.proctoring ? "Proctored" : "Standard"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{quiz.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {quiz.timeLimit} min
                          </div>
                          {quiz.adaptiveTesting && (
                            <div className="flex items-center">
                              <Zap className="h-3 w-3 mr-1" />
                              Adaptive
                            </div>
                          )}
                          {quiz.passwordProtected && (
                            <div className="flex items-center">
                              <Shield className="h-3 w-3 mr-1" />
                              Protected
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {(!quizzes || quizzes.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <Settings className="h-8 w-8 mx-auto mb-2" />
                        <p>No quizzes created yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
