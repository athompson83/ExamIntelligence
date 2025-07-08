import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function Test() {
  const [testResults, setTestResults] = useState<any[]>([]);

  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    retry: false,
  });

  const { data: sections } = useQuery({
    queryKey: ['/api/sections'],
    retry: false,
  });

  const { data: quizzes } = useQuery({
    queryKey: ['/api/quizzes'],
    retry: false,
  });

  const { data: assignments } = useQuery({
    queryKey: ['/api/quiz-assignments'],
    retry: false,
  });

  const createDummyUsers = async () => {
    try {
      const result = await apiRequest('/api/create-dummy-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      setTestResults(prev => [...prev, { action: 'Create Dummy Users', result }]);
    } catch (error) {
      setTestResults(prev => [...prev, { action: 'Create Dummy Users', error: error.message }]);
    }
  };

  const createTestSection = async () => {
    try {
      const result = await apiRequest('/api/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Section',
          description: 'A test section for development',
        }),
      });
      setTestResults(prev => [...prev, { action: 'Create Test Section', result }]);
    } catch (error) {
      setTestResults(prev => [...prev, { action: 'Create Test Section', error: error.message }]);
    }
  };

  const addStudentsToSection = async () => {
    try {
      if (!sections || sections.length === 0) {
        setTestResults(prev => [...prev, { action: 'Add Students to Section', error: 'No sections available' }]);
        return;
      }
      
      const studentUsers = users?.filter(user => user.role === 'student') || [];
      if (studentUsers.length === 0) {
        setTestResults(prev => [...prev, { action: 'Add Students to Section', error: 'No students available' }]);
        return;
      }

      const result = await apiRequest(`/api/sections/${sections[0].id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentIds: studentUsers.slice(0, 2).map(u => u.id), // Add first 2 students
        }),
      });
      setTestResults(prev => [...prev, { action: 'Add Students to Section', result }]);
    } catch (error) {
      setTestResults(prev => [...prev, { action: 'Add Students to Section', error: error.message }]);
    }
  };

  const createTestAssignment = async () => {
    try {
      const result = await apiRequest('/api/quiz-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Assignment',
          description: 'A test assignment',
          quizId: quizzes?.[0]?.id || 'test-quiz',
          assignedToSectionId: sections?.[0]?.id || null,
          assignedToUserId: users?.[0]?.id || null,
          assignedById: 'test@example.com',
          accountId: 'default-account',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          maxAttempts: 1,
          timeLimit: 60,
          isActive: true,
        }),
      });
      setTestResults(prev => [...prev, { action: 'Create Test Assignment', result }]);
    } catch (error) {
      setTestResults(prev => [...prev, { action: 'Create Test Assignment', error: error.message }]);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">API Test Page</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Data Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>Users: {users?.length || 0}</div>
              <div>Sections: {sections?.length || 0}</div>
              <div>Quizzes: {quizzes?.length || 0}</div>
              <div>Assignments: {assignments?.length || 0}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={createDummyUsers} className="w-full">
              Create Dummy Users
            </Button>
            <Button onClick={createTestSection} className="w-full">
              Create Test Section
            </Button>
            <Button onClick={addStudentsToSection} className="w-full">
              Add Students to Section
            </Button>
            <Button onClick={createTestAssignment} className="w-full">
              Create Test Assignment
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="p-2 border rounded">
                  <div className="font-semibold">{result.action}</div>
                  <div className="text-sm text-gray-600">
                    {result.error ? (
                      <span className="text-red-600">Error: {result.error}</span>
                    ) : (
                      <span className="text-green-600">Success: {JSON.stringify(result.result)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}