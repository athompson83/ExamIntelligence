import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Section {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isActive: boolean;
  createdAt: string;
}

interface SectionMember {
  studentId: string;
  studentName: string;
  studentEmail: string;
  joinedAt: string;
}

export default function SectionManagementTest() {
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');
  const [showCreateSection, setShowCreateSection] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    retry: false,
  });

  // Fetch sections
  const { data: sections = [], isLoading: sectionsLoading } = useQuery<Section[]>({
    queryKey: ['/api/sections'],
    retry: false,
  });

  // Fetch section members
  const { data: sectionMembers = [] } = useQuery<SectionMember[]>({
    queryKey: ['/api/sections', selectedSectionId, 'members'],
    enabled: !!selectedSectionId,
    retry: false,
  });

  // Create section mutation
  const createSectionMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      return await apiRequest('/api/sections', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Section created successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/sections'] });
      setShowCreateSection(false);
      setNewSectionName('');
      setNewSectionDescription('');
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to create section', variant: 'destructive' });
    },
  });

  // Add students to section mutation
  const addStudentsMutation = useMutation({
    mutationFn: async (data: { sectionId: string; studentIds: string[] }) => {
      return await apiRequest(`/api/sections/${data.sectionId}/members`, {
        method: 'POST',
        body: JSON.stringify({ studentIds: data.studentIds }),
      });
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Student added to section successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/sections', selectedSectionId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sections'] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to add student to section', variant: 'destructive' });
    },
  });

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSectionName.trim()) {
      createSectionMutation.mutate({
        name: newSectionName.trim(),
        description: newSectionDescription.trim(),
      });
    }
  };

  const availableStudents = users.filter(user => 
    user.role === 'student' && 
    !sectionMembers.some(member => member.studentId === user.id)
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Section Management Test</h1>
        <Button onClick={() => setShowCreateSection(true)}>
          Create New Section
        </Button>
      </div>

      {/* Create Section Dialog */}
      <Dialog open={showCreateSection} onOpenChange={setShowCreateSection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Section</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSection} className="space-y-4">
            <div>
              <Label htmlFor="sectionName">Section Name</Label>
              <Input
                id="sectionName"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="sectionDescription">Description</Label>
              <Textarea
                id="sectionDescription"
                value={newSectionDescription}
                onChange={(e) => setNewSectionDescription(e.target.value)}
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

      {/* API Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>API Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Users API</span>
                <Badge variant={usersLoading ? "secondary" : "default"}>
                  {usersLoading ? 'Loading...' : `${users.length} users`}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Sections API</span>
                <Badge variant={sectionsLoading ? "secondary" : "default"}>
                  {sectionsLoading ? 'Loading...' : `${sections.length} sections`}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>{user.firstName} {user.lastName}</span>
                  <Badge variant={user.role === 'student' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Sections ({sections.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section) => (
            <Card key={section.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{section.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">{section.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {section.memberCount} member{section.memberCount !== 1 ? 's' : ''}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setSelectedSectionId(section.id)}
                  >
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Section Detail Modal */}
      {selectedSectionId && (
        <Dialog open={!!selectedSectionId} onOpenChange={() => setSelectedSectionId(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Section Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Current Members ({sectionMembers.length})</h3>
                <div className="space-y-2">
                  {sectionMembers.map((member, index) => (
                    <div key={member.studentId || `member-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{member.studentName}</span>
                        <span className="text-sm text-gray-600 ml-2">({member.studentEmail})</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="font-medium">Add Students ({availableStudents.length} available)</h3>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                  {availableStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>{student.firstName} {student.lastName}</span>
                      <Button
                        size="sm"
                        onClick={() => addStudentsMutation.mutate({
                          sectionId: selectedSectionId,
                          studentIds: [student.id],
                        })}
                        disabled={addStudentsMutation.isPending}
                      >
                        {addStudentsMutation.isPending ? 'Adding...' : 'Add'}
                      </Button>
                    </div>
                  ))}
                  {availableStudents.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      All students are already in this section
                    </p>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}