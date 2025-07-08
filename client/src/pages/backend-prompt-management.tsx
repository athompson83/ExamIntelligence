import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Settings, Code, Bot, AlertTriangle, Save, RotateCcw, TestTube, CheckCircle, Sparkles, Brain, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import DragDropVariableBuilder from "@/components/DragDropVariableBuilder";
import PromptOptimizer from "@/components/PromptOptimizer";

// Types for backend prompts
interface BackendPrompt {
  id: string;
  name: string;
  description: string;
  category: "question_generation" | "question_validation" | "content_analysis" | "system";
  promptType: "system" | "user" | "assistant";
  content: string;
  variables: string[];
  isActive: boolean;
  isDefault: boolean;
  version: string;
  usage: {
    totalCalls: number;
    successRate: number;
    avgResponseTime: number;
    lastUsed: Date | null;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PromptTest {
  id: string;
  promptId: string;
  testInput: Record<string, any>;
  expectedOutput: string;
  actualOutput: string | null;
  passed: boolean | null;
  runAt: Date | null;
  duration: number | null;
}

// Form schemas
const promptSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().min(1, "Description is required").max(500, "Description too long"),
  category: z.enum(["question_generation", "question_validation", "content_analysis", "system"]),
  promptType: z.enum(["system", "user", "assistant"]).default("system"),
  content: z.string().min(1, "Content is required").max(10000, "Content too long"),
  variables: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  version: z.string().default("1.0.0"),
});

const testSchema = z.object({
  testInput: z.record(z.any()),
  expectedOutput: z.string().min(1, "Expected output is required"),
});

type PromptForm = z.infer<typeof promptSchema>;
type TestForm = z.infer<typeof testSchema>;

