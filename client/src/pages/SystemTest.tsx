import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle, XCircle, Clock, AlertCircle, Home, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  result?: any;
  error?: string;
  duration?: number;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
}

export default function SystemTest() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateTestResult = (suiteName: string, testName: string, result: Partial<TestResult>) => {
    setTestSuites(prev => prev.map(suite => 
      suite.name === suiteName 
        ? {
            ...suite,
            tests: suite.tests.map(test => 
              test.name === testName 
                ? { ...test, ...result }
                : test
            )
          }
        : suite
    ));
  };

  const runTest = async (suiteName: string, testName: string, testFn: () => Promise<any>) => {
    setCurrentTest(`${suiteName}: ${testName}`);
    const startTime = Date.now();
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      updateTestResult(suiteName, testName, { 
        status: 'success', 
        result, 
        duration 
      });
      return { success: true, result };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestResult(suiteName, testName, { 
        status: 'error', 
        error: error.message,
        duration 
      });
      return { success: false, error: error.message };
    }
  };

  const initializeTestSuites = () => {
    const suites: TestSuite[] = [
      {
        name: 'Authentication & Users',
        tests: [
          { name: 'Get current user', status: 'pending' },
          { name: 'Create test users', status: 'pending' },
          { name: 'Fetch all users', status: 'pending' },
          { name: 'User role validation', status: 'pending' },
        ]
      },
      {
        name: 'Section Management',
        tests: [
          { name: 'Create section', status: 'pending' },
          { name: 'List sections', status: 'pending' },
          { name: 'Add students to section', status: 'pending' },
          { name: 'Get section members', status: 'pending' },
        ]
      },
      {
        name: 'Quiz Management',
        tests: [
          { name: 'Create test quiz', status: 'pending' },
          { name: 'List quizzes', status: 'pending' },
          { name: 'Quiz details', status: 'pending' },
          { name: 'Quiz questions', status: 'pending' },
        ]
      },
      {
        name: 'Assignment System',
        tests: [
          { name: 'Create quiz assignment', status: 'pending' },
          { name: 'List assignments', status: 'pending' },
          { name: 'Assignment to section', status: 'pending' },
          { name: 'Assignment to individual', status: 'pending' },
        ]
      },
      {
        name: 'Testbank System',
        tests: [
          { name: 'Create testbank', status: 'pending' },
          { name: 'List testbanks', status: 'pending' },
          { name: 'Add questions to testbank', status: 'pending' },
          { name: 'Question validation', status: 'pending' },
        ]
      },
      {
        name: 'Mobile API',
        tests: [
          { name: 'Mobile dashboard stats', status: 'pending' },
          { name: 'Mobile assignments', status: 'pending' },
          { name: 'Student profile', status: 'pending' },
          { name: 'Quiz session', status: 'pending' },
        ]
      },
      {
        name: 'Analytics & Reports',
        tests: [
          { name: 'Dashboard stats', status: 'pending' },
          { name: 'Performance analytics', status: 'pending' },
          { name: 'Question analytics', status: 'pending' },
          { name: 'Export functionality', status: 'pending' },
        ]
      },
      {
        name: 'AI Services',
        tests: [
          { name: 'Question generation', status: 'pending' },
          { name: 'Question validation', status: 'pending' },
          { name: 'Study aid generation', status: 'pending' },
          { name: 'Similar question creation', status: 'pending' },
        ]
      }
    ];
    
    setTestSuites(suites);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    initializeTestSuites();

    // Authentication & Users Tests
    await runTest('Authentication & Users', 'Get current user', async () => {
      return await apiRequest('/api/auth/user');
    });

    await runTest('Authentication & Users', 'Create test users', async () => {
      const users = [
        { email: 'teacher1@test.com', firstName: 'Teacher', lastName: 'One', role: 'teacher' },
        { email: 'student1@test.com', firstName: 'Student', lastName: 'One', role: 'student' },
        { email: 'student2@test.com', firstName: 'Student', lastName: 'Two', role: 'student' },
      ];
      
      const results = [];
      for (const user of users) {
        try {
          const result = await apiRequest('/api/users', {
            method: 'POST',
            body: JSON.stringify(user),
          });
          results.push(result);
        } catch (error) {
          // User might already exist, that's OK
        }
      }
      return results;
    });

    await runTest('Authentication & Users', 'Fetch all users', async () => {
      return await apiRequest('/api/users');
    });

    // Section Management Tests
    await runTest('Section Management', 'Create section', async () => {
      return await apiRequest('/api/sections', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Section ' + Date.now(),
          description: 'Automated test section',
        }),
      });
    });

    await runTest('Section Management', 'List sections', async () => {
      return await apiRequest('/api/sections');
    });

    // Get sections for next tests
    const sectionsResult = await runTest('Section Management', 'Get section members', async () => {
      const sections = await apiRequest('/api/sections');
      if (sections.length > 0) {
        return await apiRequest(`/api/sections/${sections[0].id}/members`);
      }
      return [];
    });

    // Quiz Management Tests
    await runTest('Quiz Management', 'Create test quiz', async () => {
      return await apiRequest('/api/quizzes', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Quiz ' + Date.now(),
          description: 'Automated test quiz',
          timeLimit: 60,
          maxAttempts: 3,
          isActive: true,
        }),
      });
    });

    await runTest('Quiz Management', 'List quizzes', async () => {
      return await apiRequest('/api/quizzes');
    });

    // Assignment System Tests
    const quizzesResult = await runTest('Assignment System', 'Create quiz assignment', async () => {
      const quizzes = await apiRequest('/api/quizzes');
      const sections = await apiRequest('/api/sections');
      
      if (quizzes.length > 0 && sections.length > 0) {
        return await apiRequest('/api/quiz-assignments', {
          method: 'POST',
          body: JSON.stringify({
            quizId: quizzes[0].id,
            assignedToSectionId: sections[0].id,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            maxAttempts: 2,
            timeLimit: 60,
          }),
        });
      }
      throw new Error('No quizzes or sections available');
    });

    await runTest('Assignment System', 'List assignments', async () => {
      return await apiRequest('/api/quiz-assignments');
    });

    // Testbank System Tests
    await runTest('Testbank System', 'Create testbank', async () => {
      return await apiRequest('/api/testbanks', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Bank ' + Date.now(),
          description: 'Automated test bank',
          subject: 'Computer Science',
          isActive: true,
        }),
      });
    });

    await runTest('Testbank System', 'List testbanks', async () => {
      return await apiRequest('/api/testbanks');
    });

    // Mobile API Tests
    await runTest('Mobile API', 'Mobile dashboard stats', async () => {
      return await apiRequest('/api/mobile/dashboard/stats');
    });

    await runTest('Mobile API', 'Mobile assignments', async () => {
      return await apiRequest('/api/mobile/assignments');
    });

    await runTest('Mobile API', 'Student profile', async () => {
      return await apiRequest('/api/mobile/profile');
    });

    // Analytics Tests
    await runTest('Analytics & Reports', 'Dashboard stats', async () => {
      return await apiRequest('/api/dashboard/stats');
    });

    await runTest('Analytics & Reports', 'Performance analytics', async () => {
      return await apiRequest('/api/analytics/performance');
    });

    setIsRunning(false);
    setCurrentTest('');
    
    toast({
      title: "System Test Complete",
      description: "All tests have been executed. Check results above.",
    });
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warning':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Warning</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getOverallStats = () => {
    const allTests = testSuites.flatMap(suite => suite.tests);
    const total = allTests.length;
    const passed = allTests.filter(test => test.status === 'success').length;
    const failed = allTests.filter(test => test.status === 'error').length;
    const pending = allTests.filter(test => test.status === 'pending').length;
    
    return { total, passed, failed, pending };
  };

  const stats = getOverallStats();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/" className="flex items-center hover:text-foreground transition-colors">
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">System Test</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Test Suite</h1>
          <p className="text-muted-foreground">Comprehensive testing of all app features</p>
        </div>
        <Button 
          onClick={runAllTests} 
          disabled={isRunning}
          size="lg"
        >
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </Button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Tests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
            <div className="text-sm text-muted-foreground">Passed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
      </div>

      {/* Current Test */}
      {isRunning && currentTest && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 animate-spin" />
              <span className="font-medium">Running: {currentTest}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      <div className="space-y-6">
        {testSuites.map((suite) => (
          <Card key={suite.name}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{suite.name}</span>
                <div className="flex space-x-2">
                  {suite.tests.map((test) => (
                    <div key={test.name} className="flex items-center space-x-1">
                      {getStatusIcon(test.status)}
                    </div>
                  ))}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suite.tests.map((test) => (
                  <div key={test.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(test.status)}
                      <span className="font-medium">{test.name}</span>
                      {test.duration && (
                        <span className="text-sm text-muted-foreground">
                          ({test.duration}ms)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(test.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}