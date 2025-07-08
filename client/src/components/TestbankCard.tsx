import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BookOpen, 
  Edit, 
  Trash2, 
  Share2, 
  Eye, 
  Sparkles,
  Calendar,
  Tag,
  CheckCircle
} from "lucide-react";
import { useForm } from "react-hook-form";

interface TestbankCardProps {
  testbank: any;
  onGenerateQuestions: (testbankId: string, config: any) => void;
  isGenerating: boolean;
}

export default function TestbankCard({ testbank, onGenerateQuestions, isGenerating }: TestbankCardProps) {
  const { toast } = useToast();
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      topic: "",
      questionType: "multiple_choice",
      count: "5",
      difficulty: "intermediate",
    },
  });

  const deleteTestbankMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/testbanks/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Item bank deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/testbanks"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete item bank",
        variant: "destructive",
      });
    },
  });

  const handleGenerateQuestions = (data: any) => {
    onGenerateQuestions(testbank.id, {
      topic: data.topic,
      questionType: data.questionType,
      count: parseInt(data.count),
      difficulty: data.difficulty,
    });
    setIsGenerateDialogOpen(false);
    form.reset();
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this item bank? This action cannot be undone.")) {
      deleteTestbankMutation.mutate(testbank.id);
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
              {testbank.title}
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
              {testbank.description || "No description provided"}
            </p>
          </div>
          <div className="flex items-center space-x-1">
            {testbank.isShared && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                <Share2 className="h-3 w-3 mr-1" />
                Shared
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {testbank.questionCount || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Questions</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-secondary">
                {testbank.lastRevalidatedAt ? (
                  <CheckCircle className="h-6 w-6 mx-auto text-green-500" />
                ) : (
                  "—"
                )}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Validated</div>
            </div>
          </div>

          {/* Tags */}
          {testbank.tags && testbank.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {testbank.tags.slice(0, 3).map((tag: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
              {testbank.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{testbank.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(testbank.createdAt).toLocaleDateString()}
            </div>
            <div className="flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              {testbank.lastRevalidatedAt ? 
                new Date(testbank.lastRevalidatedAt).toLocaleDateString() : 
                "Never validated"
              }
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDelete}
                disabled={deleteTestbankMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
            <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={isGenerating}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  {isGenerating ? "Generating..." : "AI Generate"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate AI Questions</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleGenerateQuestions)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="topic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Topic</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter topic (e.g., Cell Division)" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="questionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select question type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                              <SelectItem value="multiple_response">Multiple Response</SelectItem>
                              <SelectItem value="constructed_response">Constructed Response</SelectItem>
                              <SelectItem value="true_false">True/False</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="count"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Questions</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="3">3 Questions</SelectItem>
                                <SelectItem value="5">5 Questions</SelectItem>
                                <SelectItem value="10">10 Questions</SelectItem>
                                <SelectItem value="15">15 Questions</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="difficulty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Difficulty</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="beginner">Beginner</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsGenerateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-purple-600 hover:bg-purple-700"
                        disabled={isGenerating}
                      >
                        Generate Questions
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
