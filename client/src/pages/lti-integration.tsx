import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Copy, CheckCircle, ExternalLink, Settings, BookOpen, GraduationCap, Home, LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';

interface LTIConfig {
  issuer: string;
  clientId: string;
  keysetUrl: string;
  loginUrl: string;
  redirectUrl: string;
  privateKey: string;
  publicKey: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  timeLimit: number;
  questionCount: number;
}

export default function LTIIntegration() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<string>('');

  // Fetch LTI configuration
  const { data: ltiConfig, isLoading: configLoading } = useQuery<LTIConfig>({
    queryKey: ['/api/lti/config'],
    retry: false
  });

  // Fetch available quizzes for content selection
  const { data: quizzes = [] } = useQuery<Quiz[]>({
    queryKey: ['/api/quizzes'],
    select: (data: any) => data?.map((quiz: any) => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      timeLimit: quiz.timeLimit,
      questionCount: quiz.questions?.length || 0
    })) || []
  });

  // Test LTI connection mutation
  const testConnection = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/lti/user');
      if (!response.ok) throw new Error('LTI not available');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "LTI Connection Test",
        description: "Successfully connected to LTI service",
      });
    },
    onError: () => {
      toast({
        title: "LTI Connection Test",
        description: "LTI service not available - ensure proper configuration",
        variant: "destructive"
      });
    }
  });

  // Content selection mutation
  const selectContent = useMutation({
    mutationFn: async (quizId: string) => {
      const quiz = quizzes.find(q => q.id === quizId);
      const response = await fetch('/api/lti/content-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId,
          title: quiz?.title,
          description: quiz?.description
        })
      });
      
      if (!response.ok) throw new Error('Content selection failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Content Selected",
        description: "Quiz has been selected for LMS integration",
      });
    }
  });

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      toast({
        title: "Copied to clipboard",
        description: `${fieldName} has been copied to your clipboard`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const ConfigField = ({ label, value, fieldName }: { label: string; value: string; fieldName: string }) => (
    <div className="space-y-2">
      <Label htmlFor={fieldName}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={fieldName}
          value={value}
          readOnly
          className="font-mono text-sm"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => copyToClipboard(value, label)}
        >
          {copiedField === label ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Breadcrumb Navigation */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <a href="/" className="flex items-center hover:text-blue-600 transition-colors">
                    <Home className="h-4 w-4 mr-1" />
                    Dashboard
                  </a>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <a href="/settings" className="hover:text-blue-600 transition-colors">System & Settings</a>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="flex items-center">
                    <LinkIcon className="h-4 w-4 mr-1" />
                    LTI Integration
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">LTI Integration</h1>
                <p className="text-muted-foreground mt-2">
                  Seamless Learning Management System integration for ProficiencyAI
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => testConnection.mutate()}
                  disabled={testConnection.isPending}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Test Connection
                </Button>
                <Badge variant={ltiConfig ? "default" : "secondary"}>
                  {ltiConfig ? "Configured" : "Setup Required"}
                </Badge>
              </div>
            </div>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="content">Content Selection</TabsTrigger>
          <TabsTrigger value="grades">Grade Passback</TabsTrigger>
        </TabsList>

        {/* LTI Setup Instructions */}
        <TabsContent value="setup">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  LTI 1.3 Integration Guide
                </CardTitle>
                <CardDescription>
                  Step-by-step instructions for integrating with your LMS
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">1</Badge>
                    <div>
                      <h4 className="font-semibold">Register External Tool</h4>
                      <p className="text-sm text-muted-foreground">
                        In your LMS, navigate to External Apps and create a new LTI 1.3 tool
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">2</Badge>
                    <div>
                      <h4 className="font-semibold">Configure Tool Settings</h4>
                      <p className="text-sm text-muted-foreground">
                        Use the configuration details from the Configuration tab
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">3</Badge>
                    <div>
                      <h4 className="font-semibold">Enable Services</h4>
                      <p className="text-sm text-muted-foreground">
                        Enable Assignment and Grade Services, Names and Role Provisioning
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">4</Badge>
                    <div>
                      <h4 className="font-semibold">Test Integration</h4>
                      <p className="text-sm text-muted-foreground">
                        Launch the tool from your LMS to verify the connection
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Supported LMS Platforms</CardTitle>
                <CardDescription>
                  Compatible Learning Management Systems
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Canvas</h4>
                      <p className="text-sm text-muted-foreground">Full LTI 1.3 support</p>
                    </div>
                    <Badge variant="default">✓ Supported</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Moodle</h4>
                      <p className="text-sm text-muted-foreground">LTI 1.3 compatible</p>
                    </div>
                    <Badge variant="default">✓ Supported</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Blackboard</h4>
                      <p className="text-sm text-muted-foreground">LTI 1.3 integration</p>
                    </div>
                    <Badge variant="default">✓ Supported</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Brightspace</h4>
                      <p className="text-sm text-muted-foreground">D2L LTI support</p>
                    </div>
                    <Badge variant="default">✓ Supported</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configuration Details */}
        <TabsContent value="configuration">
          <Card>
            <CardHeader>
              <CardTitle>LTI Configuration Details</CardTitle>
              <CardDescription>
                Use these values when registering ProficiencyAI as an external tool in your LMS
              </CardDescription>
            </CardHeader>
            <CardContent>
              {configLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : ltiConfig ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <ConfigField
                    label="Tool URL / Target Link URI"
                    value={ltiConfig.redirectUrl}
                    fieldName="redirectUrl"
                  />
                  <ConfigField
                    label="Login URL / OIDC Initiation URL"
                    value={ltiConfig.loginUrl}
                    fieldName="loginUrl"
                  />
                  <ConfigField
                    label="Keyset URL / JWK Set URL"
                    value={ltiConfig.keysetUrl}
                    fieldName="keysetUrl"
                  />
                  <ConfigField
                    label="Client ID"
                    value={ltiConfig.clientId}
                    fieldName="clientId"
                  />
                  <div className="md:col-span-2">
                    <ConfigField
                      label="Issuer / Platform ID"
                      value={ltiConfig.issuer}
                      fieldName="issuer"
                    />
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    LTI configuration not available. Please ensure the LTI service is properly initialized.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Selection */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Content Selection
              </CardTitle>
              <CardDescription>
                Select quizzes and assessments to integrate with your LMS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4">
                  {quizzes.length > 0 ? (
                    quizzes.map((quiz) => (
                      <div key={quiz.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{quiz.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {quiz.description}
                          </p>
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{quiz.questionCount} questions</span>
                            <span>{quiz.timeLimit} minutes</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => selectContent.mutate(quiz.id)}
                          disabled={selectContent.isPending}
                          size="sm"
                        >
                          Select for LMS
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No quizzes available for selection</p>
                      <p className="text-sm">Create quizzes in the Quiz Manager to enable LTI integration</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grade Passback */}
        <TabsContent value="grades">
          <Card>
            <CardHeader>
              <CardTitle>Grade Passback Configuration</CardTitle>
              <CardDescription>
                Automatic grade synchronization with your LMS gradebook
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Grade passback is automatically enabled when ProficiencyAI is launched from an LMS assignment.
                    Student scores will be sent back to the LMS gradebook upon quiz completion.
                  </AlertDescription>
                </Alert>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Automatic Features</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Real-time grade submission</li>
                      <li>• Percentage score calculation</li>
                      <li>• Completion status tracking</li>
                      <li>• Attempt timestamps</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Supported Services</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• LTI Assignment and Grade Services</li>
                      <li>• LTI Names and Role Provisioning</li>
                      <li>• LTI Deep Linking</li>
                      <li>• LTI Resource Link</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </Layout>
  );
}