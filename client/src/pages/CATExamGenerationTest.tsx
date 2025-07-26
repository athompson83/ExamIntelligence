import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { reportFeatureFailure } from "@/utils/errorReporting";
import { apiRequest } from "@/lib/queryClient";
import { AlertTriangle, Bug, CheckCircle } from "lucide-react";

export default function CATExamGenerationTest() {
  const [prompt, setPrompt] = useState('Create a Computer Science exam covering programming fundamentals, data structures, and algorithms');
  const [title, setTitle] = useState('Computer Science Fundamentals Test');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const testCATGeneration = async () => {
    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      console.log('Testing CAT exam generation...');
      
      const response = await apiRequest('/api/ai/generate-cat-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          title,
          existingTestbanks: []
        })
      });

      console.log('CAT generation successful:', response);
      setResult(response);
      
    } catch (err: any) {
      console.error('CAT generation failed:', err);
      setError(err.message || 'Failed to generate CAT exam');
      
      // This will trigger the contextual bug reporter
      reportFeatureFailure(
        'CAT Exam Generation',
        err instanceof Error ? err : new Error(err.message || 'CAT generation failed'),
        `User tested CAT generation with title: "${title}"`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const testDifferentPrompts = [
    {
      title: "Basic Mathematics Test",
      prompt: "Create a Mathematics exam covering basic algebra, geometry, and statistics"
    },
    {
      title: "History Knowledge Assessment", 
      prompt: "Generate a History exam covering World War 2, Cold War, and Modern Era"
    },
    {
      title: "Biology Fundamentals",
      prompt: "Create a Biology exam covering cell biology, genetics, and ecology"
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">CAT Exam Generation Test</h1>
          <p className="text-gray-600 mt-2">
            Test the CAT exam generation feature and observe contextual bug reporting when it fails
          </p>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This page demonstrates contextual bug reporting. When CAT generation fails, 
            you'll see a bug report popup appear in the bottom right corner, not a persistent floating button.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Test CAT Generation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Exam Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter exam title..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Generation Prompt</label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the exam you want to generate..."
                  rows={4}
                />
              </div>

              <Button 
                onClick={testCATGeneration}
                disabled={isGenerating || !prompt.trim() || !title.trim()}
                className="w-full"
              >
                {isGenerating ? "Generating..." : "Test CAT Generation"}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <Bug className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Generation Failed:</strong> {error}
                    <br />
                    <small>Check the bottom right corner for the contextual bug reporter popup.</small>
                  </AlertDescription>
                </Alert>
              )}

              {result && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Success!</strong> CAT exam generated with {result.itemBanks?.length || 0} item banks.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Test Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {testDifferentPrompts.map((template, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full text-left justify-start"
                  onClick={() => {
                    setTitle(template.title);
                    setPrompt(template.prompt);
                  }}
                >
                  <div>
                    <div className="font-medium">{template.title}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {template.prompt.substring(0, 50)}...
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Generation Result</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Bug Reporting System Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <p><strong>Contextual:</strong> Bug reporter only appears when features actually fail</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <p><strong>Auto-dismiss:</strong> Bug reports automatically disappear after 30 seconds</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <p><strong>Preserved UI:</strong> Your original tooltip chat functionality remains intact</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <p><strong>Admin Dashboard:</strong> All bug reports are logged to /error-logs for admin review</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}