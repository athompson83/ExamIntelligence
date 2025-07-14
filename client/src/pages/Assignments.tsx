import { useState, useEffect, useCallback } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link } from 'wouter';
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
  Settings,
  X,
  Check,
  UserPlus,
  UsersIcon
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
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  
  // Clean, simple form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quizId: '',
    dueDate: '',
    availableFrom: '',
    availableTo: '',
    timeLimit: 60,
    maxAttempts: 1,
    allowLateSubmission: false,
    percentLostPerDay: 10,
    maxLateDays: 7,
    showCorrectAnswers: false,
    requireProctoring: false,
    allowCalculator: false,
    enableQuestionFeedback: false,
    catEnabled: false,
    catMinQuestions: 10,
    catMaxQuestions: 50,
    catDifficultyTarget: 0.5
  });
  
  const [location] = useLocation();
  const queryClient = useQueryClient();

  // Simple form input handler
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Parse URL parameters for pre-selected quiz
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const preSelectedQuizId = urlParams.get('quizId');
  const preSelectedQuizTitle = urlParams.get('quizTitle');

  // Auto-open create modal if coming from quiz manager
  useEffect(() => {
    if (preSelectedQuizId && location.includes('/assignments')) {
      setShowCreateModal(true);
      setFormData(prev => ({
        ...prev,
        quizId: preSelectedQuizId,
        title: preSelectedQuizTitle ? `Assignment: ${preSelectedQuizTitle}` : '',
      }));
    }
  }, [preSelectedQuizId, preSelectedQuizTitle, location]);

  // Reset form when modal closes
  useEffect(() => {
    if (!showCreateModal && !editingAssignment) {
      setSelectedStudents([]);
      setSelectedSections([]);
      setStudentSearchTerm('');
      setFormData({
        title: '',
        description: '',
        quizId: '',
        dueDate: '',
        availableFrom: '',
        availableTo: '',
        timeLimit: 60,
        maxAttempts: 1,
        allowLateSubmission: false,
        percentLostPerDay: 10,
        maxLateDays: 7,
        showCorrectAnswers: false,
        requireProctoring: false,
        allowCalculator: false,
        enableQuestionFeedback: false,
        catEnabled: false,
        catMinQuestions: 10,
        catMaxQuestions: 50,
        catDifficultyTarget: 0.5
      });
    }
  }, [showCreateModal, editingAssignment]);

  // Populate form when editing
  useEffect(() => {
    if (editingAssignment) {
      setFormData({
        title: editingAssignment.title || '',
        description: editingAssignment.description || '',
        quizId: editingAssignment.quizId || '',
        dueDate: editingAssignment.dueDate?.slice(0, 16) || '',
        availableFrom: editingAssignment.availableFrom?.slice(0, 16) || '',
        availableTo: editingAssignment.availableTo?.slice(0, 16) || '',
        timeLimit: editingAssignment.timeLimit || 60,
        maxAttempts: editingAssignment.maxAttempts || 1,
        allowLateSubmission: editingAssignment.allowLateSubmission || false,
        percentLostPerDay: editingAssignment.lateGradingOptions?.percentLostPerDay || 10,
        maxLateDays: editingAssignment.lateGradingOptions?.maxLateDays || 7,
        showCorrectAnswers: editingAssignment.showCorrectAnswers || false,
        requireProctoring: editingAssignment.requireProctoring || false,
        allowCalculator: editingAssignment.allowCalculator || false,
        enableQuestionFeedback: editingAssignment.enableQuestionFeedback || false,
        catEnabled: editingAssignment.catEnabled || false,
        catMinQuestions: editingAssignment.catMinQuestions || 10,
        catMaxQuestions: editingAssignment.catMaxQuestions || 50,
        catDifficultyTarget: editingAssignment.catDifficultyTarget || 0.5
      });
    }
  }, [editingAssignment]);

  // Fetch data queries
  const { data: assignments = [] } = useQuery({
    queryKey: ['/api/quiz-assignments'],
    queryFn: () => apiRequest('/api/quiz-assignments'),
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ['/api/quizzes'],
    queryFn: () => apiRequest('/api/quizzes'),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('/api/users'),
  });

  const { data: sections = [] } = useQuery({
    queryKey: ['/api/sections'],
    queryFn: () => apiRequest('/api/sections'),
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/quiz-assignments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-assignments'] });
    },
  });

  // Clean assignment creation handler
  const handleCreateAssignment = useCallback(() => {
    // Use current form data directly
    const assignmentData = formData;
    
    // Validate required fields
    if (!assignmentData.quizId || assignmentData.quizId === 'add-new' || assignmentData.quizId === 'no-quizzes') {
      toast({
        title: "Error",
        description: "Please select a valid quiz",
        variant: "destructive",
      });
      return;
    }
    
    if (!assignmentData.title || !assignmentData.dueDate) {
      toast({
        title: "Error", 
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedStudents.length === 0 && selectedSections.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student or section",
        variant: "destructive",
      });
      return;
    }
    
    // Create assignments
    const assignments = [];
    
    // Individual student assignments
    for (const studentId of selectedStudents) {
      assignments.push({
        ...assignmentData,
        assignedToUserId: studentId,
        assignedToSectionId: null,
      });
    }
    
    // Section assignments
    for (const sectionId of selectedSections) {
      assignments.push({
        ...assignmentData,
        assignedToUserId: null,
        assignedToSectionId: sectionId,
      });
    }
    
    // Create all assignments
    Promise.all(assignments.map(data => createAssignmentMutation.mutateAsync(data)))
      .then(() => {
        toast({
          title: "Success",
          description: `Created ${assignments.length} assignment(s) successfully`,
        });
        
        // Reset and close
        setShowCreateModal(false);
        setSelectedStudents([]);
        setSelectedSections([]);
        setFormData({
          title: '',
          description: '',
          quizId: '',
          dueDate: '',
          availableFrom: '',
          availableTo: '',
          timeLimit: 60,
          maxAttempts: 1,
          allowLateSubmission: false,
          percentLostPerDay: 10,
          maxLateDays: 7,
          showCorrectAnswers: false,
          enableQuestionFeedback: false,
          requireProctoring: false,
          allowCalculator: false,
          catEnabled: false,
          catMinQuestions: 10,
          catMaxQuestions: 50,
          catDifficultyTarget: 0.5
        });
      })
      .catch(error => {
        console.error('Error creating assignments:', error);
        toast({
          title: "Error",
          description: "Failed to create assignment. Please try again.",
          variant: "destructive",
        });
      });
  }, [formData, selectedStudents, selectedSections, createAssignmentMutation]);

  // Filter assignments
  const filteredAssignments = assignments.filter((assignment: Assignment) => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Assignment Form Component
  const AssignmentForm = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Assignment Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter assignment title"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter assignment description"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="quizId">Select Quiz *</Label>
          <Select 
            value={formData.quizId} 
            onValueChange={(value) => handleInputChange('quizId', value)}
          >
            <SelectTrigger className="mt-1">
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

      {/* Date Settings */}
      <div className="space-y-4">
        <h3 className="font-medium">Date Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="availableFrom">Available From</Label>
            <Input
              id="availableFrom"
              type="datetime-local"
              value={formData.availableFrom}
              onChange={(e) => handleInputChange('availableFrom', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="availableTo">Available To</Label>
            <Input
              id="availableTo"
              type="datetime-local"
              value={formData.availableTo}
              onChange={(e) => handleInputChange('availableTo', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input
              id="dueDate"
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Assignment Settings */}
      <div className="space-y-4">
        <h3 className="font-medium">Assignment Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
            <Input
              id="timeLimit"
              type="number"
              value={formData.timeLimit}
              onChange={(e) => handleInputChange('timeLimit', parseInt(e.target.value) || 60)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="maxAttempts">Max Attempts</Label>
            <Input
              id="maxAttempts"
              type="number"
              value={formData.maxAttempts}
              onChange={(e) => handleInputChange('maxAttempts', parseInt(e.target.value) || 1)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Switch
              id="allowLateSubmission"
              checked={formData.allowLateSubmission}
              onCheckedChange={(checked) => handleInputChange('allowLateSubmission', checked)}
            />
            <Label htmlFor="allowLateSubmission">Allow Late Submission</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="showCorrectAnswers"
              checked={formData.showCorrectAnswers}
              onCheckedChange={(checked) => handleInputChange('showCorrectAnswers', checked)}
            />
            <Label htmlFor="showCorrectAnswers">Show Correct Answers</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="requireProctoring"
              checked={formData.requireProctoring}
              onCheckedChange={(checked) => handleInputChange('requireProctoring', checked)}
            />
            <Label htmlFor="requireProctoring">Require Proctoring</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="allowCalculator"
              checked={formData.allowCalculator}
              onCheckedChange={(checked) => handleInputChange('allowCalculator', checked)}
            />
            <Label htmlFor="allowCalculator">Allow Calculator</Label>
          </div>
        </div>
      </div>

      {/* Student Selection */}
      <div className="space-y-4">
        <h3 className="font-medium">Assign To</h3>
        
        <div className="max-h-60 overflow-y-auto border rounded-md p-4">
          <div className="space-y-2">
            <h4 className="font-medium">Students</h4>
            {students.map((student: any) => (
              <div key={student.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`student-${student.id}`}
                  checked={selectedStudents.includes(student.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedStudents(prev => [...prev, student.id]);
                    } else {
                      setSelectedStudents(prev => prev.filter(id => id !== student.id));
                    }
                  }}
                />
                <Label htmlFor={`student-${student.id}`}>
                  {student.firstName} {student.lastName} ({student.email})
                </Label>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <h4 className="font-medium">Sections</h4>
            {sections.map((section: any) => (
              <div key={section.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`section-${section.id}`}
                  checked={selectedSections.includes(section.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedSections(prev => [...prev, section.id]);
                    } else {
                      setSelectedSections(prev => prev.filter(id => id !== section.id));
                    }
                  }}
                />
                <Label htmlFor={`section-${section.id}`}>
                  {section.name} ({section.memberCount || 0} students)
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setShowCreateModal(false)}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleCreateAssignment}
          disabled={createAssignmentMutation.isPending}
        >
          Create Assignment
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
            <Link href="/" className="flex items-center hover:text-foreground transition-colors">
              <Home className="h-4 w-4" />
            </Link>
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

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
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

          {/* Assignments List */}
          <div className="grid gap-4">
            {filteredAssignments.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No assignments found.</p>
                </CardContent>
              </Card>
            ) : (
              filteredAssignments.map((assignment: Assignment) => (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={assignment.status === 'published' ? 'default' : 'secondary'}>
                          {assignment.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{assignment.timeLimit} min</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{assignment.submissions} submissions</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                        <span>Avg: {assignment.averageScore}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Create Assignment Modal */}
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogDescription>
                  Create a new assignment by selecting a quiz and configuring the assignment details.
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-y-auto flex-1 px-2">
                <AssignmentForm />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}