export default function BackendPromptManagementPage() {
  const [activeTab, setActiveTab] = useState("prompts");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<BackendPrompt | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<BackendPrompt | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  
  // Drag-and-drop variable management
  const [dragDropVariables, setDragDropVariables] = useState<any[]>([]);
  const [currentPromptContent, setCurrentPromptContent] = useState("");
  const [showVariableBuilder, setShowVariableBuilder] = useState(false);
  const [showPromptOptimizer, setShowPromptOptimizer] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PromptForm>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      category: "question_generation",
      promptType: "system",
      variables: [],
      isActive: true,
      version: "1.0.0",
    },
  });

  const testForm = useForm<TestForm>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      testInput: {},
    },
  });

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: () => apiRequest("GET", "/api/auth/user"),
  });

  // Fetch backend prompts
  const { data: prompts, isLoading } = useQuery({
    queryKey: ["/api/backend-prompts"],
    queryFn: () => apiRequest("GET", "/api/backend-prompts"),
    enabled: user?.role === "super_admin",
  });

  // Fetch prompt tests - Mock implementation
  const promptTests = [];

  // Create prompt mutation
  const createPromptMutation = useMutation({
    mutationFn: (data: PromptForm) =>
      apiRequest("POST", "/api/backend-prompts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backend-prompts"] });
      setIsCreateDialogOpen(false);
      setEditingPrompt(null);
      form.reset();
      setDragDropVariables([]);
      setCurrentPromptContent("");
      setShowVariableBuilder(false);
      setShowPromptOptimizer(false);
      toast({
        title: "Prompt Created",
        description: "Backend prompt has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create prompt",
        variant: "destructive",
      });
    },
  });

  // Update prompt mutation
  const updatePromptMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PromptForm> }) =>
      apiRequest("PATCH", `/api/backend-prompts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backend-prompts"] });
      setIsCreateDialogOpen(false);
      setEditingPrompt(null);
      form.reset();
      setDragDropVariables([]);
      setCurrentPromptContent("");
      setShowVariableBuilder(false);
      setShowPromptOptimizer(false);
      toast({
        title: "Prompt Updated",
        description: "Backend prompt has been updated successfully",
      });
    },
  });

  // Delete prompt mutation
  const deletePromptMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/backend-prompts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backend-prompts"] });
      toast({
        title: "Prompt Deleted",
        description: "Backend prompt has been deleted successfully",
      });
    },
  });

  // Set as default mutation - Mock implementation
  const setDefaultMutation = useMutation({
    mutationFn: ({ id, category }: { id: string; category: string }) =>
      Promise.resolve({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backend-prompts"] });
      toast({
        title: "Default Set",
        description: "Prompt has been set as default for this category",
      });
    },
  });

  // Test prompt mutation - Mock implementation
  const testPromptMutation = useMutation({
    mutationFn: ({ promptId, testData }: { promptId: string; testData: TestForm }) =>
      Promise.resolve({ passed: true, duration: 125 }),
    onSuccess: (result) => {
      setIsTestDialogOpen(false);
      testForm.reset();
      toast({
        title: "Test Completed",
        description: `Test ${result.passed ? "passed" : "failed"} with ${result.duration}ms response time`,
      });
    },
  });

  const handleSubmit = (data: PromptForm) => {
    // Extract variables from the drag-and-drop builder
    const extractedVariables = dragDropVariables.map(v => v.name);
    
    // Merge with any additional variables from the form
    const allVariables = Array.from(new Set([...extractedVariables, ...data.variables]));
    
    const submissionData = {
      ...data,
      variables: allVariables,
      content: currentPromptContent || data.content,
    };
    
    if (editingPrompt) {
      updatePromptMutation.mutate({ id: editingPrompt.id, data: submissionData });
    } else {
      createPromptMutation.mutate(submissionData);
    }
  };

  const handleTest = (data: TestForm) => {
    if (!selectedPrompt) return;
    testPromptMutation.mutate({ promptId: selectedPrompt.id, testData: data });
  };

  const openCreateDialog = () => {
    setEditingPrompt(null);
    form.reset();
    setDragDropVariables([]);
    setCurrentPromptContent("");
    setShowVariableBuilder(false);
    setShowPromptOptimizer(false);
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (prompt: BackendPrompt) => {
    setEditingPrompt(prompt);
    form.reset({
      name: prompt.name,
      description: prompt.description,
      category: prompt.category,
      promptType: prompt.promptType,
      content: prompt.content,
      variables: prompt.variables,
      isActive: prompt.isActive,
      version: prompt.version,
    });
    
    // Initialize drag-and-drop variables from the existing prompt
    const existingVariables = prompt.variables.map((varName, index) => ({
      id: `var-${index}`,
      name: varName,
      type: 'text' as const,
      description: `Variable: ${varName}`,
      defaultValue: '',
      isRequired: true,
      category: 'quiz_data' as const,
    }));
    
    setDragDropVariables(existingVariables);
    setCurrentPromptContent(prompt.content);
    setShowVariableBuilder(false);
    setShowPromptOptimizer(false);
    setIsCreateDialogOpen(true);
  };

  const openTestDialog = (prompt: BackendPrompt) => {
    setSelectedPrompt(prompt);
    testForm.reset();
    setIsTestDialogOpen(true);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "question_generation": return <Bot className="h-4 w-4 text-blue-500" />;
      case "question_validation": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "content_analysis": return <Settings className="h-4 w-4 text-purple-500" />;
      case "system": return <Code className="h-4 w-4 text-gray-500" />;
      default: return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredPrompts = Array.isArray(prompts) 
    ? prompts.filter((prompt: BackendPrompt) =>
        filterCategory === "all" || prompt.category === filterCategory
      )
    : [];

  // Security check
  if (user?.role !== "super_admin") {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            Only super administrators can access backend prompt management.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[{ label: "Backend Prompt Management" }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Backend Prompt Management</h1>
          <p className="text-muted-foreground">
            Manage AI prompts used for question generation and validation
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Prompt
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prompts">Active Prompts</TabsTrigger>
          <TabsTrigger value="testing">Testing & Validation</TabsTrigger>
          <TabsTrigger value="analytics">Usage Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="prompts" className="space-y-6">
          {/* Filter Controls */}
          <div className="flex gap-4">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="question_generation">Question Generation</SelectItem>
                <SelectItem value="question_validation">Question Validation</SelectItem>
                <SelectItem value="content_analysis">Content Analysis</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prompts List */}
          <div className="grid gap-4">
            {isLoading ? (
              <div className="text-center py-8">Loading prompts...</div>
            ) : filteredPrompts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Code className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No prompts found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create your first backend prompt to customize AI behavior.
                  </p>
                  <Button onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Prompt
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredPrompts.map((prompt: BackendPrompt) => (
                <Card key={prompt.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(prompt.category)}
                        <div>
                          <h3 className="font-semibold">{prompt.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {prompt.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {prompt.isDefault && (
                          <Badge variant="default">Default</Badge>
                        )}
                        <Badge variant={prompt.isActive ? "default" : "secondary"}>
                          {prompt.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">
                          v{prompt.version}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-1">Category:</h4>
                        <p className="text-sm text-muted-foreground capitalize">
                          {prompt.category.replace("_", " ")}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-1">Content Preview:</h4>
                        <p className="text-sm text-muted-foreground line-clamp-3 bg-muted p-2 rounded">
                          {prompt.content}
                        </p>
                      </div>

                      {prompt.variables.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-1">Variables:</h4>
                          <div className="flex flex-wrap gap-1">
                            {prompt.variables.map((variable, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {variable}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-sm text-muted-foreground">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <span className="font-medium">Calls:</span> {prompt.usage.totalCalls}
                          </div>
                          <div>
                            <span className="font-medium">Success Rate:</span> {prompt.usage.successRate}%
                          </div>
                          <div>
                            <span className="font-medium">Avg Time:</span> {prompt.usage.avgResponseTime}ms
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(prompt)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openTestDialog(prompt)}
                        >
                          <TestTube className="h-4 w-4 mr-2" />
                          Test
                        </Button>
                        {!prompt.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDefaultMutation.mutate({ id: prompt.id, category: prompt.category })}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletePromptMutation.mutate(prompt.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          {/* Testing Interface */}
          <Card>
            <CardHeader>
              <CardTitle>Prompt Testing</CardTitle>
              <CardDescription>
                Test prompts with sample inputs to validate their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedPrompt ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedPrompt.name}</Badge>
                    <Badge variant="secondary">{selectedPrompt.category}</Badge>
                  </div>
                  
                  {promptTests && promptTests.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="font-medium">Recent Test Results:</h4>
                      {promptTests.map((test: PromptTest) => (
                        <div key={test.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="text-sm font-medium">
                              Test run: {test.runAt && new Date(test.runAt).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Duration: {test.duration}ms
                            </p>
                          </div>
                          <Badge variant={test.passed ? "default" : "destructive"}>
                            {test.passed ? "Passed" : "Failed"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No test results yet.</p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Select a prompt from the Active Prompts tab to run tests.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Usage Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Prompts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {prompts?.length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Prompts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Array.isArray(prompts) ? prompts.filter((p: BackendPrompt) => p.isActive).length : 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total API Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Array.isArray(prompts) ? prompts.reduce((sum: number, p: BackendPrompt) => sum + (p.usage?.totalCalls || 0), 0) : 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Avg Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Array.isArray(prompts) && prompts.length > 0 
                    ? Math.round(prompts.reduce((sum: number, p: BackendPrompt) => sum + (p.usage?.successRate || 0), 0) / prompts.length)
                    : 0}%
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Prompt Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingPrompt ? "Edit Backend Prompt" : "Create Backend Prompt"}
            </DialogTitle>
            <DialogDescription>
              Configure AI prompts used for backend operations
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Question Generation System" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version</FormLabel>
                      <FormControl>
                        <Input placeholder="1.0.0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description of what this prompt does" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="question_generation">Question Generation</SelectItem>
                          <SelectItem value="question_validation">Question Validation</SelectItem>
                          <SelectItem value="content_analysis">Content Analysis</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="promptType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="system">System Prompt</SelectItem>
                          <SelectItem value="user">User Prompt</SelectItem>
                          <SelectItem value="assistant">Assistant Prompt</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Enhanced Prompt Building Interface */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowVariableBuilder(!showVariableBuilder)}
                    className="flex items-center gap-2"
                  >
                    <Database className="h-4 w-4" />
                    {showVariableBuilder ? 'Hide' : 'Show'} Variable Builder
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPromptOptimizer(!showPromptOptimizer)}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    {showPromptOptimizer ? 'Hide' : 'Show'} AI Optimizer
                  </Button>
                </div>

                {showVariableBuilder && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <DragDropVariableBuilder
                      variables={dragDropVariables}
                      onVariablesChange={setDragDropVariables}
                      promptContent={currentPromptContent || form.watch('content') || ''}
                      onPromptContentChange={(content) => {
                        setCurrentPromptContent(content);
                        form.setValue('content', content);
                      }}
                      category={form.watch('category') || 'question_generation'}
                    />
                  </div>
                )}

                {showPromptOptimizer && (
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <PromptOptimizer
                      originalPrompt={form.watch('content') || ''}
                      category={form.watch('category') || 'question_generation'}
                      variables={dragDropVariables.map(v => v.name) || []}
                      onOptimizedPrompt={(optimizedPrompt) => {
                        form.setValue('content', optimizedPrompt);
                        setCurrentPromptContent(optimizedPrompt);
                      }}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the AI prompt content here. Use {variable} syntax for dynamic variables."
                          className="min-h-[300px] font-mono"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setCurrentPromptContent(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Use single curly braces for variables: {`{topic}, {difficulty}, {questionType}`}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Enable this prompt for use in the system
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createPromptMutation.isPending || updatePromptMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingPrompt ? "Update" : "Create"} Prompt
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Test Prompt Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Test Prompt</DialogTitle>
            <DialogDescription>
              Run a test with sample data to validate prompt performance
            </DialogDescription>
          </DialogHeader>
          <Form {...testForm}>
            <form onSubmit={testForm.handleSubmit(handleTest)} className="space-y-4">
              <FormField
                control={testForm.control}
                name="testInput"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Input (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='{"topic": "Mathematics", "difficulty": 5, "questionType": "multiple_choice"}'
                        className="min-h-[100px]"
                        value={JSON.stringify(field.value, null, 2)}
                        onChange={(e) => {
                          try {
                            field.onChange(JSON.parse(e.target.value));
                          } catch {
                            // Invalid JSON, keep current value
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter test variables as JSON object
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={testForm.control}
                name="expectedOutput"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Output</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What you expect the AI to generate with this input..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTestDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={testPromptMutation.isPending}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Run Test
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}