import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Search, Edit, Trash2, BookOpen, Clock, Tag } from "lucide-react";
import { format } from "date-fns";

interface Testbank {
  id: string;
  title: string;
  description: string;
  tags: string[];
  learningObjectives: string[];
  createdAt: string;
  updatedAt: string;
  lastRevalidatedAt: string | null;
}

export default function ItemBanks() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTestbank, setEditingTestbank] = useState<Testbank | null>(null);

  const { data: testbanks, isLoading: testbanksLoading } = useQuery({
    queryKey: ['/api/testbanks'],
    enabled: isAuthenticated,
  });

  const createTestbankMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; tags: string[]; learningObjectives: string[] }) => {
      await apiRequest("POST", "/api/testbanks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/testbanks'] });
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Item bank created successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create item bank",
        variant: "destructive",
      });
    },
  });

  const updateTestbankMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Testbank> }) => {
      await apiRequest("PUT", `/api/testbanks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/testbanks'] });
      setEditingTestbank(null);
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Item bank updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update item bank",
        variant: "destructive",
      });
    },
  });

  const deleteTestbankMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/testbanks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/testbanks'] });
      toast({
        title: "Success",
        description: "Item bank deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete item bank",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(t => t),
      learningObjectives: (formData.get('learningObjectives') as string).split(',').map(t => t.trim()).filter(t => t),
    };

    if (editingTestbank) {
      updateTestbankMutation.mutate({ id: editingTestbank.id, data });
    } else {
      createTestbankMutation.mutate(data);
    }
  };

  const filteredTestbanks = testbanks?.filter((testbank: Testbank) =>
    testbank.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    testbank.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading || testbanksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <TopBar />
        
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Item Banks</h1>
              <p className="text-gray-600">Manage your question collections</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setEditingTestbank(null)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Item Bank
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingTestbank ? 'Edit Item Bank' : 'Create New Item Bank'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      required
                      defaultValue={editingTestbank?.title || ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={editingTestbank?.description || ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      name="tags"
                      placeholder="biology, chemistry, high-school"
                      defaultValue={editingTestbank?.tags?.join(', ') || ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="learningObjectives">Learning Objectives (comma-separated)</Label>
                    <Textarea
                      id="learningObjectives"
                      name="learningObjectives"
                      placeholder="Understand photosynthesis, Analyze cell structure"
                      defaultValue={editingTestbank?.learningObjectives?.join(', ') || ''}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={createTestbankMutation.isPending || updateTestbankMutation.isPending}>
                      {editingTestbank ? 'Update' : 'Create'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search item banks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Item Banks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTestbanks.map((testbank: Testbank) => (
              <Card key={testbank.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <BookOpen className="h-5 w-5 text-primary mr-2" />
                      <CardTitle className="text-lg">{testbank.title}</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingTestbank(testbank);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTestbankMutation.mutate(testbank.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{testbank.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Tags */}
                    <div>
                      <div className="flex flex-wrap gap-1">
                        {testbank.tags?.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Metadata */}
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Created: {format(new Date(testbank.createdAt), 'MMM d, yyyy')}
                      </div>
                      {testbank.lastRevalidatedAt && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          Last validated: {format(new Date(testbank.lastRevalidatedAt), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = `/testbanks/${testbank.id}/questions`}
                      >
                        View Questions
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // TODO: Implement AI validation
                          toast({
                            title: "AI Validation",
                            description: "AI validation started",
                          });
                        }}
                      >
                        Revalidate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTestbanks.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No item banks found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'No item banks match your search criteria.' : 'Create your first item bank to get started.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Item Bank
                </Button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
