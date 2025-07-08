import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  duration?: number;
}

export default function ComprehensiveTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTestResult = (name: string, status: 'pending' | 'success' | 'error', message: string, duration?: number) => {
    setTestResults(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        return prev.map(t => t.name === name ? { ...t, status, message, duration } : t);
      }
      return [...prev, { name, status, message, duration }];
    });
  };

  const runTest = async (name: string, testFn: () => Promise<void>) => {
    const startTime = Date.now();
    updateTestResult(name, 'pending', 'Running...');
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      updateTestResult(name, 'success', 'Passed', duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult(name, 'error', error.message || 'Failed', duration);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Test 1: Section Creation
    await runTest('Section Creation', async () => {
      const response = await apiRequest('/api/sections', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Section ' + Date.now(),
          description: 'Auto-generated test section'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create section');
      }
      
      const data = await response.json();
      if (!data.id) {
        throw new Error('Section creation did not return an ID');
      }
    });

    // Test 2: Section Listing
    await runTest('Section Listing', async () => {
      const response = await apiRequest('/api/sections');
      
      if (!response.ok) {
        throw new Error('Failed to fetch sections');
      }
      
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Sections response is not an array');
      }
    });

    // Test 3: Quiz Listing
    await runTest('Quiz Listing', async () => {
      const response = await apiRequest('/api/quizzes');
      
      if (!response.ok) {
        throw new Error('Failed to fetch quizzes');
      }
      
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Quizzes response is not an array');
      }
    });

    // Test 4: User Authentication
    await runTest('User Authentication', async () => {
      const response = await apiRequest('/api/auth/user');
      
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      
      const data = await response.json();
      if (!data.id) {
        throw new Error('User data does not contain ID');
      }
    });

    // Test 5: Dashboard Stats
    await runTest('Dashboard Stats', async () => {
      const response = await apiRequest('/api/dashboard/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      
      const data = await response.json();
      if (typeof data.assignedQuizzes === 'undefined') {
        throw new Error('Dashboard stats missing assignedQuizzes');
      }
    });

    // Test 6: Testbanks
    await runTest('Testbanks', async () => {
      const response = await apiRequest('/api/testbanks');
      
      if (!response.ok) {
        throw new Error('Failed to fetch testbanks');
      }
      
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Testbanks response is not an array');
      }
    });

    // Test 7: Mobile API
    await runTest('Mobile Dashboard', async () => {
      const response = await apiRequest('/api/mobile/dashboard');
      
      if (!response.ok) {
        throw new Error('Failed to fetch mobile dashboard');
      }
      
      const data = await response.json();
      if (!data.stats) {
        throw new Error('Mobile dashboard missing stats');
      }
    });

    // Test 8: Notifications
    await runTest('Notifications', async () => {
      const response = await apiRequest('/api/notifications');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Notifications response is not an array');
      }
    });

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Running</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500">Passed</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const totalTests = testResults.length;
  const passedTests = testResults.filter(t => t.status === 'success').length;
  const failedTests = testResults.filter(t => t.status === 'error').length;
  const pendingTests = testResults.filter(t => t.status === 'pending').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comprehensive System Test</h1>
          <p className="text-gray-600">Test all core functionality systematically</p>
        </div>
        <Button 
          onClick={runAllTests} 
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </Button>
      </div>

      {/* Test Summary */}
      {totalTests > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Summary</CardTitle>
            <CardDescription>
              {totalTests} tests - {passedTests} passed, {failedTests} failed, {pendingTests} pending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Passed: {passedTests}</span>
              </div>
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>Failed: {failedTests}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span>Pending: {pendingTests}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      <div className="grid gap-4">
        {testResults.map((test) => (
          <Card key={test.name}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <h3 className="font-medium">{test.name}</h3>
                    <p className="text-sm text-gray-600">{test.message}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {test.duration && (
                    <span className="text-sm text-gray-500">{test.duration}ms</span>
                  )}
                  {getStatusBadge(test.status)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {testResults.length === 0 && !isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tests have been run yet. Click "Run All Tests" to begin.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}