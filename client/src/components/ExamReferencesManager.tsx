import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, BookOpen, Settings, Target } from "lucide-react";
import { examReferenceFormSchema, type ExamReferenceForm, type ExamReference } from "@/../../shared/examReferenceSchemas";
import { apiRequest } from "@/lib/queryClient";

const defaultExamStructure = {
  totalQuestions: 100,
  timeLimit: 120,
  passingScore: 70,
  sections: [
    {
      name: "Core Knowledge",
      description: "Fundamental concepts and principles",
      questionCount: 50,
      percentage: 50,
      difficultyRange: { min: 3, max: 7 }
    },
    {
      name: "Applied Skills",
      description: "Practical application and problem-solving",
      questionCount: 30,
      percentage: 30,
      difficultyRange: { min: 5, max: 9 }
    },
    {
      name: "Critical Thinking",
      description: "Analysis and evaluation scenarios",
      questionCount: 20,
      percentage: 20,
      difficultyRange: { min: 6, max: 10 }
    }
  ]
};

const defaultQuestionGuidelines = {
  questionTypes: ["multiple_choice", "multiple_response", "scenario_based"],
  difficultyDistribution: { easy: 20, medium: 60, hard: 20 },
  scenarioBasedPercentage: 30,
  bloomsTaxonomyLevels: ["remember", "understand", "apply", "analyze", "evaluate", "create"],
  keyCompetencies: ["knowledge_application", "critical_thinking", "problem_solving"]
};

export default function ExamReferencesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReference, setEditingReference] = useState<ExamReference | null>(null);

  const { data: examReferences = [], isLoading } = useQuery({
    queryKey: ["/api/exam-references"],
  });

  const form = useForm<ExamReferenceForm>({
    resolver: zodResolver(examReferenceFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      subject: "",
      topics: [],
      contentType: "blueprint",
      content: "",
      examStructure: defaultExamStructure,
      questionGuidelines: defaultQuestionGuidelines,
      isPublic: false,
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ExamReferenceForm) => apiRequest("/api/exam-references", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exam-references"] });
      setIsDialogOpen(false);
      form.reset();
      setEditingReference(null);
      toast({
        title: "Success",
        description: "Exam reference created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create exam reference",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExamReferenceForm }) =>
      apiRequest(`/api/exam-references/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exam-references"] });
      setIsDialogOpen(false);
      form.reset();
      setEditingReference(null);
      toast({
        title: "Success",
        description: "Exam reference updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update exam reference",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/exam-references/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exam-references"] });
      toast({
        title: "Success",
        description: "Exam reference deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete exam reference",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (reference: ExamReference) => {
    setEditingReference(reference);
    form.reset({
      title: reference.title,
      description: reference.description || "",
      category: reference.category,
      subject: reference.subject || "",
      topics: reference.topics || [],
      contentType: reference.contentType,
      content: reference.content,
      examStructure: reference.examStructure || defaultExamStructure,
      questionGuidelines: reference.questionGuidelines || defaultQuestionGuidelines,
      isPublic: reference.isPublic,
      isActive: reference.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: ExamReferenceForm) => {
    if (editingReference) {
      updateMutation.mutate({ id: editingReference.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const topicsInput = form.watch("topics");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Exam References</h3>
          <p className="text-sm text-muted-foreground">
            Create reference materials for enhanced CAT exam generation
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingReference(null);
              form.reset();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Reference
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingReference ? "Edit Exam Reference" : "Create Exam Reference"}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="structure">Exam Structure</TabsTrigger>
                    <TabsTrigger value="guidelines">Question Guidelines</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., NREMT Paramedic Blueprint" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Medical">Medical</SelectItem>
                                <SelectItem value="Engineering">Engineering</SelectItem>
                                <SelectItem value="Legal">Legal</SelectItem>
                                <SelectItem value="Business">Business</SelectItem>
                                <SelectItem value="Technology">Technology</SelectItem>
                                <SelectItem value="Science">Science</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Emergency Medicine" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="contentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="blueprint">Blueprint</SelectItem>
                                <SelectItem value="guidelines">Guidelines</SelectItem>
                                <SelectItem value="standards">Standards</SelectItem>
                                <SelectItem value="curriculum">Curriculum</SelectItem>
                              </SelectContent>
                            </Select>
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
                            <Textarea 
                              placeholder="Describe the purpose and scope of this reference..."
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reference Content</FormLabel>
                          <FormDescription>
                            Detailed content that will guide AI generation
                          </FormDescription>
                          <FormControl>
                            <Textarea 
                              placeholder="Paste your reference content here..."
                              rows={8}
                              {...field} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="structure" className="space-y-4">
                    <div className="text-sm text-muted-foreground mb-4">
                      Define the overall exam structure and sections
                    </div>
                    {/* Exam structure fields would go here - simplified for now */}
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm">Exam structure configuration coming soon...</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="guidelines" className="space-y-4">
                    <div className="text-sm text-muted-foreground mb-4">
                      Configure question generation parameters
                    </div>
                    {/* Question guidelines fields would go here - simplified for now */}
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm">Question guidelines configuration coming soon...</p>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingReference ? "Update" : "Create"} Reference
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading exam references...</div>
      ) : examReferences.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold">No Exam References</h3>
                <p className="text-sm text-muted-foreground">
                  Create reference materials to enhance CAT exam generation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {examReferences.map((reference: ExamReference) => (
            <Card key={reference.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{reference.title}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{reference.category}</Badge>
                      <Badge variant="outline">{reference.contentType}</Badge>
                      {reference.subject && (
                        <Badge variant="outline">{reference.subject}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(reference)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(reference.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {reference.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(reference.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}