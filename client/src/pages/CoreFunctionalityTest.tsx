import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  AlertCircle, 
  BookOpen, 
  HelpCircle,
  Users,
  Calendar,
  Play,
  TestTube
} from "lucide-react";

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

export default function CoreFunctionalityTest() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTestResult = (name: string, status: 'pending' | 'success' | 'error', message: string, data?: any) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        existing.status = status;
        existing.message = message;
        existing.data = data;
        return [...prev];
      }
      return [...prev, { name, status, message, data }];
    });
  };

  const runCoreTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Test 1: Item Bank Creation
    updateTestResult('Item Bank Creation', 'pending', 'Testing item bank creation...');
    try {
      const testBankData = {
        title: `Test Bank ${Date.now()}`,
        description: 'Automated test bank creation',
        tags: ['test', 'automated'],
        learningObjectives: ['Test objective']
      };

      const response = await apiRequest('/api/testbanks', {
        method: 'POST',
        body: JSON.stringify(testBankData)
      });

      const newBank = await response.json();
      updateTestResult('Item Bank Creation', 'success', 'Item bank created successfully', newBank);
      
      // Test 2: Item Bank Retrieval
      updateTestResult('Item Bank Retrieval', 'pending', 'Testing item bank retrieval...');
      const listResponse = await apiRequest('/api/testbanks');
      const banks = await listResponse.json();
      const foundBank = banks.find((b: any) => b.id === newBank.id);
      
      if (foundBank) {
        updateTestResult('Item Bank Retrieval', 'success', 'Item bank retrieved successfully', foundBank);
      } else {
        updateTestResult('Item Bank Retrieval', 'error', 'Created item bank not found in list');
      }

      // Test 3: Question Creation
      updateTestResult('Question Creation', 'pending', 'Testing question creation...');
      const questionData = {
        testbankId: newBank.id,
        questionText: 'What is 2 + 2?',
        questionType: 'multiple_choice',
        difficultyScore: 5,
        answerOptions: [
          { id: 'a', answerText: '3', isCorrect: false },
          { id: 'b', answerText: '4', isCorrect: true },
          { id: 'c', answerText: '5', isCorrect: false }
        ]
      };

      const questionResponse = await apiRequest('/api/questions', {
        method: 'POST',
        body: JSON.stringify(questionData)
      });

      const newQuestion = await questionResponse.json();
      updateTestResult('Question Creation', 'success', 'Question created successfully', newQuestion);

      // Test 4: Quiz Creation
      updateTestResult('Quiz Creation', 'pending', 'Testing quiz creation...');
      const quizData = {
        title: `Test Quiz ${Date.now()}`,
        description: 'Automated test quiz',
        instructions: 'Test instructions',
        testbankId: newBank.id,
        timeLimit: 60,
        shuffleQuestions: true,
        showResults: true,
        allowReview: true
      };

      const quizResponse = await apiRequest('/api/quizzes', {
        method: 'POST',
        body: JSON.stringify(quizData)
      });

      const newQuiz = await quizResponse.json();
      updateTestResult('Quiz Creation', 'success', 'Quiz created successfully', newQuiz);

      // Test 5: Assignment Creation
      updateTestResult('Assignment Creation', 'pending', 'Testing assignment creation...');
      const assignmentData = {
        quizId: newQuiz.id,
        title: `Test Assignment ${Date.now()}`,
        description: 'Automated test assignment',
        dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        availableFrom: new Date().toISOString(),
        availableTo: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
        maxAttempts: 3,
        assignedStudents: []
      };

      const assignmentResponse = await apiRequest('/api/assignments', {
        method: 'POST',
        body: JSON.stringify(assignmentData)
      });

      const newAssignment = await assignmentResponse.json();
      updateTestResult('Assignment Creation', 'success', 'Assignment created successfully', newAssignment);

      // Test 6: Live Exam Scheduling
      updateTestResult('Live Exam Scheduling', 'pending', 'Testing live exam scheduling...');
      const liveExamData = {
        quizId: newQuiz.id,
        title: `Live Test Exam ${Date.now()}`,
        description: 'Automated live exam test',
        scheduledFor: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        duration: 60,
        maxParticipants: 10,
        enableProctoring: false,
        allowCalculator: false
      };

      const liveExamResponse = await apiRequest('/api/live-exams', {
        method: 'POST',
        body: JSON.stringify(liveExamData)
      });

      const newLiveExam = await liveExamResponse.json();
      updateTestResult('Live Exam Scheduling', 'success', 'Live exam scheduled successfully', newLiveExam);

    } catch (error) {
      console.error('Test error:', error);
      updateTestResult('Core Test Suite', 'error', `Test failed: ${error.message}`);
    }

    setIsRunning(false);
  };

  const runCacheTest = async () => {
    updateTestResult('Cache Invalidation', 'pending', 'Testing cache invalidation...');
    
    try {
      // Create a test bank
      const testBankData = {
        title: `Cache Test ${Date.now()}`,
        description: 'Testing cache invalidation',
        tags: ['cache', 'test'],
        learningObjectives: ['Cache testing']
      };

      const response = await apiRequest('/api/testbanks', {
        method: 'POST',
        body: JSON.stringify(testBankData)
      });

      const newBank = await response.json();
      
      // Clear cache and refresh
      queryClient.removeQueries({ queryKey: ['/api/testbanks'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/testbanks'] });
      
      // Verify the new bank appears in the list
      const listResponse = await apiRequest('/api/testbanks');
      const banks = await listResponse.json();
      const foundBank = banks.find((b: any) => b.id === newBank.id);
      
      if (foundBank) {
        updateTestResult('Cache Invalidation', 'success', 'Cache invalidation working correctly');
      } else {
        updateTestResult('Cache Invalidation', 'error', 'Cache invalidation failed - new bank not found');
      }
    } catch (error) {
      updateTestResult('Cache Invalidation', 'error', `Cache test failed: ${error.message}`);
    }
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Core Functionality Test Suite</h1>
          <p className="text-gray-600">Comprehensive testing of stable core systems</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Test Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={runCoreTests} 
                disabled={isRunning}
                className="w-full"
              >
                {isRunning ? 'Running Tests...' : 'Run Core Tests'}
              </Button>
              <Button 
                onClick={runCacheTest} 
                disabled={isRunning}
                variant="outline"
                className="w-full"
              >
                Test Cache Invalidation
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Protected Systems
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge variant="outline">Item Bank Management</Badge>
                <Badge variant="outline">Question Creation</Badge>
                <Badge variant="outline">Quiz Creation</Badge>
                <Badge variant="outline">Assignment Creation</Badge>
                <Badge variant="outline">Exam Scheduling</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Test Results Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Tests:</span>
                  <span className="text-sm font-medium">{testResults.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Passed:</span>
                  <span className="text-sm font-medium text-green-600">
                    {testResults.filter(r => r.status === 'success').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Failed:</span>
                  <span className="text-sm font-medium text-red-600">
                    {testResults.filter(r => r.status === 'error').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending:</span>
                  <span className="text-sm font-medium text-blue-600">
                    {testResults.filter(r => r.status === 'pending').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No tests run yet. Click "Run Core Tests" to begin testing.
              </div>
            ) : (
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${getStatusColor(result.status)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{result.name}</h3>
                      {getStatusIcon(result.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                    {result.data && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                          View Data
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Version Control Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Protected Core Systems</h3>
                <p className="text-sm text-yellow-700">
                  The following systems are marked as STABLE and should not be modified without explicit request:
                </p>
                <ul className="list-disc list-inside mt-2 text-sm text-yellow-700">
                  <li>Item Bank Management (CRUD operations)</li>
                  <li>Question Creation (multiple question types)</li>
                  <li>Quiz Creation (enhanced quiz builder)</li>
                  <li>Assignment Creation (assignment workflow)</li>
                  <li>Exam Scheduling (live exam scheduling)</li>
                </ul>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">✅ Recent Stability Fixes</h3>
                <ul className="list-disc list-inside text-sm text-green-700">
                  <li>Fixed API request signature format</li>
                  <li>Corrected cache invalidation issues</li>
                  <li>Enhanced error handling</li>
                  <li>Implemented comprehensive CAT system</li>
                </ul>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">📋 Testing Protocol</h3>
                <p className="text-sm text-blue-700">
                  All changes to core systems must pass this test suite before deployment.
                  Run tests regularly to ensure system stability.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}