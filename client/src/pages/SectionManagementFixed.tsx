import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Users, 
  Plus, 
  UserPlus, 
  UserMinus,
  BookOpen,
  Home,
  ChevronRight,
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import { Link } from 'wouter';

interface Section {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  accountId: string;
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

interface SectionMember {
  id?: string;
  studentId?: string;
  email?: string;
  studentEmail?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  joinedAt?: string;
  isActive?: boolean;
}

export default function SectionManagementFixed() {
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [showAddStudents, setShowAddStudents] = useState(false);
  const [sectionName, setSectionName] = useState('');
  const [sectionDescription, setSectionDescription] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sections
  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ['/api/sections'],
    staleTime: 30000,
  });

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    staleTime: 30000,
  });

  // Fetch section members
  const { data: sectionMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['/api/sections', selectedSection?.id, 'members'],
    enabled: !!selectedSection,
    staleTime: 30000,
  });

  // Create section mutation
  const createSectionMutation = useMutation({
    mutationFn: async (sectionData: { name: string; description: string }) => {
      const response = await apiRequest('/api/sections', {
        method: 'POST',
        body: JSON.stringify(sectionData),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Section created successfully",
      });
      setShowCreateSection(false);
      setSectionName('');
      setSectionDescription('');
      queryClient.invalidateQueries({ queryKey: ['/api/sections'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create section",
        variant: "destructive",
      });
    },
  });

  // Add students to section mutation
  const addStudentsMutation = useMutation({
    mutationFn: async ({ sectionId, studentIds }: { sectionId: string; studentIds: string[] }) => {
      const response = await apiRequest(`/api/sections/${sectionId}/members`, {
        method: 'POST',
        body: JSON.stringify({ studentIds }),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Students added to section successfully",
      });
      setShowAddStudents(false);
      setSelectedStudents([]);
      queryClient.invalidateQueries({ queryKey: ['/api/sections', selectedSection?.id, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sections'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add students to section",
        variant: "destructive",
      });
    },
  });

  // Remove student from section mutation
  const removeStudentMutation = useMutation({
    mutationFn: async ({ sectionId, studentId }: { sectionId: string; studentId: string }) => {
      const response = await apiRequest(`/api/sections/${sectionId}/members/${studentId}`, {
        method: 'DELETE',
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student removed from section successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sections', selectedSection?.id, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sections'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove student from section",
        variant: "destructive",
      });
    },
  });

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionName.trim()) {
      toast({
        title: "Error",
        description: "Section name is required",
        variant: "destructive",
      });
      return;
    }
    createSectionMutation.mutate({ name: sectionName, description: sectionDescription });
  };

  const handleAddStudents = () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student",
        variant: "destructive",
      });
      return;
    }
    if (selectedSection) {
      addStudentsMutation.mutate({ sectionId: selectedSection.id, studentIds: selectedStudents });
    }
  };

  const handleRemoveStudent = (studentId: string) => {
    if (selectedSection) {
      removeStudentMutation.mutate({ sectionId: selectedSection.id, studentId });
    }
  };

  const handleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Get students who are not in the selected section
  const availableStudents = users.filter(user => 
    user.role === 'student' && 
    !sectionMembers.some(member => (member.id || member.studentId) === user.id) &&
    ((user.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
     (user.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
     (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/dashboard" className="flex items-center hover:text-blue-600">
            <Home className="h-4 w-4 mr-1" />
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900">Section Management</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Section Management</h1>
            <p className="text-gray-600 mt-1">Create and manage student sections</p>
          </div>
          <Button 
            onClick={() => setShowCreateSection(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Section
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sections List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Sections ({sections.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sectionsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : sections.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No sections created yet</p>
                    <p className="text-sm">Create your first section to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sections.map((section: Section) => (
                      <div
                        key={section.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedSection?.id === section.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedSection(section)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">{section.name}</h3>
                            <p className="text-sm text-gray-500 truncate">{section.description}</p>
                          </div>
                          <Badge variant="secondary" className="ml-2">
                            {section.memberCount}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Section Details */}
          <div className="lg:col-span-2">
            {selectedSection ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      {selectedSection.name}
                    </CardTitle>
                    <Button
                      onClick={() => setShowAddStudents(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Students
                    </Button>
                  </div>
                  <p className="text-gray-600">{selectedSection.description}</p>
                </CardHeader>
                <CardContent>
                  {membersLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                  ) : sectionMembers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No students in this section</p>
                      <p className="text-sm">Add students to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sectionMembers.map((member: SectionMember) => (
                        <div
                          key={member.id || member.studentId}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium text-sm">
                                {(member.firstName || '').charAt(0)}{(member.lastName || '').charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {member.firstName || ''} {member.lastName || ''}
                              </p>
                              <p className="text-sm text-gray-500">{member.email || member.studentEmail || ''}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveStudent(member.id || member.studentId || '')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center text-gray-500">
                    <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">Select a section to view details</p>
                    <p className="text-sm">Choose a section from the list to manage its members</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Create Section Dialog */}
        <Dialog open={showCreateSection} onOpenChange={setShowCreateSection}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Section</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSection} className="space-y-4">
              <div>
                <Label htmlFor="sectionName">Section Name *</Label>
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

        {/* Add Students Dialog */}
        <Dialog open={showAddStudents} onOpenChange={setShowAddStudents}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Students to {selectedSection?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="search">Search Students</Label>
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or email..."
                />
              </div>
              <div className="max-h-96 overflow-y-auto border rounded-lg p-3">
                {usersLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : availableStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No available students found</p>
                    <p className="text-sm">All students may already be in this section</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableStudents.map((student: User) => (
                      <div
                        key={student.id}
                        className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50"
                      >
                        <Checkbox
                          id={student.id}
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => handleStudentSelection(student.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {student.firstName || ''} {student.lastName || ''}
                          </p>
                          <p className="text-sm text-gray-500">{student.email || ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                </p>
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddStudents(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddStudents}
                    disabled={selectedStudents.length === 0 || addStudentsMutation.isPending}
                  >
                    {addStudentsMutation.isPending ? 'Adding...' : 'Add Students'}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}