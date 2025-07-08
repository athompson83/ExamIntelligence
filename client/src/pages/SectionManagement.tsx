import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  UserPlus, 
  Send, 
  BookOpen,
  Calendar,
  Clock
} from 'lucide-react';

interface Section {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  accountId: string;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  accountId: string;
  createdAt: string;
}

interface Assignment {
  id: string;
  quizId: string;
  quizTitle: string;
  assignedToUserId?: string;
  assignedToSectionId?: string;
  assignedToSectionName?: string;
  assignedToUserName?: string;
  assignedById: string;
  dueDate: string;
  maxAttempts: number;
  timeLimit: number;
  isActive: boolean;
  createdAt: string;
}

export default function SectionManagement() {
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [showAssignQuiz, setShowAssignQuiz] = useState(false);
  const [sectionName, setSectionName] = useState('');
  const [sectionDescription, setSectionDescription] = useState('');
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [timeLimit, setTimeLimit] = useState(60);
  const [assignmentType, setAssignmentType] = useState<'individual' | 'section'>('section');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sections
  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ['/api/sections'],
    retry: false,
  });

  // Fetch students
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/users', { role: 'student' }],
    retry: false,
  });

  // Fetch quizzes
  const { data: quizzes = [], isLoading: quizzesLoading } = useQuery({
    queryKey: ['/api/quizzes'],
    retry: false,
  });

  // Fetch assignments
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['/api/quiz-assignments'],
    retry: false,
  });

  // Fetch section members
  const { data: sectionMembers = [] } = useQuery({
    queryKey: ['/api/sections', selectedSectionId, 'members'],
    enabled: !!selectedSectionId,
    retry: false,
  });

  // Create section mutation
  const createSectionMutation = useMutation({
    mutationFn: async (sectionData: { name: string; description: string }) => {
      await apiRequest('/api/sections', {
        method: 'POST',
        body: JSON.stringify(sectionData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sections'] });
      setShowCreateSection(false);
      setSectionName('');
      setSectionDescription('');
      toast({
        title: "Section created",
        description: "The section has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create section. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add students to section mutation
  const addStudentsMutation = useMutation({
    mutationFn: async ({ sectionId, studentIds }: { sectionId: string; studentIds: string[] }) => {
      await apiRequest(`/api/sections/${sectionId}/members`, {
        method: 'POST',
        body: JSON.stringify({ studentIds }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sections', selectedSectionId, 'members'] });
      toast({
        title: "Students added",
        description: "Students have been added to the section successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add students to section. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create quiz assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (assignmentData: {
      quizId: string;
      assignedToUserId?: string;
      assignedToSectionId?: string;
      dueDate: string;
      maxAttempts: number;
      timeLimit: number;
    }) => {
      await apiRequest('/api/quiz-assignments', {
        method: 'POST',
        body: JSON.stringify(assignmentData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-assignments'] });
      setShowAssignQuiz(false);
      setSelectedQuizId('');
      setSelectedStudents([]);
      setSelectedSections([]);
      setDueDate('');
      setMaxAttempts(1);
      setTimeLimit(60);
      toast({
        title: "Quiz assigned",
        description: "The quiz has been assigned successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to assign quiz. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionName.trim()) return;
    
    createSectionMutation.mutate({
      name: sectionName,
      description: sectionDescription,
    });
  };

  const handleAssignQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuizId || !dueDate) return;

    if (assignmentType === 'individual') {
      // Create individual assignments
      selectedStudents.forEach(studentId => {
        createAssignmentMutation.mutate({
          quizId: selectedQuizId,
          assignedToUserId: studentId,
          dueDate,
          maxAttempts,
          timeLimit,
        });
      });
    } else {
      // Create section assignments
      selectedSections.forEach(sectionId => {
        createAssignmentMutation.mutate({
          quizId: selectedQuizId,
          assignedToSectionId: sectionId,
          dueDate,
          maxAttempts,
          timeLimit,
        });
      });
    }
  };

  const availableStudents = students.filter(student => 
    !sectionMembers.some(member => member.studentId === student.id)
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Section Management</h1>
          <p className="text-gray-600">Organize students and assign quizzes</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showCreateSection} onOpenChange={setShowCreateSection}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Section
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Section</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSection} className="space-y-4">
                <div>
                  <Label htmlFor="sectionName">Section Name</Label>
                  <Input
                    id="sectionName"
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    placeholder="Enter section name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sectionDescription">Description</Label>
                  <Input
                    id="sectionDescription"
                    value={sectionDescription}
                    onChange={(e) => setSectionDescription(e.target.value)}
                    placeholder="Enter section description"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateSection(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createSectionMutation.isPending}>
                    {createSectionMutation.isPending ? 'Creating...' : 'Create Section'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showAssignQuiz} onOpenChange={setShowAssignQuiz}>
            <DialogTrigger asChild>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Assign Quiz
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Assign Quiz</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAssignQuiz} className="space-y-4">
                <div>
                  <Label htmlFor="quiz">Select Quiz</Label>
                  <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a quiz" />
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
                  <Label>Assignment Type</Label>
                  <Select value={assignmentType} onValueChange={(value: 'individual' | 'section') => setAssignmentType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="section">Assign to Section</SelectItem>
                      <SelectItem value="individual">Assign to Individual Students</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {assignmentType === 'section' ? (
                  <div>
                    <Label>Select Sections</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {sections.map((section: Section) => (
                        <div key={section.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={section.id}
                            checked={selectedSections.includes(section.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedSections([...selectedSections, section.id]);
                              } else {
                                setSelectedSections(selectedSections.filter(id => id !== section.id));
                              }
                            }}
                          />
                          <Label htmlFor={section.id} className="text-sm">
                            {section.name} ({section.memberCount} students)
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label>Select Students</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                      {students.map((student: User) => (
                        <div key={student.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={student.id}
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStudents([...selectedStudents, student.id]);
                              } else {
                                setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                              }
                            }}
                          />
                          <Label htmlFor={student.id} className="text-sm">
                            {student.firstName} {student.lastName} ({student.email})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxAttempts">Max Attempts</Label>
                    <Input
                      id="maxAttempts"
                      type="number"
                      min="1"
                      max="10"
                      value={maxAttempts}
                      onChange={(e) => setMaxAttempts(parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    min="5"
                    max="300"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAssignQuiz(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createAssignmentMutation.isPending}>
                    {createAssignmentMutation.isPending ? 'Assigning...' : 'Assign Quiz'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="sections" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map((section: Section) => (
              <Card key={section.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{section.name}</CardTitle>
                    <Badge variant={section.isActive ? "default" : "secondary"}>
                      {section.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {section.description && (
                    <p className="text-sm text-gray-600">{section.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{section.memberCount} students</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSectionId(section.id)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="space-y-4">
            {assignments.map((assignment: Assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{assignment.quizTitle}</CardTitle>
                    <Badge variant={assignment.isActive ? "default" : "secondary"}>
                      {assignment.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium">Assigned To</p>
                      <p className="text-sm text-gray-600">
                        {assignment.assignedToSectionName 
                          ? `Section: ${assignment.assignedToSectionName}`
                          : assignment.assignedToUserName
                          ? `Student: ${assignment.assignedToUserName}`
                          : 'Unknown'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Due Date</p>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(assignment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Max Attempts</p>
                      <p className="text-sm text-gray-600">{assignment.maxAttempts}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Time Limit</p>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {assignment.timeLimit} minutes
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student: User) => (
              <Card key={student.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{student.firstName} {student.lastName}</p>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Section Detail Modal */}
      {selectedSectionId && (
        <Dialog open={!!selectedSectionId} onOpenChange={() => setSelectedSectionId(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Section Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Current Members</h3>
                <div className="space-y-2">
                  {sectionMembers.map((member: any) => (
                    <div key={member.studentId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>{member.studentName}</span>
                      <Button variant="outline" size="sm">
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="font-medium">Add Students</h3>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {availableStudents.map((student: User) => (
                    <div key={student.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`add-${student.id}`}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            addStudentsMutation.mutate({
                              sectionId: selectedSectionId,
                              studentIds: [student.id],
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`add-${student.id}`} className="text-sm">
                        {student.firstName} {student.lastName}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}