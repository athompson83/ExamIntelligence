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
import Layout from "@/components/Layout";
import { FeatureTooltip, AdminTooltip } from "@/components/SmartTooltip";

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
  const [referenceLinks, setReferenceLinks] = useState<string[]>([]);
  const [newReferenceLink, setNewReferenceLink] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const { data: studyAids = [], isLoading } = useQuery({
    queryKey: ['/api/study-aids'],
  });

  const { data: availableQuizzes = [] } = useQuery({
    queryKey: ['/api/quizzes/available'],
  });

  const createStudyAidMutation = useMutation({
    mutationFn: async (data: { 
      type: string; 
      quizId?: string; 
      title: string; 
      customPrompt?: string;
      referenceLinks?: string[];
      uploadedFiles?: File[];
    }) => {
      return apiRequest('/api/study-aids/generate', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/study-aids'] });
      setShowCreateDialog(false);
      setSelectedType('');
      setSelectedQuiz('');
      setCustomPrompt('');
      setTitle('');
      setReferenceLinks([]);
      setNewReferenceLink('');
      setUploadedFiles([]);
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
      return apiRequest(`/api/study-aids/${id}`, { method: 'DELETE' });
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
    if (!selectedType || !title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and select a study aid type.",
        variant: "destructive",
      });
      return;
    }

    createStudyAidMutation.mutate({
      type: selectedType,
      quizId: selectedQuiz || undefined,
      title: title.trim(),
      customPrompt: customPrompt.trim() || undefined,
      referenceLinks: referenceLinks.length > 0 ? referenceLinks : undefined,
      uploadedFiles: uploadedFiles.length > 0 ? uploadedFiles : undefined,
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
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <BookOpen className="h-4 w-4" />
          <span>/</span>
          <span>Study Aids</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Study Aids</h1>
            <p className="text-muted-foreground">
              AI-generated study materials to enhance your learning
            </p>
          </div>
        <FeatureTooltip
          id="create-study-aid"
          title="AI Study Aid Generator 🧠"
          content="Generate personalized study materials from quiz content including summaries, flashcards, practice questions, and concept maps."
          position="top"
        >
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
                Create personalized study materials based on topics or quiz content
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter a title for your study aid (e.g., Biology Review, Math Formulas)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quiz">Based on Quiz (Optional)</Label>
                <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a quiz or leave blank for topic-based generation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None - Topic-based generation</SelectItem>
                    {availableQuizzes.map((quiz: any) => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        {quiz.title}
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

              <div className="space-y-2">
                <Label>Reference Links (Optional)</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add reference URL (e.g., https://example.com/article)"
                    value={newReferenceLink}
                    onChange={(e) => setNewReferenceLink(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (newReferenceLink.trim()) {
                        setReferenceLinks([...referenceLinks, newReferenceLink.trim()]);
                        setNewReferenceLink('');
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                {referenceLinks.length > 0 && (
                  <div className="space-y-1">
                    {referenceLinks.map((link, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm truncate">{link}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReferenceLinks(referenceLinks.filter((_, i) => i !== index));
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Reference Files (Optional)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.md"
                    onChange={(e) => {
                      if (e.target.files) {
                        setUploadedFiles(Array.from(e.target.files));
                      }
                    }}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="text-gray-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600">
                        Click to upload reference files (PDF, DOC, TXT, MD)
                      </p>
                    </div>
                  </label>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="space-y-1">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
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
        </FeatureTooltip>
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
    </Layout>
  );
}