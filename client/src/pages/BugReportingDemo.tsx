import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  reportFeatureFailure, 
  reportApiFailure, 
  reportComponentCrash, 
  reportUserActionFailure 
} from "@/utils/errorReporting";
import { Bug, AlertTriangle, Zap, X } from "lucide-react";

export default function BugReportingDemo() {
  const [apiCallResult, setApiCallResult] = useState<string>("");

  // Simulate different types of failures
  const simulateFeatureFailure = () => {
    reportFeatureFailure("Quiz Builder", new Error("Failed to initialize quiz editor"), "User attempted to create new quiz");
  };

  const simulateApiFailure = async () => {
    try {
      // This will fail and trigger the bug reporter
      const response = await fetch('/api/nonexistent-endpoint');
      setApiCallResult("Success!");
    } catch (error) {
      reportApiFailure('/api/nonexistent-endpoint', error, 'load demo data');
      setApiCallResult("API call failed - bug reporter should appear");
    }
  };

  const simulateComponentCrash = () => {
    reportComponentCrash("DemoComponent", new Error("Render failed: Missing required props"));
  };

  const simulateUserActionFailure = () => {
    reportUserActionFailure("Save Quiz", new Error("Validation failed: Title is required"), "Save Button");
  };

  const simulateJavaScriptError = () => {
    // This will be caught by the global error handler
    throw new Error("Uncaught JavaScript error for testing");
  };

  const testAsyncError = async () => {
    // This will be caught by the unhandled rejection handler
    Promise.reject(new Error("Unhandled promise rejection for testing"));
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bug Reporting System Demo</h1>
          <p className="text-gray-600 mt-2">
            Test the contextual bug reporting system - it only appears when features actually fail
          </p>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Click the buttons below to simulate different types of errors. The bug reporter will only appear when there's an actual failure.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bug className="h-5 w-5" />
                <span>Feature Failures</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Simulate a feature that fails to load or execute properly
                </p>
                <Button 
                  onClick={simulateFeatureFailure}
                  variant="outline"
                  className="w-full"
                >
                  Simulate Feature Failure
                </Button>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Simulate a user action that fails (like saving a form)
                </p>
                <Button 
                  onClick={simulateUserActionFailure}
                  variant="outline"
                  className="w-full"
                >
                  Simulate User Action Failure
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>API & System Errors</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Simulate an API call that fails
                </p>
                <Button 
                  onClick={simulateApiFailure}
                  variant="outline"
                  className="w-full"
                >
                  Simulate API Failure
                </Button>
                {apiCallResult && (
                  <p className="text-xs text-gray-500 mt-1">{apiCallResult}</p>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Simulate a React component crash
                </p>
                <Button 
                  onClick={simulateComponentCrash}
                  variant="outline"
                  className="w-full"
                >
                  Simulate Component Crash
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <X className="h-5 w-5" />
                <span>JavaScript Errors</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Trigger an uncaught JavaScript error
                </p>
                <Button 
                  onClick={simulateJavaScriptError}
                  variant="destructive"
                  className="w-full"
                >
                  Throw JavaScript Error
                </Button>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Trigger an unhandled promise rejection
                </p>
                <Button 
                  onClick={testAsyncError}
                  variant="destructive"
                  className="w-full"
                >
                  Trigger Promise Rejection
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <p>Bug reporter only appears when errors actually occur</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <p>Shows contextual information about what failed</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <p>Auto-dismisses after 30 seconds if no action taken</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <p>Preserves your original tooltip chat functionality</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Normal Usage:</strong> When features work properly, you won't see any bug reporter. 
            The system is completely invisible until something actually goes wrong, at which point it provides 
            a helpful way for users to report the specific issue they encountered.
          </AlertDescription>
        </Alert>
      </div>
    </Layout>
  );
}