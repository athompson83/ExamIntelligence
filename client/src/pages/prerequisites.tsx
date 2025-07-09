import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
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
  Plus, 
  Link, 
  Trash2, 
  Edit, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Home,
  ChevronRight,
  GitBranch,
  Lock,
  Unlock,
  BookOpen,
  Users,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { FeatureTooltip, AdminTooltip } from "@/components/SmartTooltip";

interface Prerequisite {
  id: string;
  quizId: string;
  quizTitle: string;
  prerequisiteQuizId: string;
  prerequisiteQuizTitle: string;
  minimumScore: number;
  strictOrder: boolean;
  createdAt: string;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  publishedAt?: string;
  averageScore?: number;
  totalAttempts?: number;
}

interface PrerequisiteStatus {
  studentId: string;
  studentName: string;
  quizId: string;
  quizTitle: string;
  canAccess: boolean;
  missingPrerequisites: Array<{
    quizId: string;
    quizTitle: string;
    minimumScore: number;
    currentScore?: number;
    completed: boolean;
  }>;
}

export default function Prerequisites() {
  const [selectedQuiz, setSelectedQuiz] = useState<string>("");
  const [selectedPrerequisite, setSelectedPrerequisite] = useState<string>("");
  const [minimumScore, setMinimumScore] = useState<number>(70);
  const [strictOrder, setStrictOrder] = useState<boolean>(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPrerequisite, setEditingPrerequisite] = useState<Prerequisite | null>(null);
  const { toast } = useToast();

  const { data: prerequisites = [], isLoading } = useQuery({
    queryKey: ['/api/prerequisites'],
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ['/api/quizzes'],
  });

  const { data: prerequisiteStatuses = [] } = useQuery({
    queryKey: ['/api/prerequisites/status'],
  });

  const createPrerequisiteMutation = useMutation({
    mutationFn: async (data: {
      quizId: string;
      prerequisiteQuizId: string;
      minimumScore: number;
      strictOrder: boolean;
    }) => {
      return apiRequest('/api/prerequisites', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prerequisites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/prerequisites/status'] });
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "Prerequisite Created",
        description: "Quiz prerequisite has been set up successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create prerequisite. Please try again.",
        variant: "destructive",
      });
    }
  });

  const updatePrerequisiteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest(`/api/prerequisites/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prerequisites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/prerequisites/status'] });
      setEditingPrerequisite(null);
      toast({
        title: "Prerequisite Updated",
        description: "Quiz prerequisite has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update prerequisite. Please try again.",
        variant: "destructive",
      });
    }
  });

  const deletePrerequisiteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/prerequisites/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prerequisites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/prerequisites/status'] });
      toast({
        title: "Prerequisite Deleted",
        description: "Quiz prerequisite has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete prerequisite. Please try again.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setSelectedQuiz("");
    setSelectedPrerequisite("");
    setMinimumScore(70);
    setStrictOrder(false);
  };

  const handleCreatePrerequisite = () => {
    if (!selectedQuiz || !selectedPrerequisite) {
      toast({
        title: "Missing Information",
        description: "Please select both quiz and prerequisite quiz.",
        variant: "destructive",
      });
      return;
    }

    if (selectedQuiz === selectedPrerequisite) {
      toast({
        title: "Invalid Selection",
        description: "A quiz cannot be a prerequisite for itself.",
        variant: "destructive",
      });
      return;
    }

    createPrerequisiteMutation.mutate({
      quizId: selectedQuiz,
      prerequisiteQuizId: selectedPrerequisite,
      minimumScore,
      strictOrder
    });
  };

  const getQuizTitle = (quizId: string) => {
    const quiz = quizzes.find((q: Quiz) => q.id === quizId);
    return quiz?.title || "Unknown Quiz";
  };

  const getAccessStatusBadge = (canAccess: boolean) => {
    return canAccess ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Can Access
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <Lock className="h-3 w-3 mr-1" />
        Locked
      </Badge>
    );
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
          <span>Prerequisites</span>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Quiz Prerequisites</h1>
            <p className="text-muted-foreground mt-1">
              Set up learning pathways by requiring students to complete certain quizzes before accessing others
            </p>
          </div>
          <FeatureTooltip
            id="create-prerequisite"
            title="Create Prerequisites 🎯"
            content="Set up learning pathways by requiring students to pass certain quizzes before accessing others. Perfect for sequential learning!"
            position="top"
          >
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Prerequisite
            </Button>
          </FeatureTooltip>
        </div>

        {/* Prerequisites Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <GitBranch className="h-5 w-5 mr-2" />
                Total Prerequisites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {prerequisites.length}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Active prerequisite rules
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Locked Quizzes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {prerequisiteStatuses.filter((s: PrerequisiteStatus) => !s.canAccess).length}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Student-quiz combinations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Unlock className="h-5 w-5 mr-2" />
                Accessible Quizzes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {prerequisiteStatuses.filter((s: PrerequisiteStatus) => s.canAccess).length}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Student-quiz combinations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Prerequisites Table */}
        <Card>
          <CardHeader>
            <CardTitle>Prerequisite Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quiz</TableHead>
                    <TableHead>Prerequisite</TableHead>
                    <TableHead>Minimum Score</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prerequisites.map((prerequisite: Prerequisite) => (
                    <TableRow key={prerequisite.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-2 text-blue-600" />
                          <span className="font-medium">{prerequisite.quizTitle}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Link className="h-4 w-4 mr-2 text-green-600" />
                          <span>{prerequisite.prerequisiteQuizTitle}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {prerequisite.minimumScore}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {prerequisite.strictOrder ? (
                          <Badge className="bg-orange-100 text-orange-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Strict
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">
                            Flexible
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingPrerequisite(prerequisite)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePrerequisiteMutation.mutate(prerequisite.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Student Access Status */}
        <Card>
          <CardHeader>
            <CardTitle>Student Access Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Quiz</TableHead>
                    <TableHead>Access Status</TableHead>
                    <TableHead>Missing Prerequisites</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prerequisiteStatuses.map((status: PrerequisiteStatus) => (
                    <TableRow key={`${status.studentId}-${status.quizId}`}>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-gray-600" />
                          <span className="font-medium">{status.studentName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span>{status.quizTitle}</span>
                      </TableCell>
                      <TableCell>
                        {getAccessStatusBadge(status.canAccess)}
                      </TableCell>
                      <TableCell>
                        {status.missingPrerequisites.length > 0 ? (
                          <div className="space-y-1">
                            {status.missingPrerequisites.map((missing, index) => (
                              <div key={index} className="text-sm">
                                <span className="text-gray-600">{missing.quizTitle}</span>
                                {missing.currentScore !== undefined ? (
                                  <span className="text-red-600 ml-2">
                                    ({missing.currentScore}% / {missing.minimumScore}%)
                                  </span>
                                ) : (
                                  <span className="text-gray-500 ml-2">(Not attempted)</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-green-600">All met</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Prerequisite Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Quiz Prerequisite</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="quiz">Quiz</Label>
                <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select quiz to add prerequisite to" />
                  </SelectTrigger>
                  <SelectContent>
                    {quizzes.map((quiz: Quiz) => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        {quiz.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="prerequisite">Prerequisite Quiz</Label>
                <Select value={selectedPrerequisite} onValueChange={setSelectedPrerequisite}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select prerequisite quiz" />
                  </SelectTrigger>
                  <SelectContent>
                    {quizzes
                      .filter((quiz: Quiz) => quiz.id !== selectedQuiz)
                      .map((quiz: Quiz) => (
                        <SelectItem key={quiz.id} value={quiz.id}>
                          {quiz.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="minimumScore">Minimum Score (%)</Label>
                <Input
                  id="minimumScore"
                  type="number"
                  min="0"
                  max="100"
                  value={minimumScore}
                  onChange={(e) => setMinimumScore(Number(e.target.value))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="strictOrder"
                  checked={strictOrder}
                  onChange={(e) => setStrictOrder(e.target.checked)}
                />
                <Label htmlFor="strictOrder">Strict Order (must complete in sequence)</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePrerequisite}>
                  Create Prerequisite
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}