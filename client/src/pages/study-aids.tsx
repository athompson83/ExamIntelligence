import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  Brain, 
  FileText, 
  Star, 
  Clock, 
  TrendingUp,
  Plus,
  Download,
  Share,
  Trash2,
  Eye,
  Lightbulb
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StudyAid {
  id: string;
  title: string;
  type: 'summary' | 'flashcards' | 'practice_questions' | 'concept_map' | 'study_guide';
  content: string;
  quizId: string;
  quizTitle: string;
  createdAt: string;
  lastAccessedAt: string;
  accessCount: number;
  rating: number;
}

const studyAidTypes = [
  { value: 'summary', label: 'Study Summary', icon: FileText, description: 'Condensed overview of key concepts' },
  { value: 'flashcards', label: 'Flashcards', icon: Brain, description: 'Interactive question and answer cards' },
  { value: 'practice_questions', label: 'Practice Questions', icon: BookOpen, description: 'Additional questions for practice' },
  { value: 'concept_map', label: 'Concept Map', icon: TrendingUp, description: 'Visual representation of relationships' },
  { value: 'study_guide', label: 'Study Guide', icon: Lightbulb, description: 'Comprehensive study plan' }
];

export default function StudyAids() {
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedQuiz, setSelectedQuiz] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  const { data: studyAids = [], isLoading } = useQuery({
    queryKey: ['/api/study-aids'],
  });

  const { data: availableQuizzes = [] } = useQuery({
    queryKey: ['/api/quizzes/completed'],
  });

  const createStudyAidMutation = useMutation({
    mutationFn: async (data: { 
      type: string; 
      quizId: string; 
      title: string; 
      customPrompt?: string;
    }) => {
      return apiRequest('POST', '/api/study-aids/generate', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/study-aids'] });
      setShowCreateDialog(false);
      setSelectedType('');
      setSelectedQuiz('');
      setCustomPrompt('');
      setTitle('');
      toast({
        title: "Study Aid Generated",
        description: "Your personalized study aid has been created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate study aid. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteStudyAidMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/study-aids/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/study-aids'] });
      toast({
        title: "Study Aid Deleted",
        description: "The study aid has been removed from your library.",
      });
    },
  });

  const updateAccessMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('POST', `/api/study-aids/${id}/access`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/study-aids'] });
    },
  });

  const rateStudyAidMutation = useMutation({
    mutationFn: async ({ id, rating }: { id: string; rating: number }) => {
      return apiRequest('POST', `/api/study-aids/${id}/rate`, { rating });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/study-aids'] });
    },
  });

  const filteredStudyAids = studyAids.filter((aid: StudyAid) => {
    if (activeTab === 'all') return true;
    return aid.type === activeTab;
  });

  const handleCreateStudyAid = () => {
    if (!selectedType || !selectedQuiz || !title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createStudyAidMutation.mutate({
      type: selectedType,
      quizId: selectedQuiz,
      title: title.trim(),
      customPrompt: customPrompt.trim() || undefined,
    });
  };

  const handleViewStudyAid = (aid: StudyAid) => {
    updateAccessMutation.mutate(aid.id);
    // Navigate to detailed view or open in modal
  };

  const getTypeIcon = (type: string) => {
    const typeInfo = studyAidTypes.find(t => t.value === type);
    return typeInfo?.icon || FileText;
  };

  const getTypeLabel = (type: string) => {
    const typeInfo = studyAidTypes.find(t => t.value === type);
    return typeInfo?.label || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Study Aids</h1>
          <p className="text-muted-foreground">
            AI-generated study materials to enhance your learning
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Study Aid
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generate New Study Aid</DialogTitle>
              <DialogDescription>
                Create personalized study materials based on your quiz performance
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter a title for your study aid"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quiz">Select Quiz</Label>
                <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a completed quiz" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableQuizzes.map((quiz: any) => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        {quiz.title} - {quiz.score}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Study Aid Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose study aid type" />
                  </SelectTrigger>
                  <SelectContent>
                    {studyAidTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <type.icon className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt">Custom Instructions (Optional)</Label>
                <Textarea
                  id="prompt"
                  placeholder="Add specific instructions for generating your study aid..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateStudyAid}
                  disabled={createStudyAidMutation.isPending}
                >
                  {createStudyAidMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Generate Study Aid
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Study Aids</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studyAids.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {studyAids.filter((aid: StudyAid) => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(aid.createdAt) > weekAgo;
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {studyAids.reduce((total: number, aid: StudyAid) => total + aid.accessCount, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {studyAids.length > 0 
                ? (studyAids.reduce((total: number, aid: StudyAid) => total + aid.rating, 0) / studyAids.length).toFixed(1)
                : "N/A"
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Study Aids List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Study Library</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All</TabsTrigger>
              {studyAidTypes.map((type) => (
                <TabsTrigger key={type.value} value={type.value}>
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value={activeTab} className="space-y-4 mt-6">
              {filteredStudyAids.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No study aids yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first AI-generated study aid to get started
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Study Aid
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredStudyAids.map((aid: StudyAid) => {
                    const Icon = getTypeIcon(aid.type);
                    return (
                      <Card key={aid.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              <Icon className="w-5 h-5 text-primary" />
                              <Badge variant="secondary">
                                {getTypeLabel(aid.type)}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewStudyAid(aid)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteStudyAidMutation.mutate(aid.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <CardTitle className="text-base">{aid.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-sm text-muted-foreground">
                            Based on: {aid.quizTitle}
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(aid.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Eye className="w-3 h-3" />
                              <span>{aid.accessCount} views</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 cursor-pointer ${
                                    star <= aid.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                  onClick={() => rateStudyAidMutation.mutate({ id: aid.id, rating: star })}
                                />
                              ))}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleViewStudyAid(aid)}
                            >
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}