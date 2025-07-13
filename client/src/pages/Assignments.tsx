import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { 
  Home, 
  ChevronRight, 
  ClipboardCheck, 
  Plus, 
  Edit3, 
  Eye, 
  Trash2,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Search,
  Filter,
  Send,
  Settings
} from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  quizId: string;
  dueDate: string;
  availableFrom: string;
  availableTo: string;
  timeLimit: number;
  maxAttempts: number;
  allowLateSubmission: boolean;
  shuffleQuestions: boolean;
  showCorrectAnswers: boolean;
  requireProctoring: boolean;
  allowCalculator: boolean;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  submissions: number;
  averageScore: number;
}

export default function Assignments() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [location] = useLocation();
  const queryClient = useQueryClient();

  // Parse URL parameters for pre-selected quiz
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const preSelectedQuizId = urlParams.get('quizId');
  const preSelectedQuizTitle = urlParams.get('quizTitle');

  // Auto-open create modal if coming from quiz manager
  useEffect(() => {
    if (preSelectedQuizId && location.includes('/assignments')) {
      setShowCreateModal(true);
    }
  }, [preSelectedQuizId, location]);

  // Fetch assignments
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['/api/quiz-assignments'],
    queryFn: () => apiRequest('/api/quiz-assignments'),
  });

  // Fetch quizzes for assignment creation
  const { data: quizzes = [] } = useQuery({
    queryKey: ['/api/quizzes'],
    queryFn: () => apiRequest('/api/quizzes'),
  });

  // Fetch students for assignment
  const { data: students = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('/api/users'),
  });

  // Fetch sections for assignment
  const { data: sections = [] } = useQuery({
    queryKey: ['/api/sections'],
    queryFn: () => apiRequest('/api/sections'),
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/quiz-assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-assignments'] });
      setShowCreateModal(false);
      toast({
        title: "Success",
        description: "Assignment created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create assignment",
        variant: "destructive",
      });
    },
  });

  // Update assignment mutation
  const updateAssignmentMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/quiz-assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-assignments'] });
      setEditingAssignment(null);
      toast({
        title: "Success",
        description: "Assignment updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update assignment",
        variant: "destructive",
      });
    },
  });

  // Delete assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/quiz-assignments/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-assignments'] });
      toast({
        title: "Success",
        description: "Assignment deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete assignment",
        variant: "destructive",
      });
    },
  });

  // Filter assignments
  const filteredAssignments = assignments.filter((assignment: Assignment) => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateAssignment = (formData: FormData) => {
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      quizId: formData.get('quizId'),
      dueDate: formData.get('dueDate'),
      availableFrom: formData.get('availableFrom'),
      availableTo: formData.get('availableTo'),
      timeLimit: parseInt(formData.get('timeLimit') as string),
      maxAttempts: parseInt(formData.get('maxAttempts') as string),
      allowLateSubmission: formData.get('allowLateSubmission') === 'on',
      shuffleQuestions: formData.get('shuffleQuestions') === 'on',
      showCorrectAnswers: formData.get('showCorrectAnswers') === 'on',
      requireProctoring: formData.get('requireProctoring') === 'on',
      allowCalculator: formData.get('allowCalculator') === 'on',
      selectedStudents: selectedStudents,
      selectedSections: selectedSections,
      status: 'draft'
    };
    createAssignmentMutation.mutate(data);
  };

  const handleUpdateAssignment = (formData: FormData) => {
    if (!editingAssignment) return;
    
    const data = {
      id: editingAssignment.id,
      title: formData.get('title'),
      description: formData.get('description'),
      quizId: formData.get('quizId'),
      dueDate: formData.get('dueDate'),
      availableFrom: formData.get('availableFrom'),
      availableTo: formData.get('availableTo'),
      timeLimit: parseInt(formData.get('timeLimit') as string),
      maxAttempts: parseInt(formData.get('maxAttempts') as string),
      allowLateSubmission: formData.get('allowLateSubmission') === 'on',
      shuffleQuestions: formData.get('shuffleQuestions') === 'on',
      showCorrectAnswers: formData.get('showCorrectAnswers') === 'on',
      requireProctoring: formData.get('requireProctoring') === 'on',
      allowCalculator: formData.get('allowCalculator') === 'on',
      status: editingAssignment.status
    };
    updateAssignmentMutation.mutate(data);
  };

  const publishAssignment = (id: string) => {
    updateAssignmentMutation.mutate({ id, status: 'published' });
  };

  const archiveAssignment = (id: string) => {
    updateAssignmentMutation.mutate({ id, status: 'archived' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const AssignmentForm = ({ assignment, onSubmit }: { assignment?: Assignment; onSubmit: (data: FormData) => void }) => (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit(new FormData(e.target as HTMLFormElement));
    }} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            defaultValue={assignment?.title || (preSelectedQuizTitle ? `Assignment: ${preSelectedQuizTitle}` : '')}
            required
          />
        </div>
        <div>
          <Label htmlFor="quizId">Quiz</Label>
          <Select name="quizId" defaultValue={assignment?.quizId || preSelectedQuizId || ''}>
            <SelectTrigger>
              <SelectValue placeholder="Select a quiz" />
            </SelectTrigger>
            <SelectContent>
              {quizzes.map((quiz: any) => (
                <SelectItem key={quiz.id} value={quiz.id}>
                  {quiz.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Student and Section Selection */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Assign to Students</Label>
          <p className="text-sm text-muted-foreground mb-3">Select individual students or entire sections</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Individual Students */}
            <div>
              <Label className="text-sm font-medium">Individual Students</Label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                {students.filter((student: any) => student.role === 'student').map((student: any) => (
                  <div key={student.id} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={`student-${student.id}`}
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStudents([...selectedStudents, student.id]);
                        } else {
                          setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                        }
                      }}
                    />
                    <Label htmlFor={`student-${student.id}`} className="text-sm">
                      {student.name || student.email}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Sections */}
            <div>
              <Label className="text-sm font-medium">Sections</Label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                {sections.map((section: any) => (
                  <div key={section.id} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={`section-${section.id}`}
                      checked={selectedSections.includes(section.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedSections([...selectedSections, section.id]);
                        } else {
                          setSelectedSections(selectedSections.filter(id => id !== section.id));
                        }
                      }}
                    />
                    <Label htmlFor={`section-${section.id}`} className="text-sm">
                      {section.name} ({section.memberCount || 0} students)
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {(selectedStudents.length > 0 || selectedSections.length > 0) && (
            <div className="mt-3 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                Selected: {selectedStudents.length} individual students, {selectedSections.length} sections
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={assignment?.description}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="availableFrom">Available From</Label>
          <Input
            id="availableFrom"
            name="availableFrom"
            type="datetime-local"
            defaultValue={assignment?.availableFrom?.slice(0, 16)}
          />
        </div>
        <div>
          <Label htmlFor="availableTo">Available To</Label>
          <Input
            id="availableTo"
            name="availableTo"
            type="datetime-local"
            defaultValue={assignment?.availableTo?.slice(0, 16)}
          />
        </div>
        <div>
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            name="dueDate"
            type="datetime-local"
            defaultValue={assignment?.dueDate?.slice(0, 16)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
          <Input
            id="timeLimit"
            name="timeLimit"
            type="number"
            defaultValue={assignment?.timeLimit || 60}
            min={1}
            required
          />
        </div>
        <div>
          <Label htmlFor="maxAttempts">Max Attempts</Label>
          <Input
            id="maxAttempts"
            name="maxAttempts"
            type="number"
            defaultValue={assignment?.maxAttempts || 3}
            min={1}
            required
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Switch
            id="allowLateSubmission"
            name="allowLateSubmission"
            defaultChecked={assignment?.allowLateSubmission}
          />
          <Label htmlFor="allowLateSubmission">Allow Late Submission</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="shuffleQuestions"
            name="shuffleQuestions"
            defaultChecked={assignment?.shuffleQuestions}
          />
          <Label htmlFor="shuffleQuestions">Shuffle Questions</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="showCorrectAnswers"
            name="showCorrectAnswers"
            defaultChecked={assignment?.showCorrectAnswers}
          />
          <Label htmlFor="showCorrectAnswers">Show Correct Answers After Submission</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="requireProctoring"
            name="requireProctoring"
            defaultChecked={assignment?.requireProctoring}
          />
          <Label htmlFor="requireProctoring">Require Proctoring</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="allowCalculator"
            name="allowCalculator"
            defaultChecked={assignment?.allowCalculator}
          />
          <Label htmlFor="allowCalculator">Allow Calculator</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
        <Button type="button" variant="outline" onClick={() => {
          setShowCreateModal(false);
          setEditingAssignment(null);
        }}>
          Cancel
        </Button>
        <Button type="submit" disabled={createAssignmentMutation.isPending || updateAssignmentMutation.isPending}>
          {assignment ? 'Update' : 'Create'} Assignment
        </Button>
      </div>
    </form>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Home className="h-4 w-4" />
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">Assignments</span>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600">Create and manage quiz assignments for your students</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Assignment
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClipboardCheck className="h-5 w-5 mr-2" />
            Assignments ({filteredAssignments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading assignments...</div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No assignments found. Create your first assignment to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead>Avg Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment: Assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.title}</div>
                          <div className="text-sm text-gray-500">{assignment.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Users className="h-4 w-4 mr-1" />
                          {assignment.submissions || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {assignment.averageScore ? `${assignment.averageScore}%` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingAssignment(assignment)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          {assignment.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => publishAssignment(assignment.id)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {assignment.status === 'published' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => archiveAssignment(assignment.id)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this assignment?')) {
                                deleteAssignmentMutation.mutate(assignment.id);
                              }
                            }}
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
          )}
        </CardContent>
      </Card>

      {/* Create Assignment Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Assignment</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-2">
            <AssignmentForm onSubmit={handleCreateAssignment} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Modal */}
      <Dialog open={!!editingAssignment} onOpenChange={() => setEditingAssignment(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-2">
            {editingAssignment && (
              <AssignmentForm
                assignment={editingAssignment}
                onSubmit={handleUpdateAssignment}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  );
